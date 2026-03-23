type Status = 'CONFIRMED' | 'PENDING' | 'FAILED' | 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';

const STATUS_CONFIG: Record<Status, { label: string; cls: string }> = {
  CONFIRMED: { label: 'Confirmed', cls: 'badge-success' },
  PENDING: { label: 'Pending', cls: 'badge-warning' },
  FAILED: { label: 'Failed', cls: 'badge-error' },
  COMPLIANT: { label: 'Compliant', cls: 'badge-success' },
  WARNING: { label: 'Warning', cls: 'badge-warning' },
  NON_COMPLIANT: { label: 'Non-Compliant', cls: 'badge-error' },
};

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`badge badge-sm ${config.cls} gap-1`}>
      {config.label}
    </span>
  );
}
