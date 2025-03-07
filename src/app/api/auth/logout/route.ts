// src/app/api/auth/logout/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_KEY!
    );

    // Sign out the user on the Supabase side
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error("Logout error:", error.message);
        return NextResponse.json(
            { error: "Failed to log out" },
            { status: 500 }
        );
    }

    // Clear cookies
    const response = NextResponse.json(
        { message: "Logged out successfully" },
        { status: 200 }
    );
    response.cookies.delete("supabase-auth-token");
    response.cookies.delete("supabase-refresh-token");

    return response;
}