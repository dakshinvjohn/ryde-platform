const { getSupabaseAdmin } = require("../lib/supabase-admin");
const { requireAdmin } = require("../lib/admin-auth");

const RECENT_LIMIT = 500;
const DAY_MS = 24 * 60 * 60 * 1000;

module.exports = async (req, res) => {

    if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    if (!requireAdmin(req, res)) return;

    try {

        const supabase = getSupabaseAdmin();

        // Full column set for the most recent bookings, shown in the table.
        const { data: bookings, error: bookingsError } = await supabase
            .from("bookings")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(RECENT_LIMIT);

        if (bookingsError) throw bookingsError;

        // Lean column set across every booking, for accurate
        // lifetime stats even if there are more than RECENT_LIMIT rows.
        const { data: statRows, error: statError } = await supabase
            .from("bookings")
            .select("fare_eur, payment_status, booking_type, created_at");

        if (statError) throw statError;

        const now = Date.now();
        const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
        const sevenDaysAgo = now - 7 * DAY_MS;
        const thirtyDaysAgo = now - 30 * DAY_MS;

        const stats = {
            totalBookings: statRows.length,
            totalRevenue: 0,
            paidRevenue: 0,
            unpaidRevenue: 0,
            paidCount: 0,
            unpaidCount: 0,
            rideCount: 0,
            movingCount: 0,
            todayCount: 0,
            todayRevenue: 0,
            last7DaysCount: 0,
            last7DaysRevenue: 0,
            last30DaysCount: 0,
            last30DaysRevenue: 0
        };

        for (const row of statRows) {

            const fare = Number(row.fare_eur) || 0;
            const createdAt = new Date(row.created_at).getTime();

            stats.totalRevenue += fare;

            if (row.payment_status === "paid") {
                stats.paidRevenue += fare;
                stats.paidCount += 1;
            } else {
                stats.unpaidRevenue += fare;
                stats.unpaidCount += 1;
            }

            if (row.booking_type === "moving") {
                stats.movingCount += 1;
            } else {
                stats.rideCount += 1;
            }

            if (createdAt >= startOfToday.getTime()) {
                stats.todayCount += 1;
                stats.todayRevenue += fare;
            }

            if (createdAt >= sevenDaysAgo) {
                stats.last7DaysCount += 1;
                stats.last7DaysRevenue += fare;
            }

            if (createdAt >= thirtyDaysAgo) {
                stats.last30DaysCount += 1;
                stats.last30DaysRevenue += fare;
            }

        }

        // Bookings per day for the last 14 days, for the chart -
        // computed from the same lean rows so it's accurate even
        // when there are more bookings than RECENT_LIMIT.
        const dailyBuckets = [];
        for (let i = 13; i >= 0; i--) {

            const dayStart = startOfToday.getTime() - i * DAY_MS;
            const dayEnd = dayStart + DAY_MS;
            const dayRows = statRows.filter(r => {
                const t = new Date(r.created_at).getTime();
                return t >= dayStart && t < dayEnd;
            });

            dailyBuckets.push({
                date: new Date(dayStart).toISOString().split("T")[0],
                count: dayRows.length,
                revenue: dayRows.reduce((sum, r) => sum + (Number(r.fare_eur) || 0), 0)
            });

        }

        res.status(200).json({ ok: true, bookings, stats, daily: dailyBuckets });

    } catch (err) {

        console.error("RYDE: admin-bookings fetch failed:", err);
        res.status(500).json({ error: "Couldn't load bookings. Please try again." });

    }

};
