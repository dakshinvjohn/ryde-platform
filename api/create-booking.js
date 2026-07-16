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
                vehicle: booking.vehicle || "standard",
                notes: booking.notes || "",
                fare_eur: Number(booking.fareEur) || 0,
                payment_method: "later",
                payment_status: "unpaid"
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
