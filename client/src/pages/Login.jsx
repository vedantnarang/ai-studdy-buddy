import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const newFieldErrors = {};
    if (!email.trim()) newFieldErrors.email = 'Email is required';
    if (!password.trim()) newFieldErrors.password = 'Password is required';
    
    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }
    
    setFieldErrors({});
    setLoading(true);

    const result = await login(email, password);
    if (!result.success) {
      if (result.errorCode === 'USER_NOT_FOUND') {
        setError(
          <span>
            {result.error} <Link to="/register" className="underline font-bold">Sign up here</Link>
          </span>
        );
      } else {
        setError(result.error);
      }
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col justify-center items-center min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900 px-4">
      {/* Back to Home Button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all hover:-translate-x-1 group"
      >
        <span className="material-symbols-outlined text-[20px] transition-transform group-hover:scale-110 text-primary">arrow_back</span>
        <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-600 via-purple-500 to-pink-500 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">Back to Home</span>
      </Link>

      {/* Brand Header */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-linear-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Study Buddy</h1>
      </div>

      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-100 dark:border-white/5 dark:border-t-white/10">
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Welcome Back</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Sign in to continue to Study Buddy</p>
        </div>
        
        {error && (
            <div className="p-3 text-sm text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-300 rounded-lg text-center">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: null }));
              }}
              className={`mt-1 block w-full px-4 py-3 rounded-lg border ${fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-500 focus:ring-blue-500'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:border-transparent transition-colors shadow-sm`}
              placeholder="Enter your email"
              required 
            />
            {fieldErrors.email && <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <input 
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: null }));
              }}
              className={`mt-1 block w-full px-4 py-3 rounded-lg border ${fieldErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-500 focus:ring-blue-500'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:border-transparent transition-colors shadow-sm`}
              placeholder="Enter your password"
              required 
            />
            {fieldErrors.password && <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.password}</p>}
            <div className="flex items-center mt-2">
              <input
                id="show-password"
                type="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
              />
              <label htmlFor="show-password" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300 select-none cursor-pointer">
                Show password
              </label>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:shadow-md hover:shadow-blue-100/20"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
