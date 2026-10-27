import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Bell, BarChart2, Users, Settings, Upload } from 'lucide-react'; // Zidna Upload hna

export default function Sidebar() {
  const menu = [
    { name: 'Tableau de bord', icon: LayoutDashboard, path: '/panneaux' },
    { name: 'Carte', icon: Map, path: '/carte' },
    { name: 'Alertes', icon: Bell, path: '/alertes' },
    { name: 'Détection', icon: Upload, path: '/detection' }, // Zidna hada
    { name: 'Statistiques', icon: BarChart2, path: '/stats' },
    { name: 'Utilisateurs', icon: Users, path: '/users' },
    { name: 'Paramètres', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="w-64 bg-white dark:bg-[#1A1A1F] text-gray-900 dark:text-white h-screen flex flex-col border-r border-gray-200 dark:border-white/5 transition-colors">
      {/* Logo l'7a9i9i */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-white/5">
        <img src="/logo.png" alt="NNM Communication" className="h-8 object-contain" />
      </div>

      {/* Liens */}
      <nav className="flex-1 py-4 space-y-1">
        {menu.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white border-l-4 border-primary'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white border-l-4 border-transparent'
              }`
            }
          >
            <item.icon size={18} />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}