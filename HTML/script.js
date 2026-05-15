const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwgiWM-ijnQV7lhBmzv7ILS516w-rjnY4NnZvIUlt0R8xHSwX4kGx72H_zvuyQhZHXS/exec";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("myForm");
    const btnUpdate = document.getElementById("btnUpdate");
    const btnDisplay = document.getElementById("btnDisplay");

    // Submit new record
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        submitForm("submit");
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

function submitForm(actionType) {
    const form = document.getElementById("myForm");
    const formData = new FormData(form);

    // Add specific action if it's an update
    if (actionType === "update") {
        formData.append("action", "update");
    }

    const btnSubmit = document.getElementById("btnSubmit");
    const btnUpdate = document.getElementById("btnUpdate");

    // Disable buttons during submission
    const originalSubmitText = btnSubmit.innerHTML;
    const originalUpdateText = btnUpdate.innerHTML;

    btnSubmit.disabled = true;
    btnUpdate.disabled = true;

    if (actionType === "submit") {
        btnSubmit.innerHTML = "Submitting...";
    } else {
        btnUpdate.innerHTML = "Updating...";
    }

    fetch(SCRIPT_URL, {
        method: "POST",
        body: formData
    })
        .then(response => response.text())
        .then(data => {
            if (actionType === "submit") {
                showToast("Data Submitted Successfully", "success");
            } else {
                showToast("Data Updated Successfully", "success");
            }
            form.reset();

            // Refresh report if it's visible
            const reportSection = document.getElementById("report-section");
            if (!reportSection.classList.contains("hidden")) {
                displayReport();
            }
        })
        .catch(error => {
            showToast(actionType === "submit" ? "Submission Failed" : "Update Failed", "error");
            console.error("Error:", error);
        })
        .finally(() => {
            // Re-enable buttons
            btnSubmit.disabled = false;
            btnUpdate.disabled = false;
            btnSubmit.innerHTML = originalSubmitText;
            btnUpdate.innerHTML = originalUpdateText;
        });
}

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
