import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ── i18next mock — stable `t` reference so useEffect([t]) doesn't loop ───────
const stableT = (key: string) => key;
const stableI18n = { changeLanguage: vi.fn(), language: 'es' };

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: stableT, i18n: stableI18n }),
  Trans: ({ children }: { children: unknown }) => children,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

// ── Recharts mock — jsdom has no ResizeObserver / SVG layout ─────────────────
vi.mock('recharts', () => ({
  LineChart: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  // Pass children through without JSX (setup.ts is not .tsx)
  ResponsiveContainer: ({ children }: { children: unknown }) => children,
}));

// ── ResizeObserver stub ───────────────────────────────────────────────────────
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
