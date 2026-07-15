// ==========================================
// RYDE — Recent searches (Phase 4)
//
// Remembers the last few pickup/destination values a visitor has
// used (this browser only, via localStorage) and offers them as
// quick-pick chips when a field is focused empty. Works whether or
// not Google Maps is configured — it just fills the input and lets
// the existing autocomplete/geocode/static-route logic take it from
// there.
// ==========================================

(function () {

    const STORAGE_KEY = "ryde_recent_locations";
    const MAX_ITEMS = 5;

    const pickupInput = document.getElementById("pickup");
    const destinationInput = document.getElementById("destination");
    const pickupRecent = document.getElementById("pickupRecent");
    const destinationRecent = document.getElementById("destinationRecent");

    if (!pickupInput || !destinationInput) return;

    function loadRecents() {

        try {

            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];

        } catch (e) {

            return []; // private browsing / storage disabled — feature just no-ops

        }

    }

    function saveRecent(value) {

        value = (value || "").trim();
        if (!value) return;

        let list = loadRecents().filter((v) => v.toLowerCase() !== value.toLowerCase());
        list.unshift(value);
        list = list.slice(0, MAX_ITEMS);

        try {

            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

        } catch (e) {

            // storage full/unavailable — not worth surfacing to the user

        }

    }

    function renderChips(container, input) {

        if (!container) return;

        const recents = loadRecents();
        container.innerHTML = "";

        if (!recents.length) {

            container.hidden = true;
            return;

        }

        recents.forEach((value) => {

            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "recent-chip";
            chip.textContent = value;

            // mousedown (not click) fires before the input's blur
            // handler, so the value is set before anything else reacts
            chip.addEventListener("mousedown", (e) => {

                e.preventDefault();

                input.value = value;
                input.dispatchEvent(new Event("input", { bubbles: true }));
                input.dispatchEvent(new Event("blur", { bubbles: true }));

                container.hidden = true;

            });

            container.appendChild(chip);

        });

        container.hidden = false;

    }

    function wireField(input, container) {

        input.addEventListener("focus", () => {

            if (!input.value.trim()) renderChips(container, input);

        });

        input.addEventListener("blur", () => {

            // short delay so a chip's mousedown can still land before
            // the list disappears
            setTimeout(() => { if (container) container.hidden = true; }, 150);

            if (input.value.trim()) saveRecent(input.value.trim());

        });

    }

    wireField(pickupInput, pickupRecent);
    wireField(destinationInput, destinationRecent);

})();
