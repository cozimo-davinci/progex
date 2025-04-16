import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '../../../lib/utils/supabase/client';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    // Create a Supabase client
    const supabase = createSupabaseClient();

    // Get the current session from cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('sb-auth-session')?.value;

    if (sessionCookie) {
        const sessionData = JSON.parse(sessionCookie);
        await supabase.auth.setSession({
            access_token: sessionData.access_token,
            refresh_token: sessionData.refresh_token,
        });
    }

    // Sign out the user
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Logout error:', error.message);
        return NextResponse.json({ error: 'Failed to log out' }, { status: 500 });
    }

    // Clear the session cookie
    cookieStore.delete('sb-auth-session');

    return NextResponse.json({ message: 'Logged out successfully!' }, { status: 200 });
}