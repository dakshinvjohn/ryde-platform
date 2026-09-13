const crypto = require("crypto");
const { getSupabaseAdmin } = require("../lib/supabase-admin");
const { requireAdmin } = require("../lib/admin-auth");
const { getResend, FROM_ADDRESS } = require("../lib/resend");
const { getStripe } = require("../lib/stripe");

const PUBLIC_URL = (process.env.RYDE_PUBLIC_URL || "https://rydechauffeurs.nl").replace(/\/$/, "");

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
}[c]));

const money = (value) => `€${(Number(value) || 0).toFixed(2).replace(".", ",")}`;

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const makeQuotationNumber = () => {
    const year = new Date().getFullYear();
    const stamp = Date.now().toString().slice(-6);
    const random = crypto.randomBytes(2).toString("hex").toUpperCase();
    return `RYDENL_${year}_${stamp}_${random}`;
};

const normalizeItems = (items) => {
    if (!Array.isArray(items)) return [];

    return items
        .map((item) => ({
            description: String(item?.description || "").trim(),
            price: Number(item?.price) || 0
        }))
        .filter((item) => item.description);
};

const buildEmail = ({ booking, quotation, items, confirmationUrl, paymentUrl }) => {
    const dutch = quotation.language === "nl";

    const text = dutch ? {
        subject: `Uw RYDE-offerte ${quotation.quotation_number}`,
        title: "Offerte en prijsopgave",
        intro: `Beste ${booking.full_name},`,
        body: "Bedankt voor uw aanvraag. Hieronder vindt u uw persoonlijke offerte voor de gevraagde rit.",
        journey: "Rit",
        date: "Datum",
        time: "Tijd",
        vehicle: "Voertuig",
        breakdown: "Prijsopbouw",
        total: "Totale geoffreerde prijs",
        valid: "Geldig tot",
        confirm: "JA, BEVESTIG MIJN RIT",
        pay: "BETAAL AANBETALING",
        paymentNote: "De aanbetaling wordt gebruikt om uw rit definitief vast te leggen. Het resterende bedrag betaalt u volgens de gekozen betaalwijze.",
        cashNote: "Na uw bevestiging wordt uw rit vastgelegd. Het volledige bedrag is verschuldigd volgens de gekozen betaalwijze.",
        closing: "Als u niet verder wilt gaan, is dat uiteraard prima. Deze offerte verplicht u niet tot boeken.",
        regards: "Met vriendelijke groet,<br>RYDE NL"
    } : {
        subject: `Your RYDE quotation ${quotation.quotation_number}`,
        title: "Quotation and price offer",
        intro: `Dear ${booking.full_name},`,
        body: "Thank you for your request. Below is your personal quotation for the requested journey.",
        journey: "Journey",
        date: "Date",
        time: "Time",
        vehicle: "Vehicle",
        breakdown: "Price breakdown",
        total: "Total quoted price",
        valid: "Valid until",
        confirm: "YES, CONFIRM MY RIDE",
        pay: "PAY ADVANCE",
        paymentNote: "The advance payment is used to secure your ride. The remaining balance is payable according to the selected payment method.",
        cashNote: "Once you confirm, your ride will be recorded as confirmed. The full amount is payable according to the selected payment method.",
        closing: "If you decide not to proceed, that is completely fine. This quotation does not create an obligation to book.",
        regards: "Kind regards,<br>RYDE NL"
    };

    const itemRows = items.length
        ? items.map((item) => `
            <tr>
                <td style="padding:8px 0;border-bottom:1px solid #ece8e1;">${escapeHtml(item.description)}</td>
                <td style="padding:8px 0;border-bottom:1px solid #ece8e1;text-align:right;">${money(item.price)}</td>
            </tr>
        `).join("")
        : `<tr><td colspan="2" style="padding:8px 0;color:#777;">${dutch ? "Vaste prijs zoals hieronder vermeld" : "Fixed price as quoted below"}</td></tr>`;

    const paymentBlock = quotation.payment_method === "advance" && paymentUrl
        ? `
            <p style="margin:18px 0 8px;">${escapeHtml(text.paymentNote)}</p>
            <p style="margin:18px 0;text-align:center;">
                <a href="${escapeHtml(paymentUrl)}" style="display:inline-block;padding:13px 22px;background:#b9a6ff;color:#17151b;text-decoration:none;border-radius:8px;font-weight:700;">${escapeHtml(text.pay)} — ${money(quotation.advance_eur)}</a>
            </p>
        `
        : quotation.payment_method === "online_full" && paymentUrl
            ? `
                <p style="margin:18px 0;text-align:center;">
                    <a href="${escapeHtml(paymentUrl)}" style="display:inline-block;padding:13px 22px;background:#b9a6ff;color:#17151b;text-decoration:none;border-radius:8px;font-weight:700;">${dutch ? "BETAAL VOLLEDIG ONLINE" : "PAY IN FULL ONLINE"} — ${money(quotation.total_eur)}</a>
                </p>
            `
            : `<p style="margin:18px 0;">${escapeHtml(text.cashNote)}</p>`;

    return {
        subject: text.subject,
        html: `<!doctype html>
<html lang="${dutch ? "nl" : "en"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f5f3ef;font-family:Arial,Helvetica,sans-serif;color:#17151b;">
<div style="max-width:680px;margin:30px auto;background:#fff;border:1px solid #e7e2da;border-radius:12px;overflow:hidden;">
    <div style="padding:28px 32px;border-bottom:1px solid #ece8e1;">
        <div style="font-size:24px;font-weight:700;letter-spacing:.02em;">RYDE<span style="color:#b9a6ff;">.</span></div>
        <div style="margin-top:18px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#777;">${escapeHtml(text.title)}</div>
        <h1 style="margin:7px 0 0;font-size:25px;">${escapeHtml(quotation.quotation_number)}</h1>
    </div>
    <div style="padding:30px 32px;">
        <p style="margin:0 0 10px;font-size:16px;">${escapeHtml(text.intro)}</p>
        <p style="margin:0 0 24px;line-height:1.6;color:#555;">${escapeHtml(text.body)}</p>
        <div style="padding:18px;background:#f7f5f1;border-radius:9px;">
            <div style="font-weight:700;margin-bottom:10px;">${escapeHtml(text.journey)}</div>
            <div>${escapeHtml(booking.pickup)} → ${escapeHtml(booking.destination)}</div>
            <div style="margin-top:7px;color:#666;">${escapeHtml(text.date)}: ${escapeHtml(booking.booking_date || "—")} · ${escapeHtml(text.time)}: ${escapeHtml(booking.booking_time || "—")}</div>
            <div style="margin-top:7px;color:#666;">${escapeHtml(text.vehicle)}: ${escapeHtml(booking.vehicle || "—")}</div>
        </div>
        <h2 style="font-size:18px;margin:28px 0 10px;">${escapeHtml(text.breakdown)}</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">${itemRows}</table>
        <div style="display:flex;justify-content:space-between;margin-top:16px;padding-top:15px;border-top:2px solid #17151b;font-weight:700;font-size:17px;">
            <span>${escapeHtml(text.total)}</span><span>${money(quotation.total_eur)}</span>
        </div>
        <p style="margin:12px 0 0;color:#666;font-size:13px;">${escapeHtml(text.valid)}: ${escapeHtml(quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString(dutch ? "nl-NL" : "en-GB") : "—")}</p>
        <p style="margin:28px 0 10px;text-align:center;">
            <a href="${escapeHtml(confirmationUrl)}" style="display:inline-block;padding:14px 24px;background:#17151b;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">${escapeHtml(text.confirm)}</a>
        </p>
        ${paymentBlock}
        <p style="margin:28px 0 0;color:#666;font-size:13px;line-height:1.6;">${escapeHtml(text.closing)}</p>
        <p style="margin:24px 0 0;line-height:1.6;">${text.regards}</p>
    </div>
</div>
</body></html>`
    };
};

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    if (!requireAdmin(req, res)) return;

    const body = req.body || {};
    const bookingId = body.bookingId;
    const language = body.language === "nl" ? "nl" : "en";
    const paymentMethod = ["advance", "online_full", "cash", "bank_transfer"].includes(body.paymentMethod)
        ? body.paymentMethod
        : "advance";
    const total = Number(body.totalEur);
    const advance = paymentMethod === "advance" ? Number(body.advanceEur) : paymentMethod === "online_full" ? total : 0;
    const validUntil = body.validUntil ? new Date(body.validUntil) : null;
    const items = normalizeItems(body.items);

    if (!bookingId || !Number.isFinite(total) || total <= 0) {
        res.status(400).json({ error: "Booking and a valid quotation total are required." });
        return;
    }

    if (paymentMethod === "advance" && (!Number.isFinite(advance) || advance <= 0 || advance > total)) {
        res.status(400).json({ error: "Advance payment must be greater than zero and no more than the total." });
        return;
    }

    if (validUntil && Number.isNaN(validUntil.getTime())) {
        res.status(400).json({ error: "Invalid quotation expiry date." });
        return;
    }

    const supabase = getSupabaseAdmin();
    let quotation = null;

    try {
        const { data: booking, error: bookingError } = await supabase
            .from("bookings")
            .select("*")
            .eq("id", bookingId)
            .single();

        if (bookingError) throw bookingError;
        if (!booking) throw new Error("Booking not found.");

        const token = crypto.randomBytes(32).toString("hex");
        const quotationNumber = makeQuotationNumber();
        const remaining = Math.max(0, total - advance);

        const { data, error } = await supabase
            .from("quotations")
            .insert({
                booking_id: booking.id,
                quotation_number: quotationNumber,
                language,
                total_eur: total,
                advance_eur: advance,
                remaining_eur: remaining,
                payment_method: paymentMethod,
                status: "draft",
                valid_until: validUntil ? validUntil.toISOString() : null,
                confirmation_token_hash: hashToken(token),
                token_expires_at: validUntil ? validUntil.toISOString() : null,
                notes: String(body.notes || "").slice(0, 2000)
            })
            .select()
            .single();

        if (error) throw error;
        quotation = data;

        let paymentUrl = null;

        if (paymentMethod === "advance" || paymentMethod === "online_full") {
            const stripe = getStripe();
            const amount = paymentMethod === "advance" ? advance : total;
            const session = await stripe.checkout.sessions.create({
                mode: "payment",
                payment_method_types: ["card"],
                customer_email: booking.email,
                line_items: [{
                    price_data: {
                        currency: "eur",
                        product_data: {
                            name: `RYDE quotation ${quotationNumber}`,
                            description: `${booking.pickup} -> ${booking.destination}`
                        },
                        unit_amount: Math.round(amount * 100)
                    },
                    quantity: 1
                }],
                metadata: {
                    quotationId: quotation.id,
                    bookingId: booking.id
                },
                success_url: `${PUBLIC_URL}/confirm.html?payment=success&token=${encodeURIComponent(token)}`,
                cancel_url: `${PUBLIC_URL}/confirm.html?payment=cancelled&token=${encodeURIComponent(token)}`
            });

            paymentUrl = session.url;

            const { data: updated, error: updateError } = await supabase
                .from("quotations")
                .update({ stripe_session_id: session.id })
                .eq("id", quotation.id)
                .select()
                .single();

            if (updateError) throw updateError;
            quotation = updated;
        }

        const confirmationUrl = `${PUBLIC_URL}/confirm.html?token=${encodeURIComponent(token)}`;
        const email = buildEmail({ booking, quotation, items, confirmationUrl, paymentUrl });
        const resend = getResend();

        const { error: emailError } = await resend.emails.send({
            from: FROM_ADDRESS,
            to: booking.email,
            subject: email.subject,
            html: email.html
        });

        if (emailError) throw emailError;

        const { data: sentQuotation, error: sentError } = await supabase
            .from("quotations")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", quotation.id)
            .select()
            .single();

        if (sentError) throw sentError;

        res.status(200).json({
            ok: true,
            quotation: sentQuotation,
            paymentUrl
        });

    } catch (err) {
        console.error("RYDE: quotation creation failed:", err);
        res.status(500).json({ error: err.message || "Couldn't create and send the quotation." });
    }
};
