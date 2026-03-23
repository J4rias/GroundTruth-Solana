import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../../components/ui/StatusBadge.js';

describe('StatusBadge', () => {
  const cases = [
    ['CONFIRMED', 'Confirmed', 'badge-success'],
    ['PENDING', 'Pending', 'badge-warning'],
    ['FAILED', 'Failed', 'badge-error'],
    ['COMPLIANT', 'Compliant', 'badge-success'],
    ['WARNING', 'Warning', 'badge-warning'],
    ['NON_COMPLIANT', 'Non-Compliant', 'badge-error'],
  ] as const;

  test.each(cases)(
    'status %s → label "%s" with class %s',
    (status, label, cls) => {
      const { container } = render(<StatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(container.firstChild).toHaveClass(cls);
    },
  );
});
