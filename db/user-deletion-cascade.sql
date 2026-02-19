-- User Deletion Cleanup Function and Trigger
-- This script ensures complete cleanup when a user is deleted

-- =================================================================
-- FUNCTION TO HANDLE USER DELETION
-- =================================================================

CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete all related data when a profile is deleted
    -- The ON DELETE CASCADE on foreign keys should handle most of this,
    -- but this ensures complete cleanup
    
    DELETE FROM public.sms_messages
    WHERE sms_number_id IN (
        SELECT id FROM public.sms_numbers WHERE user_id = OLD.id
    );
    
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

-- Create trigger for profile deletion
DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;
CREATE TRIGGER on_profile_deleted
    BEFORE DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_deletion();

-- =================================================================
-- FUNCTION TO LOG ADMIN ACTIONS
-- =================================================================

CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL,
    target_user_id UUID,
    target_email TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS on admin_logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin logs
CREATE POLICY "Admins can view all admin logs" ON public.admin_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Create function to log admin actions
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

-- Update the delete trigger to log the action
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the deletion
    PERFORM log_admin_action('user_deleted', OLD.id, OLD.email, jsonb_build_object('username', OLD.username));
    
    -- Delete all related data when a profile is deleted
    DELETE FROM public.sms_messages
    WHERE sms_number_id IN (
        SELECT id FROM public.sms_numbers WHERE user_id = OLD.id
    );
    
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
