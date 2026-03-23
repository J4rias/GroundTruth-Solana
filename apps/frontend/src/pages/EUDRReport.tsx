import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { complianceApi, type ProofEntry } from '../api/compliance.js';
import type { ComplianceScore } from '@groundtruth/types';
import { ComplianceGauge } from '../components/charts/ComplianceGauge.js';
import { Spinner } from '../components/ui/Spinner.js';
import { ErrorAlert } from '../components/ui/ErrorAlert.js';

const DEMO_FARM_ID = '1';
const EXPLORER_BASE = 'https://explorer.solana.com/tx';

export function EUDRReport() {
  const { t } = useTranslation();
  const [score, setScore] = useState<ComplianceScore | null>(null);
  const [proofs, setProofs] = useState<ProofEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      complianceApi.getScore(DEMO_FARM_ID),
      complianceApi.getProofChain(DEMO_FARM_ID),
    ])
      .then(([scoreData, proofData]) => {
        setScore(scoreData);
        setProofs(proofData);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : t('errors.generic')))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) return <Spinner size="lg" />;
  if (error) return <ErrorAlert message={error} />;
  if (!score) return null;

  const levelColor =
    score.level === 'COMPLIANT'
      ? 'text-success'
      : score.level === 'WARNING'
        ? 'text-warning'
        : 'text-error';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-base-content">{t('nav.eudr')}</h1>
        <p className="text-sm text-base-content/50 mt-1">
          Reporte de cumplimiento EUDR — EU Deforestation Regulation 2023/1115
        </p>
      </div>

      {/* Score + parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ComplianceGauge score={score} />

        <div className="lg:col-span-2 space-y-4">
          {/* Level banner */}
          <div
            className={`alert ${
              score.level === 'COMPLIANT'
                ? 'alert-success'
                : score.level === 'WARNING'
                  ? 'alert-warning'
                  : 'alert-error'
            }`}
          >
            <span className="text-lg">
              {score.level === 'COMPLIANT' ? '✅' : score.level === 'WARNING' ? '⚠️' : '❌'}
            </span>
            <div>
              <p className="font-bold">
                Nivel de cumplimiento:{' '}
                <span className={levelColor}>
                  {score.level === 'COMPLIANT'
                    ? 'CONFORME'
                    : score.level === 'WARNING'
                      ? 'ADVERTENCIA'
                      : 'NO CONFORME'}
                </span>
              </p>
              <p className="text-sm opacity-80">
                {score.compliant_readings} de {score.total_readings} lecturas dentro de los umbrales EUDR
              </p>
            </div>
          </div>

          {/* Parameter thresholds */}
          <div className="card bg-base-200 border border-base-300">
            <div className="card-body p-5">
              <h3 className="font-semibold text-sm text-base-content/70 mb-4">
                Parámetros evaluados
              </h3>
              <div className="space-y-4">
                {score.parameters.map((param) => (
                  <div key={param.name}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{param.name}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-bold ${param.is_compliant ? 'text-success' : 'text-error'}`}
                        >
                          {param.current_value} {param.unit}
                        </span>
                        <span className="text-xs text-base-content/40">
                          [{param.min_threshold}–{param.max_threshold} {param.unit}]
                        </span>
                      </div>
                    </div>
                    <progress
                      className={`progress w-full ${param.is_compliant ? 'progress-success' : 'progress-error'}`}
                      value={param.current_value - param.min_threshold}
                      max={param.max_threshold - param.min_threshold}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Last evaluation */}
          <p className="text-xs text-base-content/40 text-right">
            Última evaluación:{' '}
            {new Date(score.last_evaluated_at).toLocaleString('es', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        </div>
      </div>

      {/* Proof chain */}
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">⛓️</span>
            <h3 className="font-semibold text-sm text-base-content/70">
              Cadena de custodia on-chain (últimas {proofs.length} TX)
            </h3>
          </div>

          {proofs.length === 0 ? (
            <p className="text-sm text-base-content/40 text-center py-4">
              No hay transacciones certificadas aún
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr className="text-base-content/40 text-xs">
                    <th>#</th>
                    <th>TX Signature</th>
                    <th>Temp °C</th>
                    <th>Hum %</th>
                    <th>EUDR</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {proofs.map((proof, i) => (
                    <tr key={proof.tx_signature} className="hover">
                      <td className="text-xs text-base-content/40">{i + 1}</td>
                      <td>
                        <a
                          href={`${EXPLORER_BASE}/${proof.tx_signature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link link-primary font-mono text-xs"
                        >
                          {proof.tx_signature.slice(0, 12)}…
                        </a>
                      </td>
                      <td className="text-xs">{proof.temperature_c}°C</td>
                      <td className="text-xs">{proof.humidity_pct}%</td>
                      <td>
                        <span
                          className={`badge badge-xs ${proof.is_compliant ? 'badge-success' : 'badge-error'}`}
                        >
                          {proof.is_compliant ? '✓' : '✗'}
                        </span>
                      </td>
                      <td className="text-xs text-base-content/40">
                        {new Date(proof.timestamp).toLocaleString('es', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Download placeholder */}
      <div className="flex justify-end">
        <button className="btn btn-outline btn-sm gap-2">
          <span>📄</span>
          {t('actions.generate_report')}
        </button>
      </div>
    </div>
  );
}
