import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '../../../lib/utils/supabase/client';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    const { email, password } = await request.json();

    // Create a Supabase client
    const supabase = createSupabaseClient();

    // Sign in the user
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('Authentication failed:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Manually set the session in cookies with a 3-hour expiration
    const cookieStore = await cookies();
    const sessionData = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
    };

    cookieStore.set('sb-auth-session', JSON.stringify(sessionData), {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3 * 60 * 60, // 3 hours in seconds
    });

    return NextResponse.json({ user: data.user, session: data.session }, { status: 200 });
}