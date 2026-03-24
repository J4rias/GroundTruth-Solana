import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { readingsApi, type ReadingsPage } from '../api/readings.js';
import type { SensorReading } from '@groundtruth/types';
import { StatusBadge } from '../components/ui/StatusBadge.js';
import { Spinner } from '../components/ui/Spinner.js';
import { ErrorAlert } from '../components/ui/ErrorAlert.js';
import { TelemetryChart } from '../components/charts/TelemetryChart.js';

const DEMO_FARM_ID = '02d1a1f4-7da1-4b6c-a39c-f9826532b47f';
const PAGE_SIZE = 20;

export function Telemetry() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ReadingsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = (isInitial = false) => {
      if (isInitial) { setLoading(true); setError(null); }
      readingsApi
        .list(DEMO_FARM_ID, page, PAGE_SIZE)
        .then(setResult)
        .catch((err: unknown) => { if (isInitial) setError(err instanceof Error ? err.message : t('errors.generic')); })
        .finally(() => { if (isInitial) setLoading(false); });
    };
    loadData(true);
    const interval = setInterval(() => loadData(false), 8000);
    return () => clearInterval(interval);
  }, [page, t]);

  if (loading) return <Spinner size="lg" />;
  if (error) return <ErrorAlert message={error} />;
  if (!result) return null;

  const readings: SensorReading[] = result.data;
  const totalPages = Math.ceil(result.total / PAGE_SIZE);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-base-content">{t('nav.telemetry')}</h1>
        <p className="text-sm text-base-content/50 mt-1">
          {result.total} lecturas totales · Página {page} de {totalPages}
        </p>
      </div>

      {/* Multi-sensor charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TelemetryChart
          readings={readings}
          title="Temperatura & Humedad"
          fields={[
            { key: 'temperature_c', label: 'Temp (°C)', color: 'oklch(65% 0.18 145)', unit: '°C' },
            { key: 'humidity_pct', label: 'Hum (%)', color: 'oklch(55% 0.14 200)', unit: '%' },
          ]}
        />
        <TelemetryChart
          readings={readings}
          title="Humedad del suelo & CO₂"
          fields={[
            { key: 'soil_moisture_pct', label: 'Suelo (%)', color: 'oklch(75% 0.20 95)', unit: '%' },
            { key: 'co2_ppm', label: 'CO₂ (ppm)', color: 'oklch(60% 0.22 25)', unit: 'ppm' },
          ]}
        />
        <TelemetryChart
          readings={readings}
          title="Batería & Señal RSSI"
          fields={[
            { key: 'battery_mv', label: 'Batería (mV)', color: 'oklch(65% 0.18 145)', unit: 'mV' },
            { key: 'rssi_dbm', label: 'RSSI (dBm)', color: 'oklch(55% 0.14 200)', unit: 'dBm' },
          ]}
        />
        <TelemetryChart
          readings={readings}
          title="Luz & Presión"
          fields={[
            { key: 'light_lux', label: 'Luz (lux)', color: 'oklch(75% 0.20 95)', unit: 'lux' },
            { key: 'pressure_hpa', label: 'Presión (hPa)', color: 'oklch(70% 0.18 200)', unit: 'hPa' },
          ]}
        />
      </div>

      {/* Readings table */}
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body p-5">
          <h3 className="font-semibold text-sm text-base-content/70 mb-3">Lecturas detalladas</h3>
          <div className="overflow-x-auto">
            <table className="table table-xs">
              <thead>
                <tr className="text-base-content/40 text-xs">
                  <th>Nodo</th>
                  <th>Temp °C</th>
                  <th>Hum %</th>
                  <th>Suelo %</th>
                  <th>CO₂ ppm</th>
                  <th>Batería mV</th>
                  <th>Estado</th>
                  <th>TX</th>
                  <th>Hora</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((r) => (
                  <tr key={r.id} className="hover">
                    <td className="font-mono text-xs">{r.node_id}</td>
                    <td>{r.temperature_c}</td>
                    <td>{r.humidity_pct}</td>
                    <td>{r.soil_moisture_pct}</td>
                    <td>{r.co2_ppm}</td>
                    <td>{r.battery_mv}</td>
                    <td>
                      <StatusBadge status={r.status as 'CONFIRMED' | 'PENDING' | 'FAILED'} />
                    </td>
                    <td>
                      {r.tx_signature ? (
                        <a
                          href={`https://explorer.solana.com/tx/${r.tx_signature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link link-primary font-mono text-xs"
                        >
                          {r.tx_signature.slice(0, 8)}…
                        </a>
                      ) : (
                        <span className="text-base-content/30">—</span>
                      )}
                    </td>
                    <td className="text-xs text-base-content/40">
                      {new Date(r.created_at).toLocaleString('es', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center gap-2 mt-4">
            <button
              className="btn btn-ghost btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Anterior
            </button>
            <span className="btn btn-ghost btn-sm no-animation cursor-default">
              {page} / {totalPages}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
