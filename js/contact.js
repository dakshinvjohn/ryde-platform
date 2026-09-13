document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("contactForm");
    const submitButton = document.getElementById("contactSubmit");
    const status = document.getElementById("contactStatus");

    if (!form) return;

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        submitButton.disabled = true;
        submitButton.textContent = "Sending...";
        status.hidden = true;
        status.textContent = "";

        const formData = new FormData(form);

        const payload = {
            name: formData.get("name"),
            email: formData.get("email"),
            phone: formData.get("phone"),
            message: formData.get("message")
        };

        try {

            const response = await fetch("/api/contact", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(payload)

            });

            const result = await response.json();

            if (!response.ok || !result.ok) {
                throw new Error(
                    result.error || "Unable to send your message."
                );
            }

            form.reset();

            status.textContent =
                "Thank you. Your message has been sent. We'll get back to you shortly.";

            status.hidden = false;

        } catch (error) {

            console.error("Contact form error:", error);

            status.textContent =
                "Sorry, we couldn't send your message. Please try again or contact us directly.";

            status.hidden = false;

        } finally {

            submitButton.disabled = false;
            submitButton.textContent = "Send Message";

        }

    });

});