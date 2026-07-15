// ==========================================
// RYDE — Google Maps integration (Phase 3)
//
// Loads the Google Maps JavaScript API (Places + Geocoding), wires
// Places Autocomplete onto the pickup/destination fields, renders a
// live route map, and calculates real driving distance/duration.
//
// Talks to booking.js only through DOM CustomEvents
// ("ryde:route-updated" / "ryde:route-error") so the two files stay
// decoupled — booking.js owns the fare/summary logic and doesn't
// need to know Maps exists.
//
// Falls back silently (no map, static demo estimates keep working)
// if no API key is configured yet, the API fails to load, or the
// key is invalid/restricted.
// ==========================================

(function () {

    const CONFIG = window.RYDE_CONFIG || {};
    const API_KEY = CONFIG.googleMapsApiKey;

    const mapEl = document.getElementById("bookingMap");
    const pickupInput = document.getElementById("pickup");
    const destinationInput = document.getElementById("destination");
    const mapStatusEl = document.getElementById("bookingMapStatus");

    if (!mapEl || !pickupInput || !destinationInput) return;

    const showStatus = (text) => {

        if (!mapStatusEl) return;
        mapStatusEl.textContent = text;
        mapStatusEl.hidden = false;

    };

    const hideStatus = () => {

        if (mapStatusEl) mapStatusEl.hidden = true;

    };

    // No key configured yet — show the placeholder state and stop.
    // The rest of the booking page keeps working with the static
    // route estimates in booking.js.
    if (!API_KEY || API_KEY === "YOUR_GOOGLE_MAPS_API_KEY") {

        showStatus("Live map coming soon — add a Google Maps API key in js/maps-config.js to enable it.");
        return;

    }

    // Google calls this if the key is missing, invalid, unbilled,
    // or missing an API/referrer restriction — the script itself
    // still loads fine, so script.onerror never fires for this case.
    window.gm_authFailure = function () {

        showStatus("Live map couldn't authenticate — check that the API key in js/maps-config.js is valid, unrestricted for this domain, and has billing enabled.");

    };

    const MAP_STYLE = [
        { elementType: "geometry", stylers: [{ color: "#f4f1fb" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#6e6780" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
        { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e4dff5" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#d9d2f0" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] }
    ];

    let map, directionsService, directionsRenderer, geocoder;
    let autocompletePickup, autocompleteDestination;
    let pickupPlace = null;
    let destinationPlace = null;

    const AUTOCOMPLETE_OPTIONS = {
        componentRestrictions: { country: ["nl", "de", "be"] },
        fields: ["formatted_address", "geometry", "name"]
    };

    function panToSinglePoint() {

        // while only one side of the trip is known, at least centre
        // the map there instead of leaving it parked on Wageningen
        const known = (pickupPlace && pickupPlace.geometry) || (destinationPlace && destinationPlace.geometry);
        if (!known || !map) return;
        if (pickupPlace && pickupPlace.geometry && destinationPlace && destinationPlace.geometry) return; // full route will fit both

        map.panTo(known.location);
        map.setZoom(12);

    }

    function calculateRoute() {

        panToSinglePoint();

        if (!pickupPlace || !pickupPlace.geometry || !destinationPlace || !destinationPlace.geometry) return;

        showStatus("Calculating route…");

        directionsService.route({
            origin: pickupPlace.geometry.location,
            destination: destinationPlace.geometry.location,
            travelMode: google.maps.TravelMode.DRIVING
        }, (result, status) => {

            if (status !== "OK") {

                showStatus("Couldn't calculate that route — check both addresses and try again.");
                document.dispatchEvent(new CustomEvent("ryde:route-error", { detail: { status } }));
                return;

            }

            hideStatus();
            directionsRenderer.setDirections(result);

            const leg = result.routes[0].legs[0];

            document.dispatchEvent(new CustomEvent("ryde:route-updated", {
                detail: {
                    distanceMeters: leg.distance.value,
                    distanceText: leg.distance.text,
                    durationSeconds: leg.duration.value,
                    durationText: leg.duration.text
                }
            }));

        });

    }

    // Best-effort geocode for addresses typed by hand (or prefilled
    // via URL params) and not picked from the autocomplete dropdown,
    // so the map/fare still update instead of silently staying stale.
    function geocodeFallback(input, isPickup) {

        if (!geocoder) geocoder = new google.maps.Geocoder();

        const value = input.value.trim();
        if (!value) return;

        geocoder.geocode({ address: value, region: "nl" }, (results, status) => {

            if (status !== "OK" || !results[0]) return;

            const place = {
                geometry: results[0].geometry,
                formatted_address: results[0].formatted_address
            };

            if (isPickup) pickupPlace = place; else destinationPlace = place;

            calculateRoute();

        });

    }

    // Set right after a place_changed fires so the paired blur
    // handler doesn't immediately re-geocode the value Places just
    // filled in (its formatted text doesn't always exactly match
    // place.formatted_address, which would otherwise double the call).
    let pickupJustSelected = false;
    let destinationJustSelected = false;

    pickupInput.addEventListener("blur", () => {

        if (pickupJustSelected) { pickupJustSelected = false; return; }
        const current = pickupPlace && (pickupPlace.formatted_address || pickupPlace.name);
        if (pickupInput.value.trim() && pickupInput.value.trim() !== current) geocodeFallback(pickupInput, true);

    });

    destinationInput.addEventListener("blur", () => {

        if (destinationJustSelected) { destinationJustSelected = false; return; }
        const current = destinationPlace && (destinationPlace.formatted_address || destinationPlace.name);
        if (destinationInput.value.trim() && destinationInput.value.trim() !== current) geocodeFallback(destinationInput, false);

    });

    window.initRydeMap = function () {

        const centre = { lat: 51.9692, lng: 5.6669 }; // Wageningen, NL

        map = new google.maps.Map(mapEl, {
            center: centre,
            zoom: 8,
            disableDefaultUI: true,
            zoomControl: true,
            styles: MAP_STYLE
        });

        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer({
            map,
            suppressMarkers: false,
            polylineOptions: {
                strokeColor: "#8B7FD1",
                strokeWeight: 5,
                strokeOpacity: .9
            }
        });

        autocompletePickup = new google.maps.places.Autocomplete(pickupInput, AUTOCOMPLETE_OPTIONS);
        autocompleteDestination = new google.maps.places.Autocomplete(destinationInput, AUTOCOMPLETE_OPTIONS);

        autocompletePickup.addListener("place_changed", () => {

            pickupPlace = autocompletePickup.getPlace();
            pickupJustSelected = true;
            pickupInput.dispatchEvent(new CustomEvent("input", { bubbles: true, detail: { fromAutocomplete: true } }));
            calculateRoute();

        });

        autocompleteDestination.addListener("place_changed", () => {

            destinationPlace = autocompleteDestination.getPlace();
            destinationJustSelected = true;
            destinationInput.dispatchEvent(new CustomEvent("input", { bubbles: true, detail: { fromAutocomplete: true } }));
            calculateRoute();

        });

        hideStatus();

        // a route may already have been prefilled by booking.js
        // (e.g. booking.html?route=schiphol) before this script
        // finished loading — try to geocode + draw it now
        if (pickupInput.value.trim()) geocodeFallback(pickupInput, true);
        if (destinationInput.value.trim()) geocodeFallback(destinationInput, false);

        // keep the map tiles aligned if the layout crosses the
        // mobile/desktop breakpoint (map height changes in CSS)
        let resizeTimer;
        window.addEventListener("resize", () => {

            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {

                google.maps.event.trigger(map, "resize");
                if (directionsRenderer.getDirections()) {
                    map.fitBounds(directionsRenderer.getDirections().routes[0].bounds);
                } else {
                    map.setCenter(centre);
                }

            }, 250);

        });

    };

    showStatus("Loading live map…");

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(API_KEY)}&libraries=places&callback=initRydeMap&loading=async`;
    script.async = true;
    script.defer = true;
    script.onerror = () => showStatus("Live map couldn't load — check the API key and your connection. Estimates below still work.");
    document.head.appendChild(script);

})();
