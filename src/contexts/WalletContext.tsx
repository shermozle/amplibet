import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { trackDeposit, trackDepositFailed, trackWithdrawal, trackWithdrawalFailed } from '../utils/analytics';

export interface Transaction {
  id: string;
  type: 'deposit' | 'bet' | 'payout' | 'withdrawal';
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
  // Which member this wallet state belongs to, or null before it has been loaded.
  // The save effect keys off this: a load effect and a save effect both fire in the
  // commit where `user` appears and the save runs second, so without an ownership
  // marker in the state itself it writes the still-zero pre-load balance straight
  // over the stored one, emptying the wallet on every page load.
  userId: string | null;
}

interface WalletContextType extends WalletState {
  deposit: (amount: number, cardInfo: CreditCardInfo) => Promise<void>;
  withdraw: (amount: number) => Promise<void>;
  deductFunds: (amount: number, description: string) => boolean;
  addPayout: (amount: number, description: string) => void;
  getFormattedBalance: () => string;
}

type WalletAction =
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'DEPOSIT_SUCCESS'; payload: { amount: number; transaction: Transaction } }
  | { type: 'DEDUCT_FUNDS'; payload: { amount: number; transaction: Transaction } }
  | { type: 'ADD_PAYOUT'; payload: { amount: number; transaction: Transaction } }
  | { type: 'WITHDRAW_SUCCESS'; payload: { amount: number; transaction: Transaction } }
  | { type: 'LOAD_WALLET_DATA'; payload: { balance: number; transactions: Transaction[]; userId: string } }
  | { type: 'RESET_WALLET' };

const initialState: WalletState = {
  balance: 0,
  transactions: [],
  isProcessingDeposit: false,
  userId: null,
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
    case 'WITHDRAW_SUCCESS':
      return {
        ...state,
        balance: state.balance - action.payload.amount,
        transactions: [action.payload.transaction, ...state.transactions],
      };
    case 'LOAD_WALLET_DATA':
      return {
        ...state,
        balance: action.payload.balance,
        transactions: action.payload.transactions,
        userId: action.payload.userId,
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
      
      dispatch({ type: 'LOAD_WALLET_DATA', payload: { balance, transactions, userId: user.id } });
    } else {
      dispatch({ type: 'RESET_WALLET' });
    }
  }, [user, isAuthenticated]);

  // Only persist once the state provably belongs to the signed-in member. See the
  // note on WalletState.userId for why the guard cannot just be `isAuthenticated`.
  const hydrated = state.userId !== null && state.userId === user?.id;

  // Save balance to localStorage whenever it changes
  useEffect(() => {
    if (hydrated && user) {
      localStorage.setItem(`amplibet_balance_${user.id}`, state.balance.toString());
    }
  }, [state.balance, hydrated, user]);

  // Save transactions to localStorage whenever they change. Note there is no
  // length guard: guarding on `length > 0` means an emptied list is never
  // written, leaving stale transactions in storage to be reloaded later. The
  // hydration check is what stops an empty list overwriting a real one.
  useEffect(() => {
    if (hydrated && user) {
      localStorage.setItem(`amplibet_transactions_${user.id}`, JSON.stringify(state.transactions));
    }
  }, [state.transactions, hydrated, user]);

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
        id: Math.random().toString(36).slice(2, 11),
        type: 'deposit',
        amount,
        description: `Deposit via card ending in ${cardInfo.cardNumber.slice(-4)}`,
        timestamp: new Date(),
        status: 'completed'
      };

      // Track the deposit in Amplitude
      trackDeposit(user.id, amount, { cardNumber: cardInfo.cardNumber });

      dispatch({ type: 'DEPOSIT_SUCCESS', payload: { amount, transaction } });
    } catch (error) {
      // Record the failure. Without this the simulated 5% payment failure — a
      // core part of the error-state demo — produces no Amplitude event at all.
      trackDepositFailed(amount, (error as Error).message, cardInfo.cardNumber);
      dispatch({ type: 'SET_PROCESSING', payload: false });
      throw error;
    }
  };

  // Withdrawals validate before any async work so the failure events carry the
  // real reason, then simulate an 8% provider decline — the demo needs failed
  // withdrawals in the event stream, not just happy paths.
  const withdraw = async (amount: number): Promise<void> => {
    if (!isAuthenticated || !user) {
      throw new Error('Must be logged in to withdraw funds');
    }
    if (!amount || amount <= 0) {
      trackWithdrawalFailed(amount, 'Invalid amount');
      throw new Error('Enter an amount to withdraw.');
    }
    if (amount > state.balance) {
      trackWithdrawalFailed(amount, 'Insufficient funds');
      throw new Error('You cannot withdraw more than your balance.');
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    if (Math.random() < 0.08) {
      const reason = 'Withdrawal provider declined the request. Please try again.';
      trackWithdrawalFailed(amount, reason);
      throw new Error(reason);
    }

    const transaction: Transaction = {
      id: Math.random().toString(36).slice(2, 11),
      type: 'withdrawal',
      amount,
      description: 'Withdrawal to nominated bank account',
      timestamp: new Date(),
      status: 'completed'
    };

    trackWithdrawal(amount);
    dispatch({ type: 'WITHDRAW_SUCCESS', payload: { amount, transaction } });
  };

  const deductFunds = (amount: number, description: string): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }

    if (state.balance < amount) {
      return false; // Insufficient funds
    }

    const transaction: Transaction = {
      id: Math.random().toString(36).slice(2, 11),
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
      id: Math.random().toString(36).slice(2, 11),
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
    withdraw,
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
