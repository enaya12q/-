const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://svyvrhdjlopbmmekhdbn.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2eXZyaGRqbG9wYm1tZWtoZGJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc5OTA0MywiZXhwIjoyMDczMzc1MDQzfQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createTables() {
    try {
        console.log('Creating tables...');

        // Create 'users' table
        await supabase.rpc('create_table_if_not_exists', {
            table_name: 'users',
            schema_definition: `
                id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
                name text,
                email text UNIQUE NOT NULL,
                balance decimal(10, 3) DEFAULT 0.000 NOT NULL,
                referral_code text UNIQUE NOT NULL,
                referrer_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
                referral_earnings decimal(10, 3) DEFAULT 0.000 NOT NULL,
                created_at timestamp with time zone DEFAULT now() NOT NULL
            `
        });
        console.log('Table "users" created or already exists.');

        // Create 'ad_views' table
        await supabase.rpc('create_table_if_not_exists', {
            table_name: 'ad_views',
            schema_definition: `
                user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
                date date NOT NULL,
                count integer DEFAULT 0 NOT NULL,
                last_viewed_at timestamp with time zone DEFAULT now() NOT NULL,
                PRIMARY KEY (user_id, date)
            `
        });
        console.log('Table "ad_views" created or already exists.');

        // Create 'transactions' table
        await supabase.rpc('create_table_if_not_exists', {
            table_name: 'transactions',
            schema_definition: `
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
                type text NOT NULL,
                amount decimal(10, 3) NOT NULL,
                created_at timestamp with time zone DEFAULT now() NOT NULL
            `
        });
        console.log('Table "transactions" created or already exists.');

        // Create 'record_ad_view' RPC function
        const { error: rpcError } = await supabase.rpc('create_function_if_not_exists', {
            function_name: 'record_ad_view',
            function_definition: `
                (
                    p_user_id uuid,
                    p_view_date date,
                    p_reward_amount decimal,
                    p_referral_percentage decimal
                )
                RETURNS void
                LANGUAGE plpgsql
                SECURITY DEFINER
                AS $$
                DECLARE
                    v_referrer_id uuid;
                    v_referral_bonus decimal;
                BEGIN
                    INSERT INTO public.ad_views (user_id, date, count, last_viewed_at)
                    VALUES (p_user_id, p_view_date, 1, now())
                    ON CONFLICT (user_id, date) DO UPDATE
                    SET count = public.ad_views.count + 1, last_viewed_at = now();

                    UPDATE public.users
                    SET balance = balance + p_reward_amount
                    WHERE id = p_user_id;

                    INSERT INTO public.transactions (user_id, type, amount)
                    VALUES (p_user_id, 'ad_reward', p_reward_amount);

                    SELECT referrer_id INTO v_referrer_id
                    FROM public.users
                    WHERE id = p_user_id;

                    IF v_referrer_id IS NOT NULL THEN
                        v_referral_bonus := p_reward_amount * p_referral_percentage;

                        UPDATE public.users
                        SET
                            balance = balance + v_referral_bonus,
                            referral_earnings = referral_earnings + v_referral_bonus
                        WHERE id = v_referrer_id;

                        INSERT INTO public.transactions (user_id, type, amount)
                        VALUES (v_referrer_id, 'referral_bonus', v_referral_bonus);
                    END IF;
                END;
                $$;
            `
        });

        if (rpcError) {
            throw rpcError;
        }
        console.log('RPC function "record_ad_view" created or already exists.');

        console.log('All tables and functions created successfully!');
    } catch (error) {
        console.error('Error during table creation:', error);
    }
}

// Helper RPC functions to create tables and functions only if they don't exist
// These would need to be created manually in Supabase SQL Editor first,
// as `supabase.rpc` cannot create DDL directly.
// For this script to work, you would first run the following in Supabase SQL Editor:
/*
CREATE OR REPLACE FUNCTION create_table_if_not_exists(table_name text, schema_definition text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = table_name) THEN
        EXECUTE 'CREATE TABLE public.' || quote_ident(table_name) || ' (' || schema_definition || ');';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION create_function_if_not_exists(function_name text, function_definition text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = function_name) THEN
        EXECUTE 'CREATE OR REPLACE FUNCTION public.' || quote_ident(function_name) || function_definition;
    END IF;
END;
$$;
*/

createTables();