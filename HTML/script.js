// Determine Role
const isAdmin = sessionStorage.getItem("isAdminLoggedIn") === "true";
const isUser = sessionStorage.getItem("isUserLoggedIn") === "true";

// Always enforce login screen if no role is selected
if (!isAdmin && !isUser) {
    window.location.href = "login.html";
}

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz1k442SIhJSH3z1oeW0k2cTPBk7zK6wsvhkciJy6e2MHpF1AYY9qHKcmc6tHj9kWeM/exec";
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

    // Auth Buttons Logic
    const btnLogout = document.getElementById("btnLogout");
    const btnAdminLogin = document.getElementById("btnAdminLogin");

    if (isAdmin) {
        if (btnLogout) btnLogout.classList.remove('d-none');
        if (btnAdminLogin) btnAdminLogin.classList.add('d-none');
    } else if (isUser) {
        if (btnLogout) btnLogout.classList.remove('d-none');
        if (btnAdminLogin) btnAdminLogin.classList.remove('d-none');
    } else {
        if (btnLogout) btnLogout.classList.add('d-none');
        if (btnAdminLogin) btnAdminLogin.classList.remove('d-none');
    }
    // Show Generate PDF button for admin
    const btnGeneratePdf = document.getElementById('btnGeneratePdf');
    if (isAdmin && btnGeneratePdf) {
        btnGeneratePdf.classList.remove('d-none');
        btnGeneratePdf.addEventListener('click', generatePdfReport);
    }

    if (btnLogout) {
        btnLogout.addEventListener("click", (e) => {
            e.preventDefault();
            sessionStorage.removeItem("isAdminLoggedIn");
            sessionStorage.removeItem("isUserLoggedIn");
            window.location.href = "login.html";
        });
    }

    // Filter logic
    const filterPosting = document.getElementById("filterPosting");
    if (filterPosting) {
        filterPosting.addEventListener("change", () => {
            renderReport(allDutyRecords);
        });
    }
    // Modal Logic
    const editModal = document.getElementById('editModal');
    const closeModalBtns = [document.getElementById('closeModal'), document.getElementById('btnUpdateCancel')];

    closeModalBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener("click", () => {
                editModal.classList.add('hidden');
            });
        }
    });

    // Close on outside click
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.classList.add('hidden');
        }
    });

    // Handle Edit Form Submit
    const editForm = document.getElementById("editForm");
    if (editForm) {
        editForm.addEventListener("submit", (event) => {
            event.preventDefault();
            submitEditForm();
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

// Returns true if the given PNO already exists in allDutyRecords,
// optionally excluding a specific PNO (used during updates).
function isPnoDuplicate(pno, excludePno = null) {
    return allDutyRecords.some(record => {
        const recordPno = String(record[1]).trim();
        if (excludePno !== null && recordPno === String(excludePno).trim()) {
            return false; // skip the original record being edited
        }
        return recordPno === String(pno).trim();
    });
}

function submitForm() {
    const form = document.getElementById("myForm");
    const pno = document.getElementById("pno").value.trim();
    const btnSubmit = document.getElementById("btnSubmit");
    const originalSubmitText = btnSubmit.innerHTML;

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = "Checking...";

    // If records haven't been loaded yet, fetch them first for duplicate checking
    const checkDuplicate = allDutyRecords.length > 0
        ? Promise.resolve()
        : fetch(SCRIPT_URL)
            .then(r => r.json())
            .then(data => { allDutyRecords = data || []; });

    checkDuplicate
        .then(() => {
            if (isPnoDuplicate(pno)) {
                showToast(`PNO ${pno} already exists. Duplicate entry not allowed.`, "error");
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalSubmitText;
                return;
            }

            const formData = new FormData(form);
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
                    } else {
                        // Keep allDutyRecords in sync for future duplicate checks
                        allDutyRecords = [];
                    }
                })
                .catch(error => {
                    showToast("Submission Failed", "error");
                    console.error("Error:", error);
                })
                .finally(() => {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = originalSubmitText;
                });
        })
        .catch(error => {
            showToast("Could not verify PNO. Please try again.", "error");
            console.error("Error:", error);
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = originalSubmitText;
        });
}

// Global functions for inline HTML event handlers
window.editRecord = function (name, pno, mobile, posting) {
    document.getElementById('editOriginalPno').value = pno;
    document.getElementById('editName').value = name;
    document.getElementById('editPno').value = pno;
    document.getElementById('editMobile').value = mobile;
    document.getElementById('editPosting').value = posting;

    document.getElementById('editModal').classList.remove('hidden');
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

function submitEditForm() {
    const editForm = document.getElementById("editForm");
    const newPno = document.getElementById("editPno").value.trim();
    const originalPno = document.getElementById("editOriginalPno").value.trim();

    // Check for duplicate PNO — allow keeping the same PNO (editing own record)
    if (isPnoDuplicate(newPno, originalPno)) {
        showToast(`PNO ${newPno} is already used by another record. Duplicate not allowed.`, "error");
        return;
    }

    const formData = new FormData(editForm);
    formData.append("action", "update");

    const btnUpdateSubmit = document.getElementById("btnUpdateSubmit");
    const originalText = btnUpdateSubmit.innerHTML;

    btnUpdateSubmit.disabled = true;
    btnUpdateSubmit.innerHTML = "Saving...";

    fetch(SCRIPT_URL, {
        method: "POST",
        body: formData
    })
        .then(response => response.text())
        .then(data => {
            showToast("Record Updated Successfully", "success");
            document.getElementById('editModal').classList.add('hidden');

            // Refresh report
            const reportSection = document.getElementById("report-section");
            if (!reportSection.classList.contains("hidden")) {
                displayReport();
            } else {
                allDutyRecords = []; // Reset cache so next submit re-fetches
            }
        })
        .catch(error => {
            showToast("Update Failed", "error");
            console.error("Error:", error);
        })
        .finally(() => {
            btnUpdateSubmit.disabled = false;
            btnUpdateSubmit.innerHTML = originalText;
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
        filteredData = data.filter(record => record[3] === filterValue);
    }

    let output = "";

    if (!filteredData || filteredData.length === 0) {
        output = `<div class="empty-message">No records found.</div>`;
    } else {
        filteredData.forEach((record, index) => {
            output += `
                <div class="report-card">
                    <div class="report-card-header">
                        <span>Record ${index + 1}</span>
                        <div class="report-card-actions">
                            ${isAdmin ? `
                            <button class="action-btn edit-btn" title="Edit" onclick="editRecord('${record[0]}', '${record[1]}', '${record[2]}', '${record[3]}')">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                Edit
                            </button>
                            <button class="action-btn delete-btn" title="Delete" onclick="deleteRecord('${record[1]}')">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                Delete
                            </button>
                            ` : ''}
                        </div>
                    </div>
                    <div class="report-card-body">
                        <p><strong>Name</strong>: ${record[0]}</p>
                        <p><strong>PNO</strong>: ${record[1]}</p>
                        <p><strong>Mobile No</strong>: ${record[2]}</p>
                        <p><strong>Posting</strong>: ${record[3]}</p>
                    </div>
                </div>
            `;
        });
    }

    reportContainer.innerHTML = output;
}
function generatePdfReport() {
    // Ensure data is loaded
    const ensureData = () => {
        if (allDutyRecords.length) return Promise.resolve();
        return fetch(SCRIPT_URL).then(r => r.json()).then(data => { allDutyRecords = data || []; });
    };
    ensureData().then(() => {
        if (!allDutyRecords || allDutyRecords.length === 0) {
            showToast('No records to generate report', 'error');
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Police Station Wise Report', 105, 20, { align: 'center' });
        let y = 30;
        const grouped = {};
        allDutyRecords.forEach(rec => {
            const station = rec[3] || 'Unknown';
            if (!grouped[station]) grouped[station] = [];
            grouped[station].push(rec);
        });
        Object.entries(grouped).forEach(([station, records]) => {
            if (y > 260) { doc.addPage(); y = 20; }
            doc.setFontSize(14);
            doc.text(`Station: ${station}`, 14, y);
            y += 8;
            // Prepare table body
            const body = records.map(r => [r[0], r[1], r[2]]);
            // Add autoTable
            doc.autoTable({
                startY: y,
                head: [['Name', 'PNO', 'Mobile']],
                body: body,
                theme: 'grid',
                margin: { left: 14, right: 14 },
                styles: { fontSize: 10 },
                headStyles: { fillColor: [41, 128, 185] }
            });
            // Update y position after table
            y = doc.lastAutoTable.finalY + 10;
        });
        doc.save('Police_Station_Wise_Report.pdf');
        showToast('PDF report generated', 'success');
    }).catch(err => {
        console.error(err);
        showToast('Failed to generate PDF', 'error');
    });
}

