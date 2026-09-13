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
        const supabase = getSupabaseAdmin();

        /* ---------------------------------------
           Quotation payment
        --------------------------------------- */
        if (meta.quotationId) {
            try {
                const { data: quotation, error: quotationError } = await supabase
                    .from("quotations")
                    .select("id, booking_id, payment_method, total_eur, advance_eur, status")
                    .eq("id", meta.quotationId)
                    .single();

                if (quotationError) throw quotationError;

                const fullyPaid = quotation.payment_method === "online_full";

                const { error: quoteUpdateError } = await supabase
                    .from("quotations")
                    .update({
                        status: fullyPaid ? "paid" : "confirmed",
                        paid_at: new Date().toISOString()
                    })
                    .eq("id", quotation.id)
                    .neq("status", "paid");

                if (quoteUpdateError) throw quoteUpdateError;

                const { error: bookingUpdateError } = await supabase
                    .from("bookings")
                    .update({
                        payment_method: fullyPaid ? "online_full" : "advance",
                        payment_status: fullyPaid ? "paid" : "unpaid"
                    })
                    .eq("id", quotation.booking_id);

                if (bookingUpdateError) throw bookingUpdateError;

            } catch (quoteErr) {
                console.error("RYDE: quotation payment update failed:", quoteErr);
            }

            res.status(200).json({ received: true });
            return;
        }

        /* ---------------------------------------
           Existing direct online booking flow
        --------------------------------------- */
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
            // Idempotency: Stripe can and will retry webhook deliveries.
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

            if (error && error.code !== "23505") throw error;
        } catch (dbErr) {
            console.error("RYDE: saving paid booking failed:", dbErr);
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

handler.config = {
    api: {
        bodyParser: false
    }
};

module.exports = handler;
