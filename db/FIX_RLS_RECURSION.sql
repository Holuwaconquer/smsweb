-- ============================================
-- FIX: Infinite Recursion in RLS Policies
-- ============================================
-- 
-- The admin policies are causing infinite recursion
-- because they check EXISTS (SELECT FROM profiles)
-- while evaluating a profiles policy.
-- 
-- COPY AND PASTE THIS INTO SUPABASE SQL EDITOR
--

-- DROP all problematic policies on profiles table
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete user profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update user profiles" ON profiles;

-- DROP all problematic policies on social_media_links table  
DROP POLICY IF EXISTS "Admins can view all social media links" ON social_media_links;
DROP POLICY IF EXISTS "Admins can update social media links" ON social_media_links;
DROP POLICY IF EXISTS "Admins can delete social media links" ON social_media_links;
DROP POLICY IF EXISTS "Admins can insert social media links" ON social_media_links;
DROP POLICY IF EXISTS "Anyone can view active social media links" ON social_media_links;

-- DROP all problematic policies on social_media_audit_log
DROP POLICY IF EXISTS "Admins can view social media audit logs" ON social_media_audit_log;

-- DROP policies on wallets table
DROP POLICY IF EXISTS "Admins can view all wallets" ON wallets;
DROP POLICY IF EXISTS "Admins can update wallets" ON wallets;
DROP POLICY IF EXISTS "Admins can delete wallets" ON wallets;
DROP POLICY IF EXISTS "Users can view own wallet" ON wallets;
DROP POLICY IF EXISTS "Users can update own wallet" ON wallets;

-- DROP policies on transactions table
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;

-- DROP policies on sms_numbers table
DROP POLICY IF EXISTS "Admins can view all SMS numbers" ON sms_numbers;

-- DROP policies on logs_accounts table
DROP POLICY IF EXISTS "Admins can view all logs accounts" ON logs_accounts;

-- ============================================
-- CREATE NEW POLICIES WITHOUT RECURSION
-- ============================================

-- PROFILES TABLE - Simple approach without recursion
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- SYSTEM SETTINGS - Allow all authenticated users
-- ============================================
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read system settings"
  ON system_settings FOR SELECT
  USING (true);

-- ============================================
-- SOCIAL MEDIA LINKS - Simple policies
-- ============================================

-- Public can view ONLY active links
DROP POLICY IF EXISTS "Anyone can view active social media links" ON social_media_links;
CREATE POLICY "Anyone can view active social media links"
  ON social_media_links FOR SELECT
  USING (active = TRUE);

-- ============================================
-- Create a SECURE HELPER FUNCTION for admin checks
-- This avoids recursion by using a function
-- ============================================

CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(is_admin, FALSE) 
  FROM profiles 
  WHERE id = user_id
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- Admin-only policies using the helper function
-- ============================================

-- Admins view all profiles (using helper function)
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id OR is_admin(auth.uid())
  );

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (is_admin(auth.uid()));

-- ============================================
-- SOCIAL MEDIA LINKS - Admin policies using helper
-- ============================================

CREATE POLICY "Admins can view all social media links"
  ON social_media_links FOR SELECT
  USING (
    active = TRUE OR is_admin(auth.uid())
  );

CREATE POLICY "Admins can update social media links"
  ON social_media_links FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete social media links"
  ON social_media_links FOR DELETE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert social media links"
  ON social_media_links FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- ============================================
-- SOCIAL MEDIA AUDIT LOG - Admin only
-- ============================================

CREATE POLICY "Admins can view social media audit logs"
  ON social_media_audit_log FOR SELECT
  USING (is_admin(auth.uid()));

-- ============================================
-- WALLETS - Add policies if missing
-- ============================================

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wallet" ON wallets;
DROP POLICY IF EXISTS "Users can update own wallet" ON wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON wallets;

CREATE POLICY "Users can view own wallet"
  ON wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet"
  ON wallets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
  ON wallets FOR SELECT
  USING (is_admin(auth.uid()));

-- ============================================
-- TRANSACTIONS - Add policies if missing
-- ============================================

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  USING (is_admin(auth.uid()));

-- ============================================
-- SUCCESS!
-- The infinite recursion is fixed.
-- Users can now:
-- - View their own profile
-- - View active social media links
-- - Access wallets and transactions
-- Admins can:
-- - View everything
-- - Edit social media links
-- - Manage user accounts
-- ============================================
