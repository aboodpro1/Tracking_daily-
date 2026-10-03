
/**
 * Authentication and User Session API Handler
 *
 * Handles Sign-In, Sign-Up, Session Verification, and Logout workflows.
 * Connects frontend auth forms to n8n webhook or Notion database endpoints.
 *
 * Route:    /auth.html, /index.html, /todo.html
 * Trigger:  Form submissions (Sign-In / Sign-Up) and page load session verification
 * Auth:     Public authentication endpoints and token verification
 */

let UrlAuthPostTest = "https://n8n-production-c217.up.railway.app/webhook-test/Auth-database";
let UrlAuthPost = "https://n8n-production-c217.up.railway.app/webhook/Auth-database";
let UrlAuthGetTest = "https://n8n-production-c217.up.railway.app/webhook-test/Auth-database";
let UrlAuthGet = "https://n8n-production-c217.up.railway.app/webhook/Auth-database";

/**
 * Toast Notification Helper
 * Displays professional feedback alarms with animations.
 */
function showToast(title, message, type = "success", duration = 2500) {
    const container = document.getElementById("toast-container") || document.body;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    const iconSvg = type === "success"
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
             <polyline points="20 6 9 17 4 12"></polyline>
           </svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
             <circle cx="12" cy="12" r="10"></circle>
             <line x1="12" y1="8" x2="12" y2="12"></line>
             <line x1="12" y1="16" x2="12.01" y2="16"></line>
           </svg>`;

    toast.innerHTML = `
        <div class="toast-icon-box" aria-hidden="true">
            ${iconSvg}
        </div>
        <div class="toast-body">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button type="button" class="toast-close" aria-label="إغلاق الإشعار">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;

    // زر الإغلاق اليدوي
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => {
        removeToast(toast);
    });

    container.appendChild(toast);

    // إخفاء تلقائي بعد انقضاء الوقت المحدد
    const autoHide = setTimeout(() => {
        removeToast(toast);
    }, duration);

    function removeToast(element) {
        clearTimeout(autoHide);
        element.classList.add("toast-hiding");
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 300);
    }
}

/**
 * User Sign-In Main Handler
 */
async function loginUser() {
    // 1. جلب القيم والتحقق من الحقول الإجبارية
    const emailInput = document.getElementById("signin-email");
    const passwordInput = document.getElementById("signin-password");
    const rememberMeInput = document.getElementById("signin-remember");

    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";
    const rememberMe = rememberMeInput ? rememberMeInput.checked : false;

    // التحقق من البريد الإلكتروني أو اسم المستخدم
    if (!email) {
        showToast("حقل مطلوب", "يرجى إدخال البريد الإلكتروني أو اسم المستخدم.", "error");
        emailInput?.focus();
        return;
    }

    // التحقق من كلمة المرور
    if (!password) {
        showToast("حقل مطلوب", "يرجى إدخال كلمة المرور قبل المتابعة.", "error");
        passwordInput?.focus();
        return;
    }

    // 2. التحكم في زر الإرسال وتفعيل تأثير التحميل (Loading Effect)
    const submitBtn = document.getElementById("btn-submit-signin");
    const originalText = submitBtn ? submitBtn.innerHTML : "";

    if (submitBtn) {
        submitBtn.classList.add("is-loading");
        submitBtn.setAttribute("aria-busy", "true");
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <span class="btn-loading-content">
                <span>جاري تسجيل الدخول...</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="spin-icon" aria-hidden="true">
                    <circle cx="12" cy="12" r="9.5" stroke="currentColor" stroke-width="2.5" stroke-opacity="0.25"></circle>
                    <path d="M12 2.5a9.5 9.5 0 0 1 9.5 9.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"></path>
                </svg>
            </span>
        `;
    }

    // 3. إرسال طلب تسجيل الدخول للسيرفر
    axios
        .post(UrlAuthPost, {
            Get: "User Sign In",
            data: {

                Get: "User Sign In",
                email: email,
                password: password,
                rememberMe: rememberMe
            },
        })
        .then(function (response) {
            console.log("Sign-in Response:", response.data);
            // قم بتغيير هذا السطر
            // const res = response.data;

            // إلى هذا السطر:
            const res = Array.isArray(response.data) ? response.data[0] : response.data;

            // التحقق من صحة الاستجابة
            if (res.process === "done") {
                // حفظ التوكن وبيانات المستخدم في التخزين المحلي
                const token = res.token || "token_" + Date.now();
                const user = res.user || {
                    email: email,
                    name: res.name || email.split("@")[0],
                    role: res.role || "Member"
                };
                console.log("User:", user);
                localStorage.setItem("auth_token", token);
                localStorage.setItem("auth_user", JSON.stringify(user));

                showToast("تم تسجيل الدخول بنجاح!", `مرحباً بك ${user.name}، جاري نقلك إلى لوحة المهام...`, "success", 2000);

                // الانتقال للصفحة الرئيسية بعد انتهاء التنبيه
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1500);
            } else {
                const errorMsg = (res && res.message) ? res.message : "بيانات تسجيل الدخول غير صحيحة، يرجى المحاولة مرة أخرى.";
                showToast("فشل تسجيل الدخول", errorMsg, "error", 3500);
                console.log("Sign-in Error:", res.message);
            }
        })
        .catch((error) => {
            console.error("Sign-in Error:", error);
            showToast("خطأ في الاتصال", "تعذر الاتصال بخادم المصادقة، يرجى التأكد من تشغيل الـ Webhook.", "error");
        })
        .finally(() => {
            // 4. إيقاف تأثير التحميل وإعادة الزر لحالته الأصلية
            if (submitBtn) {
                submitBtn.classList.remove("is-loading");
                submitBtn.removeAttribute("aria-busy");
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
}

/**
 * User Sign-Up Main Handler
 */
async function registerUser() {
    // 1. جلب القيم والتحقق من الحقول الإجبارية
    const nameInput = document.getElementById("signup-name");
    const emailInput = document.getElementById("signup-email");
    const passwordInput = document.getElementById("signup-password");
    const termsInput = document.getElementById("signup-terms");

    const name = nameInput ? nameInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";
    const roleRadio = document.querySelector('input[name="user_role"]:checked');
    const role = roleRadio ? roleRadio.value : "member";

    // التحقق من الاسم
    if (!name) {
        showToast("حقل مطلوب", "يرجى كتابة اسمك الكامل قبل المتابعة.", "error");
        nameInput?.focus();
        return;
    }

    // التحقق من البريد الإلكتروني
    if (!email || !email.includes("@")) {
        showToast("بريد إلكتروني غير صالح", "يرجى كتابة عنوان بريد إلكتروني صحيح.", "error");
        emailInput?.focus();
        return;
    }

    // التحقق من كلمة المرور (8 أحرف على الأقل)
    if (!password || password.length < 8) {
        showToast("كلمة المرور قصيرة", "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.", "error");
        passwordInput?.focus();
        return;
    }

    // التحقق من الموافقة على الشروط
    if (termsInput && !termsInput.checked) {
        showToast("تنبيه", "يرجى الموافقة على الشروط وسياسة الاستخدام للمتابعة.", "error");
        return;
    }

    // 2. التحكم في زر الإرسال وتفعيل تأثير التحميل (Loading Effect)
    const submitBtn = document.getElementById("btn-submit-signup");
    const originalText = submitBtn ? submitBtn.innerHTML : "";

    if (submitBtn) {
        submitBtn.classList.add("is-loading");
        submitBtn.setAttribute("aria-busy", "true");
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <span class="btn-loading-content">
                <span>جاري إنشاء الحساب...</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="spin-icon" aria-hidden="true">
                    <circle cx="12" cy="12" r="9.5" stroke="currentColor" stroke-width="2.5" stroke-opacity="0.25"></circle>
                    <path d="M12 2.5a9.5 9.5 0 0 1 9.5 9.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"></path>
                </svg>
            </span>
        `;
    }

    // 3. إرسال طلب إنشاء الحساب
    axios
        .post(UrlAuthPost, {
            POST: "User Sign Up",
            data: {
                name: name,
                email: email,
                password: password,
                role: role,
                status: "Active",
                userId: "usr_" + Math.random().toString(36).substr(2, 9)
            }
        })
        .then(function (response) {
            console.log("Sign-up Response:", response.data);
            const res = Array.isArray(response.data) ? response.data[0] : response.data;
            console.log("Response:", res.process);
            if (res.process === "done") {
                const token = res.token || "token_" + Date.now();
                const user = res.user || {
                    name: name,
                    email: email,
                    role: role,
                    status: "Active"
                };

                localStorage.setItem("auth_token", token);
                localStorage.setItem("auth_user", JSON.stringify(user));

                showToast("تم إنشاء الحساب بنجاح!", "مرحباً بك، تم تجهيز حسابك وجاري تحويلك للوحة المهام...", "success", 2000);

                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1500);
            } else {
                const errorMsg = (res && res.message) ? res.message : "تعذر إكمال إنشاء الحساب، يرجى المحاولة مرة أخرى.";
                showToast("فشل إنشاء الحساب", errorMsg, "error", 3500);
            }
        })
        .catch((error) => {
            console.error("Sign-up Error:", error);
            showToast("خطأ في الاتصال", "تعذر الاتصال بالسيرفر، يرجى التأكد من تشغيل الـ Webhook.", "error");
        })
        .finally(() => {
            // 4. إيقاف تأثير التحميل وإعادة الزر لحالته الأصلية
            if (submitBtn) {
                submitBtn.classList.remove("is-loading");
                submitBtn.removeAttribute("aria-busy");
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
}

/**
 * Renders the logged in user info in the navigation bar and dropdown
 */
function renderNavbarUserProfile() {
    const userStr = localStorage.getItem("auth_user");
    if (!userStr) return;

    try {
        const user = JSON.parse(userStr);
        const nameElem = document.getElementById("nav-user-name");
        const roleElem = document.getElementById("nav-user-role");
        const avatarElem = document.getElementById("nav-user-avatar");

        const dropNameElem = document.getElementById("dropdown-user-name");
        const dropEmailElem = document.getElementById("dropdown-user-email");
        const dropRoleElem = document.getElementById("dropdown-user-role");
        const dropAvatarElem = document.getElementById("dropdown-user-avatar");

        const displayName = user.name || user.email?.split("@")[0] || "المستخدم";
        const email = user.email || "";
        const role = user.role || "Member";

        // الترجمة العربية للصلاحيات
        const roleLabels = {
            admin: "مدير نظام",
            Admin: "مدير نظام",
            lead: "مشرف مهام",
            Lead: "مشرف مهام",
            member: "عضو فريق",
            Member: "عضو فريق"
        };

        const translatedRole = roleLabels[role] || role;
        const initial = displayName.trim().charAt(0).toUpperCase() || "U";

        if (nameElem) nameElem.textContent = displayName;
        if (roleElem) roleElem.textContent = translatedRole;
        if (avatarElem) avatarElem.textContent = initial;

        if (dropNameElem) dropNameElem.textContent = displayName;
        if (dropEmailElem) dropEmailElem.textContent = email;
        if (dropRoleElem) dropRoleElem.textContent = translatedRole;
        if (dropAvatarElem) dropAvatarElem.textContent = initial;

        initUserDropdownMenu();
    } catch (e) {
        console.error("Error parsing user data for navbar:", e);
    }
}

/**
 * Initializes the dropdown menu toggle and outside click dismiss
 */
function initUserDropdownMenu() {
    const trigger = document.getElementById("user-menu-trigger");
    const dropdown = document.getElementById("user-dropdown-card");

    if (!trigger || !dropdown || trigger.dataset.bound === "true") return;

    trigger.dataset.bound = "true";

    trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains("show");
        if (isOpen) {
            dropdown.classList.remove("show");
            trigger.classList.remove("is-open");
            trigger.setAttribute("aria-expanded", "false");
        } else {
            dropdown.classList.add("show");
            trigger.classList.add("is-open");
            trigger.setAttribute("aria-expanded", "true");
        }
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
            dropdown.classList.remove("show");
            trigger.classList.remove("is-open");
            trigger.setAttribute("aria-expanded", "false");
        }
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            dropdown.classList.remove("show");
            trigger.classList.remove("is-open");
            trigger.setAttribute("aria-expanded", "false");
        }
    });
}

/**
 * Verify User Session on Page Refresh
 * Verifies if user exists and confirms their role and permissions.
 */
async function verifySessionOnRefresh() {
    const token = localStorage.getItem("auth_token");
    const userStr = localStorage.getItem("auth_user");

    const isAuthPage = window.location.pathname.includes("auth.html");

    // 1. فحص وجود التوكن محلياً
    if (!token || !userStr) {
        if (!isAuthPage) {
            window.location.replace("auth.html");
        }
        return false;
    }

    // 2. تحديث واجهة المستخدم فوراً بالبيانات المحفوظة
    renderNavbarUserProfile();

    // 3. التحقق مع الـ Webhook أو الخادم للتأكد من وجود المستخدم ونوعه
    try {
        const localUser = JSON.parse(userStr);

        const response = await axios.get(UrlAuthPost, {
            params: {
                Get: "Verify User Session",
                token: token,
                email: localUser.email
            }
        });

        const res = Array.isArray(response.data) ? response.data[0] : response.data;

        if (res && (res.process === "done" || res.valid === true || res.status === "success")) {
            // تحديث بيانات وصلاحية المستخدم في حال تم تعديلها في قاعدة البيانات
            if (res.user) {
                localStorage.setItem("auth_user", JSON.stringify(res.user));
                renderNavbarUserProfile();
            }
            return true;
        } else if (res && (res.valid === false || res.process === "error")) {
            // في حال تم حذف أو تعطيل الحساب من قاعدة البيانات
            logoutUser("انتهت صلاحية الجلسة أو تم تعطيل الحساب، يرجى تسجيل الدخول مجدداً.");
            return false;
        }
    } catch (error) {
        // في حال تعذر الوصول للـ Webhook مؤقتاً، الاستمرار بالبيانات المحلية لضمان تجربة مستخدم سلسة
        console.warn("Session verification check warning (webhook unreachable):", error);
        return true;
    }

    return true;
}

/**
 * Log Out Current User
 */
function logoutUser(message = "تم تسجيل الخروج بنجاح.") {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    showToast("تسجيل الخروج", message, "success", 1500);

    setTimeout(() => {
        window.location.href = "auth.html";
    }, 1000);
}

/**
 * Page Auth Guard Auto-initializer
 */
document.addEventListener("DOMContentLoaded", () => {
    const isAuthPage = window.location.pathname.includes("auth.html");
    const token = localStorage.getItem("auth_token");
    const userStr = localStorage.getItem("auth_user");

    if (isAuthPage) {
        // إذا كان مسجل دخول مسبقاً وتوجه لصفحة auth، نحوله للوحة الرئيسية
        if (token && userStr) {
            window.location.replace("index.html");
        }
    } else {
        // فحص الجلسة عند كل تحميل أو ريفريش في كل صفحات الموقع
        verifySessionOnRefresh();
    }
});

