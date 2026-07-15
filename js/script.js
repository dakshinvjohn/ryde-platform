// ==========================================
// RYDE — site interactions
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------------------------------------
       Mobile navigation toggle
    --------------------------------------- */

    const toggle = document.querySelector(".nav-toggle");
    const links = document.querySelector(".nav-links");

    if (toggle && links) {

        toggle.addEventListener("click", () => {

            const isOpen = links.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");

        });

        links.querySelectorAll("a").forEach((link) => {

            link.addEventListener("click", () => {

                links.classList.remove("is-open");
                toggle.setAttribute("aria-expanded", "false");

            });

        });

    }

    /* ---------------------------------------
       Nav gains a solid, blurred background on scroll
    --------------------------------------- */

    const nav = document.querySelector("nav");

    if (nav) {

        const onScroll = () => {

            nav.classList.toggle("is-scrolled", window.scrollY > 12);

        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });

    }

    /* ---------------------------------------
       Scroll-reveal: sections and cards rise into place
    --------------------------------------- */

    const revealEls = document.querySelectorAll(".reveal");

    if (revealEls.length) {

        if (reduceMotion || !("IntersectionObserver" in window)) {

            revealEls.forEach((el) => el.classList.add("is-visible"));

        } else {

            const io = new IntersectionObserver(
                (entries) => {

                    entries.forEach((entry) => {

                        if (entry.isIntersecting) {

                            entry.target.classList.add("is-visible");
                            io.unobserve(entry.target);

                        }

                    });

                },
                { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
            );

            revealEls.forEach((el) => io.observe(el));

        }

    }

    /* ---------------------------------------
       Hero car card — gentle 3D tilt that follows the cursor
    --------------------------------------- */

    const heroCardWrap = document.querySelector(".hero-right");
    const heroCard = document.getElementById("heroCarCard");

    if (heroCardWrap && heroCard && !reduceMotion && window.matchMedia("(hover: hover)").matches) {

        heroCardWrap.addEventListener("mousemove", (e) => {

            const rect = heroCardWrap.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;

            heroCard.style.transform =
                `rotateY(${x * 10}deg) rotateX(${y * -10}deg)`;

        });

        heroCardWrap.addEventListener("mouseleave", () => {

            heroCard.style.transform = "rotateY(0deg) rotateX(0deg)";

        });

    }

    /* ---------------------------------------
       Coverage map — route lines draw themselves in
    --------------------------------------- */

    const mapSvg = document.querySelector(".coverage-map svg");

    if (mapSvg) {

        const routeLines = mapSvg.querySelectorAll(".route-line");

        routeLines.forEach((line) => {

            const length = line.getTotalLength();
            line.style.strokeDasharray = length;
            line.style.strokeDashoffset = reduceMotion ? 0 : length;

        });

        if (!reduceMotion) {

            const mapObserver = new IntersectionObserver(
                (entries) => {

                    entries.forEach((entry) => {

                        if (entry.isIntersecting) {

                            routeLines.forEach((line, i) => {

                                line.style.transition =
                                    `stroke-dashoffset 1.1s cubic-bezier(.16,1,.3,1) ${i * 60}ms`;
                                line.style.strokeDashoffset = 0;

                            });

                            mapObserver.unobserve(entry.target);

                        }

                    });

                },
                { threshold: 0.3 }
            );

            mapObserver.observe(mapSvg);

        }

    }

    /* ---------------------------------------
       Coverage stats — count up when scrolled into view
    --------------------------------------- */

    const countEls = document.querySelectorAll("[data-count-to]");

    if (countEls.length) {

        const animateCount = (el) => {

            const target = parseInt(el.getAttribute("data-count-to"), 10) || 0;
            const suffix = el.getAttribute("data-suffix") || "";

            if (reduceMotion) {

                el.textContent = target + suffix;
                return;

            }

            const duration = 1200;
            const start = performance.now();

            const step = (now) => {

                const progress = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.round(eased * target) + suffix;

                if (progress < 1) {

                    requestAnimationFrame(step);

                }

            };

            requestAnimationFrame(step);

        };

        const countObserver = new IntersectionObserver(
            (entries) => {

                entries.forEach((entry) => {

                    if (entry.isIntersecting) {

                        animateCount(entry.target);
                        countObserver.unobserve(entry.target);

                    }

                });

            },
            { threshold: 0.6 }
        );

        countEls.forEach((el) => countObserver.observe(el));

    }

});
