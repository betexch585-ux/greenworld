import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface WithdrawalCountdownProps {
  createdAt: string;
  amountRs: number;
  bankName: string;
  accountNumber: string;
}

export const WithdrawalCountdown: React.FC<WithdrawalCountdownProps> = ({
  createdAt,
  amountRs,
  bankName,
  accountNumber,
}) => {
  const calculateRemainingMs = () => {
    const createdMs = new Date(createdAt).getTime();
    const targetMs = createdMs + 2 * 60 * 60 * 1000; // 2 hours in ms
    return Math.max(0, targetMs - Date.now());
  };

  const [remainingMs, setRemainingMs] = useState<number>(calculateRemainingMs());

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingMs(calculateRemainingMs());
    }, 1000);

    return () => clearInterval(timer);
  }, [createdAt]);

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num: number) => String(num).padStart(2, '0');

  const isExpired = remainingMs <= 0;

  return (
    <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-emerald-500/10 border-2 border-amber-300/60 rounded-2xl sm:rounded-3xl shadow-xs space-y-2.5 my-3 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
          <Clock className="w-4 h-4 text-amber-700 animate-spin-slow shrink-0" />
          <span>Pending Withdrawal Payout Review</span>
        </div>

        {/* Live Digital Countdown Badge */}
        <div className="px-3 py-1 bg-amber-900 text-amber-100 font-mono font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-1.5 border border-amber-700">
          {!isExpired ? (
            <>
              <span className="text-amber-400 text-[10px] uppercase font-sans">Time Left:</span>
              <span>{pad(hours)}:{pad(minutes)}:{pad(seconds)}</span>
            </>
          ) : (
            <span className="text-emerald-300 text-xs">Finalizing Payout Queue</span>
          )}
        </div>
      </div>

      <div className="text-xs text-slate-700 flex flex-wrap items-center justify-between pt-1 border-t border-amber-200/60 gap-2">
        <div>
          <span className="font-semibold text-slate-900">RS {amountRs.toLocaleString()}</span> to{' '}
          <span className="font-medium text-slate-800">{bankName}</span> ({accountNumber})
        </div>
        <div className="text-[11px] text-amber-800 font-medium italic">
          {!isExpired
            ? '⚡ Mandatory 2-Hour Security Processing Window'
            : '✓ Payout currently being dispatched by Owner'}
        </div>
      </div>
    </div>
  );
};
