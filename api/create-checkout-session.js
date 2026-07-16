const { getStripe } = require("../lib/stripe");

module.exports = async (req, res) => {

    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const booking = req.body || {};

    if (!booking.email || !booking.fullName || !booking.phone || !booking.pickup || !booking.destination || !booking.date || !booking.time || !booking.fareEur) {
        res.status(400).json({ error: "Missing required booking fields." });
        return;
    }

    try {

        const stripe = getStripe();
        const origin = req.headers.origin || `https://${req.headers.host}`;

        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            customer_email: booking.email,
            line_items: [
                {
                    price_data: {
                        currency: "eur",
                        product_data: {
                            name: `RYDE — ${booking.vehicleName || booking.vehicle} transfer`,
                            description: `${booking.pickup} -> ${booking.destination} · ${booking.date} ${booking.time}`
                        },
                        // Stripe wants the smallest currency unit (cents).
                        unit_amount: Math.round(Number(booking.fareEur) * 100)
                    },
                    quantity: 1
                }
            ],
            // Booking details ride along as metadata so the webhook can
            // save the booking + send confirmations once payment lands —
            // we never trust a client-side "it worked" redirect alone.
            metadata: {
                fullName: booking.fullName,
                phone: booking.phone,
                pickup: booking.pickup,
                destination: booking.destination,
                date: booking.date,
                time: booking.time,
                passengers: String(booking.passengers || "1"),
                luggage: String(booking.luggage || "0"),
                vehicle: booking.vehicle || "standard",
                vehicleName: booking.vehicleName || "",
                notes: (booking.notes || "").slice(0, 490), // Stripe metadata values cap at 500 chars
                fareEur: String(booking.fareEur)
            },
            success_url: `${origin}/booking.html?payment=success`,
            cancel_url: `${origin}/booking.html?payment=cancelled`
        });

        res.status(200).json({ url: session.url });

    } catch (err) {

        console.error("RYDE: create-checkout-session failed:", err);
        res.status(500).json({ error: "Couldn't start checkout. Please try again." });

    }

};
