import { createContext, useReducer, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await api.get('/auth/me');
        const userData = response.data.user || response.data.data?.user || response.data;
        dispatch({ type: 'SET_USER', payload: userData });
      } catch (error) {
        // Cookie is invalid or expired — server will reject the request
        dispatch({ type: 'LOGOUT' });
      }
    };

    checkUser();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });

      const user = response.data.user || response.data.data?.user;

      dispatch({ type: 'LOGIN', payload: user });
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      const respData = error.response?.data;
      return {
        success: false,
        error: respData?.error?.message || respData?.message || 'Login failed',
        errorCode: respData?.error?.code
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });

      const user = response.data.user || response.data.data?.user;

      dispatch({ type: 'LOGIN', payload: user });
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Even if the server call fails, clear the client state
      console.error('Logout request failed:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
      navigate('/login');
    }
  };

  const updateProfile = async (name, email) => {
    try {
      const response = await api.put('/auth/me', { name, email });
      const userData = response.data.user || response.data.data?.user || response.data;
      dispatch({ type: 'SET_USER', payload: userData });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error?.message || 'Update failed' };
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateProfile, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
