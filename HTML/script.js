const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzcsNHxIdkVc0Nta4PYZlfavyg_qdMjjMBL8E6K_wuT383K9AL6yi1CG1eU5O_r4Qgh/exec";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("myForm");
    const btnDisplay = document.getElementById("btnDisplay");

    // Submit new record
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        submitForm();
    });

    // Display reports
    btnDisplay.addEventListener("click", () => {
        displayReport();
    });
});

function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;

    toastContainer.appendChild(toast);

    // Trigger reflow to enable animation
    void toast.offsetWidth;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function submitForm() {
    const form = document.getElementById("myForm");
    const formData = new FormData(form);

    const btnSubmit = document.getElementById("btnSubmit");

    // Disable button during submission
    const originalSubmitText = btnSubmit.innerHTML;

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = "Submitting...";

    fetch(SCRIPT_URL, {
        method: "POST",
        body: formData
    })
        .then(response => response.text())
        .then(data => {
            showToast("Data Submitted Successfully", "success");
            form.reset();

            // Refresh report if it's visible
            const reportSection = document.getElementById("report-section");
            if (!reportSection.classList.contains("hidden")) {
                displayReport();
            }
        })
        .catch(error => {
            showToast("Submission Failed", "error");
            console.error("Error:", error);
        })
        .finally(() => {
            // Re-enable button
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = originalSubmitText;
        });
}

// Global functions for inline HTML event handlers
window.editRecord = function (pno) {
    showToast("Update Record PNO : " + pno, "info");
};

window.deleteRecord = function (pno) {
    if (confirm("Delete Record PNO : " + pno + " ?")) {
        showToast("Deleting Record...", "info");

        const formData = new FormData();
        formData.append("action", "delete");
        formData.append("pno", pno);

        // Optional: you can disable buttons here if you want, but the toast implies progress
        fetch(SCRIPT_URL, {
            method: "POST",
            body: formData
        })
            .then(response => response.text())
            .then(data => {
                showToast("Deleted Record PNO : " + pno, "success");

                // Refresh report to show updated data
                const reportSection = document.getElementById("report-section");
                if (!reportSection.classList.contains("hidden")) {
                    displayReport();
                }
            })
            .catch(error => {
                showToast("Deletion Failed", "error");
                console.error("Error:", error);
            });
    }
};

function displayReport() {
    const reportSection = document.getElementById("report-section");
    const reportContainer = document.getElementById("report");

    reportSection.classList.remove("hidden");

    reportContainer.innerHTML = `
        <div class="loader-container">
            <div class="loader"></div>
            <p>Loading Data... Please Wait</p>
        </div>
    `;

    fetch(SCRIPT_URL)
        .then(response => response.json())
        .then(data => {
            let output = "";

            if (!data || data.length === 0) {
                output = `<div class="empty-message">No records found.</div>`;
            } else {
                data.forEach((record, index) => {
                    output += `
                        <div class="report-card">
                            <div class="report-card-header">
                                <span>Record ${index + 1}</span>
                                <div class="report-card-actions">
                                    <button class="action-btn edit-btn" title="Edit" onclick="editRecord('${record[1]}')">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                        Edit
                                    </button>
                                    <button class="action-btn delete-btn" title="Delete" onclick="deleteRecord('${record[1]}')">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                        Delete
                                    </button>
                                </div>
                            </div>
                            <div class="report-card-body">
                                <p><strong>Name</strong>: ${record[0]}</p>
                                <p><strong>PNO</strong>: ${record[1]}</p>
                                <p><strong>Posting</strong>: ${record[2]}</p>
                            </div>
                        </div>
                    `;
                });
            }

            reportContainer.innerHTML = output;
        })
        .catch(error => {
            reportContainer.innerHTML = `
                <div class="error-message">
                    <strong>Unable to Load Data</strong><br>
                    Please check your connection and try again.
                </div>
            `;
            console.error("Error fetching data:", error);
        });
}
