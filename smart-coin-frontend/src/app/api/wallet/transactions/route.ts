import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
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

        const { data: transactions, error: transactionsError } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (transactionsError) {
            console.error('Error fetching transactions:', transactionsError);
            throw transactionsError;
        }

        return NextResponse.json(transactions);
    } catch (error) {
        console.error('Error in transactions API route:', error);
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
        });
    }
}