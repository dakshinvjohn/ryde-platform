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
// once your domain is verified.
const FROM_ADDRESS = process.env.RYDE_FROM_EMAIL || "RYDE <onboarding@resend.dev>";

// Where new-booking notifications go.
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
  const hasNumericFare = Number(booking.fareEur) > 0;
  const fareDisplay = hasNumericFare
    ? `€${booking.fareEur}`
    : booking.estimatedFare || "To be confirmed";

  const fareLine = booking.fareNote
    ? `${fareDisplay} — ${booking.fareNote}`
    : fareDisplay;

  return {
    subject: `RYDE booking received — ${booking.date} at ${booking.time}`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#1f2430;">
        <h2 style="margin-bottom:8px;">Your booking request has been received</h2>
        <p>Hi ${escapeHtml(booking.fullName || booking.name)},</p>
        <p>
          Thanks for booking with RYDE. We have received your request and will follow up shortly.
        </p>
        <p>
          Our goal is to keep rides fair, reliable, and cost-effective — especially for local routes, students, and airport travel.
        </p>
        <ul style="line-height:1.7;padding-left:18px;">
          ${bookingRow("Pickup", booking.pickup)}
          ${bookingRow("Destination", booking.destination || booking.dropoff)}
          ${bookingRow("Date & time", `${booking.date} at ${booking.time}`)}
          ${bookingRow("Passengers", booking.passengers)}
          ${bookingRow("Luggage", booking.luggage)}
          ${bookingRow("Estimated fare", fareLine)}
          ${bookingRow("Notes", booking.notes)}
        </ul>
        <p>
          If anything needs to be confirmed, we’ll contact you using the details you provided.
        </p>
        <p>Thank you,<br />RYDE</p>
      </div>
    `
  };
}

function bookingOwnerEmail(booking) {
  const hasNumericFare = Number(booking.fareEur) > 0;
  const fareDisplay = hasNumericFare
    ? `€${booking.fareEur}`
    : booking.estimatedFare || "Quote needed";

  const fareLine = booking.fareNote
    ? `${fareDisplay} — ${booking.fareNote}`
    : fareDisplay;

  return {
    subject: `New RYDE booking — ${booking.date} ${booking.time}`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#1f2430;">
        <h2 style="margin-bottom:8px;">New booking request</h2>
        <ul style="line-height:1.7;padding-left:18px;">
          ${bookingRow("Name", booking.fullName || booking.name)}
          ${bookingRow("Email", booking.email)}
          ${bookingRow("Phone", booking.phone)}
          ${bookingRow("Pickup", booking.pickup)}
          ${bookingRow("Destination", booking.destination || booking.dropoff)}
          ${bookingRow("Date & time", `${booking.date} at ${booking.time}`)}
          ${bookingRow("Passengers", booking.passengers)}
          ${bookingRow("Luggage", booking.luggage)}
          ${bookingRow("Vehicle", booking.vehicleName || booking.vehicle)}
          ${bookingRow("Estimated fare", fareLine)}
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