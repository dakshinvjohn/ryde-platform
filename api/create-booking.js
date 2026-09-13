const { getSupabaseAdmin } = require("../lib/supabase-admin");
const { getResend, FROM_ADDRESS, OWNER_EMAIL, bookingCustomerEmail, bookingOwnerEmail } = require("../lib/resend");

module.exports = async (req, res) => {

    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const booking = req.body || {};

    if (!booking.fullName || !booking.email || !booking.phone || !booking.pickup || !booking.destination || !booking.date || !booking.time) {
        res.status(400).json({ error: "Missing required booking fields." });
        return;
    }

    const distanceKm = Number(booking.distanceKm);
    const durationMinutes = Number(booking.durationMinutes);

    const routeData = {
        distance_km: Number.isFinite(distanceKm) && distanceKm >= 0 ? distanceKm : null,
        distance_text: booking.distanceText ? String(booking.distanceText).slice(0, 100) : null,
        duration_minutes: Number.isFinite(durationMinutes) && durationMinutes >= 0 ? Math.round(durationMinutes) : null,
        duration_text: booking.durationText ? String(booking.durationText).slice(0, 100) : null
    };

    let bookingId = null;

    try {

        const supabase = getSupabaseAdmin();

        const { data, error } = await supabase
            .from("bookings")
            .insert({
                full_name: booking.fullName,
                email: booking.email,
                phone: booking.phone,
                pickup: booking.pickup,
                destination: booking.destination,
                booking_date: booking.date,
                booking_time: booking.time,
                passengers: parseInt(booking.passengers, 10) || 1,
                luggage: parseInt(booking.luggage, 10) || 0,
                booking_type: booking.bookingType || "ride",
                vehicle: booking.vehicle || "car",
                notes: booking.notes || "",
                fare_eur: Number(booking.fareEur) || 0,
                payment_method: "later",
                payment_status: "unpaid",
                ...routeData
            })
            .select()
            .single();

        if (error) throw error;

        bookingId = data.id;

    } catch (err) {

        console.error("RYDE: create-booking Supabase insert failed:", err);
        res.status(500).json({ error: "Something went wrong saving your booking. Please try again." });
        return;

    }

    // Booking is saved — email failures shouldn't fail the request.
    try {

        const resend = getResend();

        const customerEmail = bookingCustomerEmail(booking);
        await resend.emails.send({
            from: FROM_ADDRESS,
            to: booking.email,
            subject: customerEmail.subject,
            html: customerEmail.html
        });

        if (OWNER_EMAIL) {

            const ownerEmail = bookingOwnerEmail(booking);
            await resend.emails.send({
                from: FROM_ADDRESS,
                to: OWNER_EMAIL,
                subject: ownerEmail.subject,
                html: ownerEmail.html
            });

        }

    } catch (emailErr) {

        console.error("RYDE: create-booking confirmation email failed:", emailErr);

    }

    res.status(200).json({ ok: true, bookingId });

};
