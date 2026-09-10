const { Resend } = require("resend");

let resendClient;

function getResend() {

    if (!resendClient) {

        if (!process.env.RESEND_API_KEY) {
            throw new Error("RESEND_API_KEY is not set");
        }

        resendClient = new Resend(process.env.RESEND_API_KEY);

    }

    return resendClient;

}

// Until a domain is verified in Resend, onboarding@resend.dev is the
// only address Resend will let you send from. Set RYDE_FROM_EMAIL
// once your domain is verified (see docs/14_RESEND.md).
const FROM_ADDRESS = process.env.RYDE_FROM_EMAIL || "RYDE <onboarding@resend.dev>";

// Where new-booking notifications go (the driver / owner inbox).
// Leave unset to skip owner notifications.
const OWNER_EMAIL = process.env.RYDE_OWNER_EMAIL || "";

function escapeHtml(value = "") {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

}

function bookingRow(label, value) {

    if (value === undefined || value === null || value === "") return "";
    return `<li><strong>${label}:</strong> ${escapeHtml(value)}</li>`;

}

function bookingCustomerEmail(booking) {

    const paidNote = booking.paymentMethod === "now"
        ? "paid online"
        : "pay your driver directly (cash or card)";

    return {
        subject: `Your RYDE booking — ${booking.date} at ${booking.time}`,
        html: `
            <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#1f2430;">
                <h2 style="margin-bottom:4px;">Booking confirmed</h2>
                <p>Hi ${escapeHtml(booking.fullName)},</p>
                <p>Thanks for booking with RYDE. Here are your trip details:</p>
                <ul style="line-height:1.7;padding-left:18px;">
                    ${bookingRow("Pickup", booking.pickup)}
                    ${bookingRow("Destination", booking.destination)}
                    ${bookingRow("Date & time", `${booking.date} at ${booking.time}`)}
                    ${bookingRow("Vehicle", booking.vehicleName || booking.vehicle)}
                    ${bookingRow("Passengers", booking.passengers)}
                    ${bookingRow("Luggage", booking.luggage)}
                    ${bookingRow("Fare", `€${booking.fareEur} (${paidNote})`)}
                    ${bookingRow("Notes", booking.notes)}
                </ul>
                <p>Your driver will confirm pickup shortly. Safe travels!</p>
            </div>
        `
    };

}

function bookingOwnerEmail(booking) {

    const paidNote = booking.paymentMethod === "now"
        ? "PAID via Stripe"
        : "pay later — collect from customer";

    return {
        subject: `New booking — ${booking.date} ${booking.time} (${booking.paymentMethod === "now" ? "PAID" : "pay later"})`,
        html: `
            <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#1f2430;">
                <h2 style="margin-bottom:4px;">New booking request</h2>
                <ul style="line-height:1.7;padding-left:18px;">
                    ${bookingRow("Name", booking.fullName)}
                    ${bookingRow("Email", booking.email)}
                    ${bookingRow("Phone", booking.phone)}
                    ${bookingRow("Pickup", booking.pickup)}
                    ${bookingRow("Destination", booking.destination)}
                    ${bookingRow("Date & time", `${booking.date} at ${booking.time}`)}
                    ${bookingRow("Vehicle", booking.vehicleName || booking.vehicle)}
                    ${bookingRow("Passengers", booking.passengers)}
                    ${bookingRow("Luggage", booking.luggage)}
                    ${bookingRow("Fare", `€${booking.fareEur} — ${paidNote}`)}
                    ${bookingRow("Notes", booking.notes)}
                </ul>
            </div>
        `
    };

}

module.exports = {
    getResend,
    FROM_ADDRESS,
    OWNER_EMAIL,
    bookingCustomerEmail,
    bookingOwnerEmail
};
