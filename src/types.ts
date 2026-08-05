export type UserRole = 'client' | 'admin';

export interface User {
  id: string;
  full_name: string;
  username: string;
  phone: string; // +92 format
  referral_code: string; // GW-XXXX
  referred_by?: string;
  wallet_balance: number; // in RS
  total_deposits: number; // in RS
  total_withdrawals: number; // in RS
  daily_profit: number; // in RS
  total_profit_earned: number; // in RS (cumulative profit + referral yields)
  role: UserRole;
  created_at: string;
}

export interface Deposit {
  id: string;
  user_id: string;
  username: string;
  phone: string;
  amount: number; // in RS
  payment_method: string;
  screenshot_url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  approved_at?: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  username: string;
  phone: string;
  amount: number; // in RS
  bank_name: string;
  account_holder: string;
  account_number: string;
  status: 'PENDING' | 'PAID' | 'REJECTED';
  created_at: string;
  processed_at?: string;
}

export interface OwnerSettings {
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

export interface SolarPackage {
  id: string;
  name: string;
  price_rs: number;
  daily_return_percent: number; // e.g. 5
  daily_return_rs: number;
  validity_days: number;
  capacity_kw: string;
  tag?: string;
  popular?: boolean;
}

export interface UserInvestment {
  id: string;
  user_id: string;
  package_id: string;
  package_name: string;
  amount_rs: number;
  daily_return_rs: number;
  purchased_at: string;
}

export interface ReferralRecord {
  id: string;
  referred_username: string;
  referred_phone: string;
  joined_at: string;
  commission_earned_rs: number;
  status: 'Active' | 'Pending';
}

export interface AuthResponse {
  user: User;
  token: string;
}
