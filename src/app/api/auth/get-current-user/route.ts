import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

export async function getCurrentUser(req: NextRequest) {
    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) return null;

    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const accessToken = cookies['supabase-auth-token'];
    if (!accessToken) return null;

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) return null;

    return user;
}