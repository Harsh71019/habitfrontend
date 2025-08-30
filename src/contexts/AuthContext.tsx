import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    timezone?: string;
  }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Safely initialize with true if token exists
    try {
      const token = localStorage.getItem('auth_token');
      console.log('AuthProvider init - token exists:', !!token);
      return !!token;
    } catch (error) {
      console.log('AuthProvider init - localStorage error:', error);
      return false;
    }
  });
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => {
      console.log('Making getCurrentUser API call...');
      return api.getCurrentUser();
    },
    enabled: (() => {
      try {
        const hasToken = !!localStorage.getItem('auth_token');
        console.log('Query enabled - hasToken:', hasToken);
        return hasToken;
      } catch (error) {
        console.log('Query enabled - localStorage error:', error);
        return false;
      }
    })(),
    retry: false,
  });

  useEffect(() => {
    let hasToken = false;
    try {
      hasToken = !!localStorage.getItem('auth_token');
    } catch (error) {
      hasToken = false;
    }

    console.log('AuthProvider useEffect:', { hasToken, user: !!user, error: !!error, isLoading });

    if (hasToken) {
      // Only set to false if we have a token but got an error (token invalid)
      if (error) {
        console.log('Token invalid, logging out:', error);
        setIsAuthenticated(false);
        api.removeToken();
      } else if (user) {
        console.log('User authenticated successfully');
        setIsAuthenticated(true);
      }
      // Don't change state if we're still loading and have a token
    } else {
      console.log('No token found, setting authenticated to false');
      setIsAuthenticated(false);
    }
  }, [user, error, isLoading]);

  const login = async (email: string, password: string) => {
    const response = await api.login({ email, password });
    api.setToken(response.data!.token);
    setIsAuthenticated(true);
    queryClient.setQueryData(['currentUser'], response.data!.user);
  };

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    timezone?: string;
  }) => {
    const response = await api.register(userData);
    api.setToken(response.data!.token);
    setIsAuthenticated(true);
    queryClient.setQueryData(['currentUser'], response.data!.user);
  };

  const logout = () => {
    api.removeToken();
    setIsAuthenticated(false);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        login,
        register,
        logout,
        isLoading,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}