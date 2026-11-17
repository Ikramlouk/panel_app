import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Map, Bell, BarChart2, Users, 
  Settings, FileText, Wrench, User, CheckCircle, History, Box,
  ChevronLeft, ChevronRight
} from 'lucide-react'; 
import { useState, useEffect } from 'react';

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
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
    { name: 'Historique des tâches', icon: History, path: '/historique-tasks' }, 
    { name: 'Stock & pièces', icon: Box, path: '/stock' },
  ];

  return (
    <div className={`hidden md:flex flex-col bg-white dark:bg-[#1A1A1F] text-gray-900 dark:text-white h-screen border-r border-gray-200 dark:border-white/5 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      
      {/* Header m3a Bouton dyal l'Collapse */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-white/5">
        {!isCollapsed && <img src="/logo.png" alt="Logo" className="h-8 object-contain" />}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500">
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Profile (Ila kan m7loul) */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200 dark:border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center overflow-hidden">
            {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <User size={20} className="text-gray-500" />}
          </div>
          <div>
            <p className="text-sm font-bold">admin</p>
            <p className="text-[10px] text-gray-500">Administrateur</p>
          </div>
        </div>
      )}

      {/* Menu */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {menu.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary border-l-4 border-primary'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white border-l-4 border-transparent'
              }`
            }
            title={isCollapsed ? item.name : ''}
          >
            <item.icon size={20} />
            {!isCollapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}