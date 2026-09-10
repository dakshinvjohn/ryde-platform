// ==========================================
// RYDE - Animated Counters
// ==========================================

const counters = document.querySelectorAll(".num");

const counterObserver = new IntersectionObserver((entries, observer) => {

    entries.forEach(entry => {

        if (!entry.isIntersecting) return;

        const counter = entry.target;

        const target = Number(counter.dataset.countTo);
        const suffix = counter.dataset.suffix || "";

        let current = 0;

        const duration = 1500;
        const increment = target / (duration / 16);

        function updateCounter() {

            current += increment;

            if (current >= target) {

                counter.textContent = target + suffix;

            } else {

                counter.textContent = Math.floor(current) + suffix;

                requestAnimationFrame(updateCounter);

            }

        }

        updateCounter();

        observer.unobserve(counter);

    });

}, {

    threshold: 0.5

});

counters.forEach(counter => {

    counterObserver.observe(counter);

});