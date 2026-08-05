-- GreenWorld Solar Investment Platform Database Schema
-- Database: PostgreSQL 14+

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    username VARCHAR(60) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL, -- Format +92XXXXXXXXXX
    referral_code VARCHAR(30) NOT NULL UNIQUE, -- GW-XXXX
    referred_by VARCHAR(30) REFERENCES users(referral_code) ON DELETE SET NULL,
    wallet_balance NUMERIC(15, 2) DEFAULT 0.00,
    total_deposits NUMERIC(15, 2) DEFAULT 0.00,
    total_withdrawals NUMERIC(15, 2) DEFAULT 0.00,
    daily_profit NUMERIC(15, 2) DEFAULT 0.00,
    role VARCHAR(20) DEFAULT 'client' CHECK (role IN ('client', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deposits (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(60) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 500),
    payment_method VARCHAR(60) NOT NULL,
    screenshot_url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS withdrawals (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(60) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 500),
    bank_name VARCHAR(120) NOT NULL,
    account_holder VARCHAR(120) NOT NULL,
    account_number VARCHAR(120) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS owner_settings (
    id INT PRIMARY KEY DEFAULT 1,
    bank_name VARCHAR(120) NOT NULL,
    account_title VARCHAR(120) NOT NULL,
    iban_account VARCHAR(120) NOT NULL,
    easypaisa_number VARCHAR(60) NOT NULL,
    easypaisa_name VARCHAR(120) NOT NULL,
    jazzcash_number VARCHAR(60) NOT NULL,
    jazzcash_name VARCHAR(120) NOT NULL,
    deposit_instructions TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index optimization
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
