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

        console.warn("RYDE Maps: no API key configured in js/maps-config.js — skipping live map.");
        showStatus("Live map coming soon — add a Google Maps API key in js/maps-config.js to enable it.");
        return;

    }

    // Google calls this if the key is missing, invalid, unbilled,
    // or missing an API/referrer restriction — the script itself
    // still loads fine, so script.onerror never fires for this case.
    window.gm_authFailure = function () {

        console.error(
            "RYDE Maps: gm_authFailure — the API key loaded but Google rejected it. " +
            "Common causes: (1) the key's HTTP referrer restriction doesn't include this exact domain, " +
            "(2) Maps JavaScript API / Places API / Directions API / Geocoding API aren't all enabled " +
            "for this key's project in Google Cloud Console, or (3) billing isn't enabled on that project."
        );
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
    let pickupMarker, destinationMarker;

    // Which pin the next map click / the next placed marker should
    // set. Cycles pickup -> destination -> pickup so clicking the
    // map repeatedly lets you set (and re-set) both.
    let nextClickTarget = "pickup";

    const AUTOCOMPLETE_OPTIONS = {
        componentRestrictions: { country: ["nl", "de", "be"] },
        fields: ["formatted_address", "geometry", "name"]
    };

    function markerIcon(color) {

        return {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
            labelOrigin: new google.maps.Point(0, 0)
        };

    }

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

    // Single source of truth for "a place got chosen for pickup or
    // destination" — called from Places Autocomplete, the typed-address
    // geocode fallback, and map clicks/marker drags, so all three
    // paths stay in sync (input text, marker position, route calc).
    function setPlace(target, place, options = {}) {

        const isPickup = target === "pickup";
        const input = isPickup ? pickupInput : destinationInput;
        const marker = isPickup ? pickupMarker : destinationMarker;

        if (isPickup) pickupPlace = place; else destinationPlace = place;

        if (!options.skipInputUpdate) {
            input.value = place.formatted_address || place.name || input.value;
        }

        marker.setPosition(place.geometry.location);
        marker.setVisible(true);

        // once a pin is set by click/drag, the next click sets the
        // other one — unless both are already set, in which case
        // stay put so a second click on the same side re-adjusts it
        if (nextClickTarget === target) {
            nextClickTarget = isPickup ? "destination" : "pickup";
        }

        calculateRoute();

    }

    function reverseGeocode(latLng, target) {

        if (!geocoder) geocoder = new google.maps.Geocoder();

        showStatus("Finding that address…");

        geocoder.geocode({ location: latLng }, (results, status) => {

            if (status !== "OK" || !results[0]) {

                showStatus("Couldn't find an address at that spot — try clicking closer to a road.");
                return;

            }

            setPlace(target, { geometry: { location: latLng }, formatted_address: results[0].formatted_address });

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

            setPlace(isPickup ? "pickup" : "destination", {
                geometry: results[0].geometry,
                formatted_address: results[0].formatted_address
            }, { skipInputUpdate: true }); // keep exactly what the person typed in the field

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

        console.log("RYDE Maps: script loaded OK, initializing map.");

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
            suppressMarkers: true, // we render our own draggable pickup/destination pins instead
            polylineOptions: {
                strokeColor: "#8B7FD1",
                strokeWeight: 5,
                strokeOpacity: .9
            }
        });

        pickupMarker = new google.maps.Marker({
            map,
            visible: false,
            draggable: true,
            icon: markerIcon("#4CAF50"),
            label: { text: "A", color: "#ffffff", fontSize: "12px", fontWeight: "700" },
            title: "Pickup — drag to fine-tune"
        });

        destinationMarker = new google.maps.Marker({
            map,
            visible: false,
            draggable: true,
            icon: markerIcon("#8B7FD1"),
            label: { text: "B", color: "#ffffff", fontSize: "12px", fontWeight: "700" },
            title: "Destination — drag to fine-tune"
        });

        pickupMarker.addListener("dragend", () => reverseGeocode(pickupMarker.getPosition(), "pickup"));
        destinationMarker.addListener("dragend", () => reverseGeocode(destinationMarker.getPosition(), "destination"));

        // Click anywhere on the map to drop a pin — fills whichever
        // of pickup/destination is next in line (see nextClickTarget).
        map.addListener("click", (e) => {

            reverseGeocode(e.latLng, nextClickTarget);

        });

        autocompletePickup = new google.maps.places.Autocomplete(pickupInput, AUTOCOMPLETE_OPTIONS);
        autocompleteDestination = new google.maps.places.Autocomplete(destinationInput, AUTOCOMPLETE_OPTIONS);

        autocompletePickup.addListener("place_changed", () => {

            const place = autocompletePickup.getPlace();
            if (!place.geometry) return; // person hit Enter without picking a suggestion

            pickupJustSelected = true;
            setPlace("pickup", place, { skipInputUpdate: true }); // Autocomplete already wrote its own text into the field
            pickupInput.dispatchEvent(new CustomEvent("input", { bubbles: true, detail: { fromAutocomplete: true } }));

        });

        autocompleteDestination.addListener("place_changed", () => {

            const place = autocompleteDestination.getPlace();
            if (!place.geometry) return;

            destinationJustSelected = true;
            setPlace("destination", place, { skipInputUpdate: true });
            destinationInput.dispatchEvent(new CustomEvent("input", { bubbles: true, detail: { fromAutocomplete: true } }));

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
    script.onerror = () => {
        console.error("RYDE Maps: the Google Maps script tag itself failed to load (network/ad-blocker/CSP) — this is different from an auth failure, which loads fine but calls gm_authFailure instead.");
        showStatus("Live map couldn't load — check the API key and your connection. Estimates below still work.");
    };
    document.head.appendChild(script);

})();
