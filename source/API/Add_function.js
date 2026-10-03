

<<<<<<< Updated upstream
let UrlPostTest = "https://n8n-production-4941.up.railway.app/webhook-test/post-database"
let UrlPost = "https://n8n-production-4941.up.railway.app/webhook/post-database"
=======
let UrlPostTest = "https://n8n-production-c217.up.railway.app/webhook-test/post-database";
let UrlPost = "https://n8n-production-c217.up.railway.app/webhook/post-database";
>>>>>>> Stashed changes


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
 * Add Task Main Handler
 */
async function addTask() {
    // 1. جلب القيم والتحقق من الحقول الإجبارية
    const titleInput = document.getElementById("task-title");
    const descInput = document.getElementById("task-description");
    const title = titleInput ? titleInput.value.trim() : "";
    const description = descInput ? descInput.value.trim() : "";

    // التحقق من عنوان المهمة
    if (!title) {
        showToast("حقل مطلوب", "يرجى كتابة عنوان المهمة قبل المتابعة.", "error");
        titleInput?.focus();
        return;
    }

    // التحقق من وصف المهمة
    if (!description) {
        showToast("حقل مطلوب", "يرجى كتابة وصف المهمة قبل المتابعة.", "error");
        descInput?.focus();
        return;
    }

    const category = document.querySelector('input[name="task_category"]:checked')?.value || "";
    const priority = document.querySelector('input[name="task_priority"]:checked')?.value || "";
    const duration = document.querySelector('input[name="task_duration"]:checked')?.value || "";

    // 2. التحكم في زر الإرسال وتفعيل تأثير التحميل (Loading Effect)
    const submitBtn = document.querySelector(".submit-button");
    const btnText = submitBtn?.querySelector(".btn-text");

    if (submitBtn) {
        submitBtn.classList.add("is-loading");
        submitBtn.disabled = true;
        if (btnText) btnText.textContent = "جاري الإضافة...";
    }

    const userStr = localStorage.getItem("auth_user");
    const currentUser = userStr ? JSON.parse(userStr) : {};
    const authenticatedUserId = currentUser.userId || currentUser.id || "";

    const todayDate = new Date().toISOString().split("T")[0];
    // 3. إرسال البيانات
    axios
        .post(UrlPost, {
            POST: "Add a new task",
            data: {
                title: title,
                description: description,
                category: category,
                priority: priority,
                duration: duration,
                status: "قيد الانتظار",
                userEmail: currentUser.email || "",
                userName: currentUser.name || "",
                userId: authenticatedUserId,
                "user ID": authenticatedUserId,
                userRole: currentUser.role || "member"
            }
        })
        .then(function (response) {
            const data = response.data;
            console.log("Add Task Server Response:", data);
            // التحقق الدقيق من نجاح العملية من السيرفر
            const isSuccess = data && (data.success === true || data.process === "done" || data.status === "success");

            if (isSuccess) {
                showToast("تمت الإضافة بنجاح!", data.message || "تم حفظ المهمة الجديدة في قاعدة البيانات بنجاح.", "success", 2000);
                // إعادة تحميل الصفحة بعد اكتمال عرض التنبيه
                setTimeout(() => {
                    window.location.href = "../todo.html";
                }, 1000);
            } else {
                const errorMsg = data?.message || data?.error?.message || "فشلت عملية إضافة المهمة في قاعدة البيانات.";
                console.error("Add Task Error Response:", data);
                showToast("فشلت الإضافة", errorMsg, "error", 4000);
            }
        })
        .catch((error) => {
            console.error("Add Task Network/Server Error:", error);
            const serverMsg = error.response?.data?.message || error.response?.data?.error?.message || "تعذر الاتصال بالسيرفر، تأكد من تشغيل الخدمة وصحة البيانات.";
            showToast("فشل في الإرسال", serverMsg, "error", 4000);
        })
        .finally(() => {
            // 4. إيقاف تأثير التحميل وإعادة الزر لحالته الأصلية
            if (submitBtn) {
                submitBtn.classList.remove("is-loading");
                submitBtn.disabled = false;
                if (btnText) btnText.textContent = "إضافة المهمة";
            }
        });
}
