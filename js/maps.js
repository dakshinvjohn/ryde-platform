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
// - Advanced Marker support when a Map ID is configured
//
// Removed to reduce unnecessary API usage:
// - Map click-to-address
// - Draggable pins
// - Reverse geocoding
// - "My location"
// - Blur-based geocoding
//
// Communicates with booking.js through:
// - "ryde:route-updated"
// - "ryde:route-error"
// ==========================================

(function () {

    const CONFIG = window.RYDE_CONFIG || {};
    const API_KEY = CONFIG.googleMapsApiKey;
    const MAP_ID = (CONFIG.mapId || "").trim();

    const mapEl = document.getElementById("bookingMap");
    const pickupInput = document.getElementById("pickup");
    const destinationInput = document.getElementById("destination");
    const mapStatusEl = document.getElementById("bookingMapStatus");

    if (!mapEl || !pickupInput || !destinationInput) return;


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
    // API KEY CHECK
    // ==========================================

    if (!API_KEY) {

        console.warn("RYDE Maps: no API key configured.");

        showStatus("Live map coming soon...");

        return;

    }


    // ==========================================
    // GOOGLE AUTH FAILURE
    // ==========================================

    window.gm_authFailure = function () {

        console.error(
            "RYDE Maps: Google rejected the API key. " +
            "Check the API key restrictions, enabled APIs and billing."
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
            stylers: [{ color: "#f4f1fb" }]
        },

        {
            elementType: "labels.text.fill",
            stylers: [{ color: "#6e6780" }]
        },

        {
            elementType: "labels.text.stroke",
            stylers: [{ color: "#ffffff" }]
        },

        {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }]
        },

        {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#e4dff5" }]
        },

        {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#d9d2f0" }]
        },

        {
            featureType: "poi",
            stylers: [{ visibility: "off" }]
        },

        {
            featureType: "transit",
            stylers: [{ visibility: "off" }]
        }

    ];


    // ==========================================
    // STATE
    // ==========================================

    let map;
    let directionsService;
    let directionsRenderer;

    let autocompletePickup;
    let autocompleteDestination;

    let pickupPlace = null;
    let destinationPlace = null;

    let pickupMarker;
    let destinationMarker;

    let usingAdvancedMarkers = false;

    // Prevent duplicate route requests when both
    // Places events and other form events fire close together.
    let routeRequestInProgress = false;
    let routeRequestTimer = null;

    // Prevent calculating the exact same route repeatedly.
    let lastRouteKey = "";


    // ==========================================
    // AUTOCOMPLETE
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

                const pin = new google.maps.marker.PinElement({

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
                        marker.map = visible ? map : null;
                    }

                };

            } catch (error) {

                console.warn(
                    "RYDE Maps: AdvancedMarkerElement unavailable. " +
                    "Using classic marker.",
                    error
                );

                usingAdvancedMarkers = false;

            }

        }


        // --------------------------------------
        // Classic Marker fallback
        // --------------------------------------

        const marker = new google.maps.Marker({

            map: null,

            visible: false,

            icon: {

                path: google.maps.SymbolPath.CIRCLE,

                scale: 10,

                fillColor: color,

                fillOpacity: 1,

                strokeColor: "#ffffff",

                strokeWeight: 2,

                labelOrigin: new google.maps.Point(0, 0)

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
    // ROUTE
    // ==========================================

    function calculateRoute() {

        if (
            !pickupPlace ||
            !pickupPlace.geometry ||
            !destinationPlace ||
            !destinationPlace.geometry
        ) {

            return;

        }


        const origin =
            pickupPlace.geometry.location;

        const destination =
            destinationPlace.geometry.location;


        // --------------------------------------
        // Create a simple route key.
        //
        // If the customer selects the same
        // addresses again, don't call Routes
        // unnecessarily.
        // --------------------------------------

        const routeKey =
            `${origin.lat()},${origin.lng()}|${destination.lat()},${destination.lng()}`;


        if (routeKey === lastRouteKey) {

            return;

        }


        if (routeRequestInProgress) {

            return;

        }


        lastRouteKey = routeKey;

        routeRequestInProgress = true;

        showStatus("Calculating route…");


        directionsService.route({

            origin,

            destination,

            travelMode: google.maps.TravelMode.DRIVING

        }, (result, status) => {

            routeRequestInProgress = false;


            if (status !== "OK") {

                console.error(
                    "RYDE Maps: route calculation failed:",
                    status
                );

                // Allow another attempt after a failed request.
                lastRouteKey = "";

                showStatus(
                    "Couldn't calculate that route. Please check both addresses."
                );

                document.dispatchEvent(

                    new CustomEvent("ryde:route-error", {

                        detail: {
                            status
                        }

                    })

                );

                return;

            }


            hideStatus();

            directionsRenderer.setDirections(result);


            const leg =
                result.routes[0].legs[0];


            // ----------------------------------
            // Send route information to booking.js
            // ----------------------------------

            document.dispatchEvent(

                new CustomEvent("ryde:route-updated", {

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

                })

            );

        });

    }


    // ==========================================
    // ROUTE REQUEST DEBOUNCE
    // ==========================================

    function scheduleRouteCalculation() {

        clearTimeout(routeRequestTimer);

        routeRequestTimer = setTimeout(() => {

            calculateRoute();

        }, 150);

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


        if (isPickup) {

            pickupPlace = place;

        } else {

            destinationPlace = place;

        }


        if (
            place.formatted_address ||
            place.name
        ) {

            input.value =
                place.formatted_address ||
                place.name;

        }


        marker.setPosition(
            place.geometry.location
        );

        marker.setVisible(true);


        scheduleRouteCalculation();

    }


    // ==========================================
    // INITIALISE GOOGLE MAPS
    // ==========================================

    async function initRydeMap() {

        console.log(
            "RYDE Maps: Google Maps loaded. Initialising..."
        );


        try {

            // ----------------------------------
            // Load only the libraries we need
            // ----------------------------------

            const { Map } =
                await google.maps.importLibrary("maps");


            const { DirectionsService, DirectionsRenderer } =
                await google.maps.importLibrary("routes");


            await google.maps.importLibrary("places");


            // ----------------------------------
            // Advanced markers are optional
            // ----------------------------------

            if (MAP_ID) {

                try {

                    await google.maps.importLibrary("marker");

                    usingAdvancedMarkers = true;

                } catch (error) {

                    console.warn(
                        "RYDE Maps: marker library unavailable. " +
                        "Using classic markers.",
                        error
                    );

                }

            }


            // ----------------------------------
            // Default centre
            // ----------------------------------

            const centre = {

                lat: 51.9692,
                lng: 5.6669

            };


            // ----------------------------------
            // Map options
            // ----------------------------------

            const mapOptions = {

                center: centre,

                zoom: 8,

                disableDefaultUI: true,

                zoomControl: true

            };


            if (MAP_ID) {

                mapOptions.mapId = MAP_ID;

            } else {

                mapOptions.styles = MAP_STYLE;

            }


            // ----------------------------------
            // Create map
            // ----------------------------------

            map =
                new Map(
                    mapEl,
                    mapOptions
                );


            // ----------------------------------
            // Directions
            // ----------------------------------

            directionsService =
                new DirectionsService();


            directionsRenderer =
                new DirectionsRenderer({

                    map,

                    suppressMarkers: true,

                    polylineOptions: {

                        strokeColor: "#8B7FD1",

                        strokeWeight: 5,

                        strokeOpacity: 0.9

                    }

                });


            // ----------------------------------
            // Custom markers
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
            // Pickup selected
            // ----------------------------------

            autocompletePickup.addListener(

                "place_changed",

                () => {

                    const place =
                        autocompletePickup.getPlace();


                    if (!place.geometry) {

                        console.warn(
                            "RYDE Maps: pickup place has no geometry."
                        );

                        return;

                    }


                    setPlace(
                        "pickup",
                        place
                    );


                    // Tell booking.js that the address
                    // came from Google Places.
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
            // Destination selected
            // ----------------------------------

            autocompleteDestination.addListener(

                "place_changed",

                () => {

                    const place =
                        autocompleteDestination.getPlace();


                    if (!place.geometry) {

                        console.warn(
                            "RYDE Maps: destination place has no geometry."
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


            // ----------------------------------
            // Initial state
            // ----------------------------------

            hideStatus();


            // ----------------------------------
            // Handle pre-filled booking routes
            //
            // We deliberately DO NOT geocode these
            // automatically because that would create
            // another unnecessary Geocoding API call.
            //
            // If booking.js pre-fills addresses,
            // the user can select them from autocomplete.
            // ----------------------------------

            console.log(
                "RYDE Maps: ready. " +
                "Select pickup and destination to calculate the route."
            );


            // ----------------------------------
            // Responsive map resize
            // ----------------------------------

            let resizeTimer;


            window.addEventListener(

                "resize",

                () => {

                    clearTimeout(resizeTimer);


                    resizeTimer =
                        setTimeout(() => {

                            if (!map) return;


                            google.maps.event.trigger(
                                map,
                                "resize"
                            );


                            const directions =
                                directionsRenderer.getDirections();


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

                            } else {

                                map.setCenter(
                                    centre
                                );

                            }

                        }, 250);

                }

            );

        } catch (error) {

            console.error(
                "RYDE Maps: failed to initialise.",
                error
            );


            showStatus(
                "Live map couldn't load. Route estimates are still available."
            );

        }

    }


    // ==========================================
    // GOOGLE CALLBACK
    // ==========================================

    window.initRydeMap =
        initRydeMap;


    // ==========================================
    // LOAD GOOGLE MAPS
    // ==========================================

    showStatus(
        "Loading live map…"
    );


    const script =
        document.createElement("script");


    script.src =
        `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(API_KEY)}&callback=initRydeMap&loading=async&v=weekly`;


    script.async = true;

    script.defer = true;


    script.onerror = () => {

        console.error(
            "RYDE Maps: Google Maps script failed to load."
        );


        showStatus(
            "Live map couldn't load. Route estimates are still available."
        );

    };


    document.head.appendChild(script);

})();