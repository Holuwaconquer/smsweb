-- FEMZY ADMIN DASHBOARD FIXES - QUICK SQL REFERENCE
-- Copy and paste each section into Supabase SQL Editor
-- Run in order: Part 1 → Part 2

-- ===========================================================================
-- PART 1: ADMIN-ONLY RLS POLICIES (Run First)
-- ===========================================================================
-- These policies allow admins to view and manage all users while restricting other users

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

DROP POLICY IF EXISTS "Admins can delete user profiles" ON public.profiles;
CREATE POLICY "Admins can delete user profiles" ON public.profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
        AND is_admin = FALSE
    );

DROP POLICY IF EXISTS "Admins can update user profiles" ON public.profiles;
CREATE POLICY "Admins can update user profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Wallet admin policies
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.wallets;
CREATE POLICY "Admins can view all wallets" ON public.wallets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

DROP POLICY IF EXISTS "Admins can update wallets" ON public.wallets;
CREATE POLICY "Admins can update wallets" ON public.wallets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

DROP POLICY IF EXISTS "Admins can delete wallets" ON public.wallets;
CREATE POLICY "Admins can delete wallets" ON public.wallets
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Transactions admin policy
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions" ON public.transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- SMS Numbers admin policy
DROP POLICY IF EXISTS "Admins can view all SMS numbers" ON public.sms_numbers;
CREATE POLICY "Admins can view all SMS numbers" ON public.sms_numbers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Logs accounts admin policy
DROP POLICY IF EXISTS "Admins can view all logs accounts" ON public.logs_accounts;
CREATE POLICY "Admins can view all logs accounts" ON public.logs_accounts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Social boosts admin policy
DROP POLICY IF EXISTS "Admins can view all social boosts" ON public.social_boosts;
CREATE POLICY "Admins can view all social boosts" ON public.social_boosts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Phone numbers admin policy
DROP POLICY IF EXISTS "Admins can view all phone numbers" ON public.phone_numbers;
CREATE POLICY "Admins can view all phone numbers" ON public.phone_numbers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ===========================================================================
-- PART 2: USER DELETION CASCADE & CLEANUP (Run Second)
-- ===========================================================================
-- These functions and triggers ensure complete cleanup when users are deleted

-- Create admin logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL,
    target_user_id UUID,
    target_email TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS on admin logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin logs
DROP POLICY IF EXISTS "Admins can view all admin logs" ON public.admin_logs;
CREATE POLICY "Admins can view all admin logs" ON public.admin_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Create logging function
CREATE OR REPLACE FUNCTION public.log_admin_action(
    p_action TEXT,
    p_target_user_id UUID,
    p_target_email TEXT,
    p_details JSONB DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_admin_id UUID;
BEGIN
    SELECT auth.uid() INTO v_admin_id;
    
    IF v_admin_id IS NOT NULL THEN
        INSERT INTO public.admin_logs (admin_id, action, target_user_id, target_email, details)
        VALUES (v_admin_id, p_action, p_target_user_id, p_target_email, p_details);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create user deletion cleanup function
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the deletion action
    PERFORM log_admin_action('user_deleted', OLD.id, OLD.email, jsonb_build_object('username', OLD.username));
    
    -- Delete all related SMS messages first (depends on SMS numbers)
    DELETE FROM public.sms_messages
    WHERE sms_number_id IN (
        SELECT id FROM public.sms_numbers WHERE user_id = OLD.id
    );
    
    -- Delete all user's data in order of dependencies
    DELETE FROM public.sms_numbers WHERE user_id = OLD.id;
    DELETE FROM public.wallets WHERE user_id = OLD.id;
    DELETE FROM public.transactions WHERE user_id = OLD.id;
    DELETE FROM public.logs_accounts WHERE user_id = OLD.id;
    DELETE FROM public.social_boosts WHERE user_id = OLD.id;
    DELETE FROM public.phone_numbers WHERE user_id = OLD.id;
    DELETE FROM public.promo_code_usage WHERE user_id = OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;

-- Create trigger to execute cleanup on profile deletion
CREATE TRIGGER on_profile_deleted
    BEFORE DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_deletion();

-- ===========================================================================
-- POST-SETUP VERIFICATION
-- ===========================================================================
-- Run this to verify all policies were created successfully

-- Check if admin policies exist
SELECT
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE tablename IN ('profiles', 'wallets', 'transactions')
    AND policyname LIKE 'Admin%'
ORDER BY tablename, policyname;

-- ===========================================================================
-- OPTIONAL: MAKE A USER ADMIN (if needed)
-- ===========================================================================
-- Replace 'your-email@example.com' with actual email
-- UPDATE public.profiles 
-- SET is_admin = TRUE 
-- WHERE email = 'your-email@example.com';
