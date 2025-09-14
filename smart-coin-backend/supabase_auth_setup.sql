-- Function to generate a random referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        new_code := substr(md5(random()::text), 0, 9); -- Generate an 8-character code
        SELECT EXISTS (SELECT 1 FROM public.users WHERE referral_code = new_code) INTO code_exists;
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$;

-- Trigger function to create a public user profile on new auth.users insertion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _referral_code TEXT;
    _referrer_id UUID;
BEGIN
    -- Extract referralCode from user_metadata if available
    _referral_code := NEW.raw_user_meta_data->>'referralCode';

    IF _referral_code IS NOT NULL THEN
        SELECT id INTO _referrer_id FROM public.users WHERE referral_code = _referral_code;
    END IF;

    INSERT INTO public.users (id, name, email, referral_code, referrer_id)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name', -- Assuming 'full_name' is in metadata
        NEW.email,
        generate_referral_code(),
        _referrer_id
    );
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();