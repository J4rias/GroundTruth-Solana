import { render, screen } from '@testing-library/react';
import { ErrorAlert } from '../../components/ui/ErrorAlert.js';

describe('ErrorAlert', () => {
  it('renders the error message', () => {
    render(<ErrorAlert message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('has alert-error CSS class', () => {
    const { container } = render(<ErrorAlert message="Error" />);
    expect(container.firstChild).toHaveClass('alert-error');
  });
});
