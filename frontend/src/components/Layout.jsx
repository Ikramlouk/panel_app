import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { LogOut } from 'lucide-react';
import ThemeToggle from './ThemeToggle'; // <-- Zidna hada

export default function Layout() {
  const nav = useNavigate();
  const logout = () => { localStorage.clear(); nav('/'); };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] dark:bg-[#0F0F12] text-gray-900 dark:text-white transition-colors duration-300">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-8 bg-white dark:bg-[#1A1A1F] transition-colors">
          <div></div> 
          <div className="flex items-center gap-4">
            
            {/* Bouton dyal l'Mode */}
            <ThemeToggle /> 
            
             <div className="flex items-center gap-2">
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