const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwEZCy-pAtiFlsHNf4mE8KoZM5om6P_yjUSKP1RRF4RJpcTXdufAVXpYSrb8YG7sgnd/exec";
let allDutyRecords = [];

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

    // Filter logic
    const filterPosting = document.getElementById("filterPosting");
    if (filterPosting) {
        filterPosting.addEventListener("change", () => {
            renderReport(allDutyRecords);
        });
    }
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
            allDutyRecords = data || [];
            renderReport(allDutyRecords);
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

function renderReport(data) {
    const reportContainer = document.getElementById("report");
    const filterValue = document.getElementById("filterPosting") ? document.getElementById("filterPosting").value : "All";

    let filteredData = data;
    if (filterValue !== "All") {
        filteredData = data.filter(record => record[2] === filterValue);
    }

    let output = "";

    if (!filteredData || filteredData.length === 0) {
        output = `<div class="empty-message">No records found.</div>`;
    } else {
        filteredData.forEach((record, index) => {
            output += `
                <div class="report-card">
                    <div class="report-card-header" style="display: block;">
                        <span>Record ${index + 1}</span>
                    </div>
                    <div class="report-card-body" style="margin-top: 0.5rem;">
                        <p><strong>Name</strong>: ${record[0]}</p>
                        <p><strong>PNO</strong>: ${record[1]}</p>
                        <p><strong>Posting</strong>: ${record[2]}</p>
                    </div>
                </div>
            `;
        });
    }

    reportContainer.innerHTML = output;
}
