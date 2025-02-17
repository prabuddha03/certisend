import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: string;
  organization?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, redirectTo?: string) => Promise<void>;
  loginWithGoogle: (token: string, redirectTo?: string) => Promise<void>;
  register: (formData: any, redirectTo?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        setToken(storedToken);
        
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/users/profile`
        );
        
        if (response.data) {
          setUser(response.data);
        } else {
          handleLogout();
        }
      } catch (error) {
        console.error('Auth check error:', error);
        handleLogout();
      }
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const login = async (email: string, password: string, redirectTo?: string) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/users/login`,
        { email, password }
      );
      
      const { token: newToken, user: userData } = response.data;
      
      if (newToken && userData) {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        setUser(userData);
        navigate(redirectTo || '/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const loginWithGoogle = async (googleToken: string, redirectTo?: string) => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/google/callback`,
        { token: googleToken }
      );
      
      if (response.data.token && response.data.user) {
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        setUser(response.data.user);
        navigate(redirectTo || '/dashboard');
        toast.success('Successfully logged in with Google!');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Failed to login with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (formData: any, redirectTo?: string) => {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/users/register`,
      formData
    );
    localStorage.setItem('token', response.data.token);
    setToken(response.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    setUser(response.data.user);
    navigate(redirectTo || '/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token,
      login, 
      loginWithGoogle, 
      register, 
      logout, 
      isLoading 
    }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};