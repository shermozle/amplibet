import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { trackUserSignup, trackUserLogin, trackUserLogout, setUserProperties } from '../utils/analytics';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  logout: () => void;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'RESTORE_SESSION'; payload: User };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'RESTORE_SESSION':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session from localStorage on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('amplibet_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        // Convert createdAt string back to Date
        user.createdAt = new Date(user.createdAt);
        
        
        dispatch({ type: 'RESTORE_SESSION', payload: user });
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('amplibet_user');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock authentication - accept any email/password combination
      const user: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        firstName: email.split('@')[0].split('.')[0] || 'User',
        lastName: email.split('@')[0].split('.')[1] || 'Demo',
        createdAt: new Date(),
      };

      // Store user in localStorage
      localStorage.setItem('amplibet_user', JSON.stringify(user));
      
      // Track login event (wrapped in try-catch to prevent auth failure)
      try {
        trackUserLogin(user.id, user.email);
      } catch (analyticsError) {
        console.warn('Analytics tracking failed during login:', analyticsError);
      }
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error) {
      console.error('Login error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const signup = async (userData: Omit<User, 'id' | 'createdAt'>): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create new user
      const user: User = {
        ...userData,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
      };

      // Store user in localStorage
      localStorage.setItem('amplibet_user', JSON.stringify(user));
      
      // Track signup event (wrapped in try-catch to prevent auth failure)
      try {
        trackUserSignup(user.id, user.email, user.firstName, user.lastName);
      } catch (analyticsError) {
        console.warn('Analytics tracking failed during signup:', analyticsError);
      }
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error) {
      console.error('Signup error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = (): void => {
    // Track logout event before clearing user data (wrapped in try-catch)
    if (state.user) {
      try {
        trackUserLogout(state.user.id);
      } catch (analyticsError) {
        console.warn('Analytics tracking failed during logout:', analyticsError);
      }
    }
    
    // Remove user from localStorage
    localStorage.removeItem('amplibet_user');
    // Also clear any betting data associated with the user
    localStorage.removeItem('amplibet_bets');
    
    dispatch({ type: 'LOGOUT' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
