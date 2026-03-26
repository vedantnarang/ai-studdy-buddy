import { useTheme } from '../context/ThemeContext';

const DarkModeToggle = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle dark mode"
      className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
        isDark
          ? 'bg-slate-700 text-yellow-300 hover:bg-slate-600'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } ${className}`}
    >
      <span className="material-symbols-outlined text-xl select-none">
        {isDark ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
};

export default DarkModeToggle;
