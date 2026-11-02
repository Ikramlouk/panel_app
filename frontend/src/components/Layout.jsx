import { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { LogOut, Bell } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import api from '../services/api'; // <-- Zidna api hna

export default function Layout() {
  const nav = useNavigate();
  const logout = () => { localStorage.clear(); nav('/'); };
  
  // State bach n7esbo l'Notifications l'jdad (li ma t9rawch)
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkNotifications = () => {
      api.get('/panneaux/detections/all').then(res => {
        // Kan7esbo ghir li fihom anomalie w ma t'acquittawch
        const unread = res.data.filter(d => d.panneau_status === 'anomalie' && !d.is_acknowledged);
        setUnreadCount(unread.length);
      }).catch(() => {});
    };
    
    checkNotifications();
    const interval = setInterval(checkNotifications, 10000); // Update kol 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] dark:bg-[#0F0F12] text-gray-900 dark:text-white transition-colors duration-300">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-8 bg-white dark:bg-[#1A1A1F] transition-colors">
          <div></div> 
          <div className="flex items-center gap-4">
            
            {/* Bouton dyal l'Mode */}
            <ThemeToggle /> 
            
            {/* Bouton dyal l'Notifications (Jarass) */}
            <Link to="/notifications" className="relative p-2 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 transition text-gray-600 dark:text-gray-300">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse border-2 border-white dark:border-[#1A1A1F]">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Admin Profile */}
             <div className="flex items-center gap-2 ml-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-sm">A</div>
              <span className="text-sm font-medium">admin</span>
            </div>
            <button onClick={logout} className="text-gray-400 hover:text-primary transition">
              <LogOut size={20} />
            </button>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}