import React, { useState } from 'react';
import {
  Sun,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Share2,
  Users,
  Copy,
  Check,
  Zap,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Award,
  Sparkles,
} from 'lucide-react';
import { User, SolarPackage, ReferralRecord, OwnerSettings, Deposit, Withdrawal, UserInvestment } from '../types';
import { WithdrawalCountdown } from './WithdrawalCountdown';

interface ClientDashboardProps {
  user: User;
  solarPackages: SolarPackage[];
  ownerSettings: OwnerSettings;
  referrals: ReferralRecord[];
  referralEarningsRs: number;
  userInvestments: UserInvestment[];
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  onOpenDeposit: () => void;
  onOpenWithdrawal: () => void;
  onRefreshData: () => void;
  onBuyPackage: (pkg: SolarPackage) => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  user,
  solarPackages,
  ownerSettings,
  referrals,
  referralEarningsRs,
  userInvestments,
  deposits,
  withdrawals,
  onOpenDeposit,
  onOpenWithdrawal,
  onRefreshData,
  onBuyPackage,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'packages' | 'my_investments' | 'referrals' | 'history'>('packages');

  const referralLink = `${window.location.origin}?ref=${user.referral_code}`;

  const totalInvestedInPackages = userInvestments.reduce((sum, inv) => sum + inv.amount_rs, 0);
  const totalDailyReturnFromPackages = userInvestments.reduce((sum, inv) => sum + inv.daily_return_rs, 0);
  const totalProfitEarned = user.total_profit_earned || (user.daily_profit + referralEarningsRs);

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const pendingWithdrawalsList = withdrawals.filter((w) => w.status === 'PENDING');

  return (
    <div className="space-y-5 sm:space-y-8 animate-fade-in pb-12">
      {/* Welcome Back Note Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 backdrop-blur-sm border border-emerald-100 p-4 sm:px-6 rounded-2xl shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100/80 border border-emerald-200/60 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Welcome back, <span className="text-emerald-700 font-black">{user.full_name || user.username}</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              GreenWorld Solar Client Portal • Monitor your solar yields &amp; daily profits
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Solar Node Connected</span>
        </div>
      </div>

      {/* Active Pending Withdrawal 2-Hour Countdown Alert Banner */}
      {pendingWithdrawalsList.length > 0 && (
        <div className="space-y-2">
          {pendingWithdrawalsList.map((pendingWd) => (
            <WithdrawalCountdown
              key={pendingWd.id}
              createdAt={pendingWd.created_at}
              amountRs={pendingWd.amount}
              bankName={pendingWd.bank_name}
              accountNumber={pendingWd.account_number}
            />
          ))}
        </div>
      )}

      {/* Hero Wallet Balance & Daily Profit Grid (Natural Tones Design) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-6">
        {/* Wallet Balance Hero Card */}
        <div className="lg:col-span-8 bg-emerald-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white relative overflow-hidden shadow-md flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <p className="text-emerald-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                Current Wallet Balance
              </p>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold mb-4 sm:mb-6 font-mono tracking-tight">
              RS {user.wallet_balance.toLocaleString()}
              <span className="text-xl sm:text-2xl font-normal opacity-60 italic ml-1.5">.00</span>
            </h2>
            <div className="flex flex-wrap gap-2.5 sm:gap-3">
              <button
                onClick={onOpenDeposit}
                className="px-4 py-2.5 sm:px-6 sm:py-3 bg-white text-emerald-900 rounded-xl font-bold text-xs sm:text-sm shadow-md hover:bg-emerald-50 transition-all flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4 text-emerald-700" />
                <span>Deposit Funds</span>
              </button>
              <button
                onClick={onOpenWithdrawal}
                className="px-4 py-2.5 sm:px-6 sm:py-3 bg-emerald-800 text-white rounded-xl font-bold text-xs sm:text-sm border border-emerald-700 hover:bg-emerald-700 transition-all flex items-center gap-1.5"
              >
                <ArrowDownRight className="w-4 h-4 text-emerald-300" />
                <span>Withdraw Profit</span>
              </button>
            </div>
          </div>
          {/* Background Decorative Solar Graphic */}
          <Sun className="absolute right-[-20px] bottom-[-20px] w-44 h-44 sm:w-64 sm:h-64 text-emerald-800 opacity-20 pointer-events-none" />
        </div>

        {/* Daily Profit Yield Card */}
        <div className="lg:col-span-4 bg-amber-50/90 rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-amber-100 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="px-2.5 py-0.5 bg-amber-200/80 text-amber-900 text-[10px] sm:text-xs font-bold rounded-full uppercase">
                Daily Profit Yield
              </span>
              <span className="text-emerald-700 font-bold text-xs sm:text-sm">+5.0% Daily</span>
            </div>
            <p className="text-slate-500 text-[11px] sm:text-xs font-semibold mb-1">Last 24h Earnings</p>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-800 font-mono">
              RS {user.daily_profit.toLocaleString()}
              <span className="text-lg font-normal opacity-50 ml-1">.00</span>
            </h2>
          </div>
          <div className="mt-4 sm:mt-6 flex items-center text-[11px] sm:text-xs text-amber-900 font-medium gap-1.5 pt-3 sm:pt-4 border-t border-amber-200/60">
            <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>Next yield auto-credited at midnight</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid: Total Deposits, Total Profit Earned, Total Withdrawals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        {/* 1. Total Deposits Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400">Total Deposits</span>
            <div className="text-xl sm:text-2xl font-black text-slate-800 font-mono mt-0.5">
              RS {user.total_deposits.toLocaleString()}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Approved solar capital</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 text-emerald-700 rounded-xl sm:rounded-2xl flex items-center justify-center font-bold border border-emerald-100 shrink-0">
            <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* 2. Total Profit Earned Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-emerald-100 shadow-xs flex items-center justify-between bg-gradient-to-br from-white to-emerald-50/30">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase text-emerald-700">Total Profit Earned</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-800 font-mono mt-0.5">
              RS {totalProfitEarned.toLocaleString()}
            </div>
            <p className="text-[10px] sm:text-[11px] text-emerald-600 mt-0.5">Daily yields + referral bonus</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-600 text-white rounded-xl sm:rounded-2xl flex items-center justify-center font-bold shadow-xs shrink-0">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* 3. Total Withdrawals Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400">Total Withdrawals</span>
            <div className="text-xl sm:text-2xl font-black text-slate-800 font-mono mt-0.5">
              RS {user.total_withdrawals.toLocaleString()}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Successfully paid out</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center font-bold border border-amber-200">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Referral Network Card (Natural Tones) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" /> Referral Network &amp; 3% Passive Yield
        </h3>

        <div className="bg-emerald-50 rounded-2xl p-5 mb-4 border border-emerald-100">
          <p className="text-[10px] uppercase font-bold text-emerald-800 mb-2 tracking-widest">
            My Unique Link (10% Cash + 3% Daily Yield Commission)
          </p>
          <div className="flex items-center justify-between gap-3 bg-white rounded-xl p-3 border border-emerald-200">
            <span className="text-xs font-mono font-bold text-emerald-800 truncate">
              {referralLink}
            </span>
            <button
              onClick={handleCopyReferral}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs transition-all shrink-0"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Direct Referrals</p>
            <p className="text-2xl font-bold text-slate-800">{referrals.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Referral Rewards</p>
            <p className="text-2xl font-bold text-emerald-700">10% Deposit + 3% Yield</p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium opacity-80">Referral Earnings</p>
              <p className="text-2xl font-bold">RS {referralEarningsRs.toLocaleString()}</p>
            </div>
            <Users className="w-8 h-8 opacity-20" />
          </div>
        </div>
      </div>

      {/* Main Feature Tabs */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'packages'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-emerald-800 hover:bg-slate-100'
            }`}
          >
            <Sun className="w-4 h-4" /> Buy Solar Packages
          </button>

          <button
            onClick={() => setActiveTab('my_investments')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'my_investments'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-emerald-800 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" /> My Active Investments ({userInvestments.length})
          </button>

          <button
            onClick={() => setActiveTab('referrals')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'referrals'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-emerald-800 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" /> Referral Network ({referrals.length})
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-emerald-800 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" /> Deposit &amp; Withdrawal Logs
          </button>
        </div>

        {/* TAB 1: BUY SOLAR PACKAGES */}
        {activeTab === 'packages' && (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">Select Solar Energy Array Package</h3>
              <p className="text-xs text-slate-500">All packages feature guaranteed daily yields (3% – 8%) credited at 12 AM midnight for 15 days. Full invested amount automatically returns to your wallet after 15 days.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
              {solarPackages.map((pkg) => {
                const canAfford = user.wallet_balance >= pkg.price_rs;
                return (
                  <div
                    key={pkg.id}
                    className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border shadow-xs transition-all relative flex flex-col justify-between ${
                      pkg.popular
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-100 hover:border-emerald-300'
                    }`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow-xs">
                        {pkg.tag || 'Most Popular'}
                      </div>
                    )}

                    <div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-3 sm:mb-4">
                        <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                      </div>

                      <span className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                        {pkg.capacity_kw} Capacity
                      </span>
                      <h4 className="text-base sm:text-lg font-extrabold text-slate-900 mb-1.5 sm:mb-2">{pkg.name}</h4>

                      <div className="my-3 sm:my-4 p-3 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100 space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Package Price:</span>
                          <span className="font-mono font-bold text-slate-900">RS {pkg.price_rs.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Daily Return:</span>
                          <span className="font-mono font-bold text-emerald-600">
                            +RS {pkg.daily_return_rs} ({pkg.daily_return_percent}%)
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Validity:</span>
                          <span className="font-semibold text-slate-700">{pkg.validity_days} Days</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onBuyPackage(pkg)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        canAfford
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      {canAfford ? 'Invest Now' : 'Deposit & Invest'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: MY ACTIVE INVESTMENTS */}
        {activeTab === 'my_investments' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-900 to-emerald-800 rounded-2xl sm:rounded-3xl text-white shadow-md flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-300">My Solar Capital Portfolio</span>
                <h3 className="text-xl sm:text-2xl font-extrabold font-mono mt-0.5">RS {totalInvestedInPackages.toLocaleString()}</h3>
                <p className="text-[11px] sm:text-xs text-emerald-200 mt-0.5">
                  Generating <span className="font-bold text-amber-300">+RS {totalDailyReturnFromPackages.toLocaleString()} / day</span> in active daily yields
                </p>
              </div>
              <button
                onClick={() => setActiveTab('packages')}
                className="px-3.5 py-2 sm:px-5 sm:py-2.5 bg-white text-emerald-900 rounded-xl font-bold text-[11px] sm:text-xs shadow-xs hover:bg-emerald-50 transition-all flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-700" /> Invest in More Solar
              </button>
            </div>

            {userInvestments.length === 0 ? (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center border border-slate-100 space-y-3">
                <Sun className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto" />
                <h4 className="text-sm sm:text-base font-bold text-slate-800">No Solar Package Investments Yet</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Invest in any of our GreenWorld solar packages to start generating up to 8% guaranteed daily profit!
                </p>
                <button
                  onClick={() => setActiveTab('packages')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all inline-flex items-center gap-1.5"
                >
                  <Sun className="w-3.5 h-3.5" /> Browse Solar Packages
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
                {userInvestments.map((inv) => {
                  const matchedPkg = solarPackages.find(
                    (p) => p.id === inv.package_id || p.name === inv.package_name
                  );
                  const totalDays = matchedPkg ? matchedPkg.validity_days : 15;

                  const now = Date.now();
                  const startMs = new Date(inv.purchased_at).getTime();
                  const totalMs = totalDays * 24 * 60 * 60 * 1000;
                  const elapsedMs = Math.max(0, now - startMs);

                  const elapsedDays = Math.min(totalDays, Math.floor(elapsedMs / (1000 * 60 * 60 * 24)));
                  const remainingDays = Math.max(0, totalDays - elapsedDays);

                  const rawPercent = (elapsedMs / totalMs) * 100;
                  const progressPercent = Math.min(100, Math.max(5, rawPercent));
                  const estimatedTotalReturn = totalDays * inv.daily_return_rs;
                  const currentCycleDay = Math.min(totalDays, elapsedDays + 1);

                  return (
                    <div
                      key={inv.id}
                      className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-xs flex flex-col justify-between space-y-3.5 hover:border-emerald-200 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-emerald-600" /> Active &amp; Generating
                          </span>
                          <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                            {new Date(inv.purchased_at).toLocaleDateString()}
                          </span>
                        </div>

                        <h4 className="text-base sm:text-lg font-extrabold text-slate-900">{inv.package_name}</h4>

                        <div className="mt-3 p-3 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100 space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-medium">Invested Capital:</span>
                            <span className="font-mono font-bold text-slate-900">
                              RS {inv.amount_rs.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-medium">Daily Yield (5%):</span>
                            <span className="font-mono font-bold text-emerald-600">
                              +RS {inv.daily_return_rs} / day
                            </span>
                          </div>
                        </div>

                        {/* Dynamic Progress Bar for Investment Cycle */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-bold">
                            <span className="text-slate-600 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-emerald-600" />
                              Cycle Progress
                            </span>
                            <span className="text-emerald-700 font-mono">
                              Day {currentCycleDay}/{totalDays} ({remainingDays}d left)
                            </span>
                          </div>

                          {/* Visual Progress Bar Track & Fill */}
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200 shadow-inner">
                            <div
                              className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-amber-400 h-full rounded-full transition-all duration-700 relative flex items-center justify-end"
                              style={{ width: `${progressPercent}%` }}
                            >
                              <div className="w-1.5 h-1.5 bg-white rounded-full mr-0.5 shadow-xs animate-pulse" />
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[9px] sm:text-[10px] text-slate-400 font-medium">
                            <span>Purchased: {new Date(inv.purchased_at).toLocaleDateString()}</span>
                            <span className="font-bold text-slate-700 font-mono">
                              {progressPercent.toFixed(1)}% Cycle
                            </span>
                          </div>
                        </div>

                        {/* Total Cycle Summary */}
                        <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-100 flex items-center justify-between text-xs mt-2.5">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">
                              Total Expected Yield
                            </span>
                            <span className="font-mono font-bold text-emerald-800 text-xs">
                              RS {estimatedTotalReturn.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">
                              Auto Payout
                            </span>
                            <span className="font-semibold text-emerald-700 text-[11px] flex items-center justify-end gap-0.5">
                              <Sparkles className="w-3 h-3 text-amber-500" /> Daily Midnight
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 font-medium">
                        <span>Status: Actively Yielding</span>
                        <span className="text-emerald-700 font-bold">5% Daily Credit</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REFERRAL NETWORK */}
        {activeTab === 'referrals' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <span className="text-xs text-slate-400 font-semibold">Direct Referrals Joined</span>
                <p className="text-2xl font-extrabold text-slate-800 mt-1">{referrals.length} Members</p>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <span className="text-xs text-slate-400 font-semibold">Referral Commission Rate</span>
                <p className="text-2xl font-extrabold text-emerald-600 mt-1">10% Direct Bonus</p>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <span className="text-xs text-slate-400 font-semibold">Total Referral Income Earned</span>
                <p className="text-2xl font-extrabold text-amber-600 mt-1">RS {referralEarningsRs.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" /> Referred Client Accounts
                </h4>
                <span className="text-xs text-slate-500">
                  Your Referral Code: <span className="font-mono text-emerald-700 font-bold">{user.referral_code}</span>
                </span>
              </div>

              {referrals.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                  <Users className="w-8 h-8 text-slate-400 mx-auto" />
                  <p>No direct referrals yet. Copy and share your unique referral link to start earning 10% commission!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-bold text-[11px]">
                      <tr>
                        <th className="p-4">Referred Username</th>
                        <th className="p-4">Phone Number</th>
                        <th className="p-4">Joined Date</th>
                        <th className="p-4">Total Deposited</th>
                        <th className="p-4">Your 10% Commission</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {referrals.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 font-bold text-slate-900">{r.referred_username}</td>
                          <td className="p-4 font-mono text-slate-600">{r.referred_phone}</td>
                          <td className="p-4 text-slate-500">{new Date(r.joined_at).toLocaleDateString()}</td>
                          <td className="p-4 font-mono font-semibold">RS {r.total_deposits.toLocaleString()}</td>
                          <td className="p-4 font-mono font-bold text-emerald-600">+RS {r.commission_earned_rs.toLocaleString()}</td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                r.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TRANSACTION LOGS */}
        {activeTab === 'history' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Deposits History */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" /> Recent Deposit Requests
                </h4>
              </div>
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {deposits.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No deposit records found.</p>
                ) : (
                  deposits.map((dep) => (
                    <div
                      key={dep.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 font-mono">RS {dep.amount.toLocaleString()}</div>
                        <p className="text-[10px] text-slate-500">{dep.payment_method} • {new Date(dep.created_at).toLocaleDateString()}</p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          dep.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : dep.status === 'REJECTED'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {dep.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Withdrawals History */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4 text-amber-600" /> Recent Withdrawal Payouts
                </h4>
              </div>
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {withdrawals.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No withdrawal records found.</p>
                ) : (
                  withdrawals.map((wd) => (
                    <div
                      key={wd.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 font-mono">RS {wd.amount.toLocaleString()}</div>
                        <p className="text-[10px] text-slate-500">{wd.bank_name} • {wd.account_number}</p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          wd.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : wd.status === 'REJECTED'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {wd.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
