import React, { useState } from 'react';
import {
  Sun,
  Zap,
  TrendingUp,
  Wallet,
  ShieldCheck,
  Users,
  ArrowRight,
  CheckCircle2,
  Calculator,
  Clock,
  Sparkles,
  Award,
  Activity,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Award as RibbonIcon,
  PhoneCall,
} from 'lucide-react';
import { SolarPackage, OwnerSettings } from '../types';

interface LandingPageProps {
  solarPackages: SolarPackage[];
  ownerSettings: OwnerSettings;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  solarPackages,
  ownerSettings,
  onOpenAuth,
}) => {
  // Calculator state
  const [calcAmount, setCalcAmount] = useState<number>(5000);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // ROI calculations
  const dailyReturnPercent = 0.05; // 5%
  const durationDays = 15;
  const dailyProfitRs = Math.round(calcAmount * dailyReturnPercent);
  const totalProfitRs = dailyProfitRs * durationDays;
  const grandTotalRs = calcAmount + totalProfitRs;

  const quickAmounts = [1000, 3000, 5000, 10000, 20000, 50000];

  const faqs = [
    {
      q: 'How does GreenWorld Solar generate daily profits?',
      a: 'GreenWorld operates commercial-grade solar micro-grids across Pakistan. Clean energy produced by our solar arrays is sold into the grid and commercial consumers. Returns from electricity sales are distributed proportionally (5% daily) to package investors.',
    },
    {
      q: 'When do I receive my investment principal back?',
      a: 'Your original investment principal is 100% returned to your wallet balance automatically after the 15-day package term completes, alongside your daily 5% earnings.',
    },
    {
      q: 'How fast are EasyPaisa, JazzCash & Bank withdrawals processed?',
      a: 'Withdrawals are processed swiftly by our owner admin team, usually within 30 minutes to 2 hours directly into your specified account.',
    },
    {
      q: 'How does the 10% Referral Bonus program work?',
      a: 'When you invite friends or family using your unique Referral Code, you instantly receive a 10% cash commission credited to your wallet whenever they make an approved deposit!',
    },
  ];

  // Generate randomized Pakistani names & ~2k withdrawal amounts on site load
  const recentTransactions = React.useMemo(() => {
    const names = [
      'Usman K.', 'Zainab B.', 'Fahad M.', 'Noman A.', 'Shehryar T.', 'Imran S.',
      'Danish Q.', 'Sohail V.', 'Rehan H.', 'Asad K.', 'Waqas A.', 'Haris N.',
      'Tariq P.', 'Shahid R.', 'Kashif M.', 'Hamza L.', 'Aamir J.', 'Babar G.'
    ];
    const methods = ['via EasyPaisa', 'via JazzCash', 'via Bank Transfer', 'via EasyPaisa', 'via JazzCash'];
    const times = ['1 min ago', '3 mins ago', '5 mins ago', '8 mins ago', '12 mins ago', '15 mins ago'];

    // Shuffle names array randomly
    const shuffledNames = [...names].sort(() => 0.5 - Math.random());

    // Generate 6 unique items with amounts around RS 2,000 (e.g. 1,800 to 2,500)
    return Array.from({ length: 6 }).map((_, i) => {
      const baseAmount = 1800 + Math.floor(Math.random() * 15) * 50; 
      const method = methods[i % methods.length];
      const time = times[i % times.length];
      const name = shuffledNames[i] || `Client ${i + 1}`;

      const actionTypes = [
        `Withdrew RS ${baseAmount.toLocaleString()} ${method}`,
        `Withdrew RS ${baseAmount.toLocaleString()} ${method}`,
        `Received Daily Yield RS ${baseAmount.toLocaleString()}`,
        `Claimed Solar Earnings RS ${baseAmount.toLocaleString()}`,
      ];

      const action = actionTypes[Math.floor(Math.random() * actionTypes.length)];

      return {
        name,
        action,
        time,
        amount: baseAmount,
      };
    });
  }, []);

  return (
    <div className="space-y-12 sm:space-y-20 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-4 pb-8 sm:pt-8 sm:pb-12 bg-gradient-to-b from-emerald-900 via-emerald-950 to-slate-950 rounded-3xl text-white p-6 sm:p-12 shadow-2xl border border-emerald-800/60">
        {/* Glow ambient background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Text */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold tracking-wide shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin-slow" />
              <span>Clean Energy • Guaranteed 5% Daily Returns</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Generate <span className="text-emerald-400 underline decoration-amber-400 decoration-wavy decoration-2">Solar Power</span>. <br />
              Earn Daily Profit.
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
              Join Pakistan's premier solar investment network. Invest in clean energy packages starting from just <strong className="text-white">RS 1,000</strong> and earn <strong className="text-amber-300">5% daily profit</strong> credited every 24 hours with full principal return after 15 days.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                onClick={() => onOpenAuth('register')}
                className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Start Earning Today</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onOpenAuth('login')}
                className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Existing Client Sign In</span>
              </button>
            </div>

            {/* Quick Guarantees */}
            <div className="pt-4 border-t border-emerald-800/60 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant EasyPaisa/JazzCash
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% Principal Returned
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 10% Referral Bonus
              </span>
            </div>
          </div>

          {/* Right Hero Live Metrics Widget */}
          <div className="lg:col-span-5 bg-emerald-950/80 backdrop-blur-md border border-emerald-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-emerald-800/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-amber-400">
                  <Sun className="w-6 h-6 animate-spin-slow" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-white">Live Solar Node Network</p>
                  <p className="text-[10px] text-emerald-400 font-mono">Status: 100% Operational</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/30">
                Live
              </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-slate-900/80 border border-emerald-800/50 p-4 rounded-2xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Generated</p>
                <p className="text-lg font-black text-emerald-400 font-mono mt-0.5">520,840 kWh</p>
                <p className="text-[10px] text-emerald-500/80 mt-1">Clean solar power</p>
              </div>

              <div className="bg-slate-900/80 border border-emerald-800/50 p-4 rounded-2xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Daily Profit Rate</p>
                <p className="text-lg font-black text-amber-400 font-mono mt-0.5">5.0% / Day</p>
                <p className="text-[10px] text-slate-400 mt-1">For 15 Consecutive Days</p>
              </div>

              <div className="bg-slate-900/80 border border-emerald-800/50 p-4 rounded-2xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Investors</p>
                <p className="text-lg font-black text-white font-mono mt-0.5">14,850+</p>
                <p className="text-[10px] text-slate-400 mt-1">Across Pakistan</p>
              </div>

              <div className="bg-slate-900/80 border border-emerald-800/50 p-4 rounded-2xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Payouts</p>
                <p className="text-lg font-black text-emerald-300 font-mono mt-0.5">RS 42.1M+</p>
                <p className="text-[10px] text-emerald-400 mt-1">Withdrawals cleared</p>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => onOpenAuth('register')}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Create Account &amp; Claim Solar Yield
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WHAT WE DO & HOW IT WORKS */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>How GreenWorld Solar Works</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            What We Do: Solar Power to Daily Cash
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            We bridge clean solar energy harvesting with everyday fractional investing. Here is how your money works for you:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1 */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all space-y-3 relative group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-black text-lg group-hover:scale-105 transition-transform">
              <Sun className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="absolute top-4 right-4 text-2xl font-black text-slate-100 font-mono">01</span>
            <h3 className="text-base font-extrabold text-slate-900">Solar Array Energy</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We operate high-capacity photovoltaic solar farms across urban &amp; rural Pakistan, capturing renewable solar power.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all space-y-3 relative group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-black text-lg group-hover:scale-105 transition-transform">
              <Wallet className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="absolute top-4 right-4 text-2xl font-black text-slate-100 font-mono">02</span>
            <h3 className="text-base font-extrabold text-slate-900">Pick Solar Package</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Choose an investment package starting from RS 1,000 up to RS 50,000 via EasyPaisa, JazzCash, or Bank Transfer.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all space-y-3 relative group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-black text-lg group-hover:scale-105 transition-transform">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="absolute top-4 right-4 text-2xl font-black text-slate-100 font-mono">03</span>
            <h3 className="text-base font-extrabold text-slate-900">5% Daily Yield</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your wallet receives 5% daily profit automatically every 24 hours for 15 days, reflecting clean power sales revenue.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all space-y-3 relative group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-black text-lg group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="absolute top-4 right-4 text-2xl font-black text-slate-100 font-mono">04</span>
            <h3 className="text-base font-extrabold text-slate-900">Instant Withdrawal</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Withdraw profits directly to your mobile bank anytime. Original principal is 100% returned on Day 15!
            </p>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE PROFIT & ROI CALCULATOR */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold mb-2">
              <Calculator className="w-3.5 h-3.5" />
              <span>Interactive ROI Estimator</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Calculate Your Solar Returns
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Select an investment tier to calculate your daily yield and total 15-day revenue.
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setCalcAmount(amt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  calcAmount === amt
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                RS {amt.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Calculator Display */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Slider Controls */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-300">Investment Amount</label>
                <span className="text-xl font-mono font-black text-amber-400">RS {calcAmount.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="50000"
                step="1000"
                value={calcAmount}
                onChange={(e) => setCalcAmount(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>Min: RS 1,000</span>
                <span>Max: RS 50,000</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-bold block">Daily Profit Rate</span>
                <span className="text-base font-black font-mono text-emerald-400">5% per Day</span>
              </div>
              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-bold block">Investment Term</span>
                <span className="text-base font-black font-mono text-white">15 Days</span>
              </div>
            </div>
          </div>

          {/* Right Summary Result */}
          <div className="lg:col-span-6 bg-gradient-to-br from-emerald-950 to-slate-950 p-6 sm:p-8 rounded-2xl border border-emerald-800/80 space-y-4">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-emerald-900">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Daily Profit Credit</p>
                <p className="text-xl font-extrabold text-amber-400 font-mono mt-0.5">RS {dailyProfitRs.toLocaleString()}</p>
                <p className="text-[10px] text-slate-500">Credited every 24h</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">15-Day Net Profit</p>
                <p className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">RS {totalProfitRs.toLocaleString()}</p>
                <p className="text-[10px] text-emerald-500">Pure ROI profit</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-xs text-slate-300 font-extrabold">Total Return (Principal + Profit)</p>
                <p className="text-2xl font-black text-white font-mono mt-0.5">RS {grandTotalRs.toLocaleString()}</p>
              </div>

              <button
                onClick={() => onOpenAuth('register')}
                className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer whitespace-nowrap"
              >
                Invest RS {calcAmount.toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SOLAR INVESTMENT PACKAGES SHOWCASE */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <Sun className="w-3.5 h-3.5 text-emerald-600" />
            <span>Solar Investment Packages</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            High-Yield Solar Tiers
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Pick your preferred package to start receiving daily energy returns.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {solarPackages.map((pkg) => {
            const dailyRs = pkg.daily_return_rs;
            const netProfit = dailyRs * pkg.duration_days;
            const totalBack = pkg.price_rs + netProfit;

            return (
              <div
                key={pkg.id}
                className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-5 relative group hover:-translate-y-1"
              >
                {/* Package Badge */}
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {pkg.name}
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    5% Daily Yield
                  </span>
                </div>

                {/* Price Display */}
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                    RS {pkg.price_rs.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Package Capital Investment</p>
                </div>

                {/* Return Details */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="font-medium text-slate-500">Daily Profit Credit:</span>
                    <strong className="font-mono font-bold text-emerald-700">RS {dailyRs.toLocaleString()} / day</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="font-medium text-slate-500">Duration Period:</span>
                    <strong className="font-mono font-bold text-slate-800">{pkg.duration_days} Days</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-700 pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-800">Total Return:</span>
                    <strong className="font-mono font-extrabold text-amber-700">RS {totalBack.toLocaleString()}</strong>
                  </div>
                </div>

                {/* Action CTA Button */}
                <button
                  onClick={() => onOpenAuth('register')}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Activate {pkg.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. LIVE RECENT NETWORK ACTIVITY FEED */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              Live Solar Network Feed
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono font-bold">Real-time Verified Network Activity</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {recentTransactions.map((tx, idx) => (
            <div key={idx} className="bg-slate-50/80 border border-slate-200/80 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-extrabold text-slate-900 truncate">{tx.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{tx.time}</span>
                </div>
                <p className="text-[11px] font-semibold text-emerald-800 truncate">{tx.action}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FAQ ACCORDION */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Everything You Need to Know
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all shadow-2xs"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left font-extrabold text-xs sm:text-sm text-slate-900 flex justify-between items-center gap-4 cursor-pointer hover:bg-slate-50/80"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 sm:pb-6 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. BOTTOM CTA BANNER */}
      <section className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl border border-emerald-600/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-2xl mx-auto space-y-3 relative z-10">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            Ready to Build Your Daily Solar Earnings?
          </h2>
          <p className="text-slate-200 text-xs sm:text-sm">
            Create your account in under 1 minute. Deposit via EasyPaisa or JazzCash to start generating daily yields!
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => onOpenAuth('register')}
              className="px-8 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition-all cursor-pointer"
            >
              Create Client Account
            </button>
            <button
              onClick={() => onOpenAuth('login')}
              className="px-6 py-3.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-sm rounded-2xl transition-all cursor-pointer"
            >
              Sign In Existing Account
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
