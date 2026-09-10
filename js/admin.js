// ==========================================
// RYDE — Admin dashboard
// Single shared password (see api/admin-login.js), a signed
// session token kept in sessionStorage, and one data endpoint
// (api/admin-bookings.js) that returns recent bookings plus
// pre-computed stats. Filtering/searching happens client-side
// over the already-fetched list.
// ==========================================

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

    let allBookings = [];

    /* ---------------------------------------
       Auth
    --------------------------------------- */

    const getToken = () => sessionStorage.getItem(TOKEN_KEY);
    const setToken = (t) => sessionStorage.setItem(TOKEN_KEY, t);
    const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

    const showLogin = (message) => {

        clearToken();
        app.hidden = true;
        loginScreen.hidden = false;

        if (message) {
            loginError.textContent = message;
            loginError.hidden = false;
        }

    };

    const showApp = () => {

        loginScreen.hidden = true;
        app.hidden = false;

    };

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        loginError.hidden = true;
        loginBtn.disabled = true;
        loginBtn.textContent = "Logging in…";

        try {

            const res = await fetch("/api/admin-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: passwordInput.value })
            });

            const result = await res.json();

            if (!res.ok) throw new Error(result.error || "Couldn't log in.");

            setToken(result.token);
            passwordInput.value = "";
            showApp();
            loadDashboard();

        } catch (err) {

            loginError.textContent = err.message || "Couldn't log in. Please try again.";
            loginError.hidden = false;

        } finally {

            loginBtn.disabled = false;
            loginBtn.textContent = "Log in";

        }

    });

    logoutBtn.addEventListener("click", () => showLogin());

    /* ---------------------------------------
       Data loading
    --------------------------------------- */

    const authedFetch = (url, options = {}) => fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${getToken()}`
        }
    });

    const eur = (n) => `€${Math.round(Number(n) || 0).toLocaleString("en-NL")}`;

    const renderKpis = (stats) => {

        const cards = [
            { label: "Total bookings", value: stats.totalBookings, sub: `${stats.rideCount} rides · ${stats.movingCount} moves` },
            { label: "Total revenue", value: eur(stats.totalRevenue), sub: `${stats.paidCount} paid · ${stats.unpaidCount} unpaid` },
            { label: "Paid revenue", value: eur(stats.paidRevenue), sub: "Collected so far" },
            { label: "Awaiting payment", value: eur(stats.unpaidRevenue), sub: `${stats.unpaidCount} bookings` },
            { label: "Today", value: stats.todayCount, sub: eur(stats.todayRevenue) },
            { label: "Last 7 days", value: stats.last7DaysCount, sub: eur(stats.last7DaysRevenue) },
            { label: "Last 30 days", value: stats.last30DaysCount, sub: eur(stats.last30DaysRevenue) }
        ];

        kpiGrid.innerHTML = cards.map(c => `
            <div class="admin-kpi-card">
                <p class="admin-kpi-label">${c.label}</p>
                <p class="admin-kpi-value">${c.value}</p>
                <p class="admin-kpi-sub">${c.sub}</p>
            </div>
        `).join("");

    };

    const renderChart = (daily) => {

        const maxCount = Math.max(1, ...daily.map(d => d.count));

        chartEl.innerHTML = daily.map(d => {

            const heightPct = Math.max(4, Math.round((d.count / maxCount) * 100));
            const label = new Date(d.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

            return `
                <div class="admin-chart-bar" title="${label}: ${d.count} booking${d.count === 1 ? "" : "s"}, ${eur(d.revenue)}">
                    <div class="admin-chart-bar-fill" style="height:${heightPct}%"></div>
                    <span class="admin-chart-bar-label">${label}</span>
                </div>
            `;

        }).join("");

    };

    const formatDateTime = (iso) => {

        const d = new Date(iso);
        if (isNaN(d.getTime())) return iso;

        return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + ", " +
            d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

    };

    const renderTable = () => {

        const search = searchInput.value.trim().toLowerCase();
        const status = statusFilter.value;
        const type = typeFilter.value;

        const filtered = allBookings.filter(b => {

            if (status !== "all" && b.payment_status !== status) return false;
            if (type !== "all" && b.booking_type !== type) return false;

            if (search) {

                const haystack = [b.full_name, b.email, b.phone, b.pickup, b.destination]
                    .join(" ").toLowerCase();

                if (!haystack.includes(search)) return false;

            }

            return true;

        });

        tableEmpty.hidden = filtered.length !== 0;

        tableBody.innerHTML = filtered.map(b => `
            <tr>
                <td>${formatDateTime(b.created_at)}</td>
                <td>
                    <span class="admin-table-name">${escapeHtml(b.full_name)}</span>
                    <span class="admin-table-sub">${escapeHtml(b.email)}</span>
                    <span class="admin-table-sub">${escapeHtml(b.phone)}</span>
                </td>
                <td>
                    ${escapeHtml(b.pickup)} → ${escapeHtml(b.destination)}
                    <span class="admin-table-sub">${b.passengers} pax · ${b.luggage} bags · ${escapeHtml(b.vehicle)}</span>
                </td>
                <td>${b.booking_date ? formatDateTime(`${b.booking_date}T${b.booking_time || "00:00"}`) : "—"}</td>
                <td>${b.booking_type === "moving" ? "Moving" : "Ride"}</td>
                <td>${eur(b.fare_eur)}</td>
                <td>
                    <span class="admin-status-pill ${b.payment_status === "paid" ? "is-paid" : "is-unpaid"}">
                        ${b.payment_status === "paid" ? "Paid" : "Unpaid"}
                    </span>
                </td>
                <td>
                    <button class="admin-status-toggle" data-id="${b.id}" data-next="${b.payment_status === "paid" ? "unpaid" : "paid"}">
                        Mark ${b.payment_status === "paid" ? "unpaid" : "paid"}
                    </button>
                </td>
            </tr>
        `).join("");

    };

    function escapeHtml(str) {

        return String(str ?? "").replace(/[&<>"']/g, (c) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[c]));

    }

    tableBody.addEventListener("click", async (e) => {

        const btn = e.target.closest(".admin-status-toggle");
        if (!btn) return;

        const id = btn.getAttribute("data-id");
        const nextStatus = btn.getAttribute("data-next");

        btn.disabled = true;

        try {

            const res = await authedFetch("/api/admin-update-booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, paymentStatus: nextStatus })
            });

            if (res.status === 401) { showLogin("Your session expired. Please log in again."); return; }

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Couldn't update that booking.");

            // Refresh everything so the KPI cards stay accurate too.
            await loadDashboard();

        } catch (err) {

            loadError.textContent = err.message || "Couldn't update that booking.";
            loadError.hidden = false;

        } finally {

            btn.disabled = false;

        }

    });

    [searchInput, statusFilter, typeFilter].forEach(el => {
        el.addEventListener("input", renderTable);
        el.addEventListener("change", renderTable);
    });

    async function loadDashboard() {

        loadError.hidden = true;

        try {

            const res = await authedFetch("/api/admin-bookings");

            if (res.status === 401) { showLogin("Your session expired. Please log in again."); return; }

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Couldn't load bookings.");

            allBookings = result.bookings || [];
            renderKpis(result.stats);
            renderChart(result.daily);
            renderTable();

        } catch (err) {

            loadError.textContent = err.message || "Couldn't load bookings. Please try again.";
            loadError.hidden = false;

        }

    }

    refreshBtn.addEventListener("click", loadDashboard);

    /* ---------------------------------------
       Init — go straight to the dashboard if
       an unexpired session token is already stored
    --------------------------------------- */

    if (getToken()) {
        showApp();
        loadDashboard();
    } else {
        showLogin();
    }

});
