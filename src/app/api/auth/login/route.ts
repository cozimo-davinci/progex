import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    const { email, password } = await request.json();

    // create a supabase client with the built-in session handling
    const supabase = createRouteHandlerClient({ cookies });

    // Sing in the user with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error("Authentication failed:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return the user and session data; cookies are set automatically
    return NextResponse.json({ user: data.user, session: data.session }, { status: 200 });
}