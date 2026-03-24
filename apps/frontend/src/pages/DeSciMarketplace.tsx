import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { complianceApi } from '../api/compliance.js';
import { farmsApi } from '../api/farms.js';
import type { ComplianceScore } from '@groundtruth/types';
import { Spinner } from '../components/ui/Spinner.js';
import { ErrorAlert } from '../components/ui/ErrorAlert.js';
import { StatusBadge } from '../components/ui/StatusBadge.js';

const DEMO_FARM_ID = '02d1a1f4-7da1-4b6c-a39c-f9826532b47f';

// Tag colors by category
const TAG_COLORS: Record<string, string> = {
  'cacao': 'bg-amber-100 text-amber-900',
  'café': 'bg-amber-100 text-amber-900',
  'açaí': 'bg-purple-100 text-purple-900',
  'EUDR': 'bg-green-100 text-green-900',
  'DePIN': 'bg-blue-100 text-blue-900',
  'tropical': 'bg-emerald-100 text-emerald-900',
  'specialty': 'bg-pink-100 text-pink-900',
  'Rainforest Alliance': 'bg-green-100 text-green-900',
  'biodiversidad': 'bg-emerald-100 text-emerald-900',
  'carbon credit': 'bg-teal-100 text-teal-900',
};

interface DataListing {
  id: string;
  name: string;
  location: string;
  score: number;
  level: ComplianceScore['level'];
  readings: number;
  price_sol: number;
  tags: string[];
}

export function DeSciMarketplace() {
  const { t } = useTranslation();
  const [score, setScore] = useState<ComplianceScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFarm, setSelectedFarm] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [transacting, setTransacting] = useState(false);

  useEffect(() => {
    Promise.all([
      farmsApi.getById(DEMO_FARM_ID),
      complianceApi.getScore(DEMO_FARM_ID),
    ])
      .then(([, scoreData]) => {
        setScore(scoreData);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : t('errors.generic')))
      .finally(() => setLoading(false));
  }, [t]);

  const handleRequestAccess = (farmId: string, farmName: string) => {
    setSelectedFarm(farmId);
    setModalOpen(true);
  };

  const confirmPurchase = async () => {
    if (!selectedFarm) return;

    setTransacting(true);
    try {
      // Simulate Solana transaction (in production, call actual endpoint)
      const listing = listings.find(l => l.id === selectedFarm);
      if (!listing) throw new Error('Farm not found');

      // Mock transaction
      await new Promise(resolve => setTimeout(resolve, 2000));

      alert(`✅ Acceso adquirido para ${listing.name}\n\nTX: ${Math.random().toString(36).substring(7).toUpperCase()}\n\nYa puedes acceder al dataset histórico.`);
      setModalOpen(false);
      setSelectedFarm(null);
    } catch (err) {
      alert(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setTransacting(false);
    }
  };

  if (loading) return <Spinner size="lg" />;
  if (error) return <ErrorAlert message={error} />;

  // Demo listings — in production these would come from a Solana program / indexer
  const listings: DataListing[] = [
    {
      id: DEMO_FARM_ID,
      name: 'Finca El Progreso',
      location: 'Antioquia, Colombia',
      score: score?.score ?? 0,
      level: score?.level ?? 'NON_COMPLIANT',
      readings: score?.total_readings ?? 0,
      price_sol: 0.05,
      tags: ['cacao', 'EUDR', 'DePIN', 'tropical'],
    },
    {
      id: '2',
      name: 'Hacienda Las Palmas',
      location: 'Huila, Colombia',
      score: 87,
      level: 'COMPLIANT',
      readings: 1240,
      price_sol: 0.08,
      tags: ['café', 'specialty', 'Rainforest Alliance'],
    },
    {
      id: '3',
      name: 'Cooperativa Amazónica',
      location: 'Putumayo, Colombia',
      score: 61,
      level: 'WARNING',
      readings: 432,
      price_sol: 0.03,
      tags: ['açaí', 'biodiversidad', 'carbon credit'],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-base-content">{t('nav.desci')}</h1>
          <span className="badge badge-secondary badge-sm">Beta</span>
        </div>
        <p className="text-sm text-base-content/50 mt-1">
          Datos agronómicos verificados on-chain disponibles para investigación científica y mercados de carbono
        </p>
      </div>

      {/* Stats bar */}
      <div className="stats bg-base-200 border border-base-300 w-full">
        <div className="stat">
          <div className="stat-title text-xs">Fincas registradas</div>
          <div className="stat-value text-primary text-2xl">3</div>
        </div>
        <div className="stat">
          <div className="stat-title text-xs">Lecturas certificadas</div>
          <div className="stat-value text-2xl">
            {listings.reduce((s, l) => s + l.readings, 0).toLocaleString()}
          </div>
        </div>
        <div className="stat">
          <div className="stat-title text-xs">Red</div>
          <div className="stat-value text-2xl text-accent">Solana Devnet</div>
        </div>
      </div>

      {/* Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="card bg-base-200 border border-base-300 hover:border-primary/30 transition-colors"
          >
            <div className="card-body p-5 gap-3">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-base-content">{listing.name}</h3>
                  <p className="text-xs text-base-content/50">📍 {listing.location}</p>
                </div>
                <StatusBadge status={listing.level} />
              </div>

              {/* Score ring */}
              <div className="flex items-center gap-4">
                <div className="radial-progress text-primary text-sm font-bold"
                  style={{ '--value': listing.score, '--size': '4rem', '--thickness': '4px' } as React.CSSProperties}
                >
                  {listing.score}
                </div>
                <div className="text-xs text-base-content/60 space-y-1">
                  <p>Score EUDR</p>
                  <p className="font-medium text-base-content">{listing.readings} lecturas</p>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {listing.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`px-2.5 py-1 rounded text-xs font-medium ${TAG_COLORS[tag] || 'bg-gray-100 text-gray-900'}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Price + action */}
              <div className="flex items-center justify-between pt-2 border-t border-base-300">
                <div>
                  <p className="text-xs text-base-content/40">Precio por acceso</p>
                  <p className="font-bold text-primary">{listing.price_sol} SOL</p>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={listing.id !== DEMO_FARM_ID}
                  onClick={() => handleRequestAccess(listing.id, listing.name)}
                  title={listing.id !== DEMO_FARM_ID ? 'Próximamente' : ''}
                >
                  {listing.id === DEMO_FARM_ID ? t('actions.request_access') : 'Próximamente'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DeSci info */}
      <div className="card bg-base-200 border border-secondary/20">
        <div className="card-body p-5">
          <h3 className="font-semibold text-secondary mb-3">🔬 ¿Qué es DeSci con GroundTruth?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-base-content/70">
            <div className="space-y-1">
              <p className="font-medium text-base-content">Datos verificables</p>
              <p>Cada lectura de sensor lleva una firma SHA-256 y una TX en Solana como prueba de integridad.</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-base-content">Acceso programático</p>
              <p>Los investigadores acceden a datasets históricos pagando en SOL, sin intermediarios.</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-base-content">Créditos de carbono</p>
              <p>Los datos de CO₂ y biomasa pueden usarse para certificaciones Verra/Gold Standard.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase confirmation modal */}
      {modalOpen && selectedFarm && (() => {
        const listing = listings.find(l => l.id === selectedFarm);
        return (
          <div className="modal modal-open">
            <div className="modal-box w-full max-w-md">
              <h3 className="font-bold text-lg mb-4">Confirmar compra de acceso</h3>
              {listing && (
                <div className="space-y-4">
                  <div className="bg-base-300 p-4 rounded-lg">
                    <p className="text-sm text-base-content/60">Finca</p>
                    <p className="font-bold text-base">{listing.name}</p>
                    <p className="text-xs text-base-content/50 mt-1">📍 {listing.location}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-base-300 p-3 rounded-lg">
                      <p className="text-xs text-base-content/60">Precio</p>
                      <p className="font-bold text-primary text-lg">{listing.price_sol} SOL</p>
                    </div>
                    <div className="bg-base-300 p-3 rounded-lg">
                      <p className="text-xs text-base-content/60">Lecturas</p>
                      <p className="font-bold text-lg">{listing.readings}</p>
                    </div>
                  </div>

                  <div className="alert alert-info">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span className="text-sm">Se procesará una transacción en Solana Devnet</span>
                  </div>
                </div>
              )}

              <div className="modal-action mt-6">
                <button
                  className="btn btn-ghost"
                  onClick={() => setModalOpen(false)}
                  disabled={transacting}
                >
                  Cancelar
                </button>
                <button
                  className={`btn btn-primary ${transacting ? 'loading' : ''}`}
                  onClick={confirmPurchase}
                  disabled={transacting}
                >
                  {transacting ? 'Procesando...' : 'Confirmar compra'}
                </button>
              </div>
            </div>
            <div className="modal-backdrop" onClick={() => !transacting && setModalOpen(false)} />
          </div>
        );
      })()}
    </div>
  );
}
