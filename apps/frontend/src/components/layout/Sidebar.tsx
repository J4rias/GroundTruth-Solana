import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

export function Sidebar() {
  const { t, i18n } = useTranslation();

  const navItems: NavItem[] = [
    { to: '/', label: t('nav.overview'), icon: '🌱' },
    { to: '/telemetry', label: t('nav.telemetry'), icon: '📡' },
    { to: '/eudr', label: t('nav.eudr'), icon: '📋' },
    { to: '/desci', label: t('nav.desci'), icon: '🔬' },
  ];

  function toggleLang() {
    const next = i18n.language.startsWith('es') ? 'en' : 'es';
    void i18n.changeLanguage(next);
  }

  return (
    <aside className="w-60 min-h-screen bg-base-200 border-r border-base-300 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-base-300">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌿</span>
          <div>
            <p className="font-bold text-primary text-sm leading-tight">GroundTruth</p>
            <p className="text-xs text-base-content/50">DePIN · Solana</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-primary/20 text-primary font-medium'
                  : 'text-base-content/70 hover:bg-base-300 hover:text-base-content'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-base-300 space-y-2">
        <button onClick={toggleLang} className="btn btn-ghost btn-xs w-full justify-start gap-2">
          <span>🌐</span>
          <span className="uppercase text-xs">{i18n.language.slice(0, 2)}</span>
        </button>
        <div className="flex items-center gap-2 px-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-base-content/50">Devnet</span>
        </div>
      </div>
    </aside>
  );
}
