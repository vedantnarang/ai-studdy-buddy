import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { useSubjects } from '../hooks/useSubjects';
import { useState } from 'react';
import DarkModeToggle from './DarkModeToggle';

const AppLayout = () => {
  const { user, logout } = useAuth();
  const { streak } = useAnalytics();
  const { subjects = [] } = useSubjects();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSubjectsDropdownOpen, setIsSubjectsDropdownOpen] = useState(location.pathname.startsWith('/subject'));

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
              location.pathname === '/dashboard' || location.pathname === '/'
                ? 'bg-blue-100/50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <span className={`material-symbols-outlined ${location.pathname === '/dashboard' || location.pathname === '/' ? 'filled-icon' : ''}`}>
              dashboard
            </span>
            <span>Dashboard</span>
          </Link>

          {/* Subjects Dropdown */}
          {subjects && subjects.length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setIsSubjectsDropdownOpen(!isSubjectsDropdownOpen)}
                className={`w-full flex items-center justify-between space-x-3 rounded-r-full ml-[-8px] pr-4 pl-6 py-3 font-semibold transition-transform active:scale-95 ${
                  location.pathname.startsWith('/subject') && !isSubjectsDropdownOpen
                    ? 'bg-blue-100/50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`material-symbols-outlined ${location.pathname.startsWith('/subject') ? 'filled-icon' : ''}`}>
                    library_books
                  </span>
                  <span>Subjects</span>
                </div>
                <span className={`material-symbols-outlined transition-transform duration-200 ${isSubjectsDropdownOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>
              
              {/* Dropdown Items */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isSubjectsDropdownOpen ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="flex flex-col space-y-1 ml-4 pl-8 border-l-2 border-slate-200 dark:border-slate-800 pb-2">
                  {subjects.map(subject => (
                    <Link
                      key={subject._id}
                      to={`/subject/${subject._id}`}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`block py-2 pr-4 pl-2 rounded-r-full text-sm font-medium transition-colors ${
                        location.pathname === `/subject/${subject._id}`
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 my-0.5 border-l-2 border-blue-500 ml-[-2px]'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 my-0.5'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <div 
                          className="w-2 h-2 rounded-full shrink-0" 
                          style={{ backgroundColor: subject.color || '#0053db' }}
                        />
                        <span className="truncate">{subject.title}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
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
          <div className="relative group/streak">
            <div 
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-on-primary-container cursor-default"
              style={{ backgroundColor: streak > 0 ? '#dbe1ff' : '#f0f4f7', color: streak > 0 ? '#0048bf' : '#717c82' }}
            >
              <span className={`material-symbols-outlined text-lg ${streak > 0 ? 'filled-icon text-orange-500' : ''}`}>
                local_fire_department
              </span>
              <span className="font-bold hidden sm:inline">{streak} day streak</span>
              <span className="font-bold sm:hidden">{streak}</span>
            </div>
            <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-blue-500 dark:bg-gray-800 text-white text-xs rounded-xl shadow-xl opacity-0 invisible group-hover/streak:opacity-100 group-hover/streak:visible transition-all duration-500 pointer-events-none">
              <p className="font-semibold mb-1">🔥 How streak work</p>
              <p className="text-gray-300 leading-relaxed pt-0.5">Complete quizzes or review flashcards daily to keep your streak alive. Miss a day and it resets!</p>
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <DarkModeToggle />

          {/* Profile Circle */}
          <Link 
            to="/profile" 
            className={`w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold font-headline shadow-sm shadow-blue-500/20 hover:scale-110 hover:bg-blue-700 transition-all cursor-pointer ${location.pathname === '/profile' ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
            title="View Profile"
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'S')}
          </Link>
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
