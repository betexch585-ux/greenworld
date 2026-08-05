import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ClientDashboard } from './components/ClientDashboard';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { WhatsAppButton } from './components/WhatsAppButton';
import { LandingPage } from './components/LandingPage';
import { User, SolarPackage, OwnerSettings, Deposit, Withdrawal, ReferralRecord, UserInvestment } from './types';
import { Sun, ShieldCheck, Zap, Heart, CheckCircle2 } from 'lucide-react';

// Admin Login Gate for Restricted Access
function AdminLoginGate({ onLoginSuccess }: { onLoginSuccess: (user: User) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let userResult: User | null = null;

      try {
        const res = await fetch('/api/client/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim(), password }),
        });

        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          const data = await res.json();
          userResult = data.user;
        } else if (!res.ok && contentType && contentType.includes('application/json')) {
          const data = await res.json();
          throw new Error(data.error || 'Invalid credentials');
        }
      } catch (apiErr: any) {
        if (
          apiErr.message &&
          (apiErr.message.includes('Invalid') ||
            apiErr.message.includes('Denied') ||
            apiErr.message.includes('required'))
        ) {
          throw apiErr;
        }
        console.warn('[Admin API Login Fallback]:', apiErr.message);
      }

      // Fallback for static client-side deployment
      if (!userResult) {
        const cleanUser = username.trim().toLowerCase();
        const validAdminUsers = ['admin', 'greenworld2026', 'owner'];

        if (
          validAdminUsers.includes(cleanUser) &&
          (password === 'Satkartar1.' || password.trim() === 'Satkartar1.')
        ) {
          userResult = {
            id: 'user-admin',
            full_name: 'GreenWorld Owner',
            username: cleanUser,
            phone: '+923000000000',
            referral_code: 'GW2026',
            wallet_balance: 500000,
            total_deposits: 0,
            total_withdrawals: 0,
            daily_profit: 0,
            total_profit_earned: 0,
            role: 'admin',
            created_at: new Date().toISOString(),
          };
        } else {
          throw new Error('Invalid Admin Username or Password.');
        }
      }

      if (userResult.role !== 'admin') {
        throw new Error('Access Denied: This account does not have Administrator privileges.');
      }

      onLoginSuccess(userResult);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-16 flex justify-center items-center">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck className="w-6 h-6 text-amber-700" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Operations Sign In</h2>
          <p className="text-xs text-slate-500">
            Owner Master Portal • Secure Administrator Control Center
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Username</label>
            <input
              type="text"
              required
              autoComplete="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter admin username"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-600 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Password</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-600 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" /> Sign In to Admin Panel
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [clientUser, setClientUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<'client' | 'admin'>('client');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  // App Data State
  const [solarPackages, setSolarPackages] = useState<SolarPackage[]>([]);
  const [ownerSettings, setOwnerSettings] = useState<OwnerSettings>({
    bank_name: 'Meezan Bank Limited',
    account_title: 'GreenWorld Solar Energy Pvt Ltd',
    iban_account: 'PK36MEZN00010982347101',
    easypaisa_number: '0300-8829102',
    easypaisa_name: 'GreenWorld EasyPaisa Business',
    jazzcash_number: '0301-9982310',
    jazzcash_name: 'GreenWorld JazzCash Official',
    deposit_instructions: 'Please transfer exact amount in RS and upload screenshot proof.',
    whatsapp_number: '+923008829102',
  });

  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [referralEarningsRs, setReferralEarningsRs] = useState(0);
  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>([]);

  // Admin Data State
  const [pendingDeposits, setPendingDeposits] = useState<Deposit[]>([]);
  const [allDeposits, setAllDeposits] = useState<Deposit[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Withdrawal[]>([]);
  const [allWithdrawals, setAllWithdrawals] = useState<Withdrawal[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTriggeringProfit, setIsTriggeringProfit] = useState(false);

  // Auto-login default demo user on mount & set up 3s polling for real-time admin sync
  useEffect(() => {
    fetchInitialData();

    const interval = setInterval(() => {
      fetchAdminData();
      const client = localStorage.getItem('gw_active_client_id');
      if (client) {
        fetchUserProfile(client);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchInitialData = async () => {
    try {
      // 1. Restore Admin Session if logged in
      const savedAdminStr = localStorage.getItem('gw_active_admin_user');
      if (savedAdminStr) {
        try {
          const parsedAdmin = JSON.parse(savedAdminStr);
          setAdminUser(parsedAdmin);
        } catch (e) {
          console.warn('Error parsing saved admin user', e);
        }
      }

      // 2. Public packages & owner settings
      const pubRes = await fetch('/api/public/packages');
      if (pubRes.ok) {
        const pubData = await pubRes.json();
        setSolarPackages(pubData.packages || []);
        if (pubData.settings) setOwnerSettings(pubData.settings);
      }

      // 3. Fetch admin users & pending items
      fetchAdminData();

      // 4. Restore client session if available
      const savedClientId = localStorage.getItem('gw_active_client_id');
      const savedClientUserStr = localStorage.getItem('gw_active_client_user');
      if (savedClientId) {
        try {
          const profileRes = await fetch(`/api/client/profile/${savedClientId}`);
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setClientUser(profileData.user);
            localStorage.setItem('gw_active_client_user', JSON.stringify(profileData.user));
            setReferrals(profileData.referrals || []);
            setReferralEarningsRs(profileData.referral_earnings_rs || 0);
            setUserInvestments(profileData.investments || []);
            return;
          }
        } catch (e) {
          console.warn('Profile fetch failed, using cached client user');
        }

        if (savedClientUserStr) {
          try {
            setClientUser(JSON.parse(savedClientUserStr));
          } catch (e) {
            console.warn('Error parsing saved client user', e);
          }
        }
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const res = await fetch(`/api/client/profile/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setClientUser(data.user);
        setReferrals(data.referrals || []);
        setReferralEarningsRs(data.referral_earnings_rs || 0);
        setUserInvestments(data.investments || []);
        return;
      }
    } catch (err) {
      console.warn('[Fetch Profile API Fallback]:', err);
    }

    // Local Storage Fallback for Netlify
    const usersStr = localStorage.getItem('gw_registered_users');
    if (usersStr) {
      const users: User[] = JSON.parse(usersStr);
      const found = users.find((u) => u.id === userId);
      if (found) {
        setClientUser(found);
      }
    }
  };

  const fetchAdminData = async () => {
    try {
      // 1. Deposits
      let serverAllDeps: Deposit[] = [];
      try {
        const depRes = await fetch('/api/admin/deposits');
        if (depRes.ok) {
          const depData = await depRes.json();
          serverAllDeps = depData.allDeposits || [];
        }
      } catch (e) {
        console.warn('[Admin Deposits API Fallback]');
      }

      const localDepsStr = localStorage.getItem('gw_deposits');
      const localDeps: Deposit[] = localDepsStr ? JSON.parse(localDepsStr) : [];
      const depMap = new Map<string, Deposit>();
      [...serverAllDeps, ...localDeps].forEach((d) => depMap.set(d.id, d));
      const combinedAllDeps = Array.from(depMap.values());
      const combinedPendingDeps = combinedAllDeps.filter((d) => d.status === 'PENDING');

      setPendingDeposits(combinedPendingDeps);
      setAllDeposits(combinedAllDeps);

      // 2. Withdrawals
      let serverAllWds: Withdrawal[] = [];
      try {
        const wdRes = await fetch('/api/admin/withdrawals');
        if (wdRes.ok) {
          const wdData = await wdRes.json();
          serverAllWds = wdData.allWithdrawals || [];
        }
      } catch (e) {
        console.warn('[Admin Withdrawals API Fallback]');
      }

      const localWdsStr = localStorage.getItem('gw_withdrawals');
      const localWds: Withdrawal[] = localWdsStr ? JSON.parse(localWdsStr) : [];
      const wdMap = new Map<string, Withdrawal>();
      [...serverAllWds, ...localWds].forEach((w) => wdMap.set(w.id, w));
      const combinedAllWds = Array.from(wdMap.values());
      const combinedPendingWds = combinedAllWds.filter((w) => w.status === 'PENDING');

      setPendingWithdrawals(combinedPendingWds);
      setAllWithdrawals(combinedAllWds);

      // 3. Users List
      let serverUsers: User[] = [];
      try {
        const usersRes = await fetch('/api/admin/users');
        if (usersRes.ok) {
          const uData = await usersRes.json();
          serverUsers = uData.users || [];
        }
      } catch (e) {
        console.warn('[Admin Users API Fallback]');
      }

      const localUsersStr = localStorage.getItem('gw_registered_users');
      const localUsers: User[] = localUsersStr ? JSON.parse(localUsersStr) : [];
      const userMap = new Map<string, User>();
      [...serverUsers, ...localUsers].forEach((u) => userMap.set(u.id || u.username, u));
      const combinedUsers = Array.from(userMap.values());

      setUsersList(combinedUsers);

      // 4. Owner Settings
      try {
        const settingsRes = await fetch('/api/admin/settings');
        if (settingsRes.ok) {
          const sData = await settingsRes.json();
          if (sData.settings) setOwnerSettings(sData.settings);
        } else {
          const localSettingsStr = localStorage.getItem('gw_owner_settings');
          if (localSettingsStr) setOwnerSettings(JSON.parse(localSettingsStr));
        }
      } catch (e) {
        const localSettingsStr = localStorage.getItem('gw_owner_settings');
        if (localSettingsStr) setOwnerSettings(JSON.parse(localSettingsStr));
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  const handleUserLoginSuccess = (user: User) => {
    if (user.role === 'admin') {
      setAdminUser(user);
      localStorage.setItem('gw_active_admin_user', JSON.stringify(user));
      fetchAdminData();
      showToast(`Admin signed in: ${user.full_name}`);
      if (!clientUser) {
        fetchInitialData();
      }
    } else {
      setClientUser(user);
      localStorage.setItem('gw_active_client_id', user.id);
      localStorage.setItem('gw_active_client_user', JSON.stringify(user));
      fetchUserProfile(user.id);
      fetchAdminData();
      showToast(`Welcome back, ${user.full_name}!`);
    }
  };

  const handleLogout = () => {
    if (activeView === 'admin') {
      setAdminUser(null);
      localStorage.removeItem('gw_active_admin_user');
      showToast('Admin signed out.');
    } else {
      setClientUser(null);
      localStorage.removeItem('gw_active_client_id');
      localStorage.removeItem('gw_active_client_user');
      showToast('Client signed out.');
    }
  };

  // Admin Actions
  const handleApproveDeposit = async (depositId: string) => {
    try {
      let isSuccess = false;
      try {
        const res = await fetch('/api/admin/approve-deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deposit_id: depositId }),
        });
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          const data = await res.json();
          showToast(data.message || 'Deposit approved!');
          isSuccess = true;
        }
      } catch (e) {
        console.warn('[Approve Deposit Fallback]:', e);
      }

      if (!isSuccess) {
        const localDepsStr = localStorage.getItem('gw_deposits');
        const localDeps: Deposit[] = localDepsStr ? JSON.parse(localDepsStr) : [];
        const depIdx = localDeps.findIndex((d) => d.id === depositId);
        let targetUserId = '';
        let amount = 0;

        if (depIdx >= 0) {
          localDeps[depIdx].status = 'APPROVED';
          targetUserId = localDeps[depIdx].user_id;
          amount = localDeps[depIdx].amount;
          localStorage.setItem('gw_deposits', JSON.stringify(localDeps));
        } else {
          const stateDep = allDeposits.find((d) => d.id === depositId);
          if (stateDep) {
            targetUserId = stateDep.user_id;
            amount = stateDep.amount;
            stateDep.status = 'APPROVED';
            localDeps.unshift(stateDep);
            localStorage.setItem('gw_deposits', JSON.stringify(localDeps));
          }
        }

        if (targetUserId) {
          const usersStr = localStorage.getItem('gw_registered_users');
          if (usersStr) {
            const users: User[] = JSON.parse(usersStr);
            const uIdx = users.findIndex((u) => u.id === targetUserId);
            if (uIdx >= 0) {
              users[uIdx].wallet_balance = (users[uIdx].wallet_balance || 0) + amount;
              users[uIdx].total_deposits = (users[uIdx].total_deposits || 0) + amount;
              localStorage.setItem('gw_registered_users', JSON.stringify(users));
            }
          }
        }

        showToast(`Deposit of RS ${amount.toLocaleString()} approved! Client wallet credited.`);
      }

      fetchAdminData();
      if (clientUser) fetchUserProfile(clientUser.id);
    } catch (err: any) {
      showToast('Error approving deposit: ' + err.message);
    }
  };

  const handleRejectDeposit = async (depositId: string) => {
    try {
      let isSuccess = false;
      try {
        const res = await fetch('/api/admin/reject-deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deposit_id: depositId }),
        });
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          isSuccess = true;
        }
      } catch (e) {
        console.warn('[Reject Deposit Fallback]:', e);
      }

      if (!isSuccess) {
        const localDepsStr = localStorage.getItem('gw_deposits');
        const localDeps: Deposit[] = localDepsStr ? JSON.parse(localDepsStr) : [];
        const depIdx = localDeps.findIndex((d) => d.id === depositId);
        if (depIdx >= 0) {
          localDeps[depIdx].status = 'REJECTED';
          localStorage.setItem('gw_deposits', JSON.stringify(localDeps));
        }
      }

      showToast('Deposit request rejected.');
      fetchAdminData();
    } catch (err: any) {
      showToast('Error rejecting deposit: ' + err.message);
    }
  };

  const handleMarkPaidWithdrawal = async (withdrawalId: string) => {
    try {
      let isSuccess = false;
      try {
        const res = await fetch('/api/admin/mark-paid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ withdrawal_id: withdrawalId }),
        });
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          const data = await res.json();
          showToast(data.message || 'Withdrawal marked as paid!');
          isSuccess = true;
        }
      } catch (e) {
        console.warn('[Mark Paid Fallback]:', e);
      }

      if (!isSuccess) {
        const localWdsStr = localStorage.getItem('gw_withdrawals');
        const localWds: Withdrawal[] = localWdsStr ? JSON.parse(localWdsStr) : [];
        const wdIdx = localWds.findIndex((w) => w.id === withdrawalId);
        let amount = 0;
        if (wdIdx >= 0) {
          localWds[wdIdx].status = 'PAID';
          amount = localWds[wdIdx].amount;
          localStorage.setItem('gw_withdrawals', JSON.stringify(localWds));
        }

        showToast(`Withdrawal payout of RS ${amount.toLocaleString()} marked as paid!`);
      }

      fetchAdminData();
      if (clientUser) fetchUserProfile(clientUser.id);
    } catch (err: any) {
      showToast('Error marking payout: ' + err.message);
    }
  };

  const handleRejectWithdrawal = async (withdrawalId: string) => {
    try {
      let isSuccess = false;
      try {
        const res = await fetch('/api/admin/reject-withdrawal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ withdrawal_id: withdrawalId }),
        });
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          isSuccess = true;
        }
      } catch (e) {
        console.warn('[Reject Withdrawal Fallback]:', e);
      }

      if (!isSuccess) {
        const localWdsStr = localStorage.getItem('gw_withdrawals');
        const localWds: Withdrawal[] = localWdsStr ? JSON.parse(localWdsStr) : [];
        const wdIdx = localWds.findIndex((w) => w.id === withdrawalId);
        let targetUserId = '';
        let amount = 0;

        if (wdIdx >= 0) {
          localWds[wdIdx].status = 'REJECTED';
          targetUserId = localWds[wdIdx].user_id;
          amount = localWds[wdIdx].amount;
          localStorage.setItem('gw_withdrawals', JSON.stringify(localWds));
        }

        if (targetUserId) {
          const usersStr = localStorage.getItem('gw_registered_users');
          if (usersStr) {
            const users: User[] = JSON.parse(usersStr);
            const uIdx = users.findIndex((u) => u.id === targetUserId);
            if (uIdx >= 0) {
              users[uIdx].wallet_balance = (users[uIdx].wallet_balance || 0) + amount;
              localStorage.setItem('gw_registered_users', JSON.stringify(users));
            }
          }
        }
      }

      showToast('Withdrawal request rejected and funds refunded to client wallet.');
      fetchAdminData();
      if (clientUser) fetchUserProfile(clientUser.id);
    } catch (err: any) {
      showToast('Error rejecting withdrawal: ' + err.message);
    }
  };

  const handleSaveOwnerSettings = async (newSettings: OwnerSettings) => {
    try {
      try {
        const res = await fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings),
        });
        if (res.ok) {
          const data = await res.json();
          setOwnerSettings(data.settings);
          localStorage.setItem('gw_owner_settings', JSON.stringify(data.settings));
          showToast('Owner payment destination details updated live!');
          return;
        }
      } catch (e) {
        console.warn('[Save Settings Fallback]:', e);
      }

      setOwnerSettings(newSettings);
      localStorage.setItem('gw_owner_settings', JSON.stringify(newSettings));
      showToast('Owner payment destination details updated live!');
    } catch (err: any) {
      showToast('Error saving settings: ' + err.message);
    }
  };

  // Trigger 5% Daily Interest
  const handleTriggerDailyProfit = async () => {
    setIsTriggeringProfit(true);
    try {
      const res = await fetch('/api/admin/trigger-daily-profit', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || '✨ Daily package yield & Chain Profit credited across client wallets!');
        fetchAdminData();
        if (clientUser) fetchUserProfile(clientUser.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTriggeringProfit(false);
    }
  };

  // Buy Package handler
  const handleBuyPackage = async (pkg: SolarPackage) => {
    if (!clientUser) {
      setAuthMode('login');
      setAuthModalOpen(true);
      return;
    }

    if (clientUser.wallet_balance < pkg.price_rs) {
      setDepositModalOpen(true);
      showToast(`Insufficient funds (RS ${clientUser.wallet_balance.toLocaleString()}). Please submit deposit proof first.`);
      return;
    }

    try {
      let isSuccess = false;
      try {
        const res = await fetch('/api/client/invest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: clientUser.id, package_id: pkg.id }),
        });
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          const data = await res.json();
          showToast(data.message || `Activated ${pkg.name}!`);
          isSuccess = true;
        }
      } catch (e) {
        console.warn('[Invest API Fallback]:', e);
      }

      if (!isSuccess) {
        const usersStr = localStorage.getItem('gw_registered_users');
        if (usersStr) {
          const users: User[] = JSON.parse(usersStr);
          const uIdx = users.findIndex((u) => u.id === clientUser.id);
          if (uIdx >= 0) {
            users[uIdx].wallet_balance -= pkg.price_rs;
            users[uIdx].daily_profit = (users[uIdx].daily_profit || 0) + pkg.daily_return_rs;

            // Direct referral bonus (10%) on investment plan purchase
            if (users[uIdx].referred_by && users[uIdx].referred_by?.trim()) {
              const inviterIdx = users.findIndex(
                (u) => u.referral_code.trim().toUpperCase() === users[uIdx].referred_by?.trim().toUpperCase()
              );
              if (inviterIdx >= 0) {
                const bonus = Math.round(pkg.price_rs * 0.1);
                users[inviterIdx].wallet_balance += bonus;
                users[inviterIdx].total_profit_earned = (users[inviterIdx].total_profit_earned || 0) + bonus;
              }
            }

            localStorage.setItem('gw_registered_users', JSON.stringify(users));
            setClientUser(users[uIdx]);
          }
        }
        showToast(`Activated ${pkg.name}! Daily yield of RS ${pkg.daily_return_rs.toLocaleString()} added.`);
      }

      fetchUserProfile(clientUser.id);
      fetchAdminData();
    } catch (err: any) {
      showToast('Purchase error: ' + err.message);
    }
  };

  const activeUser = activeView === 'admin' ? adminUser : clientUser;

  return (
    <div className="min-h-screen bg-[#F9FAF9] text-slate-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-white border border-emerald-300 text-emerald-950 px-5 py-3.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Top Navigation */}
      <Navbar
        user={activeUser}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {activeView === 'client' ? (
          clientUser ? (
            <ClientDashboard
              user={clientUser}
              solarPackages={solarPackages}
              ownerSettings={ownerSettings}
              referrals={referrals}
              referralEarningsRs={referralEarningsRs}
              userInvestments={userInvestments}
              deposits={allDeposits.filter((d) => d.user_id === clientUser.id)}
              withdrawals={allWithdrawals.filter((w) => w.user_id === clientUser.id)}
              onOpenDeposit={() => setDepositModalOpen(true)}
              onOpenWithdrawal={() => setWithdrawModalOpen(true)}
              onRefreshData={() => {
                fetchUserProfile(clientUser.id);
                fetchAdminData();
              }}
              onBuyPackage={handleBuyPackage}
            />
          ) : (
            <LandingPage
              solarPackages={solarPackages}
              ownerSettings={ownerSettings}
              onOpenAuth={(mode) => {
                setAuthMode(mode);
                setAuthModalOpen(true);
              }}
            />
          )
        ) : adminUser?.role === 'admin' ? (
          <AdminPanel
            pendingDeposits={pendingDeposits}
            allDeposits={allDeposits}
            pendingWithdrawals={pendingWithdrawals}
            allWithdrawals={allWithdrawals}
            ownerSettings={ownerSettings}
            usersList={usersList}
            onApproveDeposit={handleApproveDeposit}
            onRejectDeposit={handleRejectDeposit}
            onMarkPaidWithdrawal={handleMarkPaidWithdrawal}
            onRejectWithdrawal={handleRejectWithdrawal}
            onSaveOwnerSettings={handleSaveOwnerSettings}
            onTriggerDailyProfit={handleTriggerDailyProfit}
            onRefreshData={fetchAdminData}
            isTriggeringProfit={isTriggeringProfit}
          />
        ) : (
          <AdminLoginGate onLoginSuccess={handleUserLoginSuccess} />
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        allowRegister={activeView === 'client'}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleUserLoginSuccess}
      />

      {clientUser && (
        <>
          <DepositModal
            isOpen={depositModalOpen}
            userId={clientUser.id}
            userName={clientUser.full_name}
            ownerSettings={ownerSettings}
            onClose={() => setDepositModalOpen(false)}
            onDepositSubmitted={() => {
              fetchUserProfile(clientUser.id);
              fetchAdminData();
              showToast('Deposit proof submitted to owner admin!');
            }}
          />

          <WithdrawModal
            isOpen={withdrawModalOpen}
            userId={clientUser.id}
            userName={clientUser.full_name || clientUser.username}
            walletBalance={clientUser.wallet_balance}
            onClose={() => setWithdrawModalOpen(false)}
            onWithdrawalSubmitted={() => {
              fetchUserProfile(clientUser.id);
              fetchAdminData();
              showToast('Withdrawal request submitted!');
            }}
          />
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-slate-500 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Sun className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-emerald-900 text-sm">GreenWorld Solar Energy Platform</span>
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            Express Backend Port 3000 • Multer Deposit Proof Uploads • 5% Daily Yield Calculation • Pakistan (+92) Format
          </p>

          <div className="flex items-center gap-4 text-[11px] font-medium">
            <button onClick={() => setActiveView('client')} className="hover:text-emerald-700 text-emerald-800">
              Client Portal
            </button>
            <span>•</span>
            <button onClick={() => setActiveView('admin')} className="hover:text-amber-700 text-amber-800">
              Owner Admin Panel
            </button>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Customer Support Button */}
      <WhatsAppButton whatsappNumber={ownerSettings.whatsapp_number} />
    </div>
  );
}
