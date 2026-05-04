import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface Transaction {
  id: string;
  type: 'deposit' | 'bet' | 'payout';
  amount: number;
  description: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
}

export interface CreditCardInfo {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
}

interface WalletState {
  balance: number;
  transactions: Transaction[];
  isProcessingDeposit: boolean;
}

interface WalletContextType extends WalletState {
  deposit: (amount: number, cardInfo: CreditCardInfo) => Promise<void>;
  deductFunds: (amount: number, description: string) => boolean;
  addPayout: (amount: number, description: string) => void;
  getFormattedBalance: () => string;
}

type WalletAction =
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'DEPOSIT_SUCCESS'; payload: { amount: number; transaction: Transaction } }
  | { type: 'DEDUCT_FUNDS'; payload: { amount: number; transaction: Transaction } }
  | { type: 'ADD_PAYOUT'; payload: { amount: number; transaction: Transaction } }
  | { type: 'LOAD_WALLET_DATA'; payload: { balance: number; transactions: Transaction[] } }
  | { type: 'RESET_WALLET' };

const initialState: WalletState = {
  balance: 0,
  transactions: [],
  isProcessingDeposit: false,
};

const walletReducer = (state: WalletState, action: WalletAction): WalletState => {
  switch (action.type) {
    case 'SET_PROCESSING':
      return { ...state, isProcessingDeposit: action.payload };
    case 'DEPOSIT_SUCCESS':
      return {
        ...state,
        balance: state.balance + action.payload.amount,
        transactions: [action.payload.transaction, ...state.transactions],
        isProcessingDeposit: false,
      };
    case 'DEDUCT_FUNDS':
      return {
        ...state,
        balance: state.balance - action.payload.amount,
        transactions: [action.payload.transaction, ...state.transactions],
      };
    case 'ADD_PAYOUT':
      return {
        ...state,
        balance: state.balance + action.payload.amount,
        transactions: [action.payload.transaction, ...state.transactions],
      };
    case 'LOAD_WALLET_DATA':
      return {
        ...state,
        balance: action.payload.balance,
        transactions: action.payload.transactions,
      };
    case 'RESET_WALLET':
      return initialState;
    default:
      return state;
  }
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(walletReducer, initialState);
  const { user, isAuthenticated } = useAuth();

  // Load wallet data from localStorage when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      const storedBalance = localStorage.getItem(`amplibet_balance_${user.id}`);
      const storedTransactions = localStorage.getItem(`amplibet_transactions_${user.id}`);
      
      const balance = storedBalance ? parseFloat(storedBalance) : 0;
      let transactions: Transaction[] = [];

      if (storedTransactions) {
        try {
          const parsedTransactions = JSON.parse(storedTransactions);
          transactions = parsedTransactions.map((t: any) => ({
            ...t,
            timestamp: new Date(t.timestamp)
          }));
        } catch (error) {
          console.error('Error parsing stored transactions:', error);
        }
      }
      
      dispatch({ type: 'LOAD_WALLET_DATA', payload: { balance, transactions } });
    } else {
      dispatch({ type: 'RESET_WALLET' });
    }
  }, [user, isAuthenticated]);

  // Save balance to localStorage whenever it changes
  useEffect(() => {
    if (isAuthenticated && user) {
      localStorage.setItem(`amplibet_balance_${user.id}`, state.balance.toString());
    }
  }, [state.balance, user, isAuthenticated]);

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    if (isAuthenticated && user && state.transactions.length > 0) {
      localStorage.setItem(`amplibet_transactions_${user.id}`, JSON.stringify(state.transactions));
    }
  }, [state.transactions, user, isAuthenticated]);

  const deposit = async (amount: number, cardInfo: CreditCardInfo): Promise<void> => {
    if (!isAuthenticated || !user) {
      throw new Error('Must be logged in to deposit funds');
    }

    dispatch({ type: 'SET_PROCESSING', payload: true });

    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate random failure (5% chance)
      if (Math.random() < 0.05) {
        throw new Error('Payment processing failed. Please try again.');
      }

      const transaction: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'deposit',
        amount,
        description: `Deposit via card ending in ${cardInfo.cardNumber.slice(-4)}`,
        timestamp: new Date(),
        status: 'completed'
      };

      // Track the deposit in Amplitude
      const { trackDeposit } = await import('../utils/analytics');
      trackDeposit(user.id, amount, {
        cardNumber: cardInfo.cardNumber,
        cardholderName: cardInfo.cardholderName
      });

      dispatch({ type: 'DEPOSIT_SUCCESS', payload: { amount, transaction } });
    } catch (error) {
      dispatch({ type: 'SET_PROCESSING', payload: false });
      throw error;
    }
  };

  const deductFunds = (amount: number, description: string): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }

    if (state.balance < amount) {
      return false; // Insufficient funds
    }

    const transaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'bet',
      amount,
      description,
      timestamp: new Date(),
      status: 'completed'
    };

    dispatch({ type: 'DEDUCT_FUNDS', payload: { amount, transaction } });
    return true;
  };

  const addPayout = (amount: number, description: string): void => {
    if (!isAuthenticated || !user) {
      return;
    }

    const transaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'payout',
      amount,
      description,
      timestamp: new Date(),
      status: 'completed'
    };

    dispatch({ type: 'ADD_PAYOUT', payload: { amount, transaction } });
  };

  const getFormattedBalance = (): string => {
    return `$${state.balance.toFixed(2)}`;
  };

  const value: WalletContextType = {
    ...state,
    deposit,
    deductFunds,
    addPayout,
    getFormattedBalance,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
