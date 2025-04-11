// src/app/api/auth/logout/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
    const supabase = createRouteHandlerClient({ cookies });

    const response = NextResponse.json(
        { message: "Logged put successfully!" },
        { status: 200 }
    );

    // Ensure cookies are cleared
    const cookieName = `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split(".")[1]}-auth-token`;
    response.cookies.delete(cookieName);

    return supabase.auth.signOut().then(() => {
        return response;
    });
}