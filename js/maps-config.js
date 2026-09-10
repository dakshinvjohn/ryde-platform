// ==========================================
// RYDE — Google Maps configuration
//
// Add a Google Maps JavaScript API key below to enable the live
// route map, Places autocomplete and real distance/duration on the
// booking page. Get one at:
// https://console.cloud.google.com/google/maps-apis/credentials
//
// APIs to enable on that key (all under "Google Maps Platform"):
//   - Maps JavaScript API
//   - Places API (New)
//   - Directions API / Routes API
//   - Geocoding API
//
// Also restrict the key to your domain (HTTP referrers) before
// going live, and set a billing alert — these APIs are pay-per-use
// after the monthly free tier.
//
// Until a real key is added below, the booking page falls back to
// the static demo estimates from booking.js — nothing breaks.
//
// OPTIONAL — Map ID for nicer pins:
// Leave mapId blank and everything still works with the classic
// round pins. Create a Map ID at
// https://console.cloud.google.com/google/maps-apis/studio/maps
// (any style — even the default) and paste its ID below to switch
// to real teardrop-shaped, drag-friendly pins. Note: once a Map ID
// is set, Google's cloud-based styling takes over from the JSON
// style array below in js/maps.js — recreate the lavender look in
// the Map Style editor in Cloud Console if you want to keep it.
// ==========================================

window.RYDE_CONFIG = {
    googleMapsApiKey: "AIzaSyBG-LF3pE_ZtRgXscFO7sefJeW1nQ8CGIg",
    mapId: ""
};
