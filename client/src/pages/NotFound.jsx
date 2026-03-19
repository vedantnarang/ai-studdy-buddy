import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center space-y-6 max-w-md animate-in fade-in slide-in-from-bottom-4">
        <h1 className="text-9xl font-black text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">Whoops, lost your way?</h2>
        <p className="text-gray-500 dark:text-gray-400">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link 
          to="/dashboard" 
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm transition-colors mt-8"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};
export default NotFound;
