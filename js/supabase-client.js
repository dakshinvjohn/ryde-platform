// ==========================================
// RYDE — Supabase client
//
// Initializes a single shared Supabase client from the credentials
// in js/supabase-config.js and exposes it as window.rydeSupabase so
// any page/script can use it, e.g.:
//
//   const { data, error } = await window.rydeSupabase
//       .from("bookings")
//       .insert({ ... });
//
// Requires the Supabase JS CDN script to be loaded first:
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//   <script src="js/supabase-config.js"></script>
//   <script src="js/supabase-client.js"></script>
//
// Falls back silently (window.rydeSupabase stays undefined) if the
// SDK or config didn't load, so pages without Supabase needs keep
// working untouched.
// ==========================================

(function () {

    const CONFIG = window.RYDE_SUPABASE_CONFIG;

    if (!CONFIG || !CONFIG.url || !CONFIG.anonKey) {
        console.warn("RYDE: Supabase config missing — skipping client init.");
        return;
    }

    if (typeof window.supabase === "undefined" || !window.supabase.createClient) {
        console.warn("RYDE: Supabase JS SDK not loaded — add the CDN <script> tag before supabase-client.js.");
        return;
    }

    window.rydeSupabase = window.supabase.createClient(CONFIG.url, CONFIG.anonKey);

})();
