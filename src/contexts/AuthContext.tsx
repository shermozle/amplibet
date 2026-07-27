import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  trackUserSignup,
  trackUserLogin,
  trackUserLogout,
  identifyLoyaltyMember
} from '../utils/analytics';
import { mintLoyaltyId, isLoyaltyId } from '../utils/loyalty';

export interface User {
  // The loyalty ID (AB-XXXXXXXX). It is the account identifier, the localStorage
  // key suffix and the Amplitude user_id, all at once — deliberately one value
  // rather than an internal id plus a separate loyalty number, because two ids
  // for one person is exactly what stops kiosk and web sessions joining up.
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

        // Sessions stored before loyalty IDs existed have a random id like
        // '2vfjpcuif'. Mint a real one so the card, the barcode and the
        // Amplitude user_id are all valid. Their existing per-user localStorage
        // keys are orphaned by this, which is the local echo of the identity
        // break documented in SPECIFICATION.md.
        if (!isLoyaltyId(user.id)) {
          user.id = mintLoyaltyId();
          localStorage.setItem('amplibet_user', JSON.stringify(user));
        }

        // Re-bind the user_id on every restore. Without this a returning visitor
        // is anonymous until they happen to log in again, and their events land
        // on the device rather than the member.
        identifyLoyaltyMember(user.id, { loyalty_id: user.id, email: user.email });

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

  // Mock login: the password is intentionally unused — any credentials succeed.
  const login = async (email: string, _password: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock authentication - accept any email/password combination
      const user: User = {
        id: mintLoyaltyId(),
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
        id: mintLoyaltyId(),
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
    
    // Remove user from localStorage, along with every per-user key. These are
    // suffixed with the user id, so an unsuffixed removeItem('amplibet_bets')
    // silently leaves the slip and history behind to be restored on next login.
    localStorage.removeItem('amplibet_user');
    if (state.user) {
      for (const prefix of ['amplibet_bets', 'amplibet_history', 'amplibet_balance', 'amplibet_transactions', 'amplibet_loyalty']) {
        localStorage.removeItem(`${prefix}_${state.user.id}`);
      }
    }

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
