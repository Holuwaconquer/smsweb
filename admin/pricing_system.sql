-- ============================================
-- PRICING SYSTEM FOR ADMIN CONTROL
-- Admin can change ANY price on the website
-- ============================================

-- Create pricing table
CREATE TABLE IF NOT EXISTS pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL, -- 'sms', 'social_boost', 'account_log'
    service_name TEXT NOT NULL, -- 'whatsapp_us', 'instagram_followers', 'netflix', etc.
    service_type TEXT, -- 'followers', 'likes', 'views', etc. (for social)
    country TEXT, -- For SMS numbers
    base_price DECIMAL(10, 2) NOT NULL, -- What we pay to API
    selling_price DECIMAL(10, 2) NOT NULL, -- What user pays us
    markup_percentage DECIMAL(5, 2), -- Auto-calculated percentage
    currency TEXT DEFAULT 'NGN',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category, service_name, country)
);

-- Enable RLS
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Everyone can view active pricing" ON pricing
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage pricing" ON pricing
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Trigger to auto-calculate markup
CREATE OR REPLACE FUNCTION calculate_markup()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.base_price > 0 THEN
        NEW.markup_percentage := ((NEW.selling_price - NEW.base_price) / NEW.base_price) * 100;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_markup_trigger ON pricing;
CREATE TRIGGER calculate_markup_trigger
    BEFORE INSERT OR UPDATE ON pricing
    FOR EACH ROW
    EXECUTE FUNCTION calculate_markup();

-- Insert default pricing
INSERT INTO pricing (category, service_name, country, base_price, selling_price) VALUES
-- SMS Numbers
('sms', 'whatsapp', 'US', 112, 300),
('sms', 'whatsapp', 'NG', 75, 200),
('sms', 'whatsapp', 'GB', 150, 350),
('sms', 'telegram', 'US', 75, 250),
('sms', 'telegram', 'NG', 50, 150),
('sms', 'instagram', 'US', 225, 400),
('sms', 'google', 'US', 150, 350),
('sms', 'tiktok', 'US', 150, 300),

-- Account Logs
('account_log', 'netflix', NULL, 500, 1200),
('account_log', 'spotify', NULL, 300, 800),
('account_log', 'disney_plus', NULL, 400, 1000),
('account_log', 'hbo_max', NULL, 450, 1100),
('account_log', 'amazon_prime', NULL, 500, 1200),

-- Social Boosts (per 1000)
('social_boost', 'instagram_followers', NULL, 375, 800),
('social_boost', 'instagram_likes', NULL, 225, 500),
('social_boost', 'instagram_views', NULL, 150, 400),
('social_boost', 'tiktok_followers', NULL, 300, 700),
('social_boost', 'tiktok_likes', NULL, 225, 500),
('social_boost', 'youtube_subscribers', NULL, 600, 1200),
('social_boost', 'youtube_views', NULL, 375, 800),
('social_boost', 'twitter_followers', NULL, 600, 1200),
('social_boost', 'facebook_likes', NULL, 300, 700)
ON CONFLICT (category, service_name, country) DO UPDATE
SET base_price = EXCLUDED.base_price,
    selling_price = EXCLUDED.selling_price;

-- Create index
CREATE INDEX IF NOT EXISTS idx_pricing_category ON pricing(category);
CREATE INDEX IF NOT EXISTS idx_pricing_active ON pricing(is_active);

-- ============================================
-- PAYMENT HISTORY TABLE (for Paystack)
-- ============================================
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reference TEXT UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
    payment_method TEXT DEFAULT 'paystack',
    paystack_reference TEXT,
    metadata JSONB,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own payments" ON payment_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments" ON payment_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Anyone can insert payment" ON payment_history
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update payment" ON payment_history
    FOR UPDATE USING (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_payment_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_reference ON payment_history(reference);
CREATE INDEX IF NOT EXISTS idx_payment_status ON payment_history(status);
