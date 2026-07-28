import React, { useState } from 'react';
import { X, CreditCard, DollarSign, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useWallet, CreditCardInfo } from '../../contexts/WalletContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose }) => {
  const { deposit, isProcessingDeposit } = useWallet();
  const [amount, setAmount] = useState('');
  const [cardInfo, setCardInfo] = useState<CreditCardInfo>({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
  });
  const [errors, setErrors] = useState<Partial<CreditCardInfo & { amount: string; general: string }>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Escape is suppressed while a deposit is in flight for the same reason the
  // X button is disabled: closing mid-charge would hide the outcome of the
  // payment from the user.
  const dialogRef = useFocusTrap(isOpen, isProcessingDeposit ? undefined : onClose);

  const quickAmounts = [25, 50, 100, 250, 500];

  const validateCardNumber = (cardNumber: string): boolean => {
    const cleaned = cardNumber.replace(/\s/g, '');
    return cleaned.length >= 13 && cleaned.length <= 19 && /^\d+$/.test(cleaned);
  };

  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CreditCardInfo & { amount: string; general: string }> = {};

    // Amount validation
    const numAmount = parseFloat(amount);
    if (!amount || numAmount <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (numAmount < 10) {
      newErrors.amount = 'Minimum deposit is $10';
    } else if (numAmount > 10000) {
      newErrors.amount = 'Maximum deposit is $10,000';
    }

    // Card number validation
    if (!validateCardNumber(cardInfo.cardNumber)) {
      newErrors.cardNumber = 'Please enter a valid card number';
    }

    // Expiry validation
    if (!cardInfo.expiryMonth || !cardInfo.expiryYear) {
      newErrors.expiryMonth = 'Please enter expiry date';
    } else {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      const expiryYear = parseInt(cardInfo.expiryYear);
      const expiryMonth = parseInt(cardInfo.expiryMonth);

      if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
        newErrors.expiryMonth = 'Card has expired';
      }
    }

    // CVV validation
    if (!cardInfo.cvv || !/^\d{3,4}$/.test(cardInfo.cvv)) {
      newErrors.cvv = 'Please enter a valid CVV';
    }

    // Cardholder name validation
    if (!cardInfo.cardholderName.trim()) {
      newErrors.cardholderName = 'Please enter cardholder name';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await deposit(parseFloat(amount), cardInfo);
      setShowSuccess(true);
      
      // Reset form
      setAmount('');
      setCardInfo({
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        cardholderName: '',
      });
      setErrors({});

      // Close modal after success message
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      setErrors({ general: (error as Error).message });
    }
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value.replace(/\s/g, ''));
    if (formatted.replace(/\s/g, '').length <= 19) {
      setCardInfo({ ...cardInfo, cardNumber: formatted });
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString().padStart(2, '0'),
    label: (i + 1).toString().padStart(2, '0')
  }));

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Only a click on the backdrop itself dismisses; clicks inside the
        // dialog bubble up here and must not close a half-filled card form.
        if (e.target === e.currentTarget && !isProcessingDeposit) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deposit-modal-title"
        className="bg-surface rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="text-accent" size={24} />
              <h2 id="deposit-modal-title" className="text-xl font-bold text-white">Deposit Funds</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
              disabled={isProcessingDeposit}
              aria-label="Close deposit dialog"
            >
              <X size={24} />
            </button>
          </div>

          {/* Success Message. Ink text: the accent is too light to carry white. */}
          {showSuccess && (
            <div className="mb-6 p-4 bg-accent text-ink rounded-md flex items-center space-x-2">
              <CheckCircle size={20} />
              <span className="font-medium">Deposit successful!</span>
            </div>
          )}

          {/* Error Message */}
          {errors.general && (
            <div className="mb-6 p-4 bg-danger rounded-md flex items-center space-x-2">
              <AlertCircle size={20} />
              <span className="text-white">{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleDeposit} className="space-y-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Deposit Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="10"
                  max="10000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-ink text-white rounded-md border border-gray-600 focus:border-brand focus:outline-none"
                  placeholder="0.00"
                  disabled={isProcessingDeposit}
                />
              </div>
              {errors.amount && <p className="text-danger text-sm mt-1">{errors.amount}</p>}
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="px-3 py-1 bg-ink text-gray-300 rounded border border-gray-600 hover:border-brand hover:text-white text-sm"
                  disabled={isProcessingDeposit}
                >
                  ${quickAmount}
                </button>
              ))}
            </div>

            {/* Card Number */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Card Number
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={cardInfo.cardNumber}
                  onChange={(e) => handleCardNumberChange(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-ink text-white rounded-md border border-gray-600 focus:border-brand focus:outline-none"
                  placeholder="1234 5678 9012 3456"
                  disabled={isProcessingDeposit}
                />
              </div>
              {errors.cardNumber && <p className="text-danger text-sm mt-1">{errors.cardNumber}</p>}
            </div>

            {/* Expiry and CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Expiry Date
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={cardInfo.expiryMonth}
                    onChange={(e) => setCardInfo({ ...cardInfo, expiryMonth: e.target.value })}
                    className="w-full px-3 py-2 bg-ink text-white rounded-md border border-gray-600 focus:border-brand focus:outline-none"
                    disabled={isProcessingDeposit}
                  >
                    <option value="">MM</option>
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={cardInfo.expiryYear}
                    onChange={(e) => setCardInfo({ ...cardInfo, expiryYear: e.target.value })}
                    className="w-full px-3 py-2 bg-ink text-white rounded-md border border-gray-600 focus:border-brand focus:outline-none"
                    disabled={isProcessingDeposit}
                  >
                    <option value="">YYYY</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.expiryMonth && <p className="text-danger text-sm mt-1">{errors.expiryMonth}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CVV
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={cardInfo.cvv}
                  onChange={(e) => setCardInfo({ ...cardInfo, cvv: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3 py-2 bg-ink text-white rounded-md border border-gray-600 focus:border-brand focus:outline-none"
                  placeholder="123"
                  disabled={isProcessingDeposit}
                />
                {errors.cvv && <p className="text-danger text-sm mt-1">{errors.cvv}</p>}
              </div>
            </div>

            {/* Cardholder Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cardholder Name
              </label>
              <input
                type="text"
                value={cardInfo.cardholderName}
                onChange={(e) => setCardInfo({ ...cardInfo, cardholderName: e.target.value })}
                className="w-full px-3 py-2 bg-ink text-white rounded-md border border-gray-600 focus:border-brand focus:outline-none"
                placeholder="John Doe"
                disabled={isProcessingDeposit}
              />
              {errors.cardholderName && <p className="text-danger text-sm mt-1">{errors.cardholderName}</p>}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isProcessingDeposit || showSuccess}
                className="w-full flex items-center justify-center space-x-2 bg-brand hover:bg-brand-dark disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-md transition-colors"
              >
                {isProcessingDeposit ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <DollarSign size={20} />
                    <span>Deposit ${amount || '0.00'}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-3 bg-ink rounded-md">
            <p className="text-xs text-gray-400 text-center">
              🔒 This is a demo environment. No real payments are processed.
              Your card information is not stored or transmitted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositModal;
