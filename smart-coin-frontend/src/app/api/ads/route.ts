/* eslint-disable @typescript-eslint/no-unused-vars */
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(_request: Request) {
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

        // Get user stats
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('balance, referral_earnings, referral_code')
            .eq('id', user.id)
            .single();

        if (userError) {
            throw userError;
        }

        // Get today's ad views
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

        return NextResponse.json({
            ...userData,
            todayAdViews: adViews?.count || 0,
            remainingAds: 50 - (adViews?.count || 0),
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
        });
    }
}