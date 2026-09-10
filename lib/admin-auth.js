const crypto = require("crypto");

// Lightweight, dependency-free admin session tokens.
//
// There's no user-accounts system for RYDE yet - just one shared
// admin password (env: ADMIN_PASSWORD) - so instead of a database
// session table, /api/admin-login signs a short-lived token the
// browser holds in sessionStorage and sends back as a Bearer token.
// The signing secret is derived from two values that are already
// server-only secrets (ADMIN_PASSWORD + the Supabase service role
// key), so no extra environment variable is required to get this
// working, though setting ADMIN_SESSION_SECRET explicitly is
// recommended for production.
//
// This is intentionally simple. If RYDE grows past one admin user,
// swap this for real accounts (e.g. Supabase Auth) rather than
// extending it.

const SESSION_HOURS = 8;

function getSecret() {

    const explicit = process.env.ADMIN_SESSION_SECRET;
    if (explicit) return explicit;

    const password = process.env.ADMIN_PASSWORD || "";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!password || !serviceKey) {
        throw new Error("Admin auth is not configured: set ADMIN_PASSWORD (and Supabase env vars).");
    }

    return `${password}:${serviceKey}`;

}

function base64url(input) {
    return Buffer.from(input).toString("base64url");
}

function signSession() {

    const secret = getSecret();
    const payload = { exp: Date.now() + SESSION_HOURS * 60 * 60 * 1000 };
    const payloadStr = base64url(JSON.stringify(payload));
    const sig = crypto.createHmac("sha256", secret).update(payloadStr).digest("base64url");

    return `${payloadStr}.${sig}`;

}

// Returns true/false - never throws, so callers can use it directly
// as a guard clause.
function verifySession(token) {

    if (!token || typeof token !== "string" || !token.includes(".")) return false;

    try {

        const secret = getSecret();
        const [payloadStr, sig] = token.split(".");

        const expected = crypto.createHmac("sha256", secret).update(payloadStr).digest("base64url");
        const sigBuf = Buffer.from(sig);
        const expectedBuf = Buffer.from(expected);

        if (sigBuf.length !== expectedBuf.length) return false;
        if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

        const payload = JSON.parse(Buffer.from(payloadStr, "base64url").toString());
        if (!payload.exp || payload.exp < Date.now()) return false;

        return true;

    } catch {

        return false;

    }

}

// Checks the constant-time-safe admin password match.
function checkPassword(candidate) {

    const expected = process.env.ADMIN_PASSWORD;
    if (!expected || !candidate) return false;

    const candidateBuf = Buffer.from(String(candidate));
    const expectedBuf = Buffer.from(String(expected));

    if (candidateBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(candidateBuf, expectedBuf);

}

// Guard clause for admin API routes. Returns true and lets the
// caller proceed, or writes a 401 and returns false.
function requireAdmin(req, res) {

    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!verifySession(token)) {
        res.status(401).json({ error: "Not authenticated. Please log in again." });
        return false;
    }

    return true;

}

module.exports = { signSession, verifySession, checkPassword, requireAdmin };
