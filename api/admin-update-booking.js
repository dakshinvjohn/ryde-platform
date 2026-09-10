const { getSupabaseAdmin } = require("../lib/supabase-admin");
const { requireAdmin } = require("../lib/admin-auth");

const ALLOWED_STATUSES = ["paid", "unpaid"];

module.exports = async (req, res) => {

    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    if (!requireAdmin(req, res)) return;

    const { id, paymentStatus } = req.body || {};

    if (!id || !ALLOWED_STATUSES.includes(paymentStatus)) {
        res.status(400).json({ error: "Missing or invalid id/paymentStatus." });
        return;
    }

    try {

        const supabase = getSupabaseAdmin();

        const { data, error } = await supabase
            .from("bookings")
            .update({ payment_status: paymentStatus })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json({ ok: true, booking: data });

    } catch (err) {

        console.error("RYDE: admin-update-booking failed:", err);
        res.status(500).json({ error: "Couldn't update that booking. Please try again." });

    }

};
