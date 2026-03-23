import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';

export function Layout() {
  return (
    <div className="flex min-h-screen bg-base-100" data-theme="groundtruth">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
