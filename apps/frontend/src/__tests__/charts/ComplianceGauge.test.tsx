import { render, screen } from '@testing-library/react';
import { ComplianceGauge } from '../../components/charts/ComplianceGauge.js';
import type { ComplianceScore } from '@groundtruth/types';

function makeScore(overrides: Partial<ComplianceScore> = {}): ComplianceScore {
  return {
    farm_id: '1',
    score: 85,
    raw_score: 85,
    level: 'COMPLIANT',
    total_readings: 100,
    compliant_readings: 85,
    last_evaluated_at: new Date('2026-01-01'),
    parameters: [],
    ...overrides,
  };
}

describe('ComplianceGauge', () => {
  it('displays the numeric score', () => {
    render(<ComplianceGauge score={makeScore({ score: 72 })} />);
    expect(screen.getByText('72')).toBeInTheDocument();
  });

  it('displays total readings count', () => {
    render(<ComplianceGauge score={makeScore({ total_readings: 200 })} />);
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('displays compliant readings count', () => {
    render(<ComplianceGauge score={makeScore({ compliant_readings: 160, total_readings: 200 })} />);
    expect(screen.getByText('160')).toBeInTheDocument();
  });

  it('calculates non-compliant count as total minus compliant', () => {
    render(
      <ComplianceGauge score={makeScore({ total_readings: 100, compliant_readings: 75 })} />,
    );
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('shows "Compliant" badge for COMPLIANT level', () => {
    render(<ComplianceGauge score={makeScore({ level: 'COMPLIANT' })} />);
    expect(screen.getByText('Compliant')).toBeInTheDocument();
  });

  it('shows "Warning" badge for WARNING level', () => {
    render(<ComplianceGauge score={makeScore({ level: 'WARNING', score: 55 })} />);
    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('shows "Non-Compliant" badge for NON_COMPLIANT level', () => {
    render(<ComplianceGauge score={makeScore({ level: 'NON_COMPLIANT', score: 30 })} />);
    expect(screen.getByText('Non-Compliant')).toBeInTheDocument();
  });
});
