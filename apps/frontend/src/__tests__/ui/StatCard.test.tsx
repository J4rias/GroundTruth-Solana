import { render, screen } from '@testing-library/react';
import { StatCard } from '../../components/ui/StatCard.js';

describe('StatCard', () => {
  it('renders label and numeric value', () => {
    render(<StatCard label="Temperature" value={25} />);
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('renders string value (dash placeholder)', () => {
    render(<StatCard label="Humidity" value="—" />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders unit when provided', () => {
    render(<StatCard label="Temperature" value={25} unit="°C" />);
    expect(screen.getByText('°C')).toBeInTheDocument();
  });

  it('renders emoji icon when provided', () => {
    render(<StatCard label="Temperature" value={25} icon="🌡️" />);
    expect(screen.getByText('🌡️')).toBeInTheDocument();
  });

  it('renders up trend arrow', () => {
    render(<StatCard label="Temperature" value={25} trend="up" />);
    expect(screen.getByText(/↑/)).toBeInTheDocument();
  });

  it('renders down trend arrow', () => {
    render(<StatCard label="Temperature" value={25} trend="down" />);
    expect(screen.getByText(/↓/)).toBeInTheDocument();
  });

  it('applies accent border class when accent=true', () => {
    const { container } = render(<StatCard label="Temperature" value={25} accent />);
    expect(container.firstChild).toHaveClass('border-primary/30');
  });

  it('applies default border when accent is not set', () => {
    const { container } = render(<StatCard label="Temperature" value={25} />);
    expect(container.firstChild).toHaveClass('border-base-300');
  });
});
