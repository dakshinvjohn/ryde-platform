document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("adminTableBody");
    const loadError = document.getElementById("adminLoadError");
    const TOKEN_KEY = "ryde_admin_token";

    if (!tableBody) return;

    const getToken = () => sessionStorage.getItem(TOKEN_KEY);
    const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));

    const authedFetch = (url, options = {}) => fetch(url, {
        ...options,
        cache: "no-store",
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${getToken()}`,
            "Cache-Control": "no-cache"
        }
    });

    const injectButtons = () => {
        tableBody.querySelectorAll("tr").forEach((row) => {
            if (row.querySelector(".admin-quotation-btn")) return;
            const statusCell = row.lastElementChild;
            if (!statusCell) return;
            const toggle = statusCell.querySelector(".admin-status-toggle");
            const id = toggle?.dataset.id;
            if (!id) return;

            const button = document.createElement("button");
            button.type = "button";
            button.className = "admin-status-toggle admin-quotation-btn";
            button.dataset.bookingId = id;
            button.textContent = "Create quotation";
            statusCell.appendChild(button);
        });
    };

    const removeModal = () => document.querySelector(".admin-quotation-modal")?.remove();

    const addItemRow = (container, item = { description: "", price: "" }) => {
        const row = document.createElement("div");
        row.className = "admin-quotation-item-row";
        row.innerHTML = `
            <input type="text" class="quotation-item-description" placeholder="Description" value="${escapeHtml(item.description)}">
            <input type="number" class="quotation-item-price" step="0.01" placeholder="0.00" value="${escapeHtml(item.price)}">
            <button type="button" class="admin-quotation-remove" aria-label="Remove line">×</button>
        `;
        row.querySelector(".admin-quotation-remove").addEventListener("click", () => row.remove());
        container.appendChild(row);
    };

    const openModal = (booking) => {
        removeModal();

        const modal = document.createElement("div");
        modal.className = "admin-quotation-modal";
        modal.innerHTML = `
            <div class="admin-quotation-card" role="dialog" aria-modal="true" aria-labelledby="quotationTitle">
                <div class="admin-quotation-header">
                    <div>
                        <p class="admin-quotation-eyebrow">Quotation</p>
                        <h2 id="quotationTitle">Create &amp; send quotation</h2>
                        <p>${escapeHtml(booking.full_name)} · ${escapeHtml(booking.pickup)} → ${escapeHtml(booking.destination)}</p>
                    </div>
                    <button type="button" class="admin-quotation-close" aria-label="Close">×</button>
                </div>

                <form id="adminQuotationForm" class="admin-quotation-form">
                    <div class="admin-quotation-grid">
                        <label>
                            Language
                            <select name="language">
                                <option value="en">English</option>
                                <option value="nl">Nederlands</option>
                            </select>
                        </label>
                        <label>
                            Payment method
                            <select name="paymentMethod" id="quotationPaymentMethod">
                                <option value="advance">Advance + remaining balance</option>
                                <option value="online_full">Full online payment</option>
                                <option value="cash">Cash / pay driver</option>
                                <option value="bank_transfer">Bank transfer</option>
                            </select>
                        </label>
                        <label>
                            Total quoted price (€)
                            <input name="totalEur" id="quotationTotal" type="number" min="0.01" step="0.01" value="${Number(booking.fare_eur) || ""}" required>
                        </label>
                        <label id="quotationAdvanceWrap">
                            Advance (€)
                            <input name="advanceEur" id="quotationAdvance" type="number" min="0" step="0.01" value="${Math.max(0, Math.round((Number(booking.fare_eur) || 0) * 0.25 * 100) / 100)}">
                        </label>
                        <label>
                            Valid until
                            <input name="validUntil" type="date" value="${new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)}">
                        </label>
                    </div>

                    <div class="admin-quotation-section">
                        <div class="admin-quotation-section-head">
                            <div>
                                <h3>Price breakdown</h3>
                                <p>Matches your quotation structure: service, distance/logistics, discounts and total.</p>
                            </div>
                            <button type="button" class="btn btn-secondary" id="quotationAddItem">+ Add line</button>
                        </div>
                        <div id="quotationItems" class="admin-quotation-items"></div>
                    </div>

                    <label class="admin-quotation-notes">
                        Notes / included services
                        <textarea name="notes" rows="4" placeholder="Optional notes, inclusions, luggage assistance, special arrangements…"></textarea>
                    </label>

                    <div class="admin-quotation-preview">
                        <span>Customer</span><strong>${escapeHtml(booking.email)}</strong>
                        <span>Journey</span><strong>${escapeHtml(booking.booking_date || "—")} · ${escapeHtml(booking.booking_time || "—")}</strong>
                    </div>

                    <p class="admin-quotation-warning" id="quotationWarning" hidden></p>

                    <div class="admin-quotation-actions">
                        <button type="button" class="btn btn-secondary admin-quotation-cancel">Cancel</button>
                        <button type="submit" class="btn btn-primary" id="quotationSendBtn">Create &amp; send quotation</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        const items = modal.querySelector("#quotationItems");
        addItemRow(items, { description: "Premium chauffeur service", price: Number(booking.fare_eur) || "" });
        addItemRow(items, { description: "Distance / logistics", price: "" });

        modal.querySelector("#quotationAddItem").addEventListener("click", () => addItemRow(items));
        modal.querySelector(".admin-quotation-close").addEventListener("click", removeModal);
        modal.querySelector(".admin-quotation-cancel").addEventListener("click", removeModal);
        modal.addEventListener("click", (event) => {
            if (event.target === modal) removeModal();
        });

        const paymentMethod = modal.querySelector("#quotationPaymentMethod");
        const advanceWrap = modal.querySelector("#quotationAdvanceWrap");
        const advanceInput = modal.querySelector("#quotationAdvance");
        const totalInput = modal.querySelector("#quotationTotal");

        const updatePaymentFields = () => {
            const isAdvance = paymentMethod.value === "advance";
            advanceWrap.hidden = !isAdvance;
            advanceInput.required = isAdvance;
            if (paymentMethod.value === "online_full") advanceInput.value = totalInput.value;
        };
        paymentMethod.addEventListener("change", updatePaymentFields);
        totalInput.addEventListener("input", () => {
            if (paymentMethod.value === "online_full") advanceInput.value = totalInput.value;
        });
        updatePaymentFields();

        modal.querySelector("#adminQuotationForm").addEventListener("submit", async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const sendButton = modal.querySelector("#quotationSendBtn");
            const warning = modal.querySelector("#quotationWarning");
            warning.hidden = true;
            sendButton.disabled = true;
            sendButton.textContent = "Creating quotation…";

            const formData = new FormData(form);
            const payload = {
                bookingId: booking.id,
                language: formData.get("language"),
                paymentMethod: formData.get("paymentMethod"),
                totalEur: Number(formData.get("totalEur")),
                advanceEur: Number(formData.get("advanceEur")),
                validUntil: formData.get("validUntil") || null,
                notes: formData.get("notes") || "",
                items: [...items.querySelectorAll(".admin-quotation-item-row")].map((row) => ({
                    description: row.querySelector(".quotation-item-description")?.value || "",
                    price: Number(row.querySelector(".quotation-item-price")?.value) || 0
                })).filter((item) => item.description.trim())
            };

            try {
                const res = await authedFetch("/api/admin-create-quotation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const text = await res.text();
                let result = {};
                try { result = text ? JSON.parse(text) : {}; } catch { throw new Error("The server returned an invalid response."); }

                if (res.status === 401) {
                    removeModal();
                    loadError.textContent = "Your session expired. Please log in again.";
                    loadError.hidden = false;
                    sessionStorage.removeItem(TOKEN_KEY);
                    return;
                }

                if (!res.ok) throw new Error(result.error || "Couldn't create the quotation.");

                sendButton.textContent = "Sent ✓";
                sendButton.disabled = true;
                setTimeout(removeModal, 900);
            } catch (error) {
                console.error("RYDE quotation creation failed:", error);
                warning.textContent = error.message || "Couldn't create the quotation.";
                warning.hidden = false;
                sendButton.disabled = false;
                sendButton.textContent = "Create & send quotation";
            }
        });
    };

    tableBody.addEventListener("click", async (event) => {
        const button = event.target.closest(".admin-quotation-btn");
        if (!button) return;

        button.disabled = true;
        try {
            const res = await authedFetch("/api/admin-bookings");
            if (res.status === 401) throw new Error("Your session expired. Please log in again.");
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Couldn't load the booking.");
            const booking = (result.bookings || []).find((b) => String(b.id) === String(button.dataset.bookingId));
            if (!booking) throw new Error("That booking could not be found.");
            openModal(booking);
        } catch (error) {
            console.error("RYDE quotation booking lookup failed:", error);
            loadError.textContent = error.message || "Couldn't open that booking.";
            loadError.hidden = false;
        } finally {
            button.disabled = false;
        }
    });

    const observer = new MutationObserver(injectButtons);
    observer.observe(tableBody, { childList: true, subtree: true });
    injectButtons();
});
