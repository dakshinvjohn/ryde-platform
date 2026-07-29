const { getSupabaseAdmin } = require("../lib/supabase-admin");
const {
  getResend,
  FROM_ADDRESS,
  OWNER_EMAIL,
  bookingCustomerEmail,
  bookingOwnerEmail
} = require("../lib/resend");

function parseFareValue(value) {
  if (!value) return null;

  const text = String(value).replace(",", ".");
  const match = text.match(/(\d+(\.\d+)?)/);

  if (!match) return null;

  const number = Number(match[1]);
  return Number.isFinite(number) ? number : null;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const booking = req.body || {};

  const normalizedBooking = {
    fullName: booking.fullName || booking.name || "",
    email: booking.email || "",
    phone: booking.phone || "",
    pickup: booking.pickup || "",
    destination: booking.destination || booking.dropoff || "",
    date: booking.date || "",
    time: booking.time || "",
    passengers: booking.passengers || "1",
    rideType: booking.rideType || "local",
    luggage: parseInt(booking.luggage, 10) || 0,
    vehicle: booking.vehicle || "standard",
    notes: booking.notes || "",
    fareEur:
      parseFareValue(booking.fareEur) ??
      parseFareValue(booking.estimatedFare),
    estimatedFare: booking.estimatedFare || "",
    fareNote: booking.fareNote || ""
  };

  if (
    !normalizedBooking.fullName ||
    !normalizedBooking.email ||
    !normalizedBooking.phone ||
    !normalizedBooking.pickup ||
    !normalizedBooking.destination ||
    !normalizedBooking.date ||
    !normalizedBooking.time
  ) {
    res.status(400).json({ error: "Missing required booking fields." });
    return;
  }

  let bookingId = null;

  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        full_name: normalizedBooking.fullName,
        email: normalizedBooking.email,
        phone: normalizedBooking.phone,
        pickup: normalizedBooking.pickup,
        destination: normalizedBooking.destination,
        booking_date: normalizedBooking.date,
        booking_time: normalizedBooking.time,
        passengers: String(normalizedBooking.passengers),
        luggage: normalizedBooking.luggage,
        vehicle: normalizedBooking.vehicle,
        notes: [
          `Ride type: ${normalizedBooking.rideType}`,
          normalizedBooking.notes,
          normalizedBooking.estimatedFare
            ? `Estimated fare: ${normalizedBooking.estimatedFare}`
            : "",
          normalizedBooking.fareNote
            ? `Fare note: ${normalizedBooking.fareNote}`
            : ""
        ]
          .filter(Boolean)
          .join("\n\n"),
        fare_eur: normalizedBooking.fareEur,
        payment_method: "later",
        payment_status: "unpaid"
      })
      .select()
      .single();

    if (error) throw error;

    bookingId = data.id;
  } catch (err) {
    console.error("RYDE: create-booking Supabase insert failed:", err);
    res.status(500).json({
      error: "Something went wrong saving your booking. Please try again."
    });
    return;
  }

  try {
    const resend = getResend();

    const emailBooking = {
      ...booking,
      fullName: normalizedBooking.fullName,
      destination: normalizedBooking.destination,
      fareEur: normalizedBooking.fareEur,
      rideType: normalizedBooking.rideType,
      estimatedFare: normalizedBooking.estimatedFare,
      fareNote: normalizedBooking.fareNote
    };

    const customerEmail = bookingCustomerEmail(emailBooking);
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: normalizedBooking.email,
      subject: customerEmail.subject,
      html: customerEmail.html
    });

    if (OWNER_EMAIL) {
      const ownerEmail = bookingOwnerEmail(emailBooking);
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