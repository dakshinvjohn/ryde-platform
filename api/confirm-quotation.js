const crypto = require("crypto");
const { getSupabaseAdmin } = require("../lib/supabase-admin");

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

module.exports = async (req, res) => {
    const token = String(req.query?.token || req.body?.token || "").trim();

    if (!token) {
        res.status(400).json({ error: "Confirmation token is required." });
        return;
    }

    try {
        const supabase = getSupabaseAdmin();
        const tokenHash = hashToken(token);

        const { data: quotation, error } = await supabase
            .from("quotations")
            .select("id, quotation_number, booking_id, language, total_eur, advance_eur, remaining_eur, payment_method, status, valid_until, token_expires_at")
            .eq("confirmation_token_hash", tokenHash)
            .single();

        if (error || !quotation) {
            res.status(404).json({ error: "This quotation link is invalid or no longer available." });
            return;
        }

        if (quotation.token_expires_at && new Date(quotation.token_expires_at).getTime() < Date.now()) {
            res.status(410).json({ error: "This quotation has expired." });
            return;
        }

        if (req.method === "GET") {
            res.status(200).json({
                ok: true,
                quotation: {
                    quotationNumber: quotation.quotation_number,
                    language: quotation.language,
                    totalEur: quotation.total_eur,
                    advanceEur: quotation.advance_eur,
                    remainingEur: quotation.remaining_eur,
                    paymentMethod: quotation.payment_method,
                    status: quotation.status,
                    validUntil: quotation.valid_until
                }
            });
            return;
        }

        if (req.method !== "POST") {
            res.status(405).json({ error: "Method not allowed" });
            return;
        }

        if (["declined", "expired"].includes(quotation.status)) {
            res.status(409).json({ error: "This quotation can no longer be confirmed." });
            return;
        }

        const confirmedAt = new Date().toISOString();
        const { data: updatedQuotation, error: updateError } = await supabase
            .from("quotations")
            .update({
                status: quotation.payment_method === "online_full" ? "confirmed" : "confirmed",
                confirmed_at: confirmedAt
            })
            .eq("id", quotation.id)
            .select()
            .single();

        if (updateError) throw updateError;

        const bookingPaymentMethod = quotation.payment_method === "cash"
            ? "cash"
            : quotation.payment_method === "bank_transfer"
                ? "bank_transfer"
                : quotation.payment_method === "advance"
                    ? "advance"
                    : "online_full";

        const { error: bookingError } = await supabase
            .from("bookings")
            .update({
                payment_method: bookingPaymentMethod
            })
            .eq("id", quotation.booking_id);

        if (bookingError) throw bookingError;

        res.status(200).json({
            ok: true,
            quotation: {
                quotationNumber: updatedQuotation.quotation_number,
                paymentMethod: updatedQuotation.payment_method,
                totalEur: updatedQuotation.total_eur,
                advanceEur: updatedQuotation.advance_eur,
                remainingEur: updatedQuotation.remaining_eur,
                status: updatedQuotation.status
            }
        });

    } catch (err) {
        console.error("RYDE: quotation confirmation failed:", err);
        res.status(500).json({ error: "Couldn't confirm this quotation. Please contact RYDE." });
    }
};
