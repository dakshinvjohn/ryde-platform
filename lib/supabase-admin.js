const { createClient } = require("@supabase/supabase-js");

let client;

// Server-side only — uses the service role key, which bypasses Row
// Level Security. Never import this file from client-side code.
function getSupabaseAdmin() {

    if (!client) {

        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !serviceKey) {
            throw new Error("Supabase server env vars are not set (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
        }

        client = createClient(url, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

    }

    return client;

}

module.exports = { getSupabaseAdmin };
