import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';

export function Layout() {
  return (
    <div className="min-h-screen bg-base-100" data-theme="groundtruth">
      <Sidebar />
      <main className="ml-60 min-h-screen overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
