import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Map, Bell, BarChart2, Users, 
  Settings, FileText, Wrench, User, CheckCircle, History // <-- ZEDNA HISTORY
} from 'lucide-react'; 
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) setAvatar(savedAvatar);
  }, []);

  const menu = [
    { name: 'Tableau de bord', icon: LayoutDashboard, path: '/panneaux' },
    { name: 'Carte', icon: Map, path: '/carte' },
    { name: 'Alertes', icon: Bell, path: '/alertes' },
    { name: 'Rapports', icon: FileText, path: '/rapports' },
    { name: 'Statistiques', icon: BarChart2, path: '/stats' },
    { name: 'Utilisateurs', icon: Users, path: '/users' },
    { name: 'Paramètres', icon: Settings, path: '/settings' },
    { name: 'Maintenance', icon: Wrench, path: '/maintenance' },
    { name: 'Tasks', icon: CheckCircle, path: '/tasks' },
    { name: 'Historique des tâches', icon: History, path: '/historique-tasks' }, // <-- Daba ghadi ykhdem
  ];

  return (
    <div className="w-64 bg-white dark:bg-[#1A1A1F] text-gray-900 dark:text-white h-screen flex flex-col border-r border-gray-200 dark:border-white/5 transition-colors">
      <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-white/5">
        <img src="/logo.png" alt="NNM Communication" className="h-8 object-contain" />
        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-white/10">
          {avatar ? <img src={avatar} alt="User" className="w-full h-full object-cover" /> : <User size={16} className="text-gray-500" />}
        </div>
      </div>
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
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