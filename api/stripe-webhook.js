const { getStripe } = require("../lib/stripe");
const { getSupabaseAdmin } = require("../lib/supabase-admin");
const { getResend, FROM_ADDRESS, OWNER_EMAIL, bookingCustomerEmail, bookingOwnerEmail } = require("../lib/resend");

function readRawBody(req) {

    return new Promise((resolve, reject) => {

        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks)));
        req.on("error", reject);

    });

}

const handler = async (req, res) => {

    if (req.method !== "POST") {
        res.status(405).end("Method not allowed");
        return;
    }

    const stripe = getStripe();
    const signature = req.headers["stripe-signature"];

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.error("RYDE: STRIPE_WEBHOOK_SECRET is not set — refusing to process webhook.");
        res.status(500).end("Webhook not configured");
        return;
    }

    let event;

    try {

        const rawBody = await readRawBody(req);
        event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);

    } catch (err) {

        console.error("RYDE: webhook signature verification failed:", err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;

    }

    if (event.type === "checkout.session.completed") {

        const session = event.data.object;
        const meta = session.metadata || {};

        const booking = {
            fullName: meta.fullName || "",
            email: session.customer_details?.email || session.customer_email || "",
            phone: meta.phone || "",
            pickup: meta.pickup || "",
            destination: meta.destination || "",
            date: meta.date || "",
            time: meta.time || "",
            passengers: meta.passengers || "1",
            luggage: meta.luggage || "0",
            vehicle: meta.vehicle || "standard",
            vehicleName: meta.vehicleName || "",
            notes: meta.notes || "",
            fareEur: meta.fareEur || (session.amount_total ? session.amount_total / 100 : 0),
            paymentMethod: "now"
        };

        try {

            const supabase = getSupabaseAdmin();

            // Idempotency: Stripe can and will retry webhook deliveries.
            // A unique constraint on stripe_session_id (see
            // supabase-schema.sql) makes a duplicate insert a no-op
            // instead of a double-booked row.
            const { error } = await supabase
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
                    vehicle: booking.vehicle,
                    notes: booking.notes,
                    fare_eur: Number(booking.fareEur) || 0,
                    payment_method: "now",
                    payment_status: "paid",
                    stripe_session_id: session.id
                });

            if (error && error.code !== "23505") throw error; // 23505 = unique_violation (duplicate webhook retry)

        } catch (dbErr) {

            console.error("RYDE: saving paid booking failed:", dbErr);
            // Still ack the webhook — Stripe already has the payment.
            // Fix the DB issue and re-drive from the Stripe dashboard if needed.

        }

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

            console.error("RYDE: paid booking confirmation email failed:", emailErr);

        }

    }

    res.status(200).json({ received: true });

};

// Stripe requires the raw, unparsed request body to verify the
// webhook signature — turn off Vercel's automatic JSON body parsing
// for this endpoint only. Must be attached to the handler itself,
// not set on module.exports before the handler is assigned to it,
// or it gets wiped out by the assignment below.
handler.config = {
    api: {
        bodyParser: false
    }
};

module.exports = handler;
