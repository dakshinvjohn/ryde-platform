const { signSession, checkPassword } = require("../lib/admin-auth");

module.exports = async (req, res) => {

    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const { password } = req.body || {};

    if (!process.env.ADMIN_PASSWORD) {
        res.status(500).json({ error: "Admin login isn't configured yet (missing ADMIN_PASSWORD env var)." });
        return;
    }

    if (!checkPassword(password)) {
        // Same message either way - don't reveal whether the
        // password was close or the field was empty.
        res.status(401).json({ error: "Incorrect password." });
        return;
    }

    let token;

    try {
        token = signSession();
    } catch (err) {
        console.error("RYDE: admin-login failed to sign session:", err);
        res.status(500).json({ error: "Something went wrong. Please try again." });
        return;
    }

    res.status(200).json({ ok: true, token });

};
