import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import { supabase } from './src/lib/supabase';

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Rate Limiter middleware (Prevents brute-force attempts on auth routes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts per 15 minutes
  message: { error: 'Too many attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

// Body parsing middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer Storage Setup for Screenshot Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.png';
    cb(null, 'deposit-proof-' + uniqueSuffix + ext);
  },
});
const upload = multer({ storage });

// In-Memory Data Models
export interface UserRecord {
  id: string;
  full_name: string;
  username: string;
  password: string;
  phone: string;
  referral_code: string;
  referred_by?: string;
  wallet_balance: number;
  total_deposits: number;
  total_withdrawals: number;
  daily_profit: number;
  total_profit_earned: number;
  first_investment_bonus_paid?: boolean;
  role: 'client' | 'admin';
  created_at: string;
}

export interface DepositRecord {
  id: string;
  user_id: string;
  username: string;
  phone: string;
  amount: number;
  payment_method: string;
  screenshot_url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  approved_at?: string;
}

export interface WithdrawalRecord {
  id: string;
  user_id: string;
  username: string;
  phone: string;
  amount: number;
  bank_name: string;
  account_holder: string;
  account_number: string;
  status: 'PENDING' | 'PAID' | 'REJECTED';
  created_at: string;
  processed_at?: string;
}

export interface OwnerSettingsRecord {
  bank_name: string;
  account_title: string;
  iban_account: string;
  easypaisa_number: string;
  easypaisa_name: string;
  jazzcash_number: string;
  jazzcash_name: string;
  deposit_instructions: string;
  whatsapp_number: string;
}

export interface SolarPackageRecord {
  id: string;
  name: string;
  price_rs: number;
  daily_return_percent: number;
  daily_return_rs: number;
  validity_days: number;
  capacity_kw: string;
  tag?: string;
  popular?: boolean;
}

export interface InvestmentRecord {
  id: string;
  user_id: string;
  package_id: string;
  package_name: string;
  amount_rs: number;
  daily_return_rs: number;
  purchased_at: string;
}

// In-Memory Database Stores
let users: UserRecord[] = [];
let deposits: DepositRecord[] = [];
let withdrawals: WithdrawalRecord[] = [];
let investments: InvestmentRecord[] = [];

let ownerSettings: OwnerSettingsRecord = {
  bank_name: 'Meezan Bank Limited',
  account_title: 'GreenWorld Solar Energy Pvt Ltd',
  iban_account: 'PK36MEZN00010982347101',
  easypaisa_number: '0300-8829102',
  easypaisa_name: 'GreenWorld EasyPaisa Business',
  jazzcash_number: '0301-9982310',
  jazzcash_name: 'GreenWorld JazzCash Official',
  deposit_instructions: 'Please send exact amount in RS to official payment destination.',
  whatsapp_number: '+923008829102',
};

// Persistent File Store Configuration (/data/db.json)
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function saveDatabase() {
  try {
    ensureDataDir();
    const data = {
      users,
      deposits,
      withdrawals,
      investments,
      ownerSettings,
      updated_at: new Date().toISOString(),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB SAVE ERROR]', err);
  }
}

function loadDatabase(): boolean {
  try {
    ensureDataDir();
    if (fs.existsSync(DB_FILE)) {
      const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(fileContent);
      if (Array.isArray(data.users) && data.users.length > 0) {
        users = data.users;
      }
      if (Array.isArray(data.deposits)) {
        deposits = data.deposits;
      }
      if (Array.isArray(data.withdrawals)) {
        withdrawals = data.withdrawals;
      }
      if (Array.isArray(data.investments)) {
        investments = data.investments;
      }
      if (data.ownerSettings) {
        ownerSettings = { ...ownerSettings, ...data.ownerSettings };
      }
      console.log(`[PERSISTENT DB LOADED] Restored ${users.length} clients, ${deposits.length} deposits, ${withdrawals.length} withdrawals from /data/db.json`);
      return true;
    }
  } catch (err) {
    console.error('[DB LOAD ERROR]', err);
  }
  return false;
}

// Sync user record to Supabase
async function syncUserToSupabase(user: UserRecord) {
  try {
    const payload: any = {
      id: user.id,
      full_name: user.full_name,
      username: user.username,
      password: user.password,
      phone: user.phone,
      referral_code: user.referral_code,
      referred_by: user.referred_by || null,
      wallet_balance: user.wallet_balance || 0,
      total_deposits: user.total_deposits || 0,
      total_withdrawals: user.total_withdrawals || 0,
      daily_profit: user.daily_profit || 0,
      total_profit_earned: user.total_profit_earned || 0,
      role: user.role || 'client',
      created_at: user.created_at || new Date().toISOString(),
    };

    const { error } = await supabase.from('users').upsert([payload], { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase Upsert Warning]:', error.message);
      // Attempt fallback minimal insert if schema missing some optional columns
      const fallbackPayload = {
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        phone: user.phone,
      };
      const { error: fallbackErr } = await supabase.from('users').upsert([fallbackPayload], { onConflict: 'id' });
      if (fallbackErr) {
        console.warn('[Supabase Fallback Upsert Failed]:', fallbackErr.message);
      } else {
        console.log(`[Supabase Sync] User ${user.username} synced via fallback.`);
      }
    } else {
      console.log(`[Supabase Sync] User ${user.username} (${user.id}) successfully synced to Supabase.`);
    }
  } catch (err: any) {
    console.warn('[Supabase Sync Exception]:', err?.message);
  }
}

// Helper to robustly find an inviter for any user by referral_code, username, or ID
function findInviter(referredByStr?: string): UserRecord | undefined {
  if (!referredByStr || !referredByStr.trim()) return undefined;
  const clean = referredByStr.trim().toUpperCase();
  return users.find(
    (u) =>
      (u.referral_code && u.referral_code.trim().toUpperCase() === clean) ||
      (u.username && u.username.trim().toUpperCase() === clean) ||
      (u.id && u.id.trim().toUpperCase() === clean)
  );
}

// Synchronize and load users directly from Supabase Cloud Database
async function syncFromSupabase() {
  try {
    const { data: sbUsers, error } = await supabase.from('users').select('*');
    if (error) {
      console.warn('[Supabase Sync From Error]:', error.message);
      return;
    }

    if (Array.isArray(sbUsers) && sbUsers.length > 0) {
      let realClientsAdded = 0;
      for (const sbUser of sbUsers) {
        const existingIndex = users.findIndex(
          (u) => u.id === sbUser.id || u.username.toLowerCase() === (sbUser.username || '').toLowerCase()
        );

        if (existingIndex >= 0) {
          // Update existing user with Supabase state while keeping local password if missing in SB
          users[existingIndex] = {
            ...users[existingIndex],
            full_name: sbUser.full_name || users[existingIndex].full_name,
            username: sbUser.username || users[existingIndex].username,
            password: sbUser.password || users[existingIndex].password || 'Client1234.',
            phone: sbUser.phone || users[existingIndex].phone,
            wallet_balance: typeof sbUser.wallet_balance === 'number' ? sbUser.wallet_balance : users[existingIndex].wallet_balance,
            total_deposits: typeof sbUser.total_deposits === 'number' ? sbUser.total_deposits : users[existingIndex].total_deposits,
            total_withdrawals: typeof sbUser.total_withdrawals === 'number' ? sbUser.total_withdrawals : users[existingIndex].total_withdrawals,
            daily_profit: typeof sbUser.daily_profit === 'number' ? sbUser.daily_profit : users[existingIndex].daily_profit,
            total_profit_earned: typeof sbUser.total_profit_earned === 'number' ? sbUser.total_profit_earned : users[existingIndex].total_profit_earned,
            role: sbUser.role || users[existingIndex].role || 'client',
            referral_code: sbUser.referral_code || users[existingIndex].referral_code,
            referred_by: sbUser.referred_by || users[existingIndex].referred_by,
            created_at: sbUser.created_at || users[existingIndex].created_at,
          };
        } else {
          // Add brand new user from Supabase
          const newUser: UserRecord = {
            id: sbUser.id || 'user-' + Date.now() + Math.random().toString(36).substr(2, 4),
            full_name: sbUser.full_name || sbUser.username || 'Client User',
            username: (sbUser.username || 'user' + Date.now()).toLowerCase(),
            password: sbUser.password || 'Client1234.',
            phone: sbUser.phone || '',
            referral_code: sbUser.referral_code || generateReferralCode(),
            referred_by: sbUser.referred_by || undefined,
            wallet_balance: sbUser.wallet_balance || 0,
            total_deposits: sbUser.total_deposits || 0,
            total_withdrawals: sbUser.total_withdrawals || 0,
            daily_profit: sbUser.daily_profit || 0,
            total_profit_earned: sbUser.total_profit_earned || 0,
            role: sbUser.role || 'client',
            created_at: sbUser.created_at || new Date().toISOString(),
          };
          users.push(newUser);
          realClientsAdded++;
        }
      }

      // Filter out dummy seeded accounts if real Supabase clients exist
      const hasRealClients = users.some((u) => u.role === 'client' && !['user-1', 'user-2', 'user-3'].includes(u.id));
      if (hasRealClients) {
        users = users.filter((u) => !['user-1', 'user-2', 'user-3'].includes(u.id));
      }

      saveDatabase();
      console.log(`[Supabase Live Sync] Successfully synced ${sbUsers.length} records from Supabase (${realClientsAdded} new clients loaded).`);
    }
  } catch (err: any) {
    console.warn('[Supabase Sync From Catch]:', err?.message);
  }
}

const solarPackages: SolarPackageRecord[] = [
  {
    id: 'pkg-1',
    name: 'Eco Mini Solar 100W',
    price_rs: 1000,
    daily_return_percent: 3,
    daily_return_rs: 30,
    validity_days: 15,
    capacity_kw: '0.1 kW',
    tag: 'Starter Tier',
  },
  {
    id: 'pkg-2',
    name: 'Home Solar Kit 250W',
    price_rs: 2500,
    daily_return_percent: 4,
    daily_return_rs: 100,
    validity_days: 15,
    capacity_kw: '0.25 kW',
    tag: 'Basic Tier',
  },
  {
    id: 'pkg-3',
    name: 'Rooftop Solar Array 500W',
    price_rs: 5000,
    daily_return_percent: 5,
    daily_return_rs: 250,
    validity_days: 15,
    capacity_kw: '0.5 kW',
    popular: true,
    tag: 'Most Popular',
  },
  {
    id: 'pkg-4',
    name: 'Commercial Solar Kit 1kW',
    price_rs: 10000,
    daily_return_percent: 6,
    daily_return_rs: 600,
    validity_days: 15,
    capacity_kw: '1.0 kW',
    tag: 'Pro Growth',
  },
  {
    id: 'pkg-5',
    name: 'Enterprise Solar Array 2.5kW',
    price_rs: 25000,
    daily_return_percent: 7,
    daily_return_rs: 1750,
    validity_days: 15,
    capacity_kw: '2.5 kW',
    tag: 'High Yield',
  },
  {
    id: 'pkg-6',
    name: 'Industrial Mega Solar Grid 5kW',
    price_rs: 50000,
    daily_return_percent: 8,
    daily_return_rs: 4000,
    validity_days: 15,
    capacity_kw: '5.0 kW',
    tag: 'VIP Power Plant',
  },
];

// Helper: Generate Referral Code (Exactly 6 letters/characters, e.g. GW8921)
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'GW';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Format phone number to +92 format
function formatPhone(phoneStr: string): string {
  let cleaned = phoneStr.trim().replace(/\D/g, '');
  if (cleaned.startsWith('92')) {
    return '+' + cleaned;
  }
  if (cleaned.startsWith('0')) {
    return '+92' + cleaned.substring(1);
  }
  if (!phoneStr.startsWith('+')) {
    return '+92' + cleaned;
  }
  return phoneStr;
}

// SVG/Canvas generated default receipt image for mock deposits
function generateMockReceiptSvgUrl(amount: number, user: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
    <rect width="400" height="500" fill="#0f172a" rx="16"/>
    <rect x="20" y="20" width="360" height="460" fill="#1e293b" rx="12" stroke="#22c55e" stroke-width="2"/>
    <circle cx="200" cy="80" r="30" fill="#15803d"/>
    <path d="M190 80 l7 7 l15 -15" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round"/>
    <text x="200" y="140" font-family="sans-serif" font-size="20" font-weight="bold" fill="#22c55e" text-anchor="middle">PAYMENT SUCCESSFUL</text>
    <text x="200" y="165" font-family="sans-serif" font-size="12" fill="#94a3b8" text-anchor="middle">GreenWorld Solar Deposit Proof</text>
    <line x1="40" y1="190" x2="360" y2="190" stroke="#334155" stroke-width="1"/>
    <text x="50" y="220" font-family="sans-serif" font-size="13" fill="#94a3b8">Amount Transferred:</text>
    <text x="350" y="220" font-family="sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="end">RS ${amount.toLocaleString()}</text>
    <text x="50" y="260" font-family="sans-serif" font-size="13" fill="#94a3b8">Account Title:</text>
    <text x="350" y="260" font-family="sans-serif" font-size="13" fill="#e2e8f0" text-anchor="end">${user}</text>
    <text x="50" y="300" font-family="sans-serif" font-size="13" fill="#94a3b8">Destination Bank:</text>
    <text x="350" y="300" font-family="sans-serif" font-size="13" fill="#e2e8f0" text-anchor="end">Meezan Bank Ltd</text>
    <text x="50" y="340" font-family="sans-serif" font-size="13" fill="#94a3b8">Transaction ID (TRX):</text>
    <text x="350" y="340" font-family="sans-serif" font-size="13" font-weight="bold" fill="#38bdf8" text-anchor="end">TRX-${Math.floor(10000000 + Math.random() * 90000000)}</text>
    <text x="50" y="380" font-family="sans-serif" font-size="13" fill="#94a3b8">Date &amp; Time:</text>
    <text x="350" y="380" font-family="sans-serif" font-size="12" fill="#cbd5e1" text-anchor="end">${new Date().toLocaleString()}</text>
    <rect x="40" y="410" width="320" height="40" fill="#0f172a" rx="8"/>
    <text x="200" y="435" font-family="sans-serif" font-size="12" fill="#22c55e" text-anchor="middle">Verified Digital Payment Voucher</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// Seed Initial Mock Database
function seedDatabase() {
  if (users.length > 0) return;

  // Admin User
  const adminUser: UserRecord = {
    id: 'user-admin',
    full_name: 'GreenWorld Owner',
    username: 'greenworld2026',
    password: 'Satkartar1.',
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

  // Seed Client Users
  const client1: UserRecord = {
    id: 'user-1',
    full_name: 'Muhammad Ali Khan',
    username: 'ali_solar',
    password: 'user123',
    phone: '+923001234567',
    referral_code: 'GW8921',
    wallet_balance: 18500,
    total_deposits: 20000,
    total_withdrawals: 3000,
    daily_profit: 925,
    total_profit_earned: 4500,
    role: 'client',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  };

  const client2: UserRecord = {
    id: 'user-2',
    full_name: 'Sara Ahmed',
    username: 'sara_green',
    password: 'user123',
    phone: '+923129876543',
    referral_code: 'GW3310',
    referred_by: 'GW8921',
    wallet_balance: 6200,
    total_deposits: 5000,
    total_withdrawals: 0,
    daily_profit: 310,
    total_profit_earned: 1200,
    role: 'client',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  };

  const client3: UserRecord = {
    id: 'user-3',
    full_name: 'Zayan Malik',
    username: 'zayan_pk',
    password: 'user123',
    phone: '+923334567890',
    referral_code: 'GW7729',
    referred_by: 'GW8921',
    wallet_balance: 0,
    total_deposits: 0,
    total_withdrawals: 0,
    daily_profit: 0,
    total_profit_earned: 0,
    role: 'client',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  };

  users.push(adminUser, client1, client2, client3);

  // Seed Pending Deposit for Admin review
  deposits.push({
    id: 'dep-101',
    user_id: client3.id,
    username: client3.username,
    phone: client3.phone,
    amount: 15000,
    payment_method: 'EasyPaisa',
    screenshot_url: generateMockReceiptSvgUrl(15000, client3.full_name),
    status: 'PENDING',
    created_at: new Date().toISOString(),
  });

  deposits.push({
    id: 'dep-100',
    user_id: client1.id,
    username: client1.username,
    phone: client1.phone,
    amount: 20000,
    payment_method: 'Bank Transfer (Meezan)',
    screenshot_url: generateMockReceiptSvgUrl(20000, client1.full_name),
    status: 'APPROVED',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    approved_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  });

  // Seed Pending Withdrawal for Admin review
  withdrawals.push({
    id: 'wd-201',
    user_id: client1.id,
    username: client1.username,
    phone: client1.phone,
    amount: 3500,
    bank_name: 'Meezan Bank Limited',
    account_holder: 'Muhammad Ali Khan',
    account_number: 'PK36MEZN00098234102931',
    status: 'PENDING',
    created_at: new Date().toISOString(),
  });

  // Seed Active Investment
  investments.push({
    id: 'inv-1',
    user_id: client1.id,
    package_id: 'pkg-2',
    package_name: 'Rooftop Solar Array 500W',
    amount_rs: 5000,
    daily_return_rs: 250,
    purchased_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  });
}

function initDatabase() {
  const loaded = loadDatabase();
  if (!loaded || users.length === 0) {
    seedDatabase();
    saveDatabase();
  }
  // Sync live client records directly from Supabase Cloud on boot
  syncFromSupabase().catch((err) => console.warn('[Supabase Initial Sync Error]', err));
}

initDatabase();

// Helper to check and automatically return invested capital to client wallet after 15 days
function checkAndReturnExpiredInvestments() {
  const now = Date.now();
  const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;

  investments = investments.filter((inv) => {
    const startMs = new Date(inv.purchased_at).getTime();
    if (now - startMs >= FIFTEEN_DAYS_MS) {
      const user = users.find((u) => u.id === inv.user_id);
      if (user) {
        user.wallet_balance += inv.amount_rs;
        console.log(
          `[AUTO RETURN] 15 days completed for ${inv.package_name}. Returned principal amount RS ${inv.amount_rs} to ${user.username}'s wallet.`
        );
      }
      return false; // remove matured investment
    }
    return true; // keep active
  });
}

// Daily Midnight Background Cron Job (Adds Dynamic Package Daily Profit & Chain Referral Profit)
function processDailyReturns() {
  checkAndReturnExpiredInvestments();
  console.log('[CRON] Running Midnight Dynamic Package Yield + Chain Profit Calculation...');
  let totalDistributed = 0;
  let packageYieldCount = 0;
  let chainBonusCount = 0;

  // 1. Process client individual active package yields (3% to 8% per package daily return)
  users.forEach((u) => {
    if (u.role === 'client') {
      const userInvs = investments.filter((inv) => inv.user_id === u.id);
      const totalPackageYield = userInvs.reduce((sum, inv) => sum + inv.daily_return_rs, 0);

      // If client has active package investments, credit exact daily return sum of their active packages
      // If no active packages but positive wallet balance, credit 3% of balance
      const profitToCredit = totalPackageYield > 0
        ? totalPackageYield
        : (u.wallet_balance > 0 ? Math.round(u.wallet_balance * 0.03) : 0);

      if (profitToCredit > 0) {
        u.wallet_balance += profitToCredit;
        u.daily_profit += profitToCredit;
        u.total_profit_earned = (u.total_profit_earned || 0) + profitToCredit;
        totalDistributed += profitToCredit;
        packageYieldCount++;
        syncUserToSupabase(u).catch(() => {});
      }
    }
  });

  // 2. Process 2-Tier Chain Profit System for Referrers
  // Level 1: Referrer gets 3% of direct downline clients' active invested amounts (or wallet balance/deposits)
  // Level 2: Referrer gets 1.5% of Level 2 downline clients' active invested amounts (or wallet balance/deposits)
  // Level 3 is removed completely as requested.
  users.forEach((referrer) => {
    if (referrer.role === 'client' || referrer.role === 'admin') {
      let referrerChainBonus = 0;

      // Level 1 Direct Referrals (3% of active invested amount)
      const l1Users = users.filter((u) => {
        const inv = findInviter(u.referred_by);
        return inv && inv.id === referrer.id;
      });

      l1Users.forEach((l1) => {
        const l1Invs = investments.filter((i) => i.user_id === l1.id);
        const l1InvestedAmount = l1Invs.reduce((sum, i) => sum + i.amount_rs, 0);
        const l1Base = l1InvestedAmount > 0 ? l1InvestedAmount : (l1.wallet_balance > 0 ? l1.wallet_balance : l1.total_deposits);
        if (l1Base > 0) {
          referrerChainBonus += Math.round(l1Base * 0.03); // 3% Level 1 Chain Bonus
        }

        // Level 2 Indirect Referrals (1.5% of active invested amount)
        const l2Users = users.filter((u) => {
          const inv = findInviter(u.referred_by);
          return inv && inv.id === l1.id;
        });

        l2Users.forEach((l2) => {
          const l2Invs = investments.filter((i) => i.user_id === l2.id);
          const l2InvestedAmount = l2Invs.reduce((sum, i) => sum + i.amount_rs, 0);
          const l2Base = l2InvestedAmount > 0 ? l2InvestedAmount : (l2.wallet_balance > 0 ? l2.wallet_balance : l2.total_deposits);
          if (l2Base > 0) {
            referrerChainBonus += Math.round(l2Base * 0.015); // 1.5% Level 2 Chain Bonus
          }
        });
      });

      if (referrerChainBonus > 0) {
        referrer.wallet_balance += referrerChainBonus;
        referrer.daily_profit += referrerChainBonus;
        referrer.total_profit_earned = (referrer.total_profit_earned || 0) + referrerChainBonus;
        totalDistributed += referrerChainBonus;
        chainBonusCount++;
        syncUserToSupabase(referrer).catch(() => {});
        console.log(`[2-LEVEL CHAIN PROFIT] Referrer ${referrer.username} credited RS ${referrerChainBonus} from 2-tier downline network.`);
      }
    }
  });

  saveDatabase();
  console.log(`[DAILY YIELD CRON] Total RS ${totalDistributed} credited across ${packageYieldCount} active investments & ${chainBonusCount} referrer chain bonuses.`);
  return { totalDistributed, packageYieldCount, chainBonusCount };
}

// Calculate milliseconds until next midnight
function msUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

// Schedule midnight cron and repeat every 24 hours
setTimeout(() => {
  processDailyReturns();
  setInterval(processDailyReturns, 24 * 60 * 60 * 1000);
}, msUntilMidnight());

/* ==========================================================================
   REST API ENDPOINTS
   ========================================================================== */

// SECURITY STEP: Rate Limiter (Prevents brute-forcing logins)
// SIGNUP ROUTE: Saves user directly to Supabase Cloud
app.post('/api/signup', limiter, async (req, res) => {
  const { name, email, full_name, username, password, phone } = req.body;
  const userNameValue = name || full_name || username || 'Anonymous User';
  const userEmailValue = email || `${username || 'user' + Date.now()}@greenworld.app`;

  try {
    const { data, error } = await supabase
      .from('users')
      .insert([{ name: userNameValue, email: userEmailValue }]);

    if (error && process.env.SUPABASE_URL) {
      console.warn('[Supabase signup error]:', error.message);
    }
  } catch (err: any) {
    console.warn('[Supabase signup catch]:', err?.message);
  }

  res.json({ message: 'User created successfully!', user: { name: userNameValue, email: userEmailValue } });
});

// FETCH USERS ROUTE
app.get('/api/users', async (req, res) => {
  try {
    await syncFromSupabase();
    const clientUsers = users.filter((u) => u.role === 'client');
    return res.json(clientUsers);
  } catch (err: any) {
    const clientUsers = users.filter((u) => u.role === 'client');
    return res.json(clientUsers);
  }
});

// 1. Client Registration
app.post('/api/client/register', limiter, async (req, res) => {
  const { full_name, username, password, phone, referral_code } = req.body;

  if (!full_name || !username || !password || !phone) {
    return res.status(400).json({ error: 'All fields (Full Name, Username, Password, Phone) are required.' });
  }

  const existingUser = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: 'Username already registered. Please login or choose another.' });
  }

  const formattedPhone = formatPhone(phone);
  const newRefCode = generateReferralCode();

  // Validate referral inviter if supplied
  let inviterCode: string | undefined = undefined;
  if (referral_code && referral_code.trim()) {
    const inviter = findInviter(referral_code);
    if (inviter) {
      inviterCode = inviter.referral_code;
    } else {
      inviterCode = referral_code.trim().toUpperCase();
    }
  }

  const newUser: UserRecord = {
    id: 'user-' + Date.now(),
    full_name: full_name.trim(),
    username: username.trim().toLowerCase(),
    password,
    phone: formattedPhone,
    referral_code: newRefCode,
    referred_by: inviterCode,
    wallet_balance: 0,
    total_deposits: 0,
    total_withdrawals: 0,
    daily_profit: 0,
    total_profit_earned: 0,
    role: 'client',
    created_at: new Date().toISOString(),
  };

  users.push(newUser);

  // Save to persistent db.json file store
  saveDatabase();

  // Sync to Supabase table asynchronously in background
  syncUserToSupabase(newUser).catch(() => {});

  res.json({
    message: 'Registration successful! Welcome to GreenWorld Solar.',
    user: newUser,
    token: 'jwt-token-' + newUser.id,
  });
});

// 2. Client & Admin Login
app.post('/api/client/login', limiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const cleanPassword = password.trim();
  const digitsOnly = username.replace(/[^\d]/g, '');

  // 1. Direct match in users store (by username or phone)
  let user = users.find(
    (u) =>
      (u.username.toLowerCase() === cleanUsername ||
        u.phone === username.trim() ||
        (digitsOnly && u.phone.replace(/[^\d]/g, '') === digitsOnly)) &&
      (u.password === password || u.password.trim() === cleanPassword)
  );

  // If user found is admin, strictly require password to be 'Satkartar1.'
  if (user && user.role === 'admin') {
    if (password !== 'Satkartar1.' && cleanPassword !== 'Satkartar1.') {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
  }

  // 2. Admin Login Check (strictly requires password 'Satkartar1.')
  if (!user && (cleanUsername === 'admin' || cleanUsername === 'greenworld2026' || cleanUsername === 'owner')) {
    if (password === 'Satkartar1.' || cleanPassword === 'Satkartar1.') {
      user = users.find((u) => u.role === 'admin' || u.id === 'user-admin');
      if (!user) {
        user = {
          id: 'user-admin',
          full_name: 'GreenWorld Owner',
          username: cleanUsername,
          password: 'Satkartar1.',
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
        users.unshift(user);
        saveDatabase();
      } else {
        user.role = 'admin'; // ensure admin role is assigned
        user.password = 'Satkartar1.'; // update to new password
        saveDatabase();
      }
    }
  }

  // 3. Fallback: Query Supabase database if not found in memory
  if (!user) {
    try {
      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .or(`username.ilike.${cleanUsername},phone.eq.${username.trim()}`)
        .maybeSingle();

      if (dbUser && (dbUser.password === password || dbUser.password?.trim() === cleanPassword)) {
        user = dbUser as UserRecord;
        const existsInMem = users.findIndex((u) => u.id === user!.id);
        if (existsInMem >= 0) {
          users[existsInMem] = user;
        } else {
          users.push(user);
        }
        saveDatabase();
      }
    } catch (dbErr) {
      console.warn('[Login DB Fallback Error]:', dbErr);
    }
  }

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  // Sync user record to Supabase in background
  syncUserToSupabase(user).catch(() => {});

  res.json({
    user,
    token: 'jwt-token-' + user.id,
  });
});

// 3. Get User Profile & Referral Data
app.get('/api/client/profile/:userId', async (req, res) => {
  checkAndReturnExpiredInvestments();
  const { userId } = req.params;
  let user = users.find((u) => u.id === userId);

  if (!user) {
    await syncFromSupabase();
    user = users.find((u) => u.id === userId);
  }

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  // Find Level 1 Direct Referrals
  const l1Members = users.filter((u) => {
    const inv = findInviter(u.referred_by);
    return inv && inv.id === user.id;
  });

  // Find Level 2 Indirect Referrals
  const l2Members: UserRecord[] = [];
  l1Members.forEach((l1) => {
    const l2s = users.filter((u) => {
      const inv = findInviter(u.referred_by);
      return inv && inv.id === l1.id;
    });
    l2Members.push(...l2s);
  });

  const referralList = [
    ...l1Members.map((r) => {
      const rInvs = investments.filter((i) => i.user_id === r.id);
      const totalInvAmount = rInvs.reduce((sum, inv) => sum + inv.amount_rs, 0);
      const base = totalInvAmount > 0 ? totalInvAmount : (r.wallet_balance > 0 ? r.wallet_balance : r.total_deposits);
      const commission = Math.round(base * 0.10);
      return {
        id: r.id,
        referred_username: r.username,
        referred_phone: r.phone,
        joined_at: r.created_at,
        total_deposits: r.total_deposits || 0,
        commission_earned_rs: commission,
        level: 1,
        status: rInvs.length > 0 || r.wallet_balance > 0 ? ('Active' as const) : ('Pending' as const),
      };
    }),
    ...l2Members.map((r) => {
      const rInvs = investments.filter((i) => i.user_id === r.id);
      const totalInvAmount = rInvs.reduce((sum, inv) => sum + inv.amount_rs, 0);
      const base = totalInvAmount > 0 ? totalInvAmount : (r.wallet_balance > 0 ? r.wallet_balance : r.total_deposits);
      const commission = Math.round(base * 0.05);
      return {
        id: r.id,
        referred_username: r.username,
        referred_phone: r.phone,
        joined_at: r.created_at,
        total_deposits: r.total_deposits || 0,
        commission_earned_rs: commission,
        level: 2,
        status: rInvs.length > 0 || r.wallet_balance > 0 ? ('Active' as const) : ('Pending' as const),
      };
    }),
  ];

  const totalReferralEarnings = referralList.reduce((sum, r) => sum + r.commission_earned_rs, 0);

  // User investments
  const userInvestments = investments.filter((i) => i.user_id === user.id);

  res.json({
    user,
    referrals: referralList,
    referral_earnings_rs: totalReferralEarnings,
    investments: userInvestments,
  });
});

// 4. Submit Deposit (with Screenshot Upload)
app.post('/api/client/deposit', (req, res, next) => {
  upload.single('screenshot')(req, res, (err) => {
    if (err) {
      console.error('[MULTER ERROR]', err);
      return res.status(400).json({ error: 'File upload error: ' + (err.message || 'Failed to process screenshot image') });
    }
    next();
  });
}, (req, res) => {
  try {
    const { user_id, amount, payment_method } = req.body || {};

    if (!user_id || !amount) {
      return res.status(400).json({ error: 'User ID and Deposit Amount in RS are required.' });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 500) {
      return res.status(400).json({ error: 'Minimum deposit amount is RS 500.' });
    }

    const user = users.find((u) => u.id === user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let screenshot_url = '';
    if (req.file) {
      screenshot_url = '/uploads/' + req.file.filename;
    } else if (req.body && req.body.screenshot_data_url) {
      screenshot_url = req.body.screenshot_data_url;
    } else {
      screenshot_url = generateMockReceiptSvgUrl(numericAmount, user.full_name);
    }

    const newDeposit: DepositRecord = {
      id: 'dep-' + Date.now(),
      user_id: user.id,
      username: user.username,
      phone: user.phone,
      amount: numericAmount,
      payment_method: payment_method || 'Bank Transfer',
      screenshot_url,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    deposits.push(newDeposit);
    saveDatabase();

    return res.json({
      message: 'Deposit proof submitted successfully! Awaiting owner admin approval.',
      deposit: newDeposit,
    });
  } catch (err: any) {
    console.error('[DEPOSIT ERROR]', err);
    return res.status(500).json({ error: err.message || 'Server error during deposit processing' });
  }
});

// 5. Submit Withdrawal Request
app.post('/api/client/withdraw', (req, res) => {
  const { user_id, amount, bank_name, account_holder, account_number } = req.body;

  if (!user_id || !amount || !bank_name || !account_holder || !account_number) {
    return res.status(400).json({
      error: 'All fields (Amount RS, Bank Name, Account Holder Name, Account/IBAN Number) are required.',
    });
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount < 500) {
    return res.status(400).json({ error: 'Minimum withdrawal request is RS 500.' });
  }

  const user = users.find((u) => u.id === user_id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (user.wallet_balance < numericAmount) {
    return res.status(400).json({
      error: `Insufficient wallet balance. Available balance is RS ${user.wallet_balance.toLocaleString()}.`,
    });
  }

  // Deduct temporarily or mark as pending
  const newWithdrawal: WithdrawalRecord = {
    id: 'wd-' + Date.now(),
    user_id: user.id,
    username: user.username,
    phone: user.phone,
    amount: numericAmount,
    bank_name: bank_name.trim(),
    account_holder: account_holder.trim(),
    account_number: account_number.trim(),
    status: 'PENDING',
    created_at: new Date().toISOString(),
  };

  withdrawals.push(newWithdrawal);
  saveDatabase();

  res.json({
    message: 'Withdrawal request submitted! Payout will be sent to your bank/account upon admin verification.',
    withdrawal: newWithdrawal,
  });
});

// 6. Buy Solar Panel Package
app.post('/api/client/invest', (req, res) => {
  const { user_id, package_id } = req.body;
  const user = users.find((u) => u.id === user_id);
  const pkg = solarPackages.find((p) => p.id === package_id);

  if (!user || !pkg) {
    return res.status(400).json({ error: 'Invalid user or solar package selected.' });
  }

  if (user.wallet_balance < pkg.price_rs) {
    return res.status(400).json({
      error: `Insufficient wallet balance (RS ${user.wallet_balance.toLocaleString()}). Required: RS ${pkg.price_rs.toLocaleString()}. Please deposit funds first.`,
    });
  }

  user.wallet_balance -= pkg.price_rs;

  // Credit referral commission to Level 1 (10%) and Level 2 (5%) inviters when a user buys an investment plan
  const l1Inviter = findInviter(user.referred_by);
  if (l1Inviter) {
    const l1Bonus = Math.round(pkg.price_rs * 0.10); // 10% for Level 1
    l1Inviter.wallet_balance += l1Bonus;
    l1Inviter.total_profit_earned = (l1Inviter.total_profit_earned || 0) + l1Bonus;
    user.first_investment_bonus_paid = true;
    syncUserToSupabase(l1Inviter).catch(() => {});
    console.log(`[LEVEL 1 BONUS] Inviter ${l1Inviter.username} credited 10% (RS ${l1Bonus}) for ${user.username}'s plan purchase (${pkg.name}).`);

    const l2Inviter = findInviter(l1Inviter.referred_by);
    if (l2Inviter) {
      const l2Bonus = Math.round(pkg.price_rs * 0.05); // 5% for Level 2
      l2Inviter.wallet_balance += l2Bonus;
      l2Inviter.total_profit_earned = (l2Inviter.total_profit_earned || 0) + l2Bonus;
      syncUserToSupabase(l2Inviter).catch(() => {});
      console.log(`[LEVEL 2 BONUS] Level 2 Inviter ${l2Inviter.username} credited 5% (RS ${l2Bonus}) for ${user.username}'s plan purchase (${pkg.name}).`);
    }
  }

  const newInv: InvestmentRecord = {
    id: 'inv-' + Date.now(),
    user_id: user.id,
    package_id: pkg.id,
    package_name: pkg.name,
    amount_rs: pkg.price_rs,
    daily_return_rs: pkg.daily_return_rs,
    purchased_at: new Date().toISOString(),
  };

  investments.push(newInv);
  saveDatabase();
  syncUserToSupabase(user);

  res.json({
    message: `Successfully purchased ${pkg.name}! Daily profit of RS ${pkg.daily_return_rs} activated.`,
    user,
    investment: newInv,
  });
});

// 7. Get Available Solar Packages & Public Settings
app.get('/api/public/packages', (req, res) => {
  res.json({ packages: solarPackages, settings: ownerSettings });
});

/* ==========================================================================
   ADMIN PANEL APIs
   ========================================================================== */

// Admin List Deposits
app.get('/api/admin/deposits', (req, res) => {
  const pending = deposits.filter((d) => d.status === 'PENDING');
  res.json({ pendingDeposits: pending, allDeposits: deposits });
});

// Admin Approve Deposit (Automatically credits user's wallet_balance in RS + triggers referral commission)
app.post('/api/admin/approve-deposit', (req, res) => {
  const { deposit_id } = req.body;
  const deposit = deposits.find((d) => d.id === deposit_id);

  if (!deposit) {
    return res.status(404).json({ error: 'Deposit record not found.' });
  }

  if (deposit.status === 'APPROVED') {
    return res.status(400).json({ error: 'Deposit is already approved.' });
  }

  deposit.status = 'APPROVED';
  deposit.approved_at = new Date().toISOString();

  // Credit user's wallet balance
  const user = users.find((u) => u.id === deposit.user_id);
  if (user) {
    user.wallet_balance += deposit.amount;
    user.total_deposits += deposit.amount;
    syncUserToSupabase(user);
  }

  saveDatabase();

  res.json({
    message: `Deposit of RS ${deposit.amount.toLocaleString()} APPROVED and credited to ${deposit.username}'s wallet!`,
    deposit,
    user,
  });
});

// Admin Reject Deposit
app.post('/api/admin/reject-deposit', (req, res) => {
  const { deposit_id } = req.body;
  const deposit = deposits.find((d) => d.id === deposit_id);

  if (!deposit) {
    return res.status(404).json({ error: 'Deposit record not found.' });
  }

  deposit.status = 'REJECTED';
  saveDatabase();
  res.json({ message: 'Deposit request rejected.', deposit });
});

// Admin List Withdrawals
app.get('/api/admin/withdrawals', (req, res) => {
  const pending = withdrawals.filter((w) => w.status === 'PENDING');
  res.json({ pendingWithdrawals: pending, allWithdrawals: withdrawals });
});

// Admin Mark Paid Withdrawal
app.post('/api/admin/mark-paid', (req, res) => {
  const { withdrawal_id } = req.body;
  const wd = withdrawals.find((w) => w.id === withdrawal_id);

  if (!wd) {
    return res.status(404).json({ error: 'Withdrawal record not found.' });
  }

  if (wd.status === 'PAID') {
    return res.status(400).json({ error: 'Withdrawal is already marked as paid.' });
  }

  const user = users.find((u) => u.id === wd.user_id);
  if (user) {
    if (user.wallet_balance >= wd.amount) {
      user.wallet_balance -= wd.amount;
    }
    user.total_withdrawals += wd.amount;
    syncUserToSupabase(user);
  }

  wd.status = 'PAID';
  wd.processed_at = new Date().toISOString();
  saveDatabase();

  res.json({
    message: `Withdrawal of RS ${wd.amount.toLocaleString()} marked as PAID to ${wd.account_holder} (${wd.bank_name}).`,
    withdrawal: wd,
  });
});

// Admin Reject Withdrawal
app.post('/api/admin/reject-withdrawal', (req, res) => {
  const { withdrawal_id } = req.body;
  const wd = withdrawals.find((w) => w.id === withdrawal_id);

  if (!wd) {
    return res.status(404).json({ error: 'Withdrawal record not found.' });
  }

  wd.status = 'REJECTED';
  saveDatabase();
  res.json({ message: 'Withdrawal request rejected.', withdrawal: wd });
});

// Admin Get Owner Settings
app.get('/api/admin/settings', (req, res) => {
  res.json({ settings: ownerSettings });
});

// Admin Update Owner Settings
app.post('/api/admin/settings', (req, res) => {
  const {
    bank_name,
    account_title,
    iban_account,
    easypaisa_number,
    easypaisa_name,
    jazzcash_number,
    jazzcash_name,
    deposit_instructions,
    whatsapp_number,
  } = req.body;

  if (bank_name) ownerSettings.bank_name = bank_name;
  if (account_title) ownerSettings.account_title = account_title;
  if (iban_account) ownerSettings.iban_account = iban_account;
  if (easypaisa_number) ownerSettings.easypaisa_number = easypaisa_number;
  if (easypaisa_name) ownerSettings.easypaisa_name = easypaisa_name;
  if (jazzcash_number) ownerSettings.jazzcash_number = jazzcash_number;
  if (jazzcash_name) ownerSettings.jazzcash_name = jazzcash_name;
  if (deposit_instructions !== undefined) ownerSettings.deposit_instructions = deposit_instructions;
  if (whatsapp_number !== undefined) ownerSettings.whatsapp_number = whatsapp_number;

  saveDatabase();

  res.json({
    message: 'Owner payment account details & WhatsApp support number updated successfully! Changes reflected live on Client Site.',
    settings: ownerSettings,
  });
});

// Admin Trigger Daily Package Yield & Chain Profit
app.post('/api/admin/trigger-daily-profit', (req, res) => {
  const result = processDailyReturns();
  res.json({
    message: `Daily yield & Chain Profit credited successfully! Processed RS ${result.totalDistributed.toLocaleString()} across ${result.packageYieldCount} active investments & ${result.chainBonusCount} referrer chain bonuses!`,
    details: result,
  });
});

// Admin Get All Users
app.get('/api/admin/users', async (req, res) => {
  await syncFromSupabase();
  const clientUsers = users.filter((u) => u.role === 'client');
  res.json({ users: clientUsers, totalCount: clientUsers.length });
});

// Catch-all 404 handler for API routes (prevents falling through to Vite SPA index.html)
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint ${req.method} ${req.path} not found.` });
});

// Global Express Error Handler for API routes
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[SERVER ERROR]', err);
  res.status(500).json({ error: err.message || 'An internal server error occurred.' });
});

/* ==========================================================================
   VITE DEV / PRODUCTION INTEGRATION
   ========================================================================== */
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GreenWorld Solar Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
