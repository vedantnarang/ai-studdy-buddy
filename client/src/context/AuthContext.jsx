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
      const token = localStorage.getItem('token');
      if (!token) {
        dispatch({ type: 'LOGOUT' });
        return;
      }

      try {
        const response = await api.get('/auth/me');
        const userData = response.data.user || response.data.data?.user || response.data;
        dispatch({ type: 'SET_USER', payload: userData });
      } catch (error) {
        localStorage.removeItem('token');
        dispatch({ type: 'LOGOUT' });
      }
    };

    checkUser();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      const token = response.data.token || response.data.data?.token;
      const user = response.data.user || response.data.data?.user;

      localStorage.setItem('token', token);
      dispatch({ type: 'LOGIN', payload: user });
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      
      const token = response.data.token || response.data.data?.token;
      const user = response.data.user || response.data.data?.user;

      localStorage.setItem('token', token);
      dispatch({ type: 'LOGIN', payload: user });
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
    navigate('/login');
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
