import React, { useState } from 'react';
import { X, Upload, Building2, Smartphone, DollarSign, CheckCircle, AlertCircle, Copy, Check, FileImage } from 'lucide-react';
import { OwnerSettings, Deposit } from '../types';

interface DepositModalProps {
  isOpen: boolean;
  userId: string;
  userName: string;
  ownerSettings: OwnerSettings;
  onClose: () => void;
  onDepositSubmitted: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  userId,
  userName,
  ownerSettings,
  onClose,
  onDepositSubmitted,
}) => {
  const [amount, setAmount] = useState<string>('5000');
  const [paymentMethod, setPaymentMethod] = useState<'Bank' | 'EasyPaisa' | 'JazzCash'>('Bank');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 500) {
      setError('Minimum deposit amount is RS 500.');
      return;
    }

    setLoading(true);

    try {
      let isSuccess = false;

      try {
        const res = await fetch('/api/client/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            amount: numericAmount,
            payment_method: paymentMethod === 'Bank' ? ownerSettings.bank_name : paymentMethod,
          }),
        });

        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          const data = await res.json();
          isSuccess = true;
        } else if (!res.ok && contentType && contentType.includes('application/json')) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to submit deposit');
        }
      } catch (apiErr: any) {
        if (apiErr.message && apiErr.message.includes('Minimum deposit')) {
          throw apiErr;
        }
        console.warn('[Deposit API Fallback]:', apiErr.message);
      }

      // Fallback for Netlify or static deployment
      if (!isSuccess) {
        const newDeposit: Deposit = {
          id: 'dep-' + Date.now(),
          user_id: userId,
          username: userName || 'client_user',
          phone: '+923000000000',
          amount: numericAmount,
          payment_method: paymentMethod === 'Bank' ? ownerSettings.bank_name : paymentMethod,
          screenshot_url: filePreview || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
          status: 'PENDING',
          created_at: new Date().toISOString(),
        };

        const existingStr = localStorage.getItem('gw_deposits');
        const existingDeps: Deposit[] = existingStr ? JSON.parse(existingStr) : [];
        existingDeps.unshift(newDeposit);
        localStorage.setItem('gw_deposits', JSON.stringify(existingDeps));
      }

      setSuccessMsg(`Deposit request of RS ${numericAmount.toLocaleString()} submitted! Owner admin will verify receipt.`);
      setTimeout(() => {
        onDepositSubmitted();
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden text-slate-800 my-8">
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
              <Building2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Deposit Solar Investment Funds</h2>
              <p className="text-xs text-emerald-700">Send RS to Official Account &amp; Upload Proof Receipt</p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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

          {/* Payment Method Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">1. Select Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('Bank')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  paymentMethod === 'Bank'
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Bank Transfer</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('EasyPaisa')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  paymentMethod === 'EasyPaisa'
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>EasyPaisa</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('JazzCash')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  paymentMethod === 'JazzCash'
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>JazzCash</span>
              </button>
            </div>
          </div>

          {/* Official Payment Destination Card */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-2 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              Official Owner Payment Account Details:
            </span>

            {paymentMethod === 'Bank' && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-emerald-100">
                  <div>
                    <span className="text-slate-500 text-[11px]">Bank Name:</span>
                    <p className="font-bold text-slate-900">{ownerSettings.bank_name}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-emerald-100">
                  <div>
                    <span className="text-slate-500 text-[11px]">Account Title:</span>
                    <p className="font-bold text-emerald-800">{ownerSettings.account_title}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-emerald-100">
                  <div>
                    <span className="text-slate-500 text-[11px]">IBAN / Account No:</span>
                    <p className="font-mono font-bold text-amber-800 text-[11px]">{ownerSettings.iban_account}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(ownerSettings.iban_account, 'iban')}
                    className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-lg bg-slate-100"
                  >
                    {copiedField === 'iban' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {paymentMethod === 'EasyPaisa' && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-emerald-100">
                  <div>
                    <span className="text-slate-500 text-[11px]">EasyPaisa Number:</span>
                    <p className="font-mono font-bold text-emerald-800 text-sm">{ownerSettings.easypaisa_number}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(ownerSettings.easypaisa_number, 'ep')}
                    className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-lg bg-slate-100"
                  >
                    {copiedField === 'ep' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-emerald-100">
                  <div>
                    <span className="text-slate-500 text-[11px]">Account Title:</span>
                    <p className="font-bold text-slate-900">{ownerSettings.easypaisa_name}</p>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'JazzCash' && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-emerald-100">
                  <div>
                    <span className="text-slate-500 text-[11px]">JazzCash Number:</span>
                    <p className="font-mono font-bold text-amber-800 text-sm">{ownerSettings.jazzcash_number}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(ownerSettings.jazzcash_number, 'jc')}
                    className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-lg bg-slate-100"
                  >
                    {copiedField === 'jc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-emerald-100">
                  <div>
                    <span className="text-slate-500 text-[11px]">Account Title:</span>
                    <p className="font-bold text-slate-900">{ownerSettings.jazzcash_name}</p>
                  </div>
                </div>
              </div>
            )}

            <p className="text-[11px] text-slate-500 italic pt-1 border-t border-emerald-100">
              Note: {ownerSettings.deposit_instructions}
            </p>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              2. Deposit Amount in RS <span className="text-emerald-600">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-emerald-700">RS</span>
              <input
                type="number"
                required
                min="500"
                step="100"
                placeholder="5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {['2000', '5000', '15000', '50000'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-emerald-800"
                >
                  RS {parseInt(preset).toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Building2 className="w-4 h-4" /> Submit Deposit Request for Admin Approval
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
