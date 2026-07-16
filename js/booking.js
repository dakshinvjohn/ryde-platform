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
        standard: { name: "Standard", basePrice: 65 },
        business: { name: "Business", basePrice: 95 },
        van: { name: "Van", basePrice: 120 }
    };

    const ROUTES = {
        schiphol: { destination: "Schiphol Airport", price: 89, duration: "≈1 hr 10 min" },
        eindhoven: { destination: "Eindhoven Airport", price: 79, duration: "≈1 hr 5 min" },
        dusseldorf: { destination: "Düsseldorf Airport", price: 99, duration: "≈1 hr 25 min" },
        weeze: { destination: "Weeze Airport", price: 65, duration: "≈55 min" },
        brussels: { destination: "Brussels Airport", price: 149, duration: "≈2 hr" },
        charleroi: { destination: "Brussels South Charleroi Airport", price: 169, duration: "≈2 hr 20 min" }
    };

    const SERVICES = {
        airport: { vehicle: "standard", notes: "Airport transfer — happy to share my flight number if it helps with timing." },
        business: { vehicle: "business", notes: "Business travel booking." },
        student: { vehicle: "standard", notes: "Student transport booking." },
        moving: { vehicle: "van", notes: "Moving service — I'll describe what needs moving below so you can send the right vehicle." }
    };

    // Distance-based pricing used once a live route (real km) is
    // available from Google Maps. The flat "basePrice" above still
    // applies as a floor, and as the fallback when there's no live
    // route yet.
    const PRICING = {
        standard: { flagFall: 12, perKm: 1.7 },
        business: { flagFall: 18, perKm: 2.3 },
        van: { flagFall: 22, perKm: 2.6 }
    };

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
    const formMessage = document.getElementById("bookingFormMessage");

    let activeRoute = null;
    let liveRoute = null; // real {distanceKm, durationText} from js/maps.js, once available
    let currentFare = VEHICLES.standard.basePrice;

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

        const vehicleKey = form.querySelector('input[name="vehicle"]:checked')?.value || "standard";
        const vehicle = VEHICLES[vehicleKey];

        let price;

        if (liveRoute) {

            // real distance from Google Maps — price it properly
            const rate = PRICING[vehicleKey] || PRICING.standard;
            const metered = rate.flagFall + rate.perKm * liveRoute.distanceKm;
            price = Math.max(vehicle.basePrice, Math.round(metered / 5) * 5);

        } else if (activeRoute) {

            // scale the route's published standard fare by how much
            // more the chosen vehicle costs relative to standard
            const ratio = vehicle.basePrice / VEHICLES.standard.basePrice;
            price = Math.round((activeRoute.price * ratio) / 5) * 5;

        } else {

            price = vehicle.basePrice;

        }

        currentFare = price;

        if (summaryVehicle) summaryVehicle.textContent = vehicle.name;
        if (summaryFare) summaryFare.innerHTML = `From €${price}<sup>*</sup>`;

    };

    form.querySelectorAll('input[name="vehicle"]').forEach((radio) => {

        radio.addEventListener("change", updateFare);

    });

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
                updateFare();

            }

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
                updateFare();

            }

            if (liveRoute && !e.detail?.fromAutocomplete) {

                liveRoute = null;
                if (summaryDistance) summaryDistance.textContent = "—";
                if (summaryDuration) summaryDuration.textContent = "—";
                updateFare();

            }

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

        const vehicleRadio = form.querySelector(`input[name="vehicle"][value="${service.vehicle}"]`);
        if (vehicleRadio) vehicleRadio.checked = true;

        if (notesInput && !notesInput.value) notesInput.value = service.notes;

    }

    /* ---------------------------------------
       Initial paint
    --------------------------------------- */

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

        const paymentMethod = form.querySelector('input[name="paymentMethod"]:checked')?.value || "later";
        const vehicleKey = form.querySelector('input[name="vehicle"]:checked')?.value || "standard";

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
            vehicle: vehicleKey,
            vehicleName: VEHICLES[vehicleKey]?.name || vehicleKey,
            notes: notesInput?.value.trim() || "",
            fareEur: currentFare,
            paymentMethod
        };

        if (formMessage) {

            formMessage.classList.remove("booking-disclaimer--success", "booking-disclaimer--error");

        }

        try {

            if (paymentMethod === "now") {

                setLoading(true, "Redirecting to secure payment…");

                const res = await fetch("/api/create-checkout-session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const result = await res.json();

                if (!res.ok || !result.url) throw new Error(result.error || "Couldn't start checkout — please try again.");

                // Leaving the page for Stripe — no need to reset loading state.
                window.location.href = result.url;
                return;

            }

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
