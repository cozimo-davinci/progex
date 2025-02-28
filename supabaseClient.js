// supabaseClient.js (e.g., src/lib/supabaseClient.js)
import { createClient } from "@supabase/supabase-js";

export const createSupabaseClient = () => {
    if (typeof window === "undefined") {
        throw new Error("Supabase client can only be initialized on the client side.");
    }
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            auth: {
                autoRefreshToken: true,
                persistSession: true,

            },
        }
    );
};