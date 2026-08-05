import React from 'react';
import { X, Download, ExternalLink, CheckCircle2 } from 'lucide-react';

interface ReceiptViewerModalProps {
  isOpen: boolean;
  screenshotUrl: string | null;
  username: string;
  amountRs: number;
  paymentMethod: string;
  onClose: () => void;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
  isOpen,
  screenshotUrl,
  username,
  amountRs,
  paymentMethod,
  onClose,
}) => {
  if (!isOpen || !screenshotUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-xl bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden text-slate-800 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Deposit Screenshot Voucher
            </h3>
            <p className="text-xs text-slate-500">
              User: <span className="text-slate-900 font-bold">{username}</span> | Amount:{' '}
              <span className="text-emerald-700 font-bold">RS {amountRs.toLocaleString()}</span> ({paymentMethod})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Image Area */}
        <div className="p-4 bg-slate-50 flex-1 overflow-auto flex items-center justify-center min-h-[300px]">
          <img
            src={screenshotUrl}
            alt="Payment Receipt Screenshot"
            className="max-h-[60vh] max-w-full rounded-2xl object-contain border border-slate-200 shadow-sm"
          />
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs">
          <span className="text-slate-500">Digital Voucher Proof Verified</span>
          <a
            href={screenshotUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-bold"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open Full Image
          </a>
        </div>
      </div>
    </div>
  );
};
