import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { farmsApi, type FarmOverviewStats } from '../api/farms.js';
import { complianceApi } from '../api/compliance.js';
import { readingsApi } from '../api/readings.js';
import type { Farm, FarmNode, SensorReading } from '@groundtruth/types';
import type { ComplianceScore } from '@groundtruth/types';
import { StatCard } from '../components/ui/StatCard.js';
import { StatusBadge } from '../components/ui/StatusBadge.js';
import { Spinner } from '../components/ui/Spinner.js';
import { ErrorAlert } from '../components/ui/ErrorAlert.js';
import { TelemetryChart } from '../components/charts/TelemetryChart.js';
import { ComplianceGauge } from '../components/charts/ComplianceGauge.js';

// For demo: use the seeded farm ID from seed.ts
const DEMO_FARM_ID = '02d1a1f4-7da1-4b6c-a39c-f9826532b47f';

const EXPLORER_BASE = 'https://explorer.solana.com/tx';

export function FarmOverview() {
  const { t } = useTranslation();

  const [farm, setFarm] = useState<Farm | null>(null);
  const [nodes, setNodes] = useState<FarmNode[]>([]);
  const [overview, setOverview] = useState<FarmOverviewStats | null>(null);
  const [score, setScore] = useState<ComplianceScore | null>(null);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = (isInitial = false) => {
      if (isInitial) { setLoading(true); setError(null); }
      Promise.all([
        farmsApi.getById(DEMO_FARM_ID),
        farmsApi.getNodes(DEMO_FARM_ID),
        farmsApi.getOverview(DEMO_FARM_ID),
        complianceApi.getScore(DEMO_FARM_ID),
        readingsApi.list(DEMO_FARM_ID, 1, 20),
      ])
        .then(([farmData, nodesData, overviewData, scoreData, readingsData]) => {
          setFarm(farmData);
          setNodes(nodesData);
          setOverview(overviewData);
          setScore(scoreData);
          setReadings(readingsData.data);
        })
        .catch((err: unknown) => {
          if (isInitial) setError(err instanceof Error ? err.message : t('errors.generic'));
        })
        .finally(() => { if (isInitial) setLoading(false); });
    };

    fetchAll(true);
    const interval = setInterval(() => fetchAll(false), 8000);
    return () => clearInterval(interval);
  }, [t]);

  if (loading) return <Spinner size="lg" />;
  if (error) return <ErrorAlert message={error} />;
  if (!farm || !overview) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-base-content">{farm.name}</h1>
          <span className="badge badge-primary badge-sm">DePIN Node</span>
        </div>
        <p className="text-sm text-base-content/50 mt-1">
          📍 {farm.location}
          {farm.farm_pubkey && (
            <span className="ml-3 font-mono text-xs opacity-40">
              {farm.farm_pubkey.slice(0, 12)}…
            </span>
          )}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('sensor.temperature')}
          value={readings[0]?.temperature_c ?? '—'}
          unit="°C"
          icon="🌡️"
          accent
        />
        <StatCard
          label={t('sensor.humidity')}
          value={readings[0]?.humidity_pct ?? '—'}
          unit="%"
          icon="💧"
        />
        <StatCard
          label="Nodos activos"
          value={overview.active_nodes}
          icon="📡"
        />
        <StatCard
          label="Lecturas hoy"
          value={overview.readings_today}
          icon="📊"
        />
      </div>

      {/* Charts + compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TelemetryChart
            readings={readings}
            title="Temperatura & Humedad (últimas 20 lecturas)"
            fields={[
              { key: 'temperature_c', label: 'Temp', color: 'oklch(65% 0.18 145)', unit: '°C' },
              { key: 'humidity_pct', label: 'Hum', color: 'oklch(55% 0.14 200)', unit: '%' },
            ]}
          />
        </div>
        {score && (
          <ComplianceGauge score={score} />
        )}
      </div>

      {/* Nodes table */}
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body p-5">
          <h3 className="font-semibold text-sm text-base-content/70 mb-3">Nodos IoT registrados</h3>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="text-base-content/50 text-xs">
                  <th>Node ID</th>
                  <th>Estado</th>
                  <th>Batería</th>
                  <th>Última señal</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((node) => (
                  <tr key={node.node_id} className="hover">
                    <td className="font-mono text-xs">{node.node_id}</td>
                    <td>
                      <StatusBadge status={node.is_active ? 'CONFIRMED' : 'FAILED'} />
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <progress
                          className="progress progress-success w-16"
                          value={(node.battery_mv ?? 3000) - 3000}
                          max={1200}
                        />
                        <span className="text-xs">{node.battery_mv ?? '—'}mV</span>
                      </div>
                    </td>
                    <td className="text-xs text-base-content/50">
                      {node.last_seen
                        ? new Date(node.last_seen).toLocaleString('es', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Last tx */}
      {overview.last_tx_signature && (
        <div className="card bg-base-200 border border-primary/20">
          <div className="card-body p-4 flex-row items-center gap-3">
            <span className="text-xl">⛓️</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-base-content/50">Última TX certificada en Solana</p>
              <p className="font-mono text-xs text-primary truncate">{overview.last_tx_signature}</p>
            </div>
            <a
              href={`${EXPLORER_BASE}/${overview.last_tx_signature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-xs"
            >
              {t('actions.view_on_chain')}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
