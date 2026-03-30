import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Manual validation
    const newFieldErrors = {};
    if (!name.trim()) newFieldErrors.name = 'Full name is required';
    if (!email.trim()) newFieldErrors.email = 'Email is required';
    if (!password.trim()) {
      newFieldErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newFieldErrors.password = 'Password must be at least 6 characters';
    }
    
    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }
    
    setFieldErrors({});
    setLoading(true);

    const result = await register(name, email, password);
    if (!result.success) {
      setError(result.error || 'Failed to register');
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-lg shadow-blue-500">
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Create an Account</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Join Study Buddy today!</p>
        </div>
        
        {error && (
            <div className="p-3 text-sm text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-300 rounded-lg text-center">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: null }));
              }}
              className={`mt-1 block w-full px-4 py-3 rounded-lg border ${fieldErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent transition-colors shadow-sm`}
              placeholder="Enter your name"
              required 
            />
            {fieldErrors.name && <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: null }));
              }}
              className={`mt-1 block w-full px-4 py-3 rounded-lg border ${fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent transition-colors shadow-sm`}
              placeholder="Enter your email"
              required 
            />
            {fieldErrors.email && <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: null }));
              }}
              className={`mt-1 block w-full px-4 py-3 rounded-lg border ${fieldErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent transition-colors shadow-sm`}
              placeholder="Enter your password"
              required 
              minLength={6}
            />
            {fieldErrors.password && <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.password}</p>}
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:shadow-md hover:shadow-blue-100/20"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
