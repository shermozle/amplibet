import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HomeIcon,
  ChevronRightIcon,
  UserIcon,
  WalletIcon,
  HistoryIcon,
  AlertCircleIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import type { Transaction } from '../contexts/WalletContext';
import { useNotifications } from '../contexts/NotificationContext';
import { trackPageView, trackButtonClick } from '../utils/analytics';

// Badge and amount colouring per transaction type. Money in (deposit, payout)
// reads accent, money out to the bank reads salmon so a withdrawal is visually
// distinct from a stake — support calls about "missing" balance are usually one
// of these two being mistaken for the other.
const TYPE_STYLES: Record<Transaction['type'], { label: string; badge: string }> = {
  deposit: { label: 'Deposit', badge: 'text-accent' },
  payout: { label: 'Payout', badge: 'text-accent' },
  bet: { label: 'Bet', badge: 'text-paper' },
  withdrawal: { label: 'Withdrawal', badge: 'text-salmon' }
};

// Money in is signed and accented; money out is left neutral. The sign carries
// the direction so colour alone is never the only cue.
const isCredit = (type: Transaction['type']) => type === 'deposit' || type === 'payout';

const QUICK_AMOUNTS = [25, 50, 100];

const AccountPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { balance, transactions, withdraw, getFormattedBalance } = useWallet();
  const { notify } = useNotifications();

  const [amountInput, setAmountInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');

  useEffect(() => {
    trackPageView('Account');
    // Empty deps: one view event per visit, not one per balance change.
  }, []);

  if (!isAuthenticated || !user) {
    return <div className="bg-ink min-h-screen text-white p-8 text-center">
        <h1 className="text-2xl font-bold text-accent mb-2">My Account</h1>
        <p className="text-gray-400 mb-4">Sign in to see your profile, balance and transactions.</p>
        <Link to="/login" className="text-grape hover:underline">Log in</Link>
      </div>;
  }

  const parsedAmount = parseFloat(amountInput) || 0;
  const insufficientFunds = parsedAmount > balance;
  const canSubmit = !isSubmitting && parsedAmount > 0 && !insufficientFunds;

  const handleQuickAmount = (value: number, chipLabel: string) => {
    trackButtonClick('Withdraw Quick Amount', 'AccountPage', { amount: value, chip: chipLabel });
    setAmountInput(value.toFixed(2));
  };

  const handleWithdraw = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    trackButtonClick('Withdraw', 'AccountPage', { amount: parsedAmount });
    // Withdrawal Made / Withdrawal Failed events are emitted inside
    // WalletContext.withdraw, so this handler only tracks the click.
    setWithdrawError('');
    setIsSubmitting(true);
    try {
      await withdraw(parsedAmount);
      notify('success', 'Withdrawal complete', `$${parsedAmount.toFixed(2)} is on its way to your nominated bank account.`);
      setAmountInput('');
    } catch (error) {
      const message = (error as Error).message;
      setWithdrawError(message);
      notify('warning', 'Withdrawal failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return <div className="bg-ink min-h-screen text-white">
      <div className="bg-surface border-b border-ink p-4">
        <nav aria-label="Breadcrumb" className="flex items-center text-sm text-gray-400 mb-4">
          <Link to="/home" className="hover:text-white flex items-center">
            <HomeIcon size={14} className="mr-1" aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRightIcon size={14} className="mx-1" aria-hidden="true" />
          <span className="text-white" aria-current="page">Account</span>
        </nav>
        <div className="flex items-center">
          <UserIcon size={24} className="mr-3 text-accent" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-accent">My Account</h1>
        </div>
      </div>

      <div className="p-4 grid gap-4 lg:grid-cols-2">
        {/* Profile. The loyalty ID is rendered in font-mono because it is what
            staff read back over the phone — glyph ambiguity matters. */}
        <section className="bg-surface rounded-lg p-5">
          <h2 className="font-semibold mb-4 flex items-center">
            <UserIcon size={16} className="mr-2 text-accent" aria-hidden="true" />
            Profile
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-gray-400 uppercase tracking-wider">Name</dt>
              <dd className="mt-0.5">{user.firstName} {user.lastName}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400 uppercase tracking-wider">Email</dt>
              <dd className="mt-0.5">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400 uppercase tracking-wider">Loyalty ID</dt>
              <dd className="mt-0.5 font-mono tracking-[0.2em]">{user.id}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400 uppercase tracking-wider">Member since</dt>
              <dd className="mt-0.5">
                {new Date(user.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </dd>
            </div>
          </dl>
        </section>

        {/* Wallet: balance plus withdrawals. Deposits live in the deposit modal;
            this page is where money leaves, so the failure states get the space. */}
        <section className="bg-surface rounded-lg p-5">
          <h2 className="font-semibold mb-1 flex items-center">
            <WalletIcon size={16} className="mr-2 text-accent" aria-hidden="true" />
            Wallet
          </h2>
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Balance</div>
          <div className="text-4xl font-bold text-accent mb-4">{getFormattedBalance()}</div>

          <form onSubmit={handleWithdraw} noValidate>
            <label htmlFor="withdraw-amount" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
              Withdraw funds
            </label>
            <div className="relative mb-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">$</span>
              <input
                id="withdraw-amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                value={amountInput}
                onChange={event => setAmountInput(event.target.value)}
                disabled={isSubmitting}
                className="w-full bg-raised rounded py-2 pl-7 pr-3 text-sm disabled:opacity-50"
              />
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {QUICK_AMOUNTS.map(quick => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => handleQuickAmount(quick, `$${quick}`)}
                  disabled={isSubmitting}
                  className="bg-raised hover:bg-raised-light rounded px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ${quick}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleQuickAmount(balance, 'All')}
                disabled={isSubmitting}
                className="bg-raised hover:bg-raised-light rounded px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                All
              </button>
            </div>

            {withdrawError && (
              <div role="alert" className="flex items-start text-danger text-xs mb-3">
                <AlertCircleIcon size={14} className="mt-0.5 mr-1.5 flex-shrink-0" aria-hidden="true" />
                <span>{withdrawError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-brand hover:bg-brand-dark text-white py-2 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' :
               insufficientFunds ? 'Insufficient Funds' :
               'Withdraw'}
            </button>
          </form>
        </section>

        {/* Every movement of money, newest first — WalletContext already keeps
            transactions in that order. */}
        <section className="bg-surface rounded-lg p-5 lg:col-span-2">
          <h2 className="font-semibold mb-3 flex items-center">
            <HistoryIcon size={16} className="mr-2 text-accent" aria-hidden="true" />
            Transaction history
          </h2>
          {transactions.length === 0 ? (
            <p className="text-sm text-gray-400">
              No transactions yet. Make a deposit or place a bet to get started.
            </p>
          ) : (
            <ul className="divide-y divide-ink">
              {transactions.map(transaction => {
                const { label, badge } = TYPE_STYLES[transaction.type];
                const credit = isCredit(transaction.type);
                return (
                  <li key={transaction.id} className="py-2 flex items-center justify-between text-sm">
                    <div className="min-w-0 mr-3">
                      <div className="flex items-center mb-0.5">
                        <span className={`bg-raised rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wider mr-2 ${badge}`}>
                          {label}
                        </span>
                        <span className="truncate">{transaction.description}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(transaction.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className={`font-semibold whitespace-nowrap ${credit ? 'text-accent' : 'text-paper'}`}>
                      {credit ? '+' : '−'}${transaction.amount.toFixed(2)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>;
};

export default AccountPage;
