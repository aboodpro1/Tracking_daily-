/**
 * AuthPageHandler & SessionManager
 *
 * Handles UI tab switching, password toggles, and authentication state workflows.
 * Provides client-side session persistence and role-based route guard helpers.
 *
 * Route:    auth.html
 * Trigger:  Page load, tab click, form submission, and refresh auth checks
 * Auth:     Public (redirects to dashboard when authenticated)
 */

document.addEventListener('DOMContentLoaded', () => {
    initAuthTabs();
    initPasswordToggles();
    initFormHandlers();
});

/**
 * Initializes the Sign-in vs Sign-up tab switcher
 */
function initAuthTabs() {
    const tabButtons = document.querySelectorAll('.auth-switch-btn');
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const authAlert = document.getElementById('auth-alert');

    if (!tabButtons.length) return;

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Hide any previous alert message
            if (authAlert) {
                authAlert.className = 'auth-alert';
                authAlert.textContent = '';
            }

            if (targetTab === 'signin') {
                signinForm.classList.add('active-form');
                signupForm.classList.remove('active-form');
            } else {
                signupForm.classList.add('active-form');
                signinForm.classList.remove('active-form');
            }
        });
    });
}

/**
 * Enables password show/hide toggle functionality
 */
function initPasswordToggles() {
    const toggles = document.querySelectorAll('.auth-password-toggle');

    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const targetInputId = toggle.getAttribute('data-target');
            const input = document.getElementById(targetInputId);

            if (!input) return;

            const isPassword = input.getAttribute('type') === 'password';
            input.setAttribute('type', isPassword ? 'text' : 'password');

            // Toggle SVG icon
            toggle.innerHTML = isPassword
                ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
                : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        });
    });
}

/**
 * Initializes form submission listeners with feedback helpers
 */
function initFormHandlers() {
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');

    if (signinForm) {
        signinForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (typeof loginUser === 'function') {
                loginUser();
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (typeof registerUser === 'function') {
                registerUser();
            }
        });
    }
}

/**
 * Displays an alert message inside the auth card
 * @param {string} message
 * @param {'error'|'success'} type
 */
function showAuthAlert(message, type = 'error') {
    const authAlert = document.getElementById('auth-alert');
    if (!authAlert) return;

    authAlert.textContent = message;
    authAlert.className = `auth-alert show alert-${type}`;
}

/**
 * Client Session & Refresh State Manager
 * Example helper object for token storage and route checking
 */
window.AuthSession = {
    // Save session info after login
    setSession(token, user) {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
    },

    // Retrieve saved token
    getToken() {
        return localStorage.getItem('auth_token');
    },

    // Retrieve saved user object (id, name, email, role)
    getUser() {
        try {
            const raw = localStorage.getItem('auth_user');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },

    // Clear session on logout
    clearSession() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
    },

    // Check if user is currently authenticated
    isAuthenticated() {
        return Boolean(this.getToken());
    },

    // Helper to guard protected pages on refresh
    guardRoute(requiredRole = null) {
        const token = this.getToken();
        const user = this.getUser();

        if (!token || !user) {
            window.location.href = 'auth.html';
            return false;
        }

        if (requiredRole && user.role !== requiredRole) {
            alert('عذراً، ليس لديك صلاحية الوصول لهذه الصفحة.');
            window.location.href = 'index.html';
            return false;
        }

        return true;
    }
};
