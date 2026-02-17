-- ============================================
-- ENHANCED Femzy  DATABASE SCHEMA
-- Complete system with activity tracking and maintenance mode
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SYSTEM SETTINGS TABLE (for maintenance mode)
-- ============================================
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maintenance_mode BOOLEAN DEFAULT FALSE,
    maintenance_message TEXT DEFAULT 'System under maintenance. Please check back later.',
    api_5sim_key TEXT,
    api_smm_panel_url TEXT,
    api_smm_panel_key TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO system_settings (id) VALUES (uuid_generate_v4())
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view/update settings
CREATE POLICY "Admins can manage system settings" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ============================================
-- ENHANCED PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT,
    full_name TEXT,
    phone_number TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Admins can delete profiles" ON profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ============================================
-- USER ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'login', 'purchase', 'wallet_topup', 'number_view', etc.
    description TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB, -- Store additional data as JSON
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own activity logs" ON user_activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity logs" ON user_activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Anyone can insert activity logs" ON user_activity_logs
    FOR INSERT WITH CHECK (true);

-- ============================================
-- WALLETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    total_added DECIMAL(10, 2) DEFAULT 0.00,
    total_spent DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own wallet" ON wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON wallets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets" ON wallets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Admins can update all wallets" ON wallets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    reference TEXT UNIQUE,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ============================================
-- SMS NUMBERS TABLE (with inbox support)
-- ============================================
CREATE TABLE IF NOT EXISTS sms_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    country TEXT NOT NULL,
    country_code TEXT NOT NULL,
    service TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'used', 'cancelled')),
    amount DECIMAL(10, 2) NOT NULL,
    activation_id TEXT, -- External API activation ID
    activation_code TEXT,
    expires_at TIMESTAMPTZ,
    purchased_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sms_numbers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own SMS numbers" ON sms_numbers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all SMS numbers" ON sms_numbers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Admins can manage SMS numbers" ON sms_numbers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ============================================
-- SMS MESSAGES TABLE (inbox for each number)
-- ============================================
CREATE TABLE IF NOT EXISTS sms_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sms_number_id UUID REFERENCES sms_numbers(id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    message TEXT NOT NULL,
    code_extracted TEXT, -- Automatically extracted verification code
    is_read BOOLEAN DEFAULT FALSE,
    received_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view messages for their numbers" ON sms_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sms_numbers
            WHERE sms_numbers.id = sms_messages.sms_number_id
            AND sms_numbers.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all messages" ON sms_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ============================================
-- LOGS ACCOUNTS TABLE (manually added by admin)
-- ============================================
CREATE TABLE IF NOT EXISTS logs_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    platform TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    additional_info JSONB, -- Store cookies, tokens, etc.
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved')),
    price DECIMAL(10, 2) NOT NULL,
    purchased_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE logs_accounts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view available logs" ON logs_accounts
    FOR SELECT USING (
        status = 'available' OR user_id = auth.uid()
    );

CREATE POLICY "Users can view purchased logs" ON logs_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all logs accounts" ON logs_accounts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ============================================
-- SOCIAL BOOSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS social_boosts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    boost_type TEXT NOT NULL,
    username TEXT,
    target_url TEXT,
    quantity INTEGER NOT NULL,
    delivered INTEGER DEFAULT 0,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'partial')),
    order_id TEXT, -- External SMM panel order ID
    start_count INTEGER,
    remains INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE social_boosts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own social boosts" ON social_boosts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all social boosts" ON social_boosts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Admins can update social boosts" ON social_boosts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ============================================
-- PROMO CODES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROMO CODE USAGE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS promo_code_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE,
    used_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, promo_code_id)
);

-- Enable RLS
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to create wallet on profile creation
CREATE OR REPLACE FUNCTION create_wallet_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallets (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create wallet
DROP TRIGGER IF EXISTS create_wallet_trigger ON profiles;
CREATE TRIGGER create_wallet_trigger
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_wallet_for_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallets;
CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_social_boosts_updated_at ON social_boosts;
CREATE TRIGGER update_social_boosts_updated_at
    BEFORE UPDATE ON social_boosts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update last_activity on profile
CREATE OR REPLACE FUNCTION update_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles SET last_activity = NOW() WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_activity on transactions
DROP TRIGGER IF EXISTS update_activity_on_transaction ON transactions;
CREATE TRIGGER update_activity_on_transaction
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_last_activity();

-- Function to extract verification codes from SMS
CREATE OR REPLACE FUNCTION extract_verification_code()
RETURNS TRIGGER AS $$
DECLARE
    code_match TEXT;
BEGIN
    -- Extract 4-8 digit codes from message
    code_match := substring(NEW.message FROM '\d{4,8}');
    IF code_match IS NOT NULL THEN
        NEW.code_extracted := code_match;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to extract codes
DROP TRIGGER IF EXISTS extract_code_trigger ON sms_messages;
CREATE TRIGGER extract_code_trigger
    BEFORE INSERT ON sms_messages
    FOR EACH ROW
    EXECUTE FUNCTION extract_verification_code();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_numbers_user_id ON sms_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_numbers_status ON sms_numbers(status);
CREATE INDEX IF NOT EXISTS idx_logs_accounts_status ON logs_accounts(status);
CREATE INDEX IF NOT EXISTS idx_logs_accounts_user_id ON logs_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_boosts_user_id ON social_boosts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_boosts_status ON social_boosts(status);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_messages_number_id ON sms_messages(sms_number_id);

-- ============================================
-- CREATE FIRST ADMIN USER
-- ============================================
-- After signing up your first user, run:
-- UPDATE profiles SET is_admin = TRUE WHERE email = 'your-email@example.com';
