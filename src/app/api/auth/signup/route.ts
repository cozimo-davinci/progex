import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const { email, password, username } = await request.json();

    // Initialize Supabase Client
    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_KEY!
    )

    // perform the actual signup
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username
            }
        }
    });
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });

    }
    return NextResponse.json({ user: data }, { status: 201 });
}

