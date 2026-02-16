-- Supabase SQL Schema for Basedsms

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Profile Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Wallet Table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    total_added DECIMAL(10, 2) DEFAULT 0.00,
    total_spent DECIMAL(10, 2) DEFAULT 0.00,
    currency TEXT DEFAULT 'NGN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id)
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    reference TEXT UNIQUE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- SMS Numbers Table
CREATE TABLE IF NOT EXISTS public.sms_numbers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    phone_number TEXT NOT NULL,
    country TEXT NOT NULL,
    country_code TEXT NOT NULL,
    service TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    activation_code TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- SMS Messages Table
CREATE TABLE IF NOT EXISTS public.sms_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sms_number_id UUID REFERENCES public.sms_numbers(id) ON DELETE CASCADE NOT NULL,
    sender TEXT NOT NULL,
    message TEXT NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Logs Accounts Table
CREATE TABLE IF NOT EXISTS public.logs_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    platform TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    amount DECIMAL(10, 2) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Social Media Boosts Table
CREATE TABLE IF NOT EXISTS public.social_boosts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'facebook', 'twitter', 'youtube')),
    boost_type TEXT NOT NULL CHECK (boost_type IN ('followers', 'likes', 'views', 'comments', 'shares')),
    username TEXT NOT NULL,
    target_url TEXT,
    quantity INTEGER NOT NULL,
    delivered INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Phone Numbers Purchase Table
CREATE TABLE IF NOT EXISTS public.phone_numbers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    phone_number TEXT NOT NULL,
    country TEXT NOT NULL,
    country_code TEXT NOT NULL,
    type TEXT DEFAULT 'temporary' CHECK (type IN ('temporary', 'permanent')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    amount DECIMAL(10, 2) NOT NULL,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Promo Codes Table
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Promo Code Usage Table
CREATE TABLE IF NOT EXISTS public.promo_code_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE CASCADE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, promo_code_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_numbers_user_id ON public.sms_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_accounts_user_id ON public.logs_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_boosts_user_id ON public.social_boosts(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_user_id ON public.phone_numbers(user_id);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Wallets Policies
CREATE POLICY "Users can view own wallet" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON public.wallets
    FOR UPDATE USING (auth.uid() = user_id);

-- Transactions Policies
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- SMS Numbers Policies
CREATE POLICY "Users can view own SMS numbers" ON public.sms_numbers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own SMS numbers" ON public.sms_numbers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- SMS Messages Policies
CREATE POLICY "Users can view messages for own numbers" ON public.sms_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sms_numbers
            WHERE sms_numbers.id = sms_messages.sms_number_id
            AND sms_numbers.user_id = auth.uid()
        )
    );

-- Logs Accounts Policies
CREATE POLICY "Users can view own logs accounts" ON public.logs_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs accounts" ON public.logs_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Social Boosts Policies
CREATE POLICY "Users can view own social boosts" ON public.social_boosts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own social boosts" ON public.social_boosts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Phone Numbers Policies
CREATE POLICY "Users can view own phone numbers" ON public.phone_numbers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own phone numbers" ON public.phone_numbers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Promo Code Usage Policies
CREATE POLICY "Users can view own promo code usage" ON public.promo_code_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own promo code usage" ON public.promo_code_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, username)
    VALUES (NEW.id, NEW.email, SPLIT_PART(NEW.email, '@', 1));
    
    INSERT INTO public.wallets (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile and wallet on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
