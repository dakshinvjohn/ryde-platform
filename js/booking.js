const pickupInput = document.getElementById("pickup");
const dropoffInput = document.getElementById("dropoff");
const estimatedFare = document.getElementById("estimatedFare");
const fareNote = document.getElementById("fareNote");
const bookingForm = document.getElementById("bookingForm");
const formMessage = document.getElementById("formMessage");

function normalizePlace(value) {
  return value.trim().toLowerCase();
}

function getRouteEstimate(pickup, dropoff, rideType = "") {
  const from = normalizePlace(pickup);
  const to = normalizePlace(dropoff);
  const type = (rideType || "").toLowerCase();

  const text = `${from} ${to}`;

  const isWageningen = text.includes("wageningen");
  const isEdeStation =
    text.includes("ede-wageningen") ||
    text.includes("ede wageningen") ||
    text.includes("station");
  const isArnhem = text.includes("arnhem");
  const isAirport =
    text.includes("airport") ||
    text.includes("schiphol") ||
    text.includes("eindhoven airport") ||
    text.includes("rotterdam airport");

  if (type === "student-moving") {
    return {
      fare: "Affordable quote",
      note: "Student moving help is quoted based on the amount of items, distance, and help needed."
    };
  }

  if (type === "group") {
    return {
      fare: "Group quote",
      note: "Group transport up to 15 people is quoted based on group size, timing, and destination."
    };
  }

  if (type === "event" || type === "return-pickup") {
    return {
      fare: "Event quote",
      note: "Concert, nightlife, and return pickups are quoted based on location, timing, and return needs."
    };
  }

  if (type === "international") {
    return {
      fare: "Custom quote",
      note: "International rides and long-distance airport transfers are quoted individually."
    };
  }

  if (isWageningen && isEdeStation) {
    return {
      fare: "€25",
      note: "Fixed fare for Wageningen and Ede-Wageningen Station."
    };
  }

  if (isWageningen && isArnhem) {
    return {
      fare: "€35-€45",
      note: "Typical fare range for Wageningen and Arnhem."
    };
  }

  if (isAirport || type === "airport") {
    return {
      fare: "Best-value quote",
      note: "Airport rides are handled with cost-effective pricing, especially for students and pre-booked travel."
    };
  }

  return {
    fare: "€25 minimum",
    note: "Local rides start from a €25 minimum fare. Final pricing depends on route details."
  };
}

function updateEstimate() {
  const pickup = pickupInput.value || "";
  const dropoff = dropoffInput.value || "";
  const rideType = document.getElementById("rideType")?.value || "";
  const estimate = getRouteEstimate(pickup, dropoff, rideType);

  estimatedFare.textContent = estimate.fare;
  fareNote.textContent = estimate.note;
}

pickupInput.addEventListener("input", updateEstimate);
dropoffInput.addEventListener("input", updateEstimate);
document.getElementById("rideType")?.addEventListener("change", updateEstimate);

bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  formMessage.textContent = "Sending your booking request...";
  formMessage.style.color = "#0f172a";

  const formData = new FormData(bookingForm);
  const payload = Object.fromEntries(formData.entries());

  const estimate = getRouteEstimate(
    payload.pickup || "",
    payload.dropoff || "",
    payload.rideType || ""
  );

  payload.estimatedFare = estimate.fare;
  payload.fareNote = estimate.note;

  try {
    const response = await fetch("/api/create-booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || "Booking request failed");
    }

    formMessage.textContent = "Your booking request has been sent successfully. We’ll get back to you shortly.";
    formMessage.style.color = "#166534";
    bookingForm.reset();
    updateEstimate();
  } catch (error) {
    formMessage.textContent = error.message || "Something went wrong while sending your booking. Please try again.";
    formMessage.style.color = "#b91c1c";
    console.error(error);
  }
});

updateEstimate();