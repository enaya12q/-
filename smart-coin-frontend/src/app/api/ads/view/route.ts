import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const REWARD_PER_AD = 0.002;
const MAX_DAILY_ADS = 50;
const REFERRAL_PERCENTAGE = 0.10;

export async function POST(_request: Request) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    try {
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
            });
        }

        // Get current user data
        const { data: _userData, error: userError } = await supabase
            .from('users')
            .select('referrer_id, balance')
            .eq('id', user.id)
            .single();

        if (userError) {
            throw userError;
        }

        // Check daily limit
        const today = new Date().toISOString().split('T')[0];
        const { data: adViews, error: viewError } = await supabase
            .from('ad_views')
            .select('count')
            .eq('user_id', user.id)
            .eq('date', today)
            .single();

        if (viewError && viewError.code !== 'PGRST116') {
            throw viewError;
        }

        const viewCount = adViews?.count || 0;
        if (viewCount >= MAX_DAILY_ADS) {
            return new NextResponse(JSON.stringify({ error: 'Daily ad limit reached' }), {
                status: 400,
            });
        }

        // Start a transaction
        const { error: updateError } = await supabase.rpc('record_ad_view', {
            user_id: user.id,
            view_date: today,
            reward_amount: REWARD_PER_AD,
            referral_percentage: REFERRAL_PERCENTAGE
        });

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({
            success: true,
            reward: REWARD_PER_AD,
            remainingAds: MAX_DAILY_ADS - (viewCount + 1)
        });
    } catch (error) {
        console.error('Error recording ad view:', error);
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
        });
    }
}