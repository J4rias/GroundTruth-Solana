interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  accent?: boolean;
}

export function StatCard({ label, value, unit, icon, trend, accent }: StatCardProps) {
  const trendColor =
    trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-base-content/50';
  const trendArrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '';

  return (
    <div className={`card bg-base-200 border ${accent ? 'border-primary/30' : 'border-base-300'}`}>
      <div className="card-body p-5">
        <div className="flex items-start justify-between">
          <p className="text-xs text-base-content/50 uppercase tracking-wider">{label}</p>
          {icon && <span className="text-lg opacity-60">{icon}</span>}
        </div>
        <div className="flex items-end gap-1 mt-2">
          <span className={`text-3xl font-bold ${accent ? 'text-primary' : 'text-base-content'}`}>
            {value}
          </span>
          {unit && <span className="text-sm text-base-content/50 mb-1">{unit}</span>}
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trendColor}`}>
            {trendArrow} {trend}
          </span>
        )}
      </div>
    </div>
  );
}
