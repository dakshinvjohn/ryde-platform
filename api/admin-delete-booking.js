const { getSupabaseAdmin } = require("../lib/supabase-admin");
const { requireAdmin } = require("../lib/admin-auth");

module.exports = async (req, res) => {

    if (req.method !== "DELETE") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    if (!requireAdmin(req, res)) return;

    const id = String(req.body?.id || "").trim();

    if (!id) {
        res.status(400).json({ error: "Booking ID is required." });
        return;
    }

    try {

        const supabase = getSupabaseAdmin();

        const { data: booking, error: lookupError } = await supabase
            .from("bookings")
            .select("id, full_name, booking_date, booking_time")
            .eq("id", id)
            .maybeSingle();

        if (lookupError) throw lookupError;

        if (!booking) {
            res.status(404).json({ error: "Booking not found." });
            return;
        }

        // quotations.booking_id uses ON DELETE CASCADE, so any quotations
        // belonging to this booking are removed with the booking.
        const { error: deleteError } = await supabase
            .from("bookings")
            .delete()
            .eq("id", id);

        if (deleteError) throw deleteError;

        res.status(200).json({
            ok: true,
            bookingId: booking.id
        });

    } catch (err) {

        console.error("RYDE: admin-delete-booking failed:", err);
        res.status(500).json({ error: "Couldn't delete that booking." });

    }

};
