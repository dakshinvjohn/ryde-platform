document.addEventListener("DOMContentLoaded", () => {

    const TOKEN_KEY = "ryde_admin_token";

    const getToken = () => sessionStorage.getItem(TOKEN_KEY);

    const authedFetch = (url, options = {}) => fetch(url, {
        ...options,
        cache: "no-store",
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${getToken()}`,
            "Cache-Control": "no-cache"
        }
    });

    const addDeleteButton = async (bookingId) => {

        await new Promise(resolve => setTimeout(resolve, 0));

        const modal = document.querySelector(".admin-calendar-detail");
        const card = modal?.querySelector(".admin-calendar-detail-card");

        if (!modal || !card || card.querySelector("[data-calendar-delete]")) {
            return;
        }

        const actions = card.querySelector("[data-calendar-close]")?.parentElement;

        if (!actions) return;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "btn btn-danger admin-calendar-delete";
        deleteButton.dataset.calendarDelete = "";
        deleteButton.textContent = "Delete booking";

        actions.style.display = "flex";
        actions.style.alignItems = "center";
        actions.style.justifyContent = "flex-end";
        actions.style.gap = "10px";
        actions.insertBefore(deleteButton, actions.firstChild);

        deleteButton.addEventListener("click", async () => {

            const confirmed = window.confirm(
                "Delete this booking permanently?\n\n" +
                "Any quotation linked to this booking will also be deleted.\n\n" +
                "This cannot be undone."
            );

            if (!confirmed) return;

            deleteButton.disabled = true;
            deleteButton.textContent = "Deleting…";

            try {

                const response = await authedFetch(
                    "/api/admin-delete-booking",
                    {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ id: bookingId })
                    }
                );

                const text = await response.text();
                let result = {};

                try {
                    result = text ? JSON.parse(text) : {};
                } catch {
                    throw new Error("The server returned an invalid response.");
                }

                if (response.status === 401) {
                    window.location.reload();
                    return;
                }

                if (!response.ok) {
                    throw new Error(result.error || "Couldn't delete that booking.");
                }

                modal.remove();

                // Reloading keeps the dashboard KPIs, table and calendar in sync.
                window.location.reload();

            } catch (error) {

                console.error("RYDE: booking deletion failed:", error);
                deleteButton.disabled = false;
                deleteButton.textContent = "Delete booking";
                window.alert(error.message || "Couldn't delete that booking.");

            }

        });

    };

    document.addEventListener("click", (event) => {

        const bookingButton = event.target.closest(".admin-calendar-booking");

        if (!bookingButton) return;

        const bookingId = bookingButton.dataset.bookingId;

        if (bookingId) {
            addDeleteButton(bookingId);
        }

    });

});
