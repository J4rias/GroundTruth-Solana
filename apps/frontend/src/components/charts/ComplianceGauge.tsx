import type { ComplianceScore } from '@groundtruth/types';
import { StatusBadge } from '../ui/StatusBadge.js';

interface ComplianceGaugeProps {
  score: ComplianceScore;
}

export function ComplianceGauge({ score }: ComplianceGaugeProps) {
  const pct = score.score;
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference * (1 - pct / 100);

  const strokeColor =
    score.level === 'COMPLIANT'
      ? 'oklch(65% 0.18 145)'
      : score.level === 'WARNING'
        ? 'oklch(75% 0.20 95)'
        : 'oklch(60% 0.22 25)';

  return (
    <div className="card bg-base-200 border border-base-300">
      <div className="card-body p-5 items-center text-center gap-3">
        {/* SVG gauge ring */}
        <div className="relative w-36 h-36">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="oklch(25% 0.02 240)"
              strokeWidth="10"
            />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke={strokeColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-base-content">{pct}</span>
            <span className="text-xs text-base-content/50">/ 100</span>
          </div>
        </div>

        <StatusBadge status={score.level} />

        <div className="w-full space-y-1">
          <div className="flex justify-between text-xs text-base-content/60">
            <span>Lecturas analizadas</span>
            <span className="font-medium text-base-content">{score.total_readings}</span>
          </div>
          <div className="flex justify-between text-xs text-base-content/60">
            <span>Conformes</span>
            <span className="font-medium text-success">{score.compliant_readings}</span>
          </div>
          <div className="flex justify-between text-xs text-base-content/60">
            <span>No conformes</span>
            <span className="font-medium text-error">
              {score.total_readings - score.compliant_readings}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
