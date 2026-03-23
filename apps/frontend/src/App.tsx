import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';
import { Layout } from './components/layout/Layout.js';
import { FarmOverview } from './pages/FarmOverview.js';
import { Telemetry } from './pages/Telemetry.js';
import { EUDRReport } from './pages/EUDRReport.js';
import { DeSciMarketplace } from './pages/DeSciMarketplace.js';
import { Spinner } from './components/ui/Spinner.js';

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Spinner size="lg" />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<FarmOverview />} />
            <Route path="telemetry" element={<Telemetry />} />
            <Route path="eudr" element={<EUDRReport />} />
            <Route path="desci" element={<DeSciMarketplace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
