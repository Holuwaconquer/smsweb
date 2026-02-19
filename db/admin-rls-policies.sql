-- Admin RLS Policies for Femzy
-- This script adds necessary policies to allow admins to manage users

-- =================================================================
-- ADMIN POLICIES FOR PROFILES TABLE
-- =================================================================

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Allow admins to delete user profiles
CREATE POLICY "Admins can delete user profiles" ON public.profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
        AND is_admin = FALSE -- Prevent self-admin deletion
    );

-- Allow admins to update user profiles
CREATE POLICY "Admins can update user profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- =================================================================
-- ADMIN POLICIES FOR WALLETS TABLE
-- =================================================================

-- Allow admins to view all wallets
CREATE POLICY "Admins can view all wallets" ON public.wallets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Allow admins to update wallets
CREATE POLICY "Admins can update wallets" ON public.wallets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Allow admins to delete wallets
CREATE POLICY "Admins can delete wallets" ON public.wallets
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- =================================================================
-- ADMIN POLICIES FOR TRANSACTIONS TABLE
-- =================================================================

-- Allow admins to view all transactions
CREATE POLICY "Admins can view all transactions" ON public.transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- =================================================================
-- ADMIN POLICIES FOR SMS NUMBERS TABLE
-- =================================================================

-- Allow admins to view all SMS numbers
CREATE POLICY "Admins can view all SMS numbers" ON public.sms_numbers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- =================================================================
-- ADMIN POLICIES FOR OTHER TABLES
-- =================================================================

-- Allow admins to view all logs accounts
CREATE POLICY "Admins can view all logs accounts" ON public.logs_accounts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Allow admins to view all social boosts
CREATE POLICY "Admins can view all social boosts" ON public.social_boosts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Allow admins to view all phone numbers
CREATE POLICY "Admins can view all phone numbers" ON public.phone_numbers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );
