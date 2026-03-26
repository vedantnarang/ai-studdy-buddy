import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { useState } from 'react';
import DarkModeToggle from './DarkModeToggle';

const AppLayout = () => {
  const { user, logout } = useAuth();
  const { streak } = useAnalytics();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="bg-surface dark:bg-gray-900 font-body text-on-surface dark:text-gray-100 antialiased min-h-screen">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SideNavBar Component */}
      <aside 
        className={`fixed left-0 top-0 h-full z-50 flex flex-col pt-8 pb-4 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl w-64 border-r border-gray-200 dark:border-gray-800 font-headline tracking-tight transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="px-6 mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Study Buddy</h1>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">AI-Powered Learning</p>
          </div>
          {/* Mobile Close Btn */}
          <button className="lg:hidden text-gray-500" onClick={() => setIsSidebarOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <nav className="flex-1 space-y-2">
          {/* Active Navigation */}
          <Link 
            to="/dashboard"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center space-x-3 rounded-r-full ml-[-8px] pl-6 py-3 font-semibold transition-transform active:scale-95 ${
              location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/subject')
                ? 'bg-blue-100/50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <span className={`material-symbols-outlined ${location.pathname.startsWith('/dashboard') ? 'filled-icon' : ''}`}>
              dashboard
            </span>
            <span>Dashboard</span>
          </Link>
        </nav>

        <div className="mt-auto border-t border-surface-container-high dark:border-gray-700 pt-4">
          <button 
            onClick={logout}
            className="w-full flex items-center space-x-3 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 px-6 py-3 transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* TopNavBar Component */}
      <header className="sticky top-0 right-0 w-full z-30 flex justify-between items-center px-4 md:px-8 py-4 lg:ml-64 lg:max-w-[calc(100%-16rem)] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md font-headline text-sm font-medium border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4">
          {/* Hamburger for Mobile */}
          <button 
            className="lg:hidden text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-full transition-colors"
            onClick={() => setIsSidebarOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>

        <div className="flex items-center gap-4 md:gap-6 ml-auto">
          {/* Streak Badge */}
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-on-primary-container"
            style={{ backgroundColor: streak > 0 ? '#dbe1ff' : '#f0f4f7', color: streak > 0 ? '#0048bf' : '#717c82' }}
          >
            <span className={`material-symbols-outlined text-lg ${streak > 0 ? 'filled-icon text-orange-500' : ''}`}>
              local_fire_department
            </span>
            <span className="font-bold hidden sm:inline">{streak} day streak</span>
            <span className="font-bold sm:hidden">{streak}</span>
          </div>

          {/* Dark Mode Toggle */}
          <DarkModeToggle />

          {/* Profile Circle */}
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm shadow-blue-500/20">
            {user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'S')}
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="lg:ml-64 p-4 md:p-8 lg:p-12 min-h-[calc(100vh-80px)]">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
