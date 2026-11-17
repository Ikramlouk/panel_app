import { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import { LogOut, Bell, User, LayoutDashboard, Map, Wrench, Box, Settings } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import api from '../services/api';

export default function Layout() {
  const nav = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [avatar, setAvatar] = useState(null);
  
  // State dyal l'Collapse dyal Sidebar
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) setAvatar(savedAvatar);
  }, []);

  const logout = () => { localStorage.clear(); nav('/'); };

  useEffect(() => {
    const checkNotifications = () => {
      api.get('/panneaux/detections/all').then(res => {
        const unread = res.data.filter(d => d.panneau_status === 'anomalie' && !d.is_acknowledged);
        setUnreadCount(unread.length);
      }).catch(() => {});
    };
    checkNotifications();
    const interval = setInterval(checkNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] dark:bg-[#0F0F12] text-gray-900 dark:text-white transition-colors duration-300">
      
      {/* Sidebar dyal l'PC */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <div className="flex-1 flex flex-col pb-16 md:pb-0"> {/* Padding l l'Bottom Bar */}
        
        {/* Header l'fo9 */}
        <header className="h-16 border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-6 bg-white dark:bg-[#1A1A1F] transition-colors">
          <div></div> 
          <div className="flex items-center gap-4">
            <ThemeToggle /> 
            <Link to="/notifications" className="relative p-2 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 transition text-gray-600 dark:text-gray-300">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse border-2 border-white dark:border-[#1A1A1F]">
                  {unreadCount}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-2 ml-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-sm overflow-hidden">
                {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <User size={16} />}
              </div>
              <span className="text-sm font-medium hidden sm:block">admin</span>
            </div>
            <button onClick={logout} className="text-gray-400 hover:text-primary transition"><LogOut size={20} /></button>
          </div>
        </header>

        {/* L'Contenu */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* 🔥 L'BOTTOM BAR (GHIR F L'MOBILE) 🔥 */}
      <div className="md:hidden fixed bottom-0 w-full bg-white dark:bg-[#1A1A1F] border-t border-gray-200 dark:border-white/10 flex justify-around items-center h-16 z-50">
        {[
          { icon: LayoutDashboard, path: '/panneaux' },
          { icon: Map, path: '/carte' },
          { icon: Wrench, path: '/maintenance' },
          { icon: Box, path: '/stock' },
          { icon: Settings, path: '/settings' },
        ].map((item, i) => (
          <NavLink key={i} to={item.path} className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-primary' : 'text-gray-500'}`}>
            <item.icon size={22} />
          </NavLink>
        ))}
      </div>
    </div>
  );
}