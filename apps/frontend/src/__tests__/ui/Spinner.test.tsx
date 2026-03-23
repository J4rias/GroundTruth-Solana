import { render } from '@testing-library/react';
import { Spinner } from '../../components/ui/Spinner.js';

describe('Spinner', () => {
  it('renders the loading spinner span', () => {
    const { container } = render(<Spinner />);
    const span = container.querySelector('.loading');
    expect(span).toBeInTheDocument();
    expect(span).toHaveClass('loading-spinner');
  });

  it.each(['sm', 'md', 'lg'] as const)('renders size=%s correctly', (size) => {
    const { container } = render(<Spinner size={size} />);
    const span = container.querySelector('.loading');
    expect(span).toHaveClass(`loading-${size}`);
  });
});
