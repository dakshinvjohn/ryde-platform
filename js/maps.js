// ==========================================
// RYDE — Google Maps integration
//
// Lean production version.
//
// Keeps:
// - Places Autocomplete for pickup/destination
// - Live driving route
// - Real distance/duration
// - Custom pickup/destination markers
//
// Removes unnecessary API-heavy interactions:
// - Map click -> reverse geocoding
// - Draggable pins -> reverse geocoding
// - "My location" -> reverse geocoding
// - Blur -> address geocoding
//
// IMPORTANT:
// Airport shortcut routes remain controlled by booking.js.
// For example:
// booking.html?route=schiphol
//
// booking.js keeps the advertised fixed airport fare.
// Maps does NOT geocode those prefilled addresses automatically.
//
// Events:
// - ryde:route-updated
// - ryde:route-error
// ==========================================

(function () {

    const CONFIG = window.RYDE_CONFIG || {};
    const API_KEY = CONFIG.googleMapsApiKey;
    const MAP_ID = (CONFIG.mapId || "").trim();

    const mapEl = document.getElementById("bookingMap");
    const pickupInput = document.getElementById("pickup");
    const destinationInput = document.getElementById("destination");
    const mapStatusEl = document.getElementById("bookingMapStatus");

    if (!mapEl || !pickupInput || !destinationInput) {
        return;
    }


    // ==========================================
    // STATE
    // ==========================================

    let map = null;
    let directionsService = null;
    let directionsRenderer = null;

    let autocompletePickup = null;
    let autocompleteDestination = null;

    let pickupPlace = null;
    let destinationPlace = null;

    let pickupMarker = null;
    let destinationMarker = null;

    let usingAdvancedMarkers = false;

    let mapsLoaded = false;
    let mapsLoading = false;

    let lastRouteKey = "";
    let routeRequestInProgress = false;


    // ==========================================
    // STATUS
    // ==========================================

    function showStatus(text) {

        if (!mapStatusEl) return;

        mapStatusEl.textContent = text;
        mapStatusEl.hidden = false;

    }


    function hideStatus() {

        if (mapStatusEl) {
            mapStatusEl.hidden = true;
        }

    }


    // ==========================================
    // API KEY
    // ==========================================

    if (!API_KEY) {

        console.warn(
            "RYDE Maps: no Google Maps API key configured."
        );

        showStatus(
            "Live map coming soon..."
        );

        return;

    }


    // ==========================================
    // GOOGLE AUTH FAILURE
    // ==========================================

    window.gm_authFailure = function () {

        console.error(
            "RYDE Maps: Google rejected the API key. " +
            "Check API key restrictions, enabled APIs and billing."
        );

        showStatus(
            "Live map couldn't load. Route estimates are still available."
        );

    };


    // ==========================================
    // MAP STYLE
    // ==========================================

    const MAP_STYLE = [

        {
            elementType: "geometry",
            stylers: [
                { color: "#f4f1fb" }
            ]
        },

        {
            elementType: "labels.text.fill",
            stylers: [
                { color: "#6e6780" }
            ]
        },

        {
            elementType: "labels.text.stroke",
            stylers: [
                { color: "#ffffff" }
            ]
        },

        {
            featureType: "road",
            elementType: "geometry",
            stylers: [
                { color: "#ffffff" }
            ]
        },

        {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [
                { color: "#e4dff5" }
            ]
        },

        {
            featureType: "water",
            elementType: "geometry",
            stylers: [
                { color: "#d9d2f0" }
            ]
        },

        {
            featureType: "poi",
            stylers: [
                { visibility: "off" }
            ]
        },

        {
            featureType: "transit",
            stylers: [
                { visibility: "off" }
            ]
        }

    ];


    // ==========================================
    // AUTOCOMPLETE OPTIONS
    // ==========================================

    const AUTOCOMPLETE_OPTIONS = {

        componentRestrictions: {
            country: ["nl", "de", "be"]
        },

        fields: [
            "formatted_address",
            "geometry",
            "name"
        ]

    };


    // ==========================================
    // MARKERS
    // ==========================================

    function createMarker(color, glyph, title) {

        // --------------------------------------
        // Advanced Marker
        // --------------------------------------

        if (usingAdvancedMarkers) {

            try {

                const pin =
                    new google.maps.marker.PinElement({

                        background: color,

                        borderColor: "#ffffff",

                        glyphColor: "#ffffff",

                        glyph

                    });


                const marker =
                    new google.maps.marker.AdvancedMarkerElement({

                        map: null,

                        content: pin.element,

                        title

                    });


                return {

                    setPosition(latLng) {

                        marker.position = latLng;

                    },

                    setVisible(visible) {

                        marker.map =
                            visible ? map : null;

                    }

                };

            } catch (error) {

                console.warn(
                    "RYDE Maps: Advanced markers unavailable. " +
                    "Using classic markers.",
                    error
                );

                usingAdvancedMarkers = false;

            }

        }


        // --------------------------------------
        // Classic Marker fallback
        // --------------------------------------

        const marker =
            new google.maps.Marker({

                map: null,

                visible: false,

                icon: {

                    path:
                        google.maps.SymbolPath.CIRCLE,

                    scale: 10,

                    fillColor: color,

                    fillOpacity: 1,

                    strokeColor: "#ffffff",

                    strokeWeight: 2,

                    labelOrigin:
                        new google.maps.Point(0, 0)

                },

                label: {

                    text: glyph,

                    color: "#ffffff",

                    fontSize: "12px",

                    fontWeight: "700"

                },

                title

            });


        return {

            setPosition(latLng) {

                marker.setPosition(latLng);

            },

            setVisible(visible) {

                marker.setVisible(visible);

            }

        };

    }


    // ==========================================
    // ROUTE KEY
    // ==========================================

    function getRouteKey() {

        if (
            !pickupPlace ||
            !pickupPlace.geometry ||
            !destinationPlace ||
            !destinationPlace.geometry
        ) {

            return "";

        }


        const origin =
            pickupPlace.geometry.location;

        const destination =
            destinationPlace.geometry.location;


        return (
            `${origin.lat()},${origin.lng()}` +
            `|${destination.lat()},${destination.lng()}`
        );

    }


    // ==========================================
    // CALCULATE ROUTE
    // ==========================================

    function calculateRoute() {

        if (
            !directionsService ||
            !directionsRenderer
        ) {

            return;

        }


        if (
            !pickupPlace ||
            !pickupPlace.geometry ||
            !destinationPlace ||
            !destinationPlace.geometry
        ) {

            return;

        }


        const routeKey =
            getRouteKey();


        if (!routeKey) {
            return;
        }


        // --------------------------------------
        // Don't request the same route twice.
        // --------------------------------------

        if (routeKey === lastRouteKey) {

            return;

        }


        // --------------------------------------
        // Don't send overlapping requests.
        // --------------------------------------

        if (routeRequestInProgress) {

            return;

        }


        lastRouteKey = routeKey;

        routeRequestInProgress = true;

        showStatus(
            "Calculating route…"
        );


        const origin =
            pickupPlace.geometry.location;

        const destination =
            destinationPlace.geometry.location;


        directionsService.route({

            origin,

            destination,

            travelMode:
                google.maps.TravelMode.DRIVING

        }, (result, status) => {

            routeRequestInProgress = false;


            if (status !== "OK") {

                console.error(
                    "RYDE Maps: route calculation failed:",
                    status
                );

                // Allow retry if the request failed.
                lastRouteKey = "";

                showStatus(
                    "Couldn't calculate that route. " +
                    "Please check both addresses."
                );


                document.dispatchEvent(

                    new CustomEvent(
                        "ryde:route-error",
                        {
                            detail: {
                                status
                            }
                        }
                    )

                );

                return;

            }


            hideStatus();


            directionsRenderer.setDirections(
                result
            );


            const route =
                result.routes[0];


            const leg =
                route.legs[0];


            // ----------------------------------
            // Send real route information
            // to booking.js
            // ----------------------------------

            document.dispatchEvent(

                new CustomEvent(
                    "ryde:route-updated",
                    {

                        detail: {

                            distanceMeters:
                                leg.distance.value,

                            distanceText:
                                leg.distance.text,

                            durationSeconds:
                                leg.duration.value,

                            durationText:
                                leg.duration.text

                        }

                    }
                )

            );

        });

    }


    // ==========================================
    // SET PLACE
    // ==========================================

    function setPlace(target, place) {

        const isPickup =
            target === "pickup";


        const input =
            isPickup
                ? pickupInput
                : destinationInput;


        const marker =
            isPickup
                ? pickupMarker
                : destinationMarker;


        if (!place || !place.geometry) {

            return;

        }


        if (isPickup) {

            pickupPlace = place;

        } else {

            destinationPlace = place;

        }


        // --------------------------------------
        // Keep the input text clean.
        // --------------------------------------

        input.value =
            place.formatted_address ||
            place.name ||
            input.value;


        // --------------------------------------
        // Position marker.
        // --------------------------------------

        if (marker) {

            marker.setPosition(
                place.geometry.location
            );

            marker.setVisible(true);

        }


        // --------------------------------------
        // Calculate route only when both
        // addresses are available.
        // --------------------------------------

        calculateRoute();

    }


    // ==========================================
    // INITIALISE MAP
    // ==========================================

    async function initialiseMap() {

        if (mapsLoaded) {
            return;
        }


        if (mapsLoading) {
            return;
        }


        mapsLoading = true;


        try {

            console.log(
                "RYDE Maps: loading Google Maps..."
            );


            const { Map } =
                await google.maps.importLibrary(
                    "maps"
                );


            const {
                DirectionsService,
                DirectionsRenderer
            } =
                await google.maps.importLibrary(
                    "routes"
                );


            await google.maps.importLibrary(
                "places"
            );


            // ----------------------------------
            // Advanced markers optional
            // ----------------------------------

            if (MAP_ID) {

                try {

                    await google.maps.importLibrary(
                        "marker"
                    );

                    usingAdvancedMarkers = true;

                } catch (error) {

                    console.warn(
                        "RYDE Maps: marker library unavailable.",
                        error
                    );

                }

            }


            // ----------------------------------
            // Default map centre
            // ----------------------------------

            const centre = {

                lat: 51.9692,

                lng: 5.6669

            };


            const mapOptions = {

                center: centre,

                zoom: 8,

                disableDefaultUI: true,

                zoomControl: true

            };


            if (MAP_ID) {

                mapOptions.mapId =
                    MAP_ID;

            } else {

                mapOptions.styles =
                    MAP_STYLE;

            }


            // ----------------------------------
            // Create map
            // ----------------------------------

            map =
                new Map(
                    mapEl,
                    mapOptions
                );


            directionsService =
                new DirectionsService();


            directionsRenderer =
                new DirectionsRenderer({

                    map,

                    // We use our own A/B markers.
                    suppressMarkers: true,

                    polylineOptions: {

                        strokeColor:
                            "#8B7FD1",

                        strokeWeight: 5,

                        strokeOpacity: 0.9

                    }

                });


            // ----------------------------------
            // Markers
            // ----------------------------------

            pickupMarker =
                createMarker(
                    "#4CAF50",
                    "A",
                    "Pickup"
                );


            destinationMarker =
                createMarker(
                    "#8B7FD1",
                    "B",
                    "Destination"
                );


            // ==================================
            // PLACES AUTOCOMPLETE
            // ==================================

            autocompletePickup =
                new google.maps.places.Autocomplete(

                    pickupInput,

                    AUTOCOMPLETE_OPTIONS

                );


            autocompleteDestination =
                new google.maps.places.Autocomplete(

                    destinationInput,

                    AUTOCOMPLETE_OPTIONS

                );


            // ----------------------------------
            // Pickup
            // ----------------------------------

            autocompletePickup.addListener(

                "place_changed",

                () => {

                    const place =
                        autocompletePickup.getPlace();


                    if (!place.geometry) {

                        console.warn(
                            "RYDE NL Maps: pickup selection " +
                            "did not contain geometry."
                        );

                        return;

                    }


                    setPlace(
                        "pickup",
                        place
                    );


                    // Tell booking.js that the
                    // value came from autocomplete.

                    pickupInput.dispatchEvent(

                        new CustomEvent(
                            "input",
                            {
                                bubbles: true,

                                detail: {
                                    fromAutocomplete: true
                                }
                            }
                        )

                    );

                }

            );


            // ----------------------------------
            // Destination
            // ----------------------------------

            autocompleteDestination.addListener(

                "place_changed",

                () => {

                    const place =
                        autocompleteDestination.getPlace();


                    if (!place.geometry) {

                        console.warn(
                            "RYDE Maps: destination selection " +
                            "did not contain geometry."
                        );

                        return;

                    }


                    setPlace(
                        "destination",
                        place
                    );


                    destinationInput.dispatchEvent(

                        new CustomEvent(
                            "input",
                            {
                                bubbles: true,

                                detail: {
                                    fromAutocomplete: true
                                }
                            }
                        )

                    );

                }

            );


            mapsLoaded = true;

            mapsLoading = false;

            hideStatus();


            console.log(
                "RYDE NL Maps: ready."
            );


            // ==================================
            // IMPORTANT:
            //
            // We intentionally do NOT geocode
            // prefilled airport addresses here.
            //
            // booking.js remains responsible for:
            //
            // ?route=schiphol
            // ?route=eindhoven
            // etc.
            //
            // This prevents an unnecessary
            // Geocoding API request.
            // ==================================


            // ----------------------------------
            // Responsive resize
            // ----------------------------------

            let resizeTimer;


            window.addEventListener(

                "resize",

                () => {

                    clearTimeout(
                        resizeTimer
                    );


                    resizeTimer =
                        setTimeout(() => {

                            if (!map) {
                                return;
                            }


                            google.maps.event.trigger(
                                map,
                                "resize"
                            );


                            const directions =
                                directionsRenderer
                                    .getDirections();


                            if (
                                directions &&
                                directions.routes &&
                                directions.routes[0]
                            ) {

                                map.fitBounds(
                                    directions
                                        .routes[0]
                                        .bounds
                                );

                            }

                        }, 250);

                }

            );

        } catch (error) {

            mapsLoading = false;

            console.error(
                "RYDE Maps: failed to initialise.",
                error
            );


            showStatus(
                "Live map couldn't load. " +
                "Route estimates are still available."
            );

        }

    }


    // ==========================================
    // LAZY LOAD
    //
    // Google Maps isn't loaded immediately.
    //
    // It starts when the customer interacts
    // with either address field.
    // ==========================================

    let googleScriptLoading = false;


    function loadGoogleMaps() {

        if (mapsLoaded) {
            return;
        }


        if (googleScriptLoading) {
            return;
        }


        googleScriptLoading = true;

        showStatus(
            "Loading live map…"
        );


        // --------------------------------------
        // If another script already loaded Google
        // Maps, initialise directly.
        // --------------------------------------

        if (
            window.google &&
            window.google.maps
        ) {

            initialiseMap();

            return;

        }


        window.initRydeMap =
            initialiseMap;


        const script =
            document.createElement("script");


        script.src =
            `https://maps.googleapis.com/maps/api/js` +
            `?key=${encodeURIComponent(API_KEY)}` +
            `&callback=initRydeMap` +
            `&loading=async` +
            `&v=weekly`;


        script.async = true;

        script.defer = true;


        script.onerror = () => {

            googleScriptLoading = false;

            console.error(
                "RYDE Maps: Google Maps script failed to load."
            );


            showStatus(
                "Live map couldn't load. " +
                "Route estimates are still available."
            );

        };


        document.head.appendChild(
            script
        );

    }


    // ==========================================
    // START MAP ONLY WHEN ADDRESS FIELDS
    // ARE ACTUALLY USED
    // ==========================================

    pickupInput.addEventListener(
        "focus",
        loadGoogleMaps,
        { once: true }
    );


    destinationInput.addEventListener(
        "focus",
        loadGoogleMaps,
        { once: true }
    );


})();