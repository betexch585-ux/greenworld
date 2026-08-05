import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Building2,
  DollarSign,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Save,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Smartphone,
  Lock,
  Search,
  Check,
  FileText,
  History,
  CreditCard,
  CheckCircle2,
  TrendingUp,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Deposit, Withdrawal, OwnerSettings, User } from '../types';
import { ReceiptViewerModal } from './ReceiptViewerModal';

interface AdminPanelProps {
  pendingDeposits: Deposit[];
  allDeposits?: Deposit[];
  pendingWithdrawals: Withdrawal[];
  allWithdrawals?: Withdrawal[];
  ownerSettings: OwnerSettings;
  usersList: User[];
  onApproveDeposit: (depositId: string) => void;
  onRejectDeposit: (depositId: string) => void;
  onMarkPaidWithdrawal: (withdrawalId: string) => void;
  onRejectWithdrawal: (withdrawalId: string) => void;
  onSaveOwnerSettings: (settings: OwnerSettings) => void;
  onTriggerDailyProfit: () => void;
  onRefreshData: () => void;
  isTriggeringProfit?: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  pendingDeposits,
  allDeposits = [],
  pendingWithdrawals,
  allWithdrawals = [],
  ownerSettings,
  usersList,
  onApproveDeposit,
  onRejectDeposit,
  onMarkPaidWithdrawal,
  onRejectWithdrawal,
  onSaveOwnerSettings,
  onTriggerDailyProfit,
  onRefreshData,
  isTriggeringProfit,
}) => {
  // Local state for Owner Settings form
  const [settingsForm, setSettingsForm] = useState<OwnerSettings>({ ...ownerSettings });

  useEffect(() => {
    setSettingsForm({ ...ownerSettings });
  }, [ownerSettings]);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<{
    url: string;
    username: string;
    amount: number;
    method: string;
  } | null>(null);

  // Search filter for clients table
  const [userSearch, setUserSearch] = useState('');

  // Transaction Log Tab & Search State
  const [txLogTab, setTxLogTab] = useState<'all' | 'approved_deposits' | 'paid_withdrawals'>('all');
  const [txLogSearch, setTxLogSearch] = useState('');

  // Liquidity Trend Chart Timeframe State
  const [chartDays, setChartDays] = useState<7 | 14 | 30>(30);

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveOwnerSettings(settingsForm);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.includes(userSearch)
  );

  const totalPendingDepositsRs = pendingDeposits.reduce((sum, d) => sum + d.amount, 0);
  const totalPendingWithdrawalsRs = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);

  const approvedDeposits = allDeposits.filter((d) => d.status === 'APPROVED');
  const paidWithdrawals = allWithdrawals.filter((w) => w.status === 'PAID');

  const totalApprovedDepositsRs = approvedDeposits.reduce((sum, d) => sum + d.amount, 0);
  const totalPaidWithdrawalsRs = paidWithdrawals.reduce((sum, w) => sum + w.amount, 0);

  // Compute daily deposit and withdrawal trends for the selected timeframe (e.g. 30 days)
  const liquidityTrends = useMemo(() => {
    const daysMap = new Map<string, { deposits: number; withdrawals: number; label: string }>();
    const now = new Date();

    for (let i = chartDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const isoDate = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      daysMap.set(isoDate, { deposits: 0, withdrawals: 0, label });
    }

    approvedDeposits.forEach((dep) => {
      const rawDate = dep.approved_at || dep.created_at || '';
      const dateStr = rawDate.split('T')[0];
      if (daysMap.has(dateStr)) {
        const item = daysMap.get(dateStr)!;
        item.deposits += dep.amount;
      }
    });

    paidWithdrawals.forEach((wd) => {
      const rawDate = wd.processed_at || wd.created_at || '';
      const dateStr = rawDate.split('T')[0];
      if (daysMap.has(dateStr)) {
        const item = daysMap.get(dateStr)!;
        item.withdrawals += wd.amount;
      }
    });

    const result: { dateKey: string; label: string; Deposits: number; Withdrawals: number; NetFlow: number }[] = [];
    daysMap.forEach((val, key) => {
      result.push({
        dateKey: key,
        label: val.label,
        Deposits: val.deposits,
        Withdrawals: val.withdrawals,
        NetFlow: val.deposits - val.withdrawals,
      });
    });

    return result;
  }, [approvedDeposits, paidWithdrawals, chartDays]);

  const chartTotals = useMemo(() => {
    const totalDep = liquidityTrends.reduce((acc, curr) => acc + curr.Deposits, 0);
    const totalWd = liquidityTrends.reduce((acc, curr) => acc + curr.Withdrawals, 0);
    return {
      deposits: totalDep,
      withdrawals: totalWd,
      net: totalDep - totalWd,
    };
  }, [liquidityTrends]);

  const filteredApprovedDeposits = approvedDeposits.filter((d) => {
    const q = txLogSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      d.username.toLowerCase().includes(q) ||
      d.phone.includes(q) ||
      d.user_id.toLowerCase().includes(q) ||
      d.payment_method.toLowerCase().includes(q) ||
      d.amount.toString().includes(q)
    );
  });

  const filteredPaidWithdrawals = paidWithdrawals.filter((w) => {
    const q = txLogSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      w.username.toLowerCase().includes(q) ||
      w.phone.includes(q) ||
      w.user_id.toLowerCase().includes(q) ||
      w.bank_name.toLowerCase().includes(q) ||
      w.account_holder.toLowerCase().includes(q) ||
      w.account_number.includes(q) ||
      w.amount.toString().includes(q)
    );
  });

  return (
    <div className="space-y-5 sm:space-y-8 animate-fade-in pb-12 text-slate-800">
      {/* Receipt Image Zoom Modal */}
      <ReceiptViewerModal
        isOpen={!!selectedReceipt}
        screenshotUrl={selectedReceipt?.url || null}
        username={selectedReceipt?.username || ''}
        amountRs={selectedReceipt?.amount || 0}
        paymentMethod={selectedReceipt?.method || ''}
        onClose={() => setSelectedReceipt(null)}
      />

      {/* Admin Panel Welcome Header (Natural Tones) */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-8 border border-slate-100 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100/80 text-amber-900 border border-amber-200/80 text-[10px] sm:text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" /> Owner Master Control Panel
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              GreenWorld <span className="text-emerald-700">Admin Operations</span>
            </h1>
            <p className="text-xs text-slate-500 max-w-xl">
              Verify client deposits, approve withdrawals, update active payment destination accounts, and trigger daily yields.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onTriggerDailyProfit}
              disabled={isTriggeringProfit}
              className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all"
            >
              <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isTriggeringProfit ? 'animate-spin' : ''}`} />
              <span>Trigger Daily Yield</span>
            </button>
            <button
              onClick={onRefreshData}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors"
              title="Refresh Live Admin Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Total Deposits Card */}
        <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 text-white rounded-3xl p-5 shadow-md border border-emerald-700/50 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-emerald-200 uppercase tracking-wider">Total Approved Deposits</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-700/80 text-emerald-100 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-5 h-5 text-emerald-200" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-100">
            RS {totalApprovedDepositsRs.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-200/80 mt-1.5 flex items-center gap-1">
            <span className="font-bold">{approvedDeposits.length}</span> approved client deposits
          </p>
        </div>

        {/* Total Withdrawals Card */}
        <div className="bg-gradient-to-br from-amber-900 to-amber-800 text-white rounded-3xl p-5 shadow-md border border-amber-700/50 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-amber-200 uppercase tracking-wider">Total Paid Withdrawals</span>
            <div className="w-9 h-9 rounded-xl bg-amber-700/80 text-amber-100 flex items-center justify-center font-bold">
              <ArrowDownRight className="w-5 h-5 text-amber-200" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-100">
            RS {totalPaidWithdrawalsRs.toLocaleString()}
          </div>
          <p className="text-[11px] text-amber-200/80 mt-1.5 flex items-center gap-1">
            <span className="font-bold">{paidWithdrawals.length}</span> approved & paid client withdrawals
          </p>
        </div>

        {/* Total Clients Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Clients</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{usersList.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Registered solar investors</p>
        </div>

        {/* Pending Deposits Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Pending Deposits</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              {pendingDeposits.length}
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">RS {totalPendingDepositsRs.toLocaleString()}</div>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting admin approval</p>
        </div>

        {/* Pending Withdrawals Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Pending Withdrawals</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              {pendingWithdrawals.length}
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono">RS {totalPendingWithdrawalsRs.toLocaleString()}</div>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting bank payout</p>
        </div>

        {/* System Status Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">System Status</span>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-base font-bold text-emerald-700 flex items-center gap-1.5 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" /> Live &amp; Active
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Midnight Yield Cron Active</p>
        </div>
      </div>

      {/* PLATFORM LIQUIDITY & TRENDS RECHARTS SECTION */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100/80 text-emerald-900 border border-emerald-200/80 text-[10px] font-bold uppercase tracking-wider mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-700" /> Platform Financial Analytics
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" /> Daily Deposit &amp; Withdrawal Trends
            </h3>
            <p className="text-xs text-slate-500">
              Visualizing liquidity flow across all client investments and payouts over the selected timeframe.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Timeframe Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setChartDays(7)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  chartDays === 7 ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setChartDays(14)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  chartDays === 14 ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                14 Days
              </button>
              <button
                type="button"
                onClick={() => setChartDays(30)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  chartDays === 30 ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                30 Days
              </button>
            </div>

            {/* Quick Metrics Badges */}
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-100 font-mono font-bold">
                <span className="text-[10px] uppercase text-emerald-700 font-extrabold block">Inflow</span>
                +RS {chartTotals.deposits.toLocaleString()}
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-100 font-mono font-bold">
                <span className="text-[10px] uppercase text-amber-700 font-extrabold block">Outflow</span>
                -RS {chartTotals.withdrawals.toLocaleString()}
              </div>
              <div
                className={`px-3 py-1.5 rounded-xl font-mono font-bold border ${
                  chartTotals.net >= 0
                    ? 'bg-slate-900 text-emerald-400 border-slate-800'
                    : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}
              >
                <span className="text-[10px] uppercase text-slate-400 font-extrabold block">Net Liquidity</span>
                {chartTotals.net >= 0 ? '+' : ''}RS {chartTotals.net.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Recharts Area / Line Chart Container */}
        <div className="w-full h-72 sm:h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={liquidityTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="depositGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="withdrawalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                dy={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                tickFormatter={(val) =>
                  val >= 1000000
                    ? `${(val / 1000000).toFixed(1)}M`
                    : val >= 1000
                    ? `${(val / 1000).toFixed(0)}k`
                    : val
                }
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const depVal = payload.find((p: any) => p.dataKey === 'Deposits')?.value || 0;
                    const wdVal = payload.find((p: any) => p.dataKey === 'Withdrawals')?.value || 0;
                    const net = depVal - wdVal;

                    return (
                      <div className="bg-slate-900 border border-slate-700 text-white p-3.5 rounded-2xl shadow-xl text-xs space-y-2 font-sans">
                        <p className="font-extrabold text-slate-300 border-b border-slate-800 pb-1.5 flex items-center justify-between gap-4">
                          <span>{label}</span>
                          <span className="text-[10px] text-slate-400 font-mono">24h Volume</span>
                        </p>
                        <div className="flex items-center justify-between gap-6">
                          <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Approved Deposits:
                          </span>
                          <span className="font-black font-mono text-emerald-300">RS {depVal.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between gap-6">
                          <span className="flex items-center gap-1.5 font-medium text-amber-400">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Paid Withdrawals:
                          </span>
                          <span className="font-black font-mono text-amber-300">RS {wdVal.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between gap-6 pt-1.5 border-t border-slate-800">
                          <span className="font-bold text-slate-400">Net Flow:</span>
                          <span className={`font-black font-mono ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {net >= 0 ? '+' : ''}RS {net.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                height={36}
                iconType="circle"
                formatter={(value) => (
                  <span className="text-xs font-bold text-slate-700 mr-2">{value}</span>
                )}
              />
              <Area
                type="monotone"
                dataKey="Deposits"
                name="Approved Deposits (RS)"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#depositGradient)"
              />
              <Area
                type="monotone"
                dataKey="Withdrawals"
                name="Paid Withdrawals (RS)"
                stroke="#f59e0b"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#withdrawalGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION 1: PENDING DEPOSITS TABLE */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-emerald-600" /> Live Pending Deposits
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-mono font-bold">
                {pendingDeposits.length}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Fetched live from <code className="text-emerald-700">/api/admin/deposits</code>. Approving automatically credits client's wallet.
            </p>
          </div>
        </div>

        {pendingDeposits.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
            <p>No pending deposit requests. All deposits are up to date!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-bold text-[11px]">
                <tr>
                  <th className="p-4">Client Username</th>
                  <th className="p-4">Phone (+92)</th>
                  <th className="p-4">Deposit Amount (RS)</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Receipt Proof</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {pendingDeposits.map((dep) => (
                  <tr key={dep.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{dep.username}</td>
                    <td className="p-4 font-mono text-slate-600">{dep.phone}</td>
                    <td className="p-4 font-mono font-bold text-emerald-700 text-sm">
                      RS {dep.amount.toLocaleString()}
                    </td>
                    <td className="p-4 font-medium text-slate-700">{dep.payment_method}</td>
                    <td className="p-4">
                      {dep.screenshot_url ? (
                        <button
                          onClick={() =>
                            setSelectedReceipt({
                              url: dep.screenshot_url,
                              username: dep.username,
                              amount: dep.amount,
                              method: dep.payment_method,
                            })
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-[11px] transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Receipt
                        </button>
                      ) : (
                        <span className="text-slate-400">No Receipt</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500 text-[11px]">{new Date(dep.created_at).toLocaleString()}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onApproveDeposit(dep.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve Deposit
                        </button>
                        <button
                          onClick={() => onRejectDeposit(dep.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-red-100 hover:text-red-700 text-slate-600 border border-slate-200 text-xs transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: PENDING WITHDRAWALS TABLE */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5 text-amber-600" /> Pending Payout Withdrawals
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-mono font-bold">
                {pendingWithdrawals.length}
              </span>
            </h3>
            <p className="text-xs text-slate-500">Payout requests submitted by clients requiring bank transfer.</p>
          </div>
        </div>

        {pendingWithdrawals.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs space-y-2">
            <CheckCircle className="w-8 h-8 text-amber-600 mx-auto" />
            <p>No pending payout requests. All withdrawals have been processed!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-bold text-[11px]">
                <tr>
                  <th className="p-4">Client Username</th>
                  <th className="p-4">Bank Name</th>
                  <th className="p-4">Account Holder Title</th>
                  <th className="p-4">Account / IBAN Number</th>
                  <th className="p-4">Amount (RS)</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {pendingWithdrawals.map((wd) => (
                  <tr key={wd.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900">
                      {wd.username}
                      <p className="text-[10px] text-slate-500 font-mono">{wd.phone}</p>
                    </td>
                    <td className="p-4 font-medium text-amber-800">{wd.bank_name}</td>
                    <td className="p-4 font-semibold text-slate-900">{wd.account_holder}</td>
                    <td className="p-4 font-mono text-emerald-800 font-bold">{wd.account_number}</td>
                    <td className="p-4 font-mono font-bold text-amber-700 text-sm">
                      RS {wd.amount.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onMarkPaidWithdrawal(wd.id)}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Mark Paid
                        </button>
                        <button
                          onClick={() => onRejectWithdrawal(wd.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-red-100 hover:text-red-700 text-slate-600 border border-slate-200 text-xs transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 3: OWNER PAYMENT SETTINGS CARD */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-600" /> Owner Payment Destination Settings
            </h3>
            <p className="text-xs text-slate-500">
              Update official Bank, EasyPaisa, &amp; JazzCash accounts. Updates appear live on Deposit Modal!
            </p>
          </div>
        </div>

        <form onSubmit={handleSettingsSubmit} className="p-6 space-y-6">
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Owner account settings saved successfully! Live changes pushed to Client Portal.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bank Settings */}
            <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" /> Bank Account Settings
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  required
                  value={settingsForm.bank_name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bank_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Title</label>
                <input
                  type="text"
                  required
                  value={settingsForm.account_title}
                  onChange={(e) => setSettingsForm({ ...settingsForm, account_title: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">IBAN / Account Number</label>
                <input
                  type="text"
                  required
                  value={settingsForm.iban_account}
                  onChange={(e) => setSettingsForm({ ...settingsForm, iban_account: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Mobile Wallet Settings */}
            <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" /> EasyPaisa &amp; JazzCash Settings
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">EasyPaisa No.</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.easypaisa_number}
                    onChange={(e) => setSettingsForm({ ...settingsForm, easypaisa_number: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">EasyPaisa Title</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.easypaisa_name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, easypaisa_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">JazzCash No.</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.jazzcash_number}
                    onChange={(e) => setSettingsForm({ ...settingsForm, jazzcash_number: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">JazzCash Title</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.jazzcash_name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, jazzcash_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Special Deposit Note / Instructions</label>
                <textarea
                  rows={2}
                  value={settingsForm.deposit_instructions}
                  onChange={(e) => setSettingsForm({ ...settingsForm, deposit_instructions: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Client Customer Support WhatsApp Number (+92 Format)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +923008829102"
                  value={settingsForm.whatsapp_number || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_number: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Clients clicking the WhatsApp Support button on the client portal will directly open a chat with this number.
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Save &amp; Update Payment Destination Details
          </button>
        </form>
      </div>

      {/* SECTION 4: APPROVED DEPOSITS & PAID WITHDRAWALS TRANSACTION LOG */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm space-y-0">
        <div className="p-5 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider mb-1">
              <History className="w-3 h-3 text-emerald-400" /> Complete Audit Trail
            </div>
            <h3 className="text-base sm:text-lg font-extrabold flex items-center gap-2 text-white">
              <FileText className="w-5 h-5 text-emerald-400" /> Admin Transaction Log &amp; Payout History
            </h3>
            <p className="text-xs text-slate-400">
              Complete history of approved client deposit investments &amp; disbursed bank payouts with Client IDs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setTxLogTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  txLogTab === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({approvedDeposits.length + paidWithdrawals.length})
              </button>
              <button
                type="button"
                onClick={() => setTxLogTab('approved_deposits')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  txLogTab === 'approved_deposits'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Deposits ({approvedDeposits.length})
              </button>
              <button
                type="button"
                onClick={() => setTxLogTab('paid_withdrawals')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  txLogTab === 'paid_withdrawals'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Paid ({paidWithdrawals.length})
              </button>
            </div>

            {/* Log Search */}
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search username, ID, bank..."
                value={txLogSearch}
                onChange={(e) => setTxLogSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* LOG CONTENT TABLES */}
        <div className="p-4 sm:p-6 space-y-6 bg-slate-50/50">
          {/* APPROVED DEPOSITS LOG TABLE */}
          {(txLogTab === 'all' || txLogTab === 'approved_deposits') && (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="p-4 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900">
                      Approved Deposits Log ({filteredApprovedDeposits.length})
                    </h4>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      Total Approved Balance Credited: <span className="font-bold font-mono">RS {totalApprovedDepositsRs.toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              </div>

              {filteredApprovedDeposits.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No approved deposits logged matching search filter.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-bold text-[10px]">
                      <tr>
                        <th className="p-3.5">Client ID &amp; Username</th>
                        <th className="p-3.5">Phone Number</th>
                        <th className="p-3.5">Approved Amount</th>
                        <th className="p-3.5">Method</th>
                        <th className="p-3.5">Date Approved</th>
                        <th className="p-3.5 text-center">Receipt</th>
                        <th className="p-3.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {filteredApprovedDeposits.map((dep) => (
                        <tr key={dep.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5">
                            <span className="font-bold text-slate-900">{dep.username}</span>
                            <p className="text-[10px] text-slate-500 font-mono">User ID: {dep.user_id}</p>
                          </td>
                          <td className="p-3.5 font-mono text-slate-600">{dep.phone}</td>
                          <td className="p-3.5 font-mono font-black text-emerald-700 text-sm">
                            + RS {dep.amount.toLocaleString()}
                          </td>
                          <td className="p-3.5 font-semibold text-slate-700">{dep.payment_method}</td>
                          <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                            {dep.approved_at
                              ? new Date(dep.approved_at).toLocaleString()
                              : new Date(dep.created_at).toLocaleString()}
                          </td>
                          <td className="p-3.5 text-center">
                            {dep.screenshot_url ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedReceipt({
                                    url: dep.screenshot_url,
                                    username: dep.username,
                                    amount: dep.amount,
                                    method: dep.payment_method,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 font-bold rounded-lg text-[10px] transition-colors"
                              >
                                <Eye className="w-3 h-3 text-emerald-600" /> View
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[10px]">No image</span>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> APPROVED
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* PAID WITHDRAWALS LOG TABLE */}
          {(txLogTab === 'all' || txLogTab === 'paid_withdrawals') && (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="p-4 bg-amber-50/80 border-b border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                      Paid Withdrawals Log ({filteredPaidWithdrawals.length})
                    </h4>
                    <p className="text-[11px] text-amber-700 font-medium">
                      Total Disbursed Payouts: <span className="font-bold font-mono">RS {totalPaidWithdrawalsRs.toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              </div>

              {filteredPaidWithdrawals.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No paid withdrawals logged matching search filter.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-bold text-[10px]">
                      <tr>
                        <th className="p-3.5">Client ID &amp; Username</th>
                        <th className="p-3.5">Phone Number</th>
                        <th className="p-3.5">Payout Destination (Whom)</th>
                        <th className="p-3.5">Account Number / IBAN</th>
                        <th className="p-3.5">Amount Paid</th>
                        <th className="p-3.5">Date Paid</th>
                        <th className="p-3.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {filteredPaidWithdrawals.map((wd) => (
                        <tr key={wd.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5">
                            <span className="font-bold text-slate-900">{wd.username}</span>
                            <p className="text-[10px] text-slate-500 font-mono">User ID: {wd.user_id}</p>
                          </td>
                          <td className="p-3.5 font-mono text-slate-600">{wd.phone}</td>
                          <td className="p-3.5">
                            <span className="font-bold text-slate-900">{wd.account_holder}</span>
                            <p className="text-[10px] text-amber-800 font-medium">{wd.bank_name}</p>
                          </td>
                          <td className="p-3.5 font-mono font-bold text-emerald-800">{wd.account_number}</td>
                          <td className="p-3.5 font-mono font-black text-amber-700 text-sm">
                            - RS {wd.amount.toLocaleString()}
                          </td>
                          <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                            {wd.processed_at
                              ? new Date(wd.processed_at).toLocaleString()
                              : new Date(wd.created_at).toLocaleString()}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-900 font-bold rounded-full text-[10px]">
                              <CheckCircle2 className="w-3 h-3 text-amber-600" /> PAID
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 5: ALL REGISTERED CLIENTS DIRECTORY */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" /> Registered Clients Directory
            </h3>
            <p className="text-xs text-slate-500">View client balances, phone numbers, and referral codes.</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search user, phone, ref..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-bold text-[11px]">
              <tr>
                <th className="p-4">Full Name</th>
                <th className="p-4">Username</th>
                <th className="p-4">Phone Number</th>
                <th className="p-4">Referral Code</th>
                <th className="p-4">Wallet Balance</th>
                <th className="p-4">Total Deposits</th>
                <th className="p-4">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 font-bold text-slate-900">{u.full_name}</td>
                  <td className="p-4 font-medium text-emerald-700">{u.username}</td>
                  <td className="p-4 font-mono text-slate-600">{u.phone}</td>
                  <td className="p-4 font-mono font-bold text-amber-700">{u.referral_code}</td>
                  <td className="p-4 font-mono font-bold text-emerald-700">RS {u.wallet_balance.toLocaleString()}</td>
                  <td className="p-4 font-mono">RS {u.total_deposits.toLocaleString()}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'admin'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
