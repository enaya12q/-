import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    console.log('Callback Route: Received code:', code);

    if (code) {
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        console.log('Callback Route: Session data:', data);
        console.log('Callback Route: Session error:', error);

        if (error) {
            console.error('Callback Route: Error exchanging code for session:', error);
        }
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(requestUrl.origin + '/dashboard');
}