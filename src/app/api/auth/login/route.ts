import { createClient } from "@supabase/supabase-js";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    const { email, password } = await request.json();

    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_KEY!
    );

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error("Login error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const response = new NextResponse(JSON.stringify({ user: data.user, session: data.session }), { status: 200 });
    if (data.session) {
        response.cookies.set("supabase-auth-token", data.session.access_token, {
            httpOnly: true,
            path: "/",
            maxAge: data.session.expires_in,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
        });
        response.cookies.set("supabase-refresh-token", data.session.refresh_token, {
            httpOnly: true,
            path: "/",
            maxAge: 3600 * 24 * 7, // 1 week
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
        });
    }

    return response;
}