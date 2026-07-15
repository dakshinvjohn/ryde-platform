// ==========================================
// RYDE - Mobile Navigation
// ==========================================

const navToggle = document.querySelector(".nav-toggle");
const mobileNav = document.querySelector(".mobile-nav");
const navOverlay = document.querySelector(".nav-overlay");
const closeButton = document.querySelector(".mobile-close");
const mobileLinks = document.querySelectorAll(".mobile-links a");

// Only run if the navigation exists
if (navToggle && mobileNav && navOverlay && closeButton) {

    // ==========================
    // Open Menu
    // ==========================

    function openMenu() {

        mobileNav.classList.add("active");
        navOverlay.classList.add("active");

        navToggle.setAttribute("aria-expanded", "true");
        mobileNav.setAttribute("aria-hidden", "false");

        document.body.style.overflow = "hidden";

    }

    // ==========================
    // Close Menu
    // ==========================

    function closeMenu() {

        mobileNav.classList.remove("active");
        navOverlay.classList.remove("active");

        navToggle.setAttribute("aria-expanded", "false");
        mobileNav.setAttribute("aria-hidden", "true");

        document.body.style.overflow = "";

    }

    // ==========================
    // Toggle Button
    // ==========================

    navToggle.addEventListener("click", () => {

        if (mobileNav.classList.contains("active")) {

            closeMenu();

        } else {

            openMenu();

        }

    });

    // ==========================
    // Close Button
    // ==========================

    closeButton.addEventListener("click", closeMenu);

    // ==========================
    // Overlay
    // ==========================

    navOverlay.addEventListener("click", closeMenu);

    // ==========================
    // Close After Clicking Link
    // ==========================

    mobileLinks.forEach(link => {

        link.addEventListener("click", closeMenu);

    });

    // ==========================
    // Escape Key
    // ==========================

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {

            closeMenu();

        }

    });

}