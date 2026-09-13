// RYDE — persist live Google Maps route details with the booking request.
// Loaded before booking.js so the existing booking submit payload is augmented
// without adding another Maps API request.
(function () {
    let latestRoute = null;

    document.addEventListener("ryde:route-updated", (event) => {
        const detail = event.detail || {};
        const distanceMeters = Number(detail.distanceMeters);
        const durationSeconds = Number(detail.durationSeconds);

        if (!Number.isFinite(distanceMeters) || !Number.isFinite(durationSeconds)) {
            latestRoute = null;
            return;
        }

        latestRoute = {
            distanceKm: Math.round((distanceMeters / 1000) * 100) / 100,
            distanceText: String(detail.distanceText || ""),
            durationMinutes: Math.round(durationSeconds / 60),
            durationText: String(detail.durationText || "")
        };
    });

    document.addEventListener("ryde:route-error", () => {
        latestRoute = null;
    });

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input, init = {}) => {
        const url = typeof input === "string" ? input : input?.url || "";

        if (!url.includes("/api/create-booking") || !init.body || !latestRoute) {
            return originalFetch(input, init);
        }

        try {
            const payload = JSON.parse(init.body);
            payload.distanceKm = latestRoute.distanceKm;
            payload.distanceText = latestRoute.distanceText;
            payload.durationMinutes = latestRoute.durationMinutes;
            payload.durationText = latestRoute.durationText;
            init = { ...init, body: JSON.stringify(payload) };
        } catch (error) {
            console.warn("RYDE: could not attach route details to booking request.", error);
        }

        return originalFetch(input, init);
    };
})();
