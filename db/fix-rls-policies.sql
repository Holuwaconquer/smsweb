-- FIX: Missing RLS INSERT Policies for User Signup
-- Run this in Supabase SQL Editor to enable user signup
-- This fixes the "Database error saving new user" error during signup

-- STEP 1: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow wallet creation on user signup" ON public.wallets;

-- STEP 2: Add INSERT policy for profiles table (allows new user to create their profile during signup)
CREATE POLICY "Users can create own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- STEP 3: Add INSERT policy for wallets table (allows system to create wallet when user signs up)
CREATE POLICY "Allow wallet creation on user signup" ON public.wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- STEP 4: Recreate the trigger function with proper permissions
-- This function is called automatically when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert profile record
    INSERT INTO public.profiles (id, email, username)
    VALUES (NEW.id, NEW.email, SPLIT_PART(NEW.email, '@', 1))
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert wallet record
    INSERT INTO public.wallets (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- STEP 5: Grant proper permissions (important!)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated;
GRANT ALL ON public.profiles TO postgres, anon, authenticated;
GRANT ALL ON public.wallets TO postgres, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated;

-- VERIFY the fix
-- Run these queries to check if policies exist:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('profiles', 'wallets') ORDER BY tablename;
-- SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';
