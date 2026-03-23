import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, beforeEach, afterEach } from 'vitest';
import { FarmOverview } from '../../pages/FarmOverview.js';
import type { Farm, FarmNode } from '@groundtruth/types';
import type { FarmOverviewStats } from '../../api/farms.js';
import type { ComplianceScore } from '@groundtruth/types';

// ── Mock API modules ──────────────────────────────────────────────────────────

vi.mock('../../api/farms.js', () => ({
  farmsApi: {
    getById: vi.fn(),
    getNodes: vi.fn(),
    getOverview: vi.fn(),
  },
}));

vi.mock('../../api/compliance.js', () => ({
  complianceApi: {
    getScore: vi.fn(),
  },
}));

vi.mock('../../api/readings.js', () => ({
  readingsApi: {
    list: vi.fn(),
  },
}));

// ── Import mocked modules ─────────────────────────────────────────────────────

import { farmsApi } from '../../api/farms.js';
import { complianceApi } from '../../api/compliance.js';
import { readingsApi } from '../../api/readings.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockFarm: Farm = {
  id: '1',
  name: 'Finca El Progreso',
  location: 'Antioquia, Colombia',
  owner_pubkey: 'owner123',
  farm_pubkey: null,
  is_active: true,
  created_at: new Date('2026-01-01'),
};

const mockNodes: FarmNode[] = [
  {
    id: 'n1',
    node_id: 'GT-NODE-001',
    farm_id: '1',
    node_pubkey: null,
    is_active: true,
    last_seen: new Date('2026-03-20T10:00:00Z'),
    battery_mv: 3800,
    created_at: new Date('2026-01-01'),
  },
];

const mockOverview: FarmOverviewStats = {
  active_nodes: 1,
  readings_today: 12,
  compliance_score_pct: 85,
  last_tx_signature: null,
  last_tx_at: null,
};

const mockScore: ComplianceScore = {
  farm_id: '1',
  score: 85,
  raw_score: 85,
  level: 'COMPLIANT',
  total_readings: 100,
  compliant_readings: 85,
  last_evaluated_at: new Date('2026-01-01'),
  parameters: [],
};

const mockReadings = { data: [], total: 0 };

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderPage() {
  return render(
    <MemoryRouter>
      <FarmOverview />
    </MemoryRouter>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('FarmOverview', () => {
  beforeEach(() => {
    vi.mocked(farmsApi.getById).mockResolvedValue(mockFarm);
    vi.mocked(farmsApi.getNodes).mockResolvedValue(mockNodes);
    vi.mocked(farmsApi.getOverview).mockResolvedValue(mockOverview);
    vi.mocked(complianceApi.getScore).mockResolvedValue(mockScore);
    vi.mocked(readingsApi.list).mockResolvedValue(mockReadings);
  });

  afterEach(() => vi.clearAllMocks());

  it('shows a loading spinner initially', () => {
    vi.mocked(farmsApi.getById).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(document.querySelector('.loading')).toBeInTheDocument();
  });

  it('renders the farm name after data loads', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Finca El Progreso')).toBeInTheDocument();
    });
  });

  it('renders the farm location', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Antioquia, Colombia/)).toBeInTheDocument();
    });
  });

  it('renders the node ID in the nodes table', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('GT-NODE-001')).toBeInTheDocument();
    });
  });

  it('shows ErrorAlert when an API call rejects', async () => {
    vi.mocked(farmsApi.getById).mockImplementation(() =>
      Promise.reject(new Error('Network error')),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument());
  });
});
