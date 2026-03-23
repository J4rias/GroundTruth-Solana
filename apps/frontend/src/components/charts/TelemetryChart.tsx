import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { SensorReading } from '@groundtruth/types';

interface TelemetryChartProps {
  readings: SensorReading[];
  fields: Array<{
    key: keyof SensorReading;
    label: string;
    color: string;
    unit: string;
  }>;
  title: string;
}

export function TelemetryChart({ readings, fields, title }: TelemetryChartProps) {
  const data = [...readings]
    .reverse()
    .map((r) => ({
      time: new Date(r.created_at).toLocaleTimeString('es', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      ...Object.fromEntries(fields.map((f) => [f.key, r[f.key]])),
    }));

  return (
    <div className="card bg-base-200 border border-base-300">
      <div className="card-body p-5">
        <h3 className="card-title text-sm text-base-content/70">{title}</h3>
        <div className="h-52 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(30% 0.02 240)" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: 'oklch(60% 0.02 240)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'oklch(60% 0.02 240)' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'oklch(17% 0.02 240)',
                  border: '1px solid oklch(30% 0.02 240)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'oklch(88% 0.02 240)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              {fields.map((f) => (
                <Line
                  key={String(f.key)}
                  type="monotone"
                  dataKey={String(f.key)}
                  name={`${f.label} (${f.unit})`}
                  stroke={f.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
