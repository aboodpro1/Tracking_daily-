# Authentication Flow and Refresh Session Verification Logic

## 1. Overview

This document explains the authentication architecture, lifecycle, and session verification mechanism on every browser refresh for the Daily Tracking application.

---

## 2. Authentication Lifecycle

### 2.1 Sign-Up Flow
1. User enters name, email, password, and selects their role (member, lead, admin).
2. Frontend sends `POST /api/auth/signup` with credentials.
3. Backend hashes the password (e.g. bcrypt/argon2), stores the user record, and generates an access token (JWT) or session cookie.
4. Response returns `{ token, user: { id, name, email, role } }`.
5. Frontend saves the token and user data in client storage and redirects to `index.html`.

### 2.2 Sign-In Flow
1. User enters email/username and password.
2. Frontend sends `POST /api/auth/signin`.
3. Backend validates password against stored hash.
4. Backend issues signed JWT containing `userId`, `email`, and `role`.
5. Frontend stores token and user object, then navigates to the dashboard.

---

## 3. Session Check on Page Refresh (The Refresh Verification Cycle)

When a user presses **F5** or opens a protected page (`index.html`, `todo.html`), the browser reloads all JavaScript in-memory state. To maintain seamless session state and verify permissions without requiring re-login:

```
[ Page Load / F5 ]
       │
       ▼
Check LocalStorage / Cookie for `auth_token`
       │
  ┌────┴───────────────────────────┐
  │ No Token Found                 │ Token Found
  ▼                                ▼
Redirect to `auth.html`       Send `GET /api/auth/me`
                              (Header: Authorization: Bearer <token>)
                                   │
                             ┌─────┴──────────────────────┐
                             │ 200 OK (Valid)             │ 401 / 403 (Invalid/Expired)
                             ▼                            ▼
                        Update UI State              Clear local storage
                        - Display user name/avatar   Redirect to `auth.html`
                        - Apply role permissions
                        - Render protected data
```

### Detailed Steps:

1. **Step 1 - Client Storage Read**:
   Immediately before rendering protected data, client reads `localStorage.getItem('auth_token')`.
   If missing, user is redirected to `auth.html`.

2. **Step 2 - Verification Request (`/api/auth/me`)**:
   Axios or Fetch sends a lightweight request to the backend with `Authorization: Bearer <token>`.

3. **Step 3 - Backend Validation**:
   - Backend decodes JWT and checks secret signature and expiration time (`exp`).
   - Backend queries user database to ensure the account is active and not banned/deleted.
   - Backend returns `{ user: { id, name, email, role, permissions } }`.

4. **Step 4 - Role-Based Access Control (RBAC)**:
   - **Member (`member`)**: Can view, add, and complete their assigned tasks.
   - **Lead (`lead`)**: Can assign tasks, view team statistics, and manage columns.
   - **Admin (`admin`)**: Full system access, team configuration, user management.

5. **Step 5 - Handling Expiration & Refresh Tokens**:
   - If token is expired (401), the frontend checks for a refresh token.
   - If refresh fails, clear `localStorage` via `AuthSession.clearSession()` and redirect to `auth.html`.

---

## 4. Practical Implementation Helper

You can include this standard guard snippet at the top of protected pages:

```javascript
// Example: source/Actions_js/guard.js
(async function verifySession() {
    const token = localStorage.getItem('auth_token');
    
    // 1. If not logged in, immediately redirect to auth page
    if (!token) {
        window.location.replace('auth.html');
        return;
    }

    try {
        // 2. Validate token with backend on every refresh
        const response = await axios.get('/api/auth/me', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const currentUser = response.data.user;
        
        // 3. Update session storage with latest user details & role
        localStorage.setItem('auth_user', JSON.stringify(currentUser));

        // 4. Update UI with user info
        const userNameElem = document.getElementById('current-user-name');
        if (userNameElem) userNameElem.textContent = currentUser.name;

    } catch (error) {
        // Token invalid or expired
        console.warn('Session expired or invalid:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.replace('auth.html');
    }
})();
```
