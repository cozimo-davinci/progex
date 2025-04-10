import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';


export async function getCurrentUser(req: NextRequest) {
    // Access cookies from the request


    // Create a supabase client with the built-in session handling and pass the cookies we got 
    // from the request
    const supabase = createRouteHandlerClient({ cookies });

    // Now we need to fetch the authenticated user
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        console.error("Authentication failed: ", error?.message);
        return NextResponse.json({ error: "Unauthorized", details: error?.message || "No user found" }, { status: 401 });
    }

    // Return the authenticated user and Supabase client for further use
    return { user, supabase };
}