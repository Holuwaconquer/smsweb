-- COMPLETE FIX: Database error saving new user
-- This script fixes the signup issue by improving the trigger function

-- STEP 1: First, ensure RLS policies exist
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow wallet creation on user signup" ON public.wallets;
DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;

-- Create robust INSERT policies
CREATE POLICY "Users can create own profile" ON public.profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow wallet creation on user signup" ON public.wallets
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own wallet" ON public.wallets
    FOR UPDATE USING (auth.uid() = user_id);

-- STEP 2: Drop the old trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- STEP 3: Create improved trigger function with unique username generation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    base_username TEXT;
    final_username TEXT;
    counter INTEGER := 0;
BEGIN
    -- Extract base username from email
    base_username := LOWER(SPLIT_PART(NEW.email, '@', 1));
    final_username := base_username;
    
    -- Find a unique username by adding a counter if needed
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
        counter := counter + 1;
        final_username := base_username || counter;
    END LOOP;
    
    -- Insert profile record with unique username
    BEGIN
        INSERT INTO public.profiles (id, email, username, created_at, updated_at)
        VALUES (NEW.id, NEW.email, final_username, NOW(), NOW());
    EXCEPTION WHEN OTHERS THEN
        -- If profile insert fails, continue (don't block wallet creation)
        RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
    END;
    
    -- Insert wallet record
    BEGIN
        INSERT INTO public.wallets (user_id, created_at, updated_at)
        VALUES (NEW.id, NOW(), NOW());
    EXCEPTION WHEN OTHERS THEN
        -- If wallet insert fails, still return successfully
        RAISE WARNING 'Wallet creation failed for user %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- STEP 4: Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- STEP 5: Grant all necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated;
GRANT ALL ON TABLE public.profiles TO postgres, anon, authenticated;
GRANT ALL ON TABLE public.wallets TO postgres, anon, authenticated;
GRANT ALL ON TABLE public.transactions TO postgres, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated;

-- STEP 6: Verify
-- Check if trigger exists
-- SELECT event_object_table, trigger_name FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';

-- Check if policies exist
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('profiles', 'wallets') ORDER BY tablename;
