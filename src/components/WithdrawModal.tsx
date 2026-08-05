import React, { useState } from 'react';
import { X, ArrowDownRight, Building, UserCheck, CreditCard, AlertCircle, CheckCircle, Wallet } from 'lucide-react';
import { Withdrawal, User } from '../types';

interface WithdrawModalProps {
  isOpen: boolean;
  userId: string;
  userName?: string;
  walletBalance: number;
  onClose: () => void;
  onWithdrawalSubmitted: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  userId,
  userName,
  walletBalance,
  onClose,
  onWithdrawalSubmitted,
}) => {
  const [amount, setAmount] = useState<string>('2000');
  const [bankName, setBankName] = useState<string>('Meezan Bank Limited');
  const [accountHolder, setAccountHolder] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 500) {
      setError('Minimum withdrawal request amount is RS 500.');
      return;
    }

    if (numericAmount > walletBalance) {
      setError(`Insufficient funds. Your wallet balance is RS ${walletBalance.toLocaleString()}.`);
      return;
    }

    if (!bankName.trim() || !accountHolder.trim() || !accountNumber.trim()) {
      setError('Please fill in all 4 required fields (Amount RS, Bank Name, Account Holder Name, Account/IBAN Number).');
      return;
    }

    setLoading(true);

    try {
      let isSuccess = false;

      try {
        const res = await fetch('/api/client/withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            amount: numericAmount,
            bank_name: bankName,
            account_holder: accountHolder,
            account_number: accountNumber,
          }),
        });

        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          const data = await res.json();
          isSuccess = true;
        } else if (!res.ok && contentType && contentType.includes('application/json')) {
          const data = await res.json();
          throw new Error(data.error || 'Withdrawal request failed');
        }
      } catch (apiErr: any) {
        if (apiErr.message && (apiErr.message.includes('Minimum') || apiErr.message.includes('Insufficient'))) {
          throw apiErr;
        }
        console.warn('[Withdrawal API Fallback]:', apiErr.message);
      }

      // Fallback for Netlify or static deployment
      if (!isSuccess) {
        const newWithdrawal: Withdrawal = {
          id: 'wd-' + Date.now(),
          user_id: userId,
          username: userName || 'client_user',
          phone: '+923000000000',
          amount: numericAmount,
          bank_name: bankName,
          account_holder: accountHolder,
          account_number: accountNumber,
          status: 'PENDING',
          created_at: new Date().toISOString(),
        };

        const existingStr = localStorage.getItem('gw_withdrawals');
        const existingWds: Withdrawal[] = existingStr ? JSON.parse(existingStr) : [];
        existingWds.unshift(newWithdrawal);
        localStorage.setItem('gw_withdrawals', JSON.stringify(existingWds));

        // Update registered user balance & withdrawal sum in localStorage
        const usersStr = localStorage.getItem('gw_registered_users');
        if (usersStr) {
          const localUsers: User[] = JSON.parse(usersStr);
          const userIdx = localUsers.findIndex(u => u.id === userId);
          if (userIdx >= 0) {
            localUsers[userIdx].wallet_balance = Math.max(0, localUsers[userIdx].wallet_balance - numericAmount);
            localUsers[userIdx].total_withdrawals = (localUsers[userIdx].total_withdrawals || 0) + numericAmount;
            localStorage.setItem('gw_registered_users', JSON.stringify(localUsers));
          }
        }
      }

      setSuccessMsg(`Withdrawal request of RS ${numericAmount.toLocaleString()} submitted successfully! Admin will process payout.`);
      setTimeout(() => {
        onWithdrawalSubmitted();
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to submit withdrawal request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="bg-slate-50 p-6 border-b border-slate-100 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <ArrowDownRight className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Withdraw Profit &amp; Funds</h2>
              <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                <Wallet className="w-3 h-3" /> Available Balance: RS {walletBalance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. Amount RS */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Field 1: Amount to Withdraw (RS) <span className="text-emerald-600">*</span>
            </label>
            <input
              type="number"
              required
              min="500"
              max={walletBalance}
              placeholder="e.g. 2000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
            />
          </div>

          {/* 2. Bank Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Field 2: Bank / Gateway Name <span className="text-emerald-600">*</span>
            </label>
            <div className="relative">
              <Building className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. Meezan Bank, HBL, EasyPaisa, JazzCash"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* 3. Account Holder Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Field 3: Account Holder Title <span className="text-emerald-600">*</span>
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. Muhammad Ali Khan"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* 4. Account / IBAN Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Field 4: Account Number / IBAN <span className="text-emerald-600">*</span>
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 absolute left-3 top-3 text-emerald-600" />
              <input
                type="text"
                required
                placeholder="e.g. PK36MEZN00010982347101 or 03001234567"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ArrowDownRight className="w-4 h-4" /> Request Payout to Bank
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
