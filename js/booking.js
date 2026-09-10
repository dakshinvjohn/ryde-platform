// ==========================================
// RYDE — Booking page
// Phase 2: booking form + live journey summary.
// Phase 3: listens for real distance/duration from js/maps.js
// (Google Maps + Places Autocomplete) and prices from actual route
// distance when it's available. Falls back to the static route
// table / flat vehicle price when no Maps API key is configured.
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("bookingForm");
    if (!form) return;

    /* ---------------------------------------
       Reference data (mirrors the homepage)
    --------------------------------------- */

    const VEHICLES = {
        car: { name: "Car" },
        van: { name: "Van" }
    };

    // Display labels/descriptions change slightly depending on
    // whether it's a ride or a moving job — same physical car,
    // different job.
    const VEHICLE_CONTEXT = {
        ride: {
            car: { label: "Car", desc: "Tesla Model 3 · up to 3 passengers" }
        },
        moving: {
            car: { label: "Car (small move)", desc: "Tesla Model 3 · light loads, few boxes" },
            van: { label: "Van (big move)", desc: "Big moves, more boxes and furniture" }
        }
    };

    const ROUTES = {
        schiphol: { destination: "Schiphol Airport", price: 100, duration: "≈1 hr 10 min" },
        eindhoven: { destination: "Eindhoven Airport", price: 100, duration: "≈1 hr 5 min" },
        dusseldorf: { destination: "Düsseldorf Airport", price: 100, duration: "≈1 hr 25 min" },
        weeze: { destination: "Weeze Airport", price: 100, duration: "≈55 min" },
        brussels: { destination: "Brussels Airport", price: 150, duration: "≈2 hr" },
        charleroi: { destination: "Brussels South Charleroi Airport", price: 169, duration: "≈2 hr 20 min" }
    };

    const SERVICES = {
        airport: { bookingType: "ride", vehicle: "car", notes: "Airport transfer — happy to share my flight number if it helps with timing." },
        business: { bookingType: "ride", vehicle: "car", notes: "Business travel booking." },
        student: { bookingType: "ride", vehicle: "car", notes: "Student transport booking." },
        moving: { bookingType: "moving", vehicle: "van", notes: "Moving service — I'll describe what needs moving below so you can send the right vehicle." }
    };

    // Pricing, matching what's quoted on the booking form:
    //   Ride (Car):    €25 flat for the first 2km, then €1,50/km beyond that
    //   Moving (Car):  €100 flat callout + €3/km, always
    //   Moving (Van):  €150 flat callout + €5/km, always
    // Ride pricing tracks close to the "Premium" scenario (€3/km) in
    // the RYDE financial model's Pricing Scenarios tab; the moving
    // rates are a new product the spreadsheet doesn't model yet, so
    // keep an eye on real job margins as they come in.
/* ---------------------------------------
   Pricing
   Airport routes use fixed prices.
   Moving jobs use base + distance.
--------------------------------------- */

const DISCOUNT_RATE = 0.25; // online-booking incentive, shown as a struck-through saving

// Until a Google Maps API key is configured, there's no live driving
// distance for a typed (non-airport) address pair. Rather than show
// nothing, price it against a typical local trip - Wageningen and
// surrounding towns average about this many km - clearly marked as
// an estimate via the row label below.
const FALLBACK_RIDE_KM = 8;

const PRICING = {
    ride: {
        base: 25,
        includedKm: 2,
        perKm: 2
    },
    moving: {
        car: {
            base: 100,
            perKm: 2.50
        },
        van: {
            base: 150,
            perKm: 5
        }
    }
};

// Builds a line-by-line price breakdown so the customer can see
// exactly what they're paying for, not just a single total.
// Returns null when there isn't enough information yet (no distance
// and no fixed route) so the UI can prompt for pickup/destination.
function getFareBreakdown(bookingType, vehicleKey, km, isEstimate) {

    const lines = [];
    let subtotal;

    if (bookingType === "ride") {

        // A predefined airport route always uses its advertised flat price.
        if (activeRoute?.price) {

            subtotal = activeRoute.price;
            lines.push({ label: `Flat fare to ${activeRoute.destination}`, amount: subtotal });

        } else if (km != null) {

            const rate = PRICING.ride;
            const extraKm = Math.max(0, km - rate.includedKm);
            const extraCost = extraKm * rate.perKm;
            const tag = isEstimate ? " (typical local trip - confirmed once you're on the map)" : "";

            lines.push({ label: `Base fare (first ${rate.includedKm} km)`, amount: rate.base });

            if (extraKm > 0) {
                lines.push({ label: `Extra distance (~${extraKm.toFixed(1)} km × €${rate.perKm.toFixed(2)}/km)${tag}`, amount: extraCost });
            }

            subtotal = rate.base + extraCost;

        } else {

            return null;

        }

    } else {

        const rate = PRICING.moving?.[vehicleKey];
        if (!rate) return null;

        if (km != null) {

            const distanceCost = rate.perKm * km;
            lines.push({ label: "Call-out fee", amount: rate.base });
            lines.push({ label: `Distance (${km.toFixed(1)} km × €${rate.perKm.toFixed(2)}/km)`, amount: distanceCost });
            subtotal = rate.base + distanceCost;

        } else {

            lines.push({ label: "Call-out fee (from)", amount: rate.base });
            subtotal = rate.base;

        }

        // Round the pre-discount subtotal to the nearest €5, same as before.
        subtotal = Math.ceil(subtotal / 5) * 5;

    }

    const discount = subtotal * DISCOUNT_RATE;
    const total = Math.round(subtotal - discount);

    return { lines, subtotal, discount, total };

}

function calcFare(bookingType, vehicleKey, km, isEstimate) {

    const breakdown = getFareBreakdown(bookingType, vehicleKey, km, isEstimate);
    return breakdown ? breakdown.total : null;

}

/* ---------------------------------------
   Elements
--------------------------------------- */

const pickupInput = document.getElementById("pickup");
const destinationInput = document.getElementById("destination");
const dateInput = document.getElementById("date");
const timeInput = document.getElementById("time");
const notesInput = document.getElementById("notes");

const summaryPickup = document.getElementById("summaryPickup");
const summaryDestination = document.getElementById("summaryDestination");
const summaryDistance = document.getElementById("summaryDistance");
const summaryDuration = document.getElementById("summaryDuration");
const summaryVehicle = document.getElementById("summaryVehicle");
const summaryDateTime = document.getElementById("summaryDateTime");
const summaryPassengers = document.getElementById("summaryPassengers");
const summaryLuggage = document.getElementById("summaryLuggage");
const summaryFare = document.getElementById("summaryFare");
const fareBreakdown = document.getElementById("fareBreakdown");
const mobileFareAmount = document.getElementById("mobileFareAmount");
const formMessage = document.getElementById("bookingFormMessage");

const bookingTypeInputs = form.querySelectorAll('input[name="bookingType"]');
const vehicleOptionsEl = document.getElementById("vehicleOptions");
const carVehicleDesc = document.getElementById("carVehicleDesc");
const carVehiclePrice = document.getElementById("carVehiclePrice");

let bookingType = form.querySelector('input[name="bookingType"]:checked')?.value || "ride";

let activeRoute = null;
let liveRoute = null;
let currentFare = null;
    /* ---------------------------------------
       Ride / Moving toggle — swaps which
       vehicle(s) are offered and their
       labels/prices, since a "move" job and
       a "ride" price completely differently.
    --------------------------------------- */

    const applyBookingType = () => {

        const vanOption = vehicleOptionsEl?.querySelector('[data-vehicle="van"]');

        if (vanOption) vanOption.hidden = bookingType !== "moving";
        if (vehicleOptionsEl) vehicleOptionsEl.classList.toggle("single-vehicle", bookingType === "ride");

        // ride only offers Car — if Van was selected and we're
        // switching to ride, fall back to Car automatically
        if (bookingType === "ride") {

            const vanRadio = form.querySelector('input[name="vehicle"][value="van"]');
            const carRadio = form.querySelector('input[name="vehicle"][value="car"]');
            if (vanRadio?.checked && carRadio) carRadio.checked = true;

        }

        const carCtx = VEHICLE_CONTEXT[bookingType]?.car;
        if (carCtx) {

            if (carVehicleDesc) carVehicleDesc.textContent = carCtx.desc;

            const carBase = bookingType === "ride" ? PRICING.ride.base : PRICING.moving.car.base;
            if (carVehiclePrice) carVehiclePrice.textContent = `From €${carBase}`;

        }

    };

    bookingTypeInputs.forEach((radio) => {

        radio.addEventListener("change", () => {

            bookingType = radio.value;
            applyBookingType();
            updateFare();

        });

    });

    /* ---------------------------------------
       Prefill date to today, min = today
    --------------------------------------- */

    if (dateInput) {

        const today = new Date().toISOString().split("T")[0];
        dateInput.min = today;
        dateInput.value = today;

    }

    /* ---------------------------------------
       Steppers (passengers / luggage)
    --------------------------------------- */

    document.querySelectorAll("[data-stepper]").forEach((stepper) => {

        const key = stepper.getAttribute("data-stepper");
        const min = parseInt(stepper.getAttribute("data-min"), 10) || 0;
        const max = parseInt(stepper.getAttribute("data-max"), 10) || 99;

        const valueEl = stepper.querySelector(".stepper-value");
        const hiddenInput = document.getElementById(`${key}Input`);
        const summaryEl = key === "passengers" ? summaryPassengers : summaryLuggage;

        const setValue = (val) => {

            const clamped = Math.min(max, Math.max(min, val));
            valueEl.textContent = clamped;
            if (hiddenInput) hiddenInput.value = clamped;
            if (summaryEl) summaryEl.textContent = clamped;

        };

        stepper.querySelectorAll(".stepper-btn").forEach((btn) => {

            btn.addEventListener("click", () => {

                const current = parseInt(valueEl.textContent, 10) || 0;
                const delta = btn.getAttribute("data-action") === "increase" ? 1 : -1;
                setValue(current + delta);

            });

        });

    });

 /* ---------------------------------------
   Fare estimate
--------------------------------------- */

const updateFare = () => {

    const vehicleKey =
        form.querySelector('input[name="vehicle"]:checked')?.value || "car";

    const ctx = VEHICLE_CONTEXT[bookingType]?.[vehicleKey];

    // A live distance from the map applies to rides and moving jobs
    // alike - a fixed airport route still wins for rides (handled
    // inside getFareBreakdown). If Maps isn't configured yet but the
    // customer has typed both a pickup and a destination, price the
    // ride against a typical-trip estimate rather than show nothing.
    let km = liveRoute ? liveRoute.distanceKm : null;
    let isEstimate = false;

    if (km == null && bookingType === "ride" && !activeRoute?.price &&
        pickupInput?.value.trim() && destinationInput?.value.trim()) {

        km = FALLBACK_RIDE_KM;
        isEstimate = true;

    }

    const breakdown = getFareBreakdown(bookingType, vehicleKey, km, isEstimate);

    currentFare = breakdown ? breakdown.total : null;

    if (summaryVehicle) {

        summaryVehicle.textContent =
            ctx?.label ||
            VEHICLES[vehicleKey]?.name ||
            vehicleKey;

    }

    // ==========================
    // Display Fare + breakdown
    // ==========================

    const renderFareAmount = (el) => {

        if (!el) return;

        if (breakdown) {

            el.innerHTML =
                `<span class="fare-was">€${breakdown.subtotal.toFixed(0)}</span>` +
                `<span class="fare-now">€${breakdown.total}<sup>*</sup></span>`;

        } else {

            el.innerHTML = "Add pickup &amp; destination";

        }

    };

    renderFareAmount(summaryFare);
    renderFareAmount(mobileFareAmount);

    if (fareBreakdown) {

        if (breakdown) {

            const rows = breakdown.lines.map(line =>
                `<div class="fare-breakdown-row">
                    <span>${line.label}</span>
                    <span>€${line.amount.toFixed(2)}</span>
                </div>`
            ).join("");

            fareBreakdown.innerHTML =
                rows +
                `<div class="fare-breakdown-row fare-breakdown-subtotal">
                    <span>Subtotal</span>
                    <span>€${breakdown.subtotal.toFixed(2)}</span>
                </div>
                <div class="fare-breakdown-row fare-breakdown-discount">
                    <span>Online booking discount (20%)</span>
                    <span>-€${breakdown.discount.toFixed(2)}</span>
                </div>
                <div class="fare-breakdown-row fare-breakdown-total">
                    <span>You pay</span>
                    <span>€${breakdown.total}</span>
                </div>`;

            fareBreakdown.hidden = false;

        } else {

            fareBreakdown.innerHTML =
                `<p class="fare-breakdown-empty">Add a pickup and destination above to see your price breakdown.</p>`;
            fareBreakdown.hidden = false;

        }

    }

};

    /* ---------------------------------------
       Live summary — pickup / destination
    --------------------------------------- */

    if (pickupInput && summaryPickup) {

        pickupInput.addEventListener("input", (e) => {

            summaryPickup.textContent = pickupInput.value.trim() || "Add a pickup location";

            // manual edits invalidate a previously calculated live
            // route until maps.js confirms a new one — but skip this
            // when the change came from picking an autocomplete
            // suggestion, since maps.js is about to recalculate it
            // anyway and clearing here just causes a price flicker
            if (liveRoute && !e.detail?.fromAutocomplete) {

                liveRoute = null;
                if (summaryDistance) summaryDistance.textContent = "—";
                if (summaryDuration) summaryDuration.textContent = "—";

            }

            updateFare();

        });

    }

    if (destinationInput && summaryDestination) {

        destinationInput.addEventListener("input", (e) => {

            summaryDestination.textContent = destinationInput.value.trim() || "Add a destination";

            // typing a different destination by hand clears the
            // route-specific duration/fare estimate
            if (activeRoute && destinationInput.value.trim() !== activeRoute.destination) {

                activeRoute = null;
                if (summaryDuration) summaryDuration.textContent = "—";

            }

            if (liveRoute && !e.detail?.fromAutocomplete) {

                liveRoute = null;
                if (summaryDistance) summaryDistance.textContent = "—";
                if (summaryDuration) summaryDuration.textContent = "—";

            }

            updateFare();

        });

    }

    /* ---------------------------------------
       Live summary — date & time
    --------------------------------------- */

    const updateDateTime = () => {

        if (!summaryDateTime) return;

        if (!dateInput.value || !timeInput.value) {

            summaryDateTime.textContent = "Not set";
            return;

        }

        const dt = new Date(`${dateInput.value}T${timeInput.value}`);

        if (isNaN(dt.getTime())) {

            summaryDateTime.textContent = "Not set";
            return;

        }

        summaryDateTime.textContent = dt.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
        }) + ", " + dt.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit"
        });

    };

    [dateInput, timeInput].forEach((el) => {

        if (el) el.addEventListener("change", updateDateTime);

    });

    /* ---------------------------------------
       Live route data from js/maps.js (Phase 3)
    --------------------------------------- */

    document.addEventListener("ryde:route-updated", (e) => {

        const { distanceMeters, distanceText, durationText } = e.detail;

        // a real Maps route takes priority over any static route
        // table match — clear it so the two never disagree
        activeRoute = null;

        liveRoute = {
            distanceKm: distanceMeters / 1000,
            durationText
        };

        if (summaryDistance) summaryDistance.textContent = distanceText;
        if (summaryDuration) summaryDuration.textContent = durationText;

        updateFare();

    });

    document.addEventListener("ryde:route-error", () => {

        liveRoute = null;
        if (summaryDistance) summaryDistance.textContent = "—";
        if (summaryDuration) summaryDuration.textContent = "—";
        updateFare();

    });

    /* ---------------------------------------
       Prefill from homepage links
       (?route=schiphol or ?service=airport)
    --------------------------------------- */

    const params = new URLSearchParams(window.location.search);
    const routeParam = params.get("route");
    const serviceParam = params.get("service");
    const vehicleParam = params.get("vehicle");

    if (routeParam && ROUTES[routeParam]) {

        activeRoute = ROUTES[routeParam];

        if (pickupInput) pickupInput.value = "Wageningen, Gelderland";
        if (destinationInput) destinationInput.value = activeRoute.destination;
        if (summaryPickup) summaryPickup.textContent = pickupInput.value;
        if (summaryDestination) summaryDestination.textContent = activeRoute.destination;
        if (summaryDuration) summaryDuration.textContent = activeRoute.duration;

    }

    if (serviceParam && SERVICES[serviceParam]) {

        const service = SERVICES[serviceParam];

        const bookingTypeRadio = form.querySelector(`input[name="bookingType"][value="${service.bookingType}"]`);
        if (bookingTypeRadio) {
            bookingTypeRadio.checked = true;
            bookingType = service.bookingType;
        }

        applyBookingType();

        const vehicleRadio = form.querySelector(`input[name="vehicle"][value="${service.vehicle}"]`);
        if (vehicleRadio) vehicleRadio.checked = true;

        if (notesInput && !notesInput.value) notesInput.value = service.notes;

    }

    // Optional explicit vehicle override (e.g. booking.html?service=moving&vehicle=car)
    // — lets links pick a specific vehicle within a booking type
    // rather than always getting that type's default.
    if (vehicleParam) {

        const vehicleRadio = form.querySelector(`input[name="vehicle"][value="${vehicleParam}"]`);
        if (vehicleRadio) vehicleRadio.checked = true;

    }

    /* ---------------------------------------
       Initial paint
    --------------------------------------- */

    applyBookingType();
    updateFare();
    updateDateTime();

    /* ---------------------------------------
       Returning from Stripe Checkout
       (success_url / cancel_url land back here)
    --------------------------------------- */

    const returnParams = new URLSearchParams(window.location.search);

    if (formMessage && returnParams.get("payment") === "success") {

        formMessage.textContent =
            "Payment received — your booking is confirmed! A confirmation email is on its way.";
        formMessage.classList.remove("booking-disclaimer--error");
        formMessage.classList.add("booking-disclaimer--success");

    } else if (formMessage && returnParams.get("payment") === "cancelled") {

        formMessage.textContent =
            "Payment was cancelled, so nothing was booked. You can try again below.";
        formMessage.classList.remove("booking-disclaimer--success");
        formMessage.classList.add("booking-disclaimer--error");

    }

    /* ---------------------------------------
       Submit — sends the booking to the API.
       "Pay now" starts a Stripe Checkout redirect;
       "Pay later" creates the booking directly and
       emails a confirmation via Resend.
    --------------------------------------- */

    const submitBtn = form.querySelector(".booking-submit");
    const defaultSubmitLabel = submitBtn ? submitBtn.textContent.trim() : "Review booking";

    const setLoading = (isLoading, label) => {

        if (!submitBtn) return;
        submitBtn.disabled = isLoading;
        submitBtn.textContent = label || defaultSubmitLabel;

    };

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        if (!form.reportValidity()) return;

        const vehicleKey = form.querySelector('input[name="vehicle"]:checked')?.value || "car";

        // Payment always happens later (driver/RYDE confirms and
        // charges after the fact) — there's no pay-now/pay-later
        // choice on this form, so the API always gets the same
        // booking-request flow, never the Stripe checkout one.
        const payload = {
            fullName: document.getElementById("fullName")?.value.trim() || "",
            email: document.getElementById("email")?.value.trim() || "",
            phone: document.getElementById("phone")?.value.trim() || "",
            pickup: pickupInput.value.trim(),
            destination: destinationInput.value.trim(),
            date: dateInput.value,
            time: timeInput.value,
            passengers: document.getElementById("passengersInput")?.value || "1",
            luggage: document.getElementById("luggageInput")?.value || "0",
            bookingType,
            vehicle: vehicleKey,
            vehicleName: VEHICLE_CONTEXT[bookingType]?.[vehicleKey]?.label || VEHICLES[vehicleKey]?.name || vehicleKey,
            notes: notesInput?.value.trim() || "",
            fareEur: currentFare,
            paymentMethod: "later"
        };

        if (formMessage) {

            formMessage.classList.remove("booking-disclaimer--success", "booking-disclaimer--error");

        }

        try {

            setLoading(true, "Sending your request…");

            const res = await fetch("/api/create-booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await res.json();

            if (!res.ok) throw new Error(result.error || "Couldn't send your booking request — please try again.");

            if (formMessage) {

                formMessage.textContent =
                    "Request received! A confirmation email is on its way, and your driver will confirm pickup shortly.";
                formMessage.classList.add("booking-disclaimer--success");

            }

            form.reset();
            if (dateInput) dateInput.value = new Date().toISOString().split("T")[0];
            updateFare();
            updateDateTime();

        } catch (err) {

            if (formMessage) {

                formMessage.textContent = err.message || "Something went wrong — please try again or contact us directly.";
                formMessage.classList.add("booking-disclaimer--error");

            }

        } finally {

            setLoading(false);

        }

    });

});
