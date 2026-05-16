document.addEventListener("DOMContentLoaded", () => {
    // Check if already logged in
    if (sessionStorage.getItem("isAdminLoggedIn") === "true") {
        window.location.href = "index.html";
        return;
    }

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;
            const btnLogin = document.getElementById("btnLogin");

            const originalText = btnLogin.innerHTML;
            btnLogin.disabled = true;
            btnLogin.innerHTML = "Authenticating...";

            // Mock Authentication Delay
            setTimeout(() => {
                if (username === "admin" && password === "Santosh!0077#") {
                    showToast("Login Successful! Redirecting...", "success");
                    sessionStorage.setItem("isAdminLoggedIn", "true");

                    setTimeout(() => {
                        window.location.href = "index.html";
                    }, 1000);
                } else {
                    showToast("Invalid Username or Password", "error");
                    btnLogin.disabled = false;
                    btnLogin.innerHTML = originalText;
                }
            }, 800);
        });
    }
});

function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

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
