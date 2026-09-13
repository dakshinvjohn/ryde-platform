const {
    getResend,
    FROM_ADDRESS,
    OWNER_EMAIL
} = require("../lib/resend");

function escapeHtml(value = "") {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

module.exports = async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            ok: false,
            error: "Method not allowed"
        });

    }

    try {

        const {
            name,
            email,
            phone,
            message
        } = req.body || {};

        const cleanName = String(name || "").trim();
        const cleanEmail = String(email || "").trim();
        const cleanPhone = String(phone || "").trim();
        const cleanMessage = String(message || "").trim();

        if (!cleanName || !cleanEmail || !cleanMessage) {

            return res.status(400).json({
                ok: false,
                error: "Name, email and message are required."
            });

        }

        if (cleanName.length > 120) {

            return res.status(400).json({
                ok: false,
                error: "Name is too long."
            });

        }

        if (cleanEmail.length > 254) {

            return res.status(400).json({
                ok: false,
                error: "Email address is too long."
            });

        }

        if (cleanPhone.length > 50) {

            return res.status(400).json({
                ok: false,
                error: "Phone number is too long."
            });

        }

        if (cleanMessage.length > 5000) {

            return res.status(400).json({
                ok: false,
                error: "Message is too long."
            });

        }

        const emailLooksValid =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);

        if (!emailLooksValid) {

            return res.status(400).json({
                ok: false,
                error: "Please enter a valid email address."
            });

        }

        if (!OWNER_EMAIL) {

            console.error("RYDE_OWNER_EMAIL is not configured.");

            return res.status(500).json({
                ok: false,
                error: "Contact service is not configured."
            });

        }

        const resend = getResend();

        await resend.emails.send({

            from: FROM_ADDRESS,

            to: OWNER_EMAIL,

            replyTo: cleanEmail,

            subject: `New RYDE contact enquiry — ${cleanName}`,

            html: `
                <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#1f2430;">

                    <h2 style="margin-bottom:6px;">
                        New contact enquiry
                    </h2>

                    <p style="color:#666;">
                        Someone has submitted the contact form on the RYDE website.
                    </p>

                    <div style="margin:24px 0;padding:20px;background:#f7f7f8;border-radius:8px;">

                        <p>
                            <strong>Name:</strong>
                            ${escapeHtml(cleanName)}
                        </p>

                        <p>
                            <strong>Email:</strong>
                            ${escapeHtml(cleanEmail)}
                        </p>

                        <p>
                            <strong>Phone:</strong>
                            ${escapeHtml(cleanPhone || "Not provided")}
                        </p>

                    </div>

                    <h3>Message</h3>

                    <div style="padding:18px;border-left:3px solid #8f7bb8;background:#faf9fc;white-space:pre-wrap;">
                        ${escapeHtml(cleanMessage)}
                    </div>

                </div>
            `

        });

        return res.status(200).json({
            ok: true
        });

    } catch (error) {

        console.error("Contact form error:", error);

        return res.status(500).json({
            ok: false,
            error: "Unable to send your message right now."
        });

    }

};