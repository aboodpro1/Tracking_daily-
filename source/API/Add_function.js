

let UrlPostTest = "http://localhost:5678/webhook-test/post-database"
let UrlPost = "http://localhost:5678/webhook/post-database"


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
            }
            
            
        })
        .then(function (response) {
            console.log("Response:", response.data);
            const data = response.data;

                // التحقق من أن الاستجابة ليست فارغة وترجع process: done
            if (data ==="done") {
                showToast("فشلت الإضافة", "لم يتم استلام تأكيد المعالجة من السيرفر (لم يرجع process: done).", "error", 3500);
                return;
            } else {
                showToast("تمت الإضافة بنجاح!", "تم حفظ المهمة الجديدة في قاعدة البيانات بنجاح.", "success", 2000);
            
          
        }
        
            // إعادة تحميل الصفحة بعد اكتمال عرض التنبيه
          setTimeout(() => {
              location.reload();
          }, 1800);
        })
        .catch((error) => {
            console.error("Error:", error);
            showToast("فشل في الإرسال", "تعذر الاتصال بالسيرفر، تأكد من تشغيل الخدمة.", "error");
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
