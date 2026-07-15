// ==========================================
// RYDE - Active Navigation
// ==========================================

const sections = document.querySelectorAll("main section[id]");

const desktopLinks = document.querySelectorAll(".nav-links a");

const mobileLinks = document.querySelectorAll(".mobile-links a");

const observerOptions = {

    rootMargin: "-45% 0px -45% 0px",

    threshold: 0

};

const sectionObserver = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if (!entry.isIntersecting) return;

        const currentId = entry.target.id;

        // Desktop navigation

        desktopLinks.forEach(link => {

            link.classList.remove("active");

            if (link.getAttribute("href") === `#${currentId}`) {

                link.classList.add("active");

            }

        });

        // Mobile navigation

        mobileLinks.forEach(link => {

            link.classList.remove("active");

            if (link.getAttribute("href") === `#${currentId}`) {

                link.classList.add("active");

            }

        });

    });

}, observerOptions);

sections.forEach(section => {

    sectionObserver.observe(section);

});