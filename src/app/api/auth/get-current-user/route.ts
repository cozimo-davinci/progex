import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '../../../lib/utils/supabase/client';
import { cookies } from 'next/headers';

export async function getCurrentUser(req: NextRequest) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('sb-auth-session')?.value;

    if (!sessionCookie) {
        return NextResponse.json({ error: 'Unauthorized', details: 'No session found' }, { status: 401 });
    }

    const sessionData = JSON.parse(sessionCookie);
    const currentTime = Math.floor(Date.now() / 1000);

    const supabase = createSupabaseClient();

    // Check if the session has expired
    if (currentTime >= sessionData.expires_at) {
        // Refresh the session
        const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession({
            refresh_token: sessionData.refresh_token,
        });

        if (refreshError || !refreshedSession.session) {
            cookieStore.delete('sb-auth-session');
            return NextResponse.json({ error: 'Unauthorized', details: 'Session refresh failed' }, { status: 401 });
        }

        // Update the session cookie with the new session data
        const newSessionData = {
            access_token: refreshedSession.session.access_token,
            refresh_token: refreshedSession.session.refresh_token,
            expires_at: refreshedSession.session.expires_at,
            expires_in: refreshedSession.session.expires_in,
        };

        cookieStore.set('sb-auth-session', JSON.stringify(newSessionData), {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 3 * 60 * 60, // 3 hours
        });

        await supabase.auth.setSession({
            access_token: newSessionData.access_token,
            refresh_token: newSessionData.refresh_token,
        });
    } else {
        // Set the existing session
        await supabase.auth.setSession({
            access_token: sessionData.access_token,
            refresh_token: sessionData.refresh_token,
        });
    }

    // Fetch the authenticated user
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        console.error('Authentication failed:', error?.message);
        return NextResponse.json({ error: 'Unauthorized', details: error?.message || 'No user found' }, { status: 401 });
    }

    return { user, supabase };
}