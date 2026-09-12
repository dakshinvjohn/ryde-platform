document.addEventListener("DOMContentLoaded", () => {

    const TOKEN_KEY = "ryde_admin_token";

    const loginScreen = document.getElementById("adminLoginScreen");
    const loginForm = document.getElementById("adminLoginForm");
    const passwordInput = document.getElementById("adminPassword");
    const loginBtn = document.getElementById("adminLoginBtn");
    const loginError = document.getElementById("adminLoginError");

    const app = document.getElementById("adminApp");
    const loadError = document.getElementById("adminLoadError");
    const kpiGrid = document.getElementById("adminKpiGrid");
    const chartEl = document.getElementById("adminChart");
    const tableBody = document.getElementById("adminTableBody");
    const tableEmpty = document.getElementById("adminTableEmpty");
    const refreshBtn = document.getElementById("adminRefreshBtn");
    const logoutBtn = document.getElementById("adminLogoutBtn");
    const searchInput = document.getElementById("adminSearch");
    const statusFilter = document.getElementById("adminStatusFilter");
    const typeFilter = document.getElementById("adminTypeFilter");

    /* ---------------------------------------
       Calendar elements
    --------------------------------------- */

    const calendarDaysEl =
        document.getElementById("adminCalendarDays");

    const calendarGridEl =
        document.getElementById("adminCalendarGrid");

    const calendarTitleEl =
        document.getElementById("adminCalendarTitle");

    const calendarPrevBtn =
        document.getElementById("adminCalendarPrev");

    const calendarTodayBtn =
        document.getElementById("adminCalendarToday");

    const calendarNextBtn =
        document.getElementById("adminCalendarNext");


    let allBookings = [];
    let calendarDate = new Date();


    /* ---------------------------------------
       Auth
    --------------------------------------- */

    const getToken = () =>
        sessionStorage.getItem(TOKEN_KEY);

    const setToken = (token) =>
        sessionStorage.setItem(TOKEN_KEY, token);

    const clearToken = () =>
        sessionStorage.removeItem(TOKEN_KEY);


    const showLogin = (message = "") => {

        clearToken();

        app.hidden = true;
        loginScreen.hidden = false;

        if (message) {
            loginError.textContent = message;
            loginError.hidden = false;
        } else {
            loginError.textContent = "";
            loginError.hidden = true;
        }

    };


    const showApp = () => {

        loginScreen.hidden = true;
        app.hidden = false;

    };


    /* ---------------------------------------
       Login
    --------------------------------------- */

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        loginError.hidden = true;
        loginError.textContent = "";

        loginBtn.disabled = true;
        loginBtn.textContent = "Logging in…";

        try {

            const res = await fetch("/api/admin-login", {
                method: "POST",
                cache: "no-store",
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-cache"
                },
                body: JSON.stringify({
                    password: passwordInput.value
                })
            });

            const text = await res.text();

            let result = {};

            try {
                result = text ? JSON.parse(text) : {};
            } catch {
                throw new Error(
                    "The server returned an invalid response."
                );
            }

            if (!res.ok) {
                throw new Error(
                    result.error || "Couldn't log in."
                );
            }

            if (!result.token) {
                throw new Error(
                    "Login succeeded but no session token was returned."
                );
            }

            setToken(result.token);

            passwordInput.value = "";

            showApp();

            await loadDashboard();

        } catch (err) {

            console.error(
                "RYDE admin login failed:",
                err
            );

            showLogin(
                err.message ||
                "Couldn't log in. Please try again."
            );

        } finally {

            loginBtn.disabled = false;
            loginBtn.textContent = "Log in";

        }

    });


    logoutBtn.addEventListener(
        "click",
        () => showLogin()
    );


    /* ---------------------------------------
       Authenticated API requests
    --------------------------------------- */

    const authedFetch = (url, options = {}) => {

        return fetch(url, {
            ...options,

            cache: "no-store",

            headers: {
                ...(options.headers || {}),
                Authorization: `Bearer ${getToken()}`,
                "Cache-Control": "no-cache"
            }
        });

    };


    /* ---------------------------------------
       Formatting
    --------------------------------------- */

    const eur = (n) =>
        `€${Math.round(
            Number(n) || 0
        ).toLocaleString("en-NL")}`;


    const formatDateTime = (iso) => {

        const d = new Date(iso);

        if (isNaN(d.getTime())) {
            return iso || "—";
        }

        return (
            d.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short"
            }) +
            ", " +
            d.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit"
            })
        );

    };


    function escapeHtml(str) {

        return String(str ?? "").replace(
            /[&<>"']/g,
            (c) => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[c])
        );

    }


    /* =======================================
       KPI CARDS
    ======================================= */

    const renderKpis = (stats = {}) => {

        const cards = [

            {
                label: "Total bookings",
                value: stats.totalBookings || 0,
                sub:
                    `${stats.rideCount || 0} rides · ` +
                    `${stats.movingCount || 0} moves`
            },

            {
                label: "Total revenue",
                value: eur(stats.totalRevenue),
                sub:
                    `${stats.paidCount || 0} paid · ` +
                    `${stats.unpaidCount || 0} unpaid`
            },

            {
                label: "Paid revenue",
                value: eur(stats.paidRevenue),
                sub: "Collected so far"
            },

            {
                label: "Awaiting payment",
                value: eur(stats.unpaidRevenue),
                sub:
                    `${stats.unpaidCount || 0} bookings`
            },

            {
                label: "Today",
                value: stats.todayCount || 0,
                sub: eur(stats.todayRevenue)
            },

            {
                label: "Last 7 days",
                value: stats.last7DaysCount || 0,
                sub: eur(stats.last7DaysRevenue)
            },

            {
                label: "Last 30 days",
                value: stats.last30DaysCount || 0,
                sub: eur(stats.last30DaysRevenue)
            }

        ];


        kpiGrid.innerHTML = cards.map((c) => `

            <div class="admin-kpi-card">

                <p class="admin-kpi-label">
                    ${escapeHtml(c.label)}
                </p>

                <p class="admin-kpi-value">
                    ${escapeHtml(c.value)}
                </p>

                <p class="admin-kpi-sub">
                    ${escapeHtml(c.sub)}
                </p>

            </div>

        `).join("");

    };


    /* =======================================
       CHART
    ======================================= */

    const renderChart = (daily = []) => {

        const maxCount = Math.max(
            1,
            ...daily.map(
                d => Number(d.count) || 0
            )
        );


        chartEl.innerHTML = daily.map((d) => {

            const count =
                Number(d.count) || 0;

            const revenue =
                Number(d.revenue) || 0;

            const heightPct =
                Math.max(
                    4,
                    Math.round(
                        (count / maxCount) * 100
                    )
                );


            const date =
                new Date(
                    `${d.date}T00:00:00`
                );


            const label =
                isNaN(date.getTime())
                    ? d.date
                    : date.toLocaleDateString(
                        "en-GB",
                        {
                            day: "numeric",
                            month: "short"
                        }
                    );


            return `

                <div
                    class="admin-chart-bar"
                    title="${escapeHtml(
                        `${label}: ${count} booking${
                            count === 1 ? "" : "s"
                        }, ${eur(revenue)}`
                    )}"
                >

                    <div
                        class="admin-chart-bar-fill"
                        style="height:${heightPct}%"
                    ></div>

                    <span class="admin-chart-bar-label">
                        ${escapeHtml(label)}
                    </span>

                </div>

            `;

        }).join("");

    };


    /* =======================================
       BOOKINGS TABLE
    ======================================= */

    const renderTable = () => {

        const search =
            searchInput.value
                .trim()
                .toLowerCase();

        const status =
            statusFilter.value;

        const type =
            typeFilter.value;


        const filtered =
            allBookings.filter((b) => {

                if (
                    status !== "all" &&
                    b.payment_status !== status
                ) {
                    return false;
                }


                if (
                    type !== "all" &&
                    b.booking_type !== type
                ) {
                    return false;
                }


                if (search) {

                    const haystack = [
                        b.full_name,
                        b.email,
                        b.phone,
                        b.pickup,
                        b.destination,
                        b.booking_reference
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    if (
                        !haystack.includes(search)
                    ) {
                        return false;
                    }

                }


                return true;

            });


        tableEmpty.hidden =
            filtered.length !== 0;


        tableBody.innerHTML =
            filtered.map((b) => `

                <tr>

                    <td>
                        ${formatDateTime(
                            b.created_at
                        )}
                    </td>


                    <td>

                        <span class="admin-table-name">
                            ${escapeHtml(
                                b.full_name
                            )}
                        </span>

                        <span class="admin-table-sub">
                            ${escapeHtml(
                                b.email
                            )}
                        </span>

                        <span class="admin-table-sub">
                            ${escapeHtml(
                                b.phone
                            )}
                        </span>

                    </td>


                    <td>

                        ${escapeHtml(
                            b.pickup
                        )}

                        →

                        ${escapeHtml(
                            b.destination
                        )}

                        <span class="admin-table-sub">

                            ${escapeHtml(
                                b.passengers ?? 0
                            )}

                            pax ·

                            ${escapeHtml(
                                b.luggage ?? 0
                            )}

                            bags ·

                            ${escapeHtml(
                                b.vehicle
                            )}

                        </span>

                    </td>


                    <td>

                        ${
                            b.booking_date
                                ? formatDateTime(
                                    `${b.booking_date}T${
                                        b.booking_time ||
                                        "00:00"
                                    }`
                                )
                                : "—"
                        }

                    </td>


                    <td>

                        ${
                            b.booking_type === "moving"
                                ? "Moving"
                                : "Ride"
                        }

                    </td>


                    <td>
                        ${eur(b.fare_eur)}
                    </td>


                    <td>

                        <span
                            class="admin-status-pill ${
                                b.payment_status === "paid"
                                    ? "is-paid"
                                    : "is-unpaid"
                            }"
                        >

                            ${
                                b.payment_status === "paid"
                                    ? "Paid"
                                    : "Unpaid"
                            }

                        </span>

                    </td>


                    <td>

                        <button
                            class="admin-status-toggle"
                            data-id="${escapeHtml(b.id)}"
                            data-next="${
                                b.payment_status === "paid"
                                    ? "unpaid"
                                    : "paid"
                            }"
                            type="button"
                        >

                            Mark ${
                                b.payment_status === "paid"
                                    ? "unpaid"
                                    : "paid"
                            }

                        </button>

                    </td>

                </tr>

            `).join("");

    };


    /* =======================================
       DRIVER CALENDAR
    ======================================= */

    const getMonday = (date) => {

        const d = new Date(date);

        const day = d.getDay();

        const diff =
            day === 0
                ? -6
                : 1 - day;

        d.setDate(
            d.getDate() + diff
        );

        d.setHours(
            0,
            0,
            0,
            0
        );

        return d;

    };


    const formatCalendarDate = (date) => {

        return date.toLocaleDateString(
            "en-GB",
            {
                day: "numeric",
                month: "short"
            }
        );

    };


    const formatCalendarTime = (time) => {

        if (!time) {
            return "";
        }

        const parts =
            String(time).split(":");

        return `${parts[0]}:${parts[1]}`;

    };


    const getBookingDateTime = (booking) => {

        if (!booking.booking_date) {
            return null;
        }

        const time =
            booking.booking_time ||
            "00:00:00";

        const date =
            new Date(
                `${booking.booking_date}T${time}`
            );

        return isNaN(date.getTime())
            ? null
            : date;

    };


    const renderCalendar = () => {

        if (
            !calendarDaysEl ||
            !calendarGridEl ||
            !calendarTitleEl
        ) {
            return;
        }


        const monday =
            getMonday(calendarDate);


        const days = [];


        for (let i = 0; i < 7; i++) {

            const d =
                new Date(monday);

            d.setDate(
                monday.getDate() + i
            );

            days.push(d);

        }


        const weekStart =
            days[0];

        const weekEnd =
            days[6];


        calendarTitleEl.textContent =
            `${formatCalendarDate(
                weekStart
            )} – ${formatCalendarDate(
                weekEnd
            )} ${weekEnd.getFullYear()}`;


        /* Day headings */

        calendarDaysEl.innerHTML = `

            <div></div>

            ${days.map((d) => {

                const today =
                    d.toDateString() ===
                    new Date().toDateString();


                return `

                    <div
                        class="admin-calendar-day ${
                            today
                                ? "is-today"
                                : ""
                        }"
                    >

                        ${d.toLocaleDateString(
                            "en-GB",
                            {
                                weekday: "short"
                            }
                        )}

                        <strong>
                            ${d.getDate()}
                        </strong>

                    </div>

                `;

            }).join("")}

        `;


        /* Time grid */

        const hours = [];

        for (
            let hour = 6;
            hour <= 23;
            hour++
        ) {
            hours.push(hour);
        }


        let html = "";


        hours.forEach((hour) => {

            html += `

                <div class="admin-calendar-time">

                    ${String(hour).padStart(
                        2,
                        "0"
                    )}:00

                </div>

            `;


            days.forEach((d) => {

                const today =
                    d.toDateString() ===
                    new Date().toDateString();


                const dateKey =
                    [
                        d.getFullYear(),
                        String(
                            d.getMonth() + 1
                        ).padStart(2, "0"),
                        String(
                            d.getDate()
                        ).padStart(2, "0")
                    ].join("-");


                html += `

                    <div
                        class="admin-calendar-column ${
                            today
                                ? "is-today"
                                : ""
                        }"
                    >

                `;


                const dayBookings =
                    allBookings.filter(
                        (booking) =>
                            booking.booking_date ===
                            dateKey
                    );


                dayBookings.forEach(
                    (booking) => {

                        const bookingDateTime =
                            getBookingDateTime(
                                booking
                            );


                        if (
                            !bookingDateTime
                        ) {
                            return;
                        }


                        const bookingHour =
                            bookingDateTime.getHours();


                        const bookingMinutes =
                            bookingDateTime.getMinutes();


                        if (
                            bookingHour !==
                            hour
                        ) {
                            return;
                        }


                        const type =
                            booking.booking_type ===
                            "moving"
                                ? "is-moving"
                                : "";


                        html += `

                            <button
                                type="button"
                                class="admin-calendar-booking ${type}"
                                style="top:${bookingMinutes}px;"
                                data-booking-id="${escapeHtml(
                                    booking.id
                                )}"
                            >

                                <div class="admin-calendar-booking-time">

                                    ${escapeHtml(
                                        formatCalendarTime(
                                            booking.booking_time
                                        )
                                    )}

                                </div>


                                <div class="admin-calendar-booking-name">

                                    ${escapeHtml(
                                        booking.full_name
                                    )}

                                </div>


                                <div class="admin-calendar-booking-route">

                                    ${escapeHtml(
                                        booking.pickup
                                    )}

                                    →

                                    ${escapeHtml(
                                        booking.destination
                                    )}

                                </div>


                                <div class="admin-calendar-booking-meta">

                                    ${
                                        booking.booking_type ===
                                        "moving"
                                            ? "MOVING"
                                            : "RIDE"
                                    }

                                    ·

                                    ${
                                        Number(
                                            booking.passengers
                                        ) || 0
                                    }

                                    pax

                                </div>

                            </button>

                        `;

                    }
                );


                html += `</div>`;

            });

        });


        calendarGridEl.innerHTML =
            html;

    };


    /* =======================================
       Calendar booking details
    ======================================= */

    const showCalendarBooking =
        (booking) => {

            const existing =
                document.querySelector(
                    ".admin-calendar-detail"
                );


            if (existing) {
                existing.remove();
            }


            const modal =
                document.createElement(
                    "div"
                );


            modal.className =
                "admin-calendar-detail";


            modal.innerHTML = `

                <div class="admin-calendar-detail-card">

                    <h3>
                        ${escapeHtml(
                            booking.full_name
                        )}
                    </h3>


                    <p class="admin-calendar-detail-route">

                        ${escapeHtml(
                            booking.pickup
                        )}

                        →

                        ${escapeHtml(
                            booking.destination
                        )}

                    </p>


                    <div class="admin-calendar-detail-row">

                        <span class="admin-calendar-detail-label">
                            Date
                        </span>

                        <span class="admin-calendar-detail-value">

                            ${escapeHtml(
                                booking.booking_date ||
                                "—"
                            )}

                        </span>

                    </div>


                    <div class="admin-calendar-detail-row">

                        <span class="admin-calendar-detail-label">
                            Pickup time
                        </span>

                        <span class="admin-calendar-detail-value">

                            ${escapeHtml(
                                formatCalendarTime(
                                    booking.booking_time
                                ) || "—"
                            )}

                        </span>

                    </div>


                    <div class="admin-calendar-detail-row">

                        <span class="admin-calendar-detail-label">
                            Phone
                        </span>

                        <span class="admin-calendar-detail-value">

                            ${escapeHtml(
                                booking.phone ||
                                "—"
                            )}

                        </span>

                    </div>


                    <div class="admin-calendar-detail-row">

                        <span class="admin-calendar-detail-label">
                            Passengers
                        </span>

                        <span class="admin-calendar-detail-value">

                            ${escapeHtml(
                                booking.passengers ??
                                "—"
                            )}

                        </span>

                    </div>


                    <div class="admin-calendar-detail-row">

                        <span class="admin-calendar-detail-label">
                            Luggage
                        </span>

                        <span class="admin-calendar-detail-value">

                            ${escapeHtml(
                                booking.luggage ??
                                "—"
                            )}

                        </span>

                    </div>


                    <div class="admin-calendar-detail-row">

                        <span class="admin-calendar-detail-label">
                            Vehicle
                        </span>

                        <span class="admin-calendar-detail-value">

                            ${escapeHtml(
                                booking.vehicle ||
                                "—"
                            )}

                        </span>

                    </div>


                    <div class="admin-calendar-detail-row">

                        <span class="admin-calendar-detail-label">
                            Fare
                        </span>

                        <span class="admin-calendar-detail-value">

                            ${eur(
                                booking.fare_eur
                            )}

                        </span>

                    </div>


                    <div class="admin-calendar-detail-row">

                        <span class="admin-calendar-detail-label">
                            Payment
                        </span>

                        <span class="admin-calendar-detail-value">

                            ${escapeHtml(
                                booking.payment_status ||
                                "—"
                            )}

                        </span>

                    </div>


                    <div class="admin-calendar-detail-row">

                        <span class="admin-calendar-detail-label">
                            Type
                        </span>

                        <span class="admin-calendar-detail-value">

                            ${
                                booking.booking_type ===
                                "moving"
                                    ? "Moving"
                                    : "Ride"
                            }

                        </span>

                    </div>


                    <div
                        style="
                            margin-top:20px;
                            text-align:right;
                        "
                    >

                        <button
                            type="button"
                            class="btn btn-secondary"
                            data-calendar-close
                        >
                            Close
                        </button>

                    </div>

                </div>

            `;


            modal.addEventListener(
                "click",
                (event) => {

                    if (
                        event.target === modal ||
                        event.target.closest(
                            "[data-calendar-close]"
                        )
                    ) {
                        modal.remove();
                    }

                }
            );


            document.body.appendChild(
                modal
            );

        };


    calendarGridEl?.addEventListener(
        "click",
        (event) => {

            const button =
                event.target.closest(
                    ".admin-calendar-booking"
                );


            if (!button) {
                return;
            }


            const booking =
                allBookings.find(
                    (b) =>
                        String(b.id) ===
                        button.dataset.bookingId
                );


            if (booking) {
                showCalendarBooking(
                    booking
                );
            }

        }
    );


    calendarPrevBtn?.addEventListener(
        "click",
        () => {

            calendarDate.setDate(
                calendarDate.getDate() - 7
            );

            renderCalendar();

        }
    );


    calendarNextBtn?.addEventListener(
        "click",
        () => {

            calendarDate.setDate(
                calendarDate.getDate() + 7
            );

            renderCalendar();

        }
    );


    calendarTodayBtn?.addEventListener(
        "click",
        () => {

            calendarDate =
                new Date();

            renderCalendar();

        }
    );


    /* =======================================
       Payment status update
    ======================================= */

    tableBody.addEventListener(
        "click",
        async (e) => {

            const btn =
                e.target.closest(
                    ".admin-status-toggle"
                );


            if (!btn) {
                return;
            }


            const id =
                btn.getAttribute("data-id");

            const nextStatus =
                btn.getAttribute("data-next");


            btn.disabled = true;

            loadError.hidden = true;


            try {

                const res =
                    await authedFetch(
                        "/api/admin-update-booking",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
                            body: JSON.stringify({
                                id,
                                paymentStatus:
                                    nextStatus
                            })
                        }
                    );


                const text =
                    await res.text();


                let result = {};

                try {
                    result =
                        text
                            ? JSON.parse(text)
                            : {};
                } catch {
                    throw new Error(
                        "The server returned an invalid response."
                    );
                }


                if (res.status === 401) {

                    showLogin(
                        "Your session expired. Please log in again."
                    );

                    return;

                }


                if (!res.ok) {

                    throw new Error(
                        result.error ||
                        "Couldn't update that booking."
                    );

                }


                await loadDashboard();

            } catch (err) {

                console.error(
                    "RYDE booking update failed:",
                    err
                );

                loadError.textContent =
                    err.message ||
                    "Couldn't update that booking.";

                loadError.hidden = false;

            } finally {

                btn.disabled = false;

            }

        }
    );


    /* =======================================
       Filters
    ======================================= */

    [
        searchInput,
        statusFilter,
        typeFilter
    ].forEach((el) => {

        el.addEventListener(
            "input",
            renderTable
        );

        el.addEventListener(
            "change",
            renderTable
        );

    });


    /* =======================================
       Load dashboard
    ======================================= */

    async function loadDashboard() {

        loadError.hidden = true;


        try {

            const res =
                await authedFetch(
                    "/api/admin-bookings"
                );


            if (res.status === 401) {

                showLogin(
                    "Your session expired. Please log in again."
                );

                return;

            }


            const text =
                await res.text();


            let result = {};

            try {

                result =
                    text
                        ? JSON.parse(text)
                        : {};

            } catch {

                throw new Error(
                    "The server returned an invalid response."
                );

            }


            if (!res.ok) {

                throw new Error(
                    result.error ||
                    "Couldn't load bookings."
                );

            }


            allBookings =
                Array.isArray(
                    result.bookings
                )
                    ? result.bookings
                    : [];


            renderKpis(
                result.stats || {}
            );

            renderChart(
                result.daily || []
            );

            renderTable();

            renderCalendar();

        } catch (err) {

            console.error(
                "RYDE dashboard load failed:",
                err
            );

            loadError.textContent =
                err.message ||
                "Couldn't load bookings. Please try again.";

            loadError.hidden = false;

        }

    }


    /* =======================================
       Refresh
    ======================================= */

    refreshBtn.addEventListener(
        "click",
        loadDashboard
    );


    /* =======================================
       Init
    ======================================= */

    if (getToken()) {

        showApp();

        loadDashboard();

    } else {

        showLogin();

    }

});
