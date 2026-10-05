/**
 * Board Function and Task Synchronization Handler
 *
 * Fetches tasks from webhook or Notion database, filters them for today only,
 * and organizes them into their respective Kanban sections.
 * Handles task rendering, status mapping, statistics calculation, and drag-and-drop workflow.
 *
 * Route:    /todo.html
 * Trigger:  Page load (DOMContentLoaded) or clicking "جلب المهام" button
 * Auth:     Public or Local Webhook
 */


const UrlGetTest = "https://n8n-production-c217.up.railway.app/webhook-test/Get-database";
const UrlGet = "https://n8n-production-c217.up.railway.app/webhook/Get-database";
const UrlPostTest = "https://n8n-production-c217.up.railway.app/webhook-test/post-database";
const UrlPost = "https://n8n-production-c217.up.railway.app/webhook/post-database";


/**
 * Formats today's date in YYYY-MM-DD format for comparisons and API parameters.
 */
function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/**
 * Formats today's date in Arabic readable format for UI display.
 */
function getTodayArabicString() {
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    try {
        return new Intl.DateTimeFormat("ar-EG", options).format(new Date());
    } catch {
        return getTodayDateString();
    }
}

/**
 * Checks if a given date string or object matches today's date.
 * If task has no date specified, it defaults to true to avoid hiding newly added tasks.
 */
function isTaskForToday(dateInput) {
    if (!dateInput) return true;

    try {
        let dateStr = dateInput;
        if (typeof dateInput === "object" && dateInput !== null) {
            dateStr = dateInput.start || dateInput.date || "";
        }

        if (!dateStr) return true;

        const todayStr = getTodayDateString();

        // Check if string begins with YYYY-MM-DD
        if (typeof dateStr === "string" && dateStr.startsWith(todayStr)) {
            return true;
        }

        const taskDate = new Date(dateStr);
        if (isNaN(taskDate.getTime())) {
            return true;
        }

        const today = new Date();
        return (
            taskDate.getFullYear() === today.getFullYear() &&
            taskDate.getMonth() === today.getMonth() &&
            taskDate.getDate() === today.getDate()
        );
    } catch {
        return true;
    }
}

/**
 * Toast Notification Helper
 * Displays professional feedback alarms with animations.
 */
function showToast(title, message, type = "success", duration = 3000) {
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

    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => {
        removeToast(toast);
    });

    container.appendChild(toast);

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
 * Escapes unsafe HTML characters to prevent XSS attacks.
 */
function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Maps raw Notion or custom status string to one of the 3 board sections.
 * Notion status options: "Not started", "In progress", "Done".
 */
function normalizeStatus(statusRaw) {
    if (!statusRaw) return "pending";

    const normalized = String(statusRaw).trim().toLowerCase();

    // Map In Progress statuses
    if (
        normalized === "in progress" ||
        normalized === "in_progress" ||
        normalized === "قيد التنفيذ" ||
        normalized === "doing" ||
        normalized === "جارية"
    ) {
        return "progress";
    }

    // Map Done / Complete statuses
    if (
        normalized === "done" ||
        normalized === "complete" ||
        normalized === "completed" ||
        normalized === "مكتملة" ||
        normalized === "مكتمل" ||
        normalized === "تم" ||
        normalized === "منجز"
    ) {
        return "completed";
    }

    // Default to pending for "Not started", "To-do", "قيد الانتظار" or unmapped
    return "pending";
}

/**
 * Resolves category display label and CSS badge styling.
 */
function getCategoryInfo(categoryRaw) {
    const val = String(categoryRaw || "").toLowerCase().trim();

    if (val === "religious" || val === "دينية") {
        return { label: "دينية", className: "cat-religious" };
    }
    if (val === "body" || val === "جسم" || val === "بدنية") {
        return { label: "جسم", className: "cat-body" };
    }
    if (val === "work" || val === "شغل" || val === "عمل") {
        return { label: "شغل", className: "cat-work" };
    }
    if (val === "study" || val === "دراسة" || val === "تعليم") {
        return { label: "دراسة", className: "cat-study" };
    }

    return { label: categoryRaw || "عامة", className: "cat-work" };
}

/**
 * Resolves priority display label and badge styling.
 */
function getPriorityInfo(priorityRaw) {
    const val = String(priorityRaw || "").toLowerCase().trim();

    if (val === "important" || val === "مهمة" || val === "high" || val === "urgent") {
        return { label: "مهمة", className: "priority-important" };
    }

    return { label: "عادية", className: "priority-normal" };
}

/**
 * Resolves duration display text.
 */
function getDurationLabel(durationRaw) {
    const val = String(durationRaw || "").toLowerCase().trim();

    if (val === "under_hour" || val === "أقل من ساعة") return "أقل من ساعة";
    if (val === "one_hour" || val === "ساعة") return "ساعة واحدة";
    if (val === "two_hours" || val === "ساعتان") return "ساعتان";
    if (!durationRaw) return "غير محدد";

    return durationRaw;
}

/**
 * Extracts a normalized array of task objects from varied webhook/n8n/Notion responses.
 * Handles:
 * 1. n8n direct property outputs: property_العنوان, property_الوصف, property_الحالة, property_التصنيف, property_الأهمية, property_الوقت_المتوقع, property_date
 * 2. Full Notion API Page format: properties.Title.title, properties.Status.status, etc.
 * 3. Standard flattened object arrays.
 */
function parseTasksResponse(responseData) {
    if (!responseData) return [];

    let rawList = [];

    // Parse string response if needed
    if (typeof responseData === "string") {
        try {
            responseData = JSON.parse(responseData);
        } catch {
            return [];
        }
    }

    if (Array.isArray(responseData)) {
        rawList = responseData;
    } else if (Array.isArray(responseData.results)) {
        rawList = responseData.results;
    } else if (Array.isArray(responseData.data)) {
        rawList = responseData.data;
    } else if (Array.isArray(responseData.tasks)) {
        rawList = responseData.tasks;
    } else if (Array.isArray(responseData.items)) {
        rawList = responseData.items;
    } else if (typeof responseData === "object" && responseData !== null) {
        // Check if single item with properties
        if (responseData.id || responseData.name || responseData.property_العنوان || responseData.properties) {
            rawList = [responseData];
        }
    }

    return rawList.map((item, index) => {
        const props = item.properties || item.data || item;

        // 1. Extract Title (supports n8n property_العنوان, name, Title, title)
        let title =
            props.property_العنوان ||
            item.property_العنوان ||
            item.name ||
            item.title ||
            item.task_title ||
            props.name ||
            "";

        if (!title && props.Title?.title?.[0]?.plain_text) {
            title = props.Title.title[0].plain_text;
        } else if (!title && props["العنوان"]?.title?.[0]?.plain_text) {
            title = props["العنوان"].title[0].plain_text;
        } else if (!title && props["عنوان المهمة"]?.title?.[0]?.plain_text) {
            title = props["عنوان المهمة"].title[0].plain_text;
        } else if (!title && props.title?.title?.[0]?.plain_text) {
            title = props.title.title[0].plain_text;
        } else if (!title && typeof props.title === "string") {
            title = props.title;
        }

        // 2. Extract Description (supports n8n property_الوصف, description, desc)
        let description =
            props.property_الوصف ||
            item.property_الوصف ||
            item.description ||
            item.desc ||
            item.task_description ||
            props.description ||
            "";

        if (!description && props.Description?.rich_text?.[0]?.plain_text) {
            description = props.Description.rich_text[0].plain_text;
        } else if (!description && props["الوصف"]?.rich_text?.[0]?.plain_text) {
            description = props["الوصف"].rich_text[0].plain_text;
        } else if (!description && props["وصف المهمة"]?.rich_text?.[0]?.plain_text) {
            description = props["وصف المهمة"].rich_text[0].plain_text;
        }

        // 3. Extract Status (supports n8n property_الحالة, property_text, status)
        let status =
            props.property_الحالة ||
            item.property_الحالة ||
            props.property_text ||
            item.property_text ||
            item.status ||
            item.state ||
            props.status ||
            "";

        if (!status && props.Status?.status?.name) {
            status = props.Status.status.name;
        } else if (!status && props.Status?.select?.name) {
            status = props.Status.select.name;
        } else if (!status && props["الحالة"]?.select?.name) {
            status = props["الحالة"].select.name;
        } else if (!status && props["الحالة"]?.status?.name) {
            status = props["الحالة"].status.name;
        }

        // 4. Extract Category (supports n8n property_التصنيف, category)
        let category =
            props.property_التصنيف ||
            item.property_التصنيف ||
            item.category ||
            item.task_category ||
            props.category ||
            "";

        if (!category && props.Category?.select?.name) {
            category = props.Category.select.name;
        } else if (!category && props["التصنيف"]?.select?.name) {
            category = props["التصنيف"].select.name;
        }

        // 5. Extract Priority (supports n8n property_الأهمية, priority)
        let priority =
            props.property_الأهمية ||
            item.property_الأهمية ||
            item.priority ||
            item.task_priority ||
            props.priority ||
            "";

        if (!priority && props.Priority?.select?.name) {
            priority = props.Priority.select.name;
        } else if (!priority && props["الأهمية"]?.select?.name) {
            priority = props["الأهمية"].select.name;
        }

        // 6. Extract Duration (supports n8n property_الوقت_المتوقع, duration)
        let duration =
            props.property_الوقت_المتوقع ||
            item.property_الوقت_المتوقع ||
            item.duration ||
            item.task_duration ||
            props.duration ||
            "";

        if (!duration && props.Duration?.select?.name) {
            duration = props.Duration.select.name;
        } else if (!duration && props["الوقت المتوقع"]?.select?.name) {
            duration = props["الوقت المتوقع"].select.name;
        }

        // 7. Extract Date (supports n8n property_date.start, Date, created_time)
        let date =
            props.property_date?.start ||
            item.property_date?.start ||
            props.property_date ||
            item.property_date ||
            item.date ||
            item.created_time ||
            item.created_at ||
            "";

        if (!date && props.Date?.date?.start) {
            date = props.Date.date.start;
        } else if (!date && props["التاريخ"]?.date?.start) {
            date = props["التاريخ"].date.start;
        } else if (!date && props["تاريخ"]?.date?.start) {
            date = props["تاريخ"].date.start;
        } else if (!date && item.created_time) {
            date = item.created_time;
        }

        const id = item.property_id_task || item.id || `task-${index}-${Date.now()}`;

        return {
            id,
            ID_task: item.property_id_task || item.ID_task || item.property_ID_task || id,
            title: title || "مهمة بدون عنوان",
            description,
            status,
            category,
            priority,
            duration,
            date,
            userId: item.userId || item["user ID"] || item.user_id || "",
            userEmail: item.userEmail || item.email || "",
            rawItem: item,
        };
    });
}

/**
 * Builds the interactive Task Card DOM element with View Details Eye action.
 */
function createTaskCardElement(task, statusKey) {
    const card = document.createElement("div");
    const isCompleted = statusKey === "completed";

    card.className = `task-card ${isCompleted ? "card-is-completed" : ""}`;
    card.setAttribute("draggable", "true");
    card.setAttribute("data-id", task.id);
    card.setAttribute("data-status", statusKey);

    const categoryInfo = getCategoryInfo(task.category);
    const priorityInfo = getPriorityInfo(task.priority);
    const durationText = getDurationLabel(task.duration);

    card.innerHTML = `
        <div class="card-top">
            <span class="category-badge ${categoryInfo.className}">${escapeHtml(categoryInfo.label)}</span>
            <span class="priority-badge ${priorityInfo.className}">
                <span class="priority-dot" aria-hidden="true"></span>
                <span>${escapeHtml(priorityInfo.label)}</span>
            </span>
        </div>
        <h3 class="card-title">${escapeHtml(task.title)}</h3>
        ${task.description ? `<p class="card-desc">${escapeHtml(task.description)}</p>` : ""}
        <div class="card-bottom">
            <span class="duration-tag">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>${escapeHtml(durationText)}</span>
            </span>
            <div class="card-actions-group">
                <button type="button" class="btn-card-details" title="عرض تفاصيل المهمة" aria-label="عرض تفاصيل المهمة">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </button>
                ${isCompleted ? `
                    <span class="completed-check-badge" title="مكتملة">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </span>
                ` : `
                    <span class="drag-handle" aria-label="اسحب المهمة">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="9" cy="5" r="1"></circle>
                            <circle cx="9" cy="12" r="1"></circle>
                            <circle cx="9" cy="19" r="1"></circle>
                            <circle cx="15" cy="5" r="1"></circle>
                            <circle cx="15" cy="12" r="1"></circle>
                            <circle cx="15" cy="19" r="1"></circle>
                        </svg>
                    </span>
                `}
            </div>
        </div>
    `;

    // Click handler for View Details Eye action
    const detailsBtn = card.querySelector(".btn-card-details");
    if (detailsBtn) {
        detailsBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            e.preventDefault();
            openTaskDetailsModal(task, card);
        });
    }

    // Drag events for card
    card.addEventListener("dragstart", (e) => {
        card.classList.add("is-dragging");
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
    });

    card.addEventListener("dragend", () => {
        card.classList.remove("is-dragging");
    });

    return card;
}

/**
 * Recalculates stats, counters, and completion percentage across all sections.
 */
function updateBoardStats() {
    const pendingList = document.getElementById("cards-pending");
    const progressList = document.getElementById("cards-progress");
    const completedList = document.getElementById("cards-completed");

    const pendingCount = pendingList ? pendingList.querySelectorAll(".task-card").length : 0;
    const progressCount = progressList ? progressList.querySelectorAll(".task-card").length : 0;
    const completedCount = completedList ? completedList.querySelectorAll(".task-card").length : 0;
    const totalCount = pendingCount + progressCount + completedCount;

    // Update column counters
    const counterPending = document.getElementById("counter-pending");
    const counterProgress = document.getElementById("counter-progress");
    const counterCompleted = document.getElementById("counter-completed");

    if (counterPending) counterPending.textContent = pendingCount;
    if (counterProgress) counterProgress.textContent = progressCount;
    if (counterCompleted) counterCompleted.textContent = completedCount;

    // Update main stats summary cards
    const statTotal = document.getElementById("stat-total");
    const statPending = document.getElementById("stat-pending");
    const statProgress = document.getElementById("stat-progress");
    const statCompleted = document.getElementById("stat-completed");
    const statPill = document.getElementById("stat-progress-pill");

    if (statTotal) statTotal.textContent = totalCount;
    if (statPending) statPending.textContent = pendingCount;
    if (statProgress) statProgress.textContent = progressCount;
    if (statCompleted) statCompleted.textContent = completedCount;

    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    if (statPill) {
        statPill.innerHTML = `<span>${percentage}% إنجاز</span>`;
    }

    // Render empty state placeholder if list is empty
    checkEmptyPlaceholders(pendingList, "قيد الانتظار");
    checkEmptyPlaceholders(progressList, "قيد التنفيذ");
    checkEmptyPlaceholders(completedList, "مكتملة");
}

/**
 * Shows a placeholder when a column has zero cards.
 */
function checkEmptyPlaceholders(container, label) {
    if (!container) return;

    const hasCards = container.querySelectorAll(".task-card").length > 0;
    let placeholder = container.querySelector(".empty-column-placeholder");

    if (!hasCards) {
        if (!placeholder) {
            placeholder = document.createElement("div");
            placeholder.className = "empty-column-placeholder";
            placeholder.textContent = `لا توجد مهام في قسم ${label}`;
            container.appendChild(placeholder);
        }
    } else if (placeholder) {
        placeholder.remove();
    }
}

/**
 * Reverts a task card to its previous column and state if server update fails.
 */
function revertCardToPreviousStatus(cardElement, previousStatus) {
    if (!cardElement || !previousStatus) return;

    cardElement.setAttribute("data-status", previousStatus);

    const targetContainer =
        previousStatus === "pending"
            ? document.getElementById("cards-pending")
            : previousStatus === "progress"
                ? document.getElementById("cards-progress")
                : document.getElementById("cards-completed");

    const actionsGroup = cardElement.querySelector(".card-actions-group");

    if (previousStatus === "completed") {
        cardElement.classList.add("card-is-completed");
        const handle = actionsGroup?.querySelector(".drag-handle");
        if (handle) {
            handle.outerHTML = `
                <span class="completed-check-badge" title="مكتملة">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </span>
            `;
        }
    } else {
        cardElement.classList.remove("card-is-completed");
        const checkBadge = actionsGroup?.querySelector(".completed-check-badge");
        if (checkBadge) {
            checkBadge.outerHTML = `
                <span class="drag-handle" aria-label="اسحب المهمة">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="9" cy="5" r="1"></circle>
                        <circle cx="9" cy="12" r="1"></circle>
                        <circle cx="9" cy="19" r="1"></circle>
                        <circle cx="15" cy="5" r="1"></circle>
                        <circle cx="15" cy="12" r="1"></circle>
                        <circle cx="15" cy="19" r="1"></circle>
                    </svg>
                </span>
            `;
        }
    }

    if (targetContainer) {
        targetContainer.appendChild(cardElement);
    }
    updateBoardStats();
}

/**
 * Sends a POST request to update the task status in the database.
 * Verifies that response returns { process: "done" } or displays an error and rolls back.
 * Follows canonical Axios promise chaining (.then, .catch, .finally).
 */
function updateTaskStatus(taskId, statusKey, cardElement, previousStatus) {
    const userStr = localStorage.getItem("auth_user");
    const currentUser = userStr ? JSON.parse(userStr) : {};
    const authenticatedUserId = currentUser.userId || currentUser.id || "";

    const statusArabicMap = {
        pending: "قيد الانتظار",
        progress: "قيد التنفيذ",
        completed: "مكتملة",
    };

    const statusNotionMap = {
        pending: "Not started",
        progress: "In progress",
        completed: "Done",
    };

    const newStatusArabic = statusArabicMap[statusKey] || statusKey;
    const newStatusNotion = statusNotionMap[statusKey] || statusKey;

    axios
        .post(UrlPost, {
            POST: "Update task status",
            taskId: taskId,
            id: taskId,
            status: newStatusArabic,
            status_text: newStatusNotion,
            statusKey: statusKey,
            userId: authenticatedUserId,
            "user ID": authenticatedUserId,
            updated_at: new Date().toISOString(),
        })
        .then(function (response) {
            const data = response.data;
            const isSuccess = data && (data.success === true || data.process === "done" || data.status === "success");

            if (isSuccess) {
                showToast("تم تحديث الحالة", `تم نقل المهمة إلى "${newStatusArabic}" وتحديثها بنجاح.`, "success", 2000);
            } else {
                const errorMsg = data?.message || data?.error?.message || "لم يتم تأكيد العملية من السيرفر.";
                showToast("فشل التحديث", errorMsg, "error", 3500);
                revertCardToPreviousStatus(cardElement, previousStatus);
            }
        })
        .catch(function (error) {
            console.error("Error updating task status:", error);
            const serverMsg = error.response?.data?.message || error.response?.data?.error?.message || "تعذر حفظ تغيير الحالة في السيرفر، يرجى التحقق من الاتصال.";
            showToast("خطأ في التحديث", serverMsg, "error");
            revertCardToPreviousStatus(cardElement, previousStatus);
        })
        .finally(function () {
            // Completion callback
        });
}

/**
 * Calculates the closest task card relative to mouse Y position for precise insertion among multiple cards.
 */
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll(".task-card:not(.is-dragging)")];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/**
 * Initializes drag and drop listeners on column containers.
 */
function initDragAndDrop() {
    const columns = [
        { container: document.getElementById("cards-pending"), statusKey: "pending" },
        { container: document.getElementById("cards-progress"), statusKey: "progress" },
        { container: document.getElementById("cards-completed"), statusKey: "completed" },
    ];

    columns.forEach(({ container, statusKey }) => {
        if (!container) return;

        container.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            container.classList.add("drag-over");

            const draggingCard = document.querySelector(".task-card.is-dragging");
            if (draggingCard) {
                const afterElement = getDragAfterElement(container, e.clientY);
                if (afterElement) {
                    container.insertBefore(draggingCard, afterElement);
                } else {
                    container.appendChild(draggingCard);
                }
            }
        });

        container.addEventListener("dragleave", (e) => {
            if (!container.contains(e.relatedTarget)) {
                container.classList.remove("drag-over");
            }
        });

        container.addEventListener("drop", (e) => {
            e.preventDefault();
            container.classList.remove("drag-over");

            const draggingCard = document.querySelector(".task-card.is-dragging");
            if (!draggingCard) return;

            const previousStatus = draggingCard.getAttribute("data-status");
            const taskId = draggingCard.getAttribute("data-id");

            // Update card styling based on target column
            draggingCard.setAttribute("data-status", statusKey);

            const actionsGroup = draggingCard.querySelector(".card-actions-group");

            if (statusKey === "completed") {
                draggingCard.classList.add("card-is-completed");
                // Update bottom action icon to completed checkmark
                const handle = actionsGroup?.querySelector(".drag-handle");
                if (handle) {
                    handle.outerHTML = `
                        <span class="completed-check-badge" title="مكتملة">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </span>
                    `;
                }
            } else {
                draggingCard.classList.remove("card-is-completed");
                const checkBadge = actionsGroup?.querySelector(".completed-check-badge");
                if (checkBadge) {
                    checkBadge.outerHTML = `
                        <span class="drag-handle" aria-label="اسحب المهمة">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="9" cy="5" r="1"></circle>
                                <circle cx="9" cy="12" r="1"></circle>
                                <circle cx="9" cy="19" r="1"></circle>
                                <circle cx="15" cy="5" r="1"></circle>
                                <circle cx="15" cy="12" r="1"></circle>
                                <circle cx="15" cy="19" r="1"></circle>
                            </svg>
                        </span>
                    `;
                }
            }

            const afterElement = getDragAfterElement(container, e.clientY);
            if (afterElement) {
                container.insertBefore(draggingCard, afterElement);
            } else {
                container.appendChild(draggingCard);
            }
            updateBoardStats();

            // Trigger POST request to save the new status in database
            if (previousStatus !== statusKey && taskId) {
                updateTaskStatus(taskId, statusKey, draggingCard, previousStatus);
            }
        });
    });
}

let currentActiveModalTask = null;
let currentActiveModalCardElement = null;

/**
 * Opens the Task Details Modal populated with database fields.
 */
function openTaskDetailsModal(task, cardElement) {
    currentActiveModalTask = task;
    currentActiveModalCardElement = cardElement;

    const overlay = document.getElementById("task-details-modal-overlay");
    if (!overlay) return;

    // 1. Populate Badges
    const headerBadges = document.getElementById("modal-header-badges");
    if (headerBadges) {
        const categoryInfo = getCategoryInfo(task.category);
        const priorityInfo = getPriorityInfo(task.priority);
        const statusKey = normalizeStatus(task.status);
        const statusLabel = statusKey === "completed" ? "مكتملة" : statusKey === "progress" ? "قيد التنفيذ" : "قيد الانتظار";
        const statusDotClass = statusKey === "completed" ? "dot-completed" : statusKey === "progress" ? "dot-progress" : "dot-pending";

        headerBadges.innerHTML = `
            <span class="category-badge ${categoryInfo.className}">${escapeHtml(categoryInfo.label)}</span>
            <span class="priority-badge ${priorityInfo.className}">
                <span class="priority-dot" aria-hidden="true"></span>
                <span>${escapeHtml(priorityInfo.label)}</span>
            </span>
            <span class="modal-status-badge">
                <span class="column-dot ${statusDotClass}" style="width: 7px; height: 7px;" aria-hidden="true"></span>
                <span>${escapeHtml(statusLabel)}</span>
            </span>
        `;
    }

    // 2. Populate Title and Description
    const titleEl = document.getElementById("modal-task-title");
    if (titleEl) {
        titleEl.textContent = task.title || "مهمة بدون عنوان";
    }

    const descEl = document.getElementById("modal-task-description");
    if (descEl) {
        if (task.description && task.description.trim()) {
            descEl.textContent = task.description;
            descEl.classList.remove("is-empty");
        } else {
            descEl.textContent = "لا يوجد وصف إضافي لهذه المهمة.";
            descEl.classList.add("is-empty");
        }
    }

    // 3. Populate Grid Fields
    const statusValEl = document.getElementById("modal-task-status");
    if (statusValEl) {
        const statusKey = normalizeStatus(task.status);
        const statusLabel = statusKey === "completed" ? "مكتملة" : statusKey === "progress" ? "قيد التنفيذ" : "قيد الانتظار";
        statusValEl.textContent = statusLabel;
    }

    const catValEl = document.getElementById("modal-task-category");
    if (catValEl) {
        const categoryInfo = getCategoryInfo(task.category);
        catValEl.textContent = categoryInfo.label;
    }

    const prioValEl = document.getElementById("modal-task-priority");
    if (prioValEl) {
        const priorityInfo = getPriorityInfo(task.priority);
        prioValEl.textContent = priorityInfo.label;
    }

    const durValEl = document.getElementById("modal-task-duration");
    if (durValEl) {
        durValEl.textContent = getDurationLabel(task.duration);
    }

    const dateValEl = document.getElementById("modal-task-date");
    if (dateValEl) {
        dateValEl.textContent = task.date || getTodayDateString();
    }

    const idValEl = document.getElementById("modal-task-id");
    if (idValEl) {
        idValEl.textContent = task.ID_task || task.id || "-";
    }

    // Reset delete button state
    const deleteBtn = document.getElementById("modal-delete-btn");
    if (deleteBtn) {
        deleteBtn.classList.remove("is-confirming");
        deleteBtn.innerHTML = `
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            <span>حذف المهمة</span>
        `;
    }

    // Show modal overlay
    overlay.classList.add("is-active");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

/**
 * Closes the Task Details Modal.
 */
function closeTaskDetailsModal() {
    const overlay = document.getElementById("task-details-modal-overlay");
    if (!overlay) return;

    overlay.classList.remove("is-active");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    currentActiveModalTask = null;
    currentActiveModalCardElement = null;
}

/**
 * Sends a POST request to delete the task from the database and updates the UI.
 * Follows the project's canonical Axios promise pattern (.then, .catch, .finally).
 */
function deleteTaskFromModal() {
    if (!currentActiveModalTask) return;

    const deleteBtn = document.getElementById("modal-delete-btn");
    if (!deleteBtn) return;

    // First click: prompt for confirmation
    if (!deleteBtn.classList.contains("is-confirming")) {
        deleteBtn.classList.add("is-confirming");
        deleteBtn.innerHTML = `
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>تأكيد الحذف؟</span>
        `;
        return;
    }

    const taskToDelete = currentActiveModalTask;
    const cardElToDelete = currentActiveModalCardElement;
    const taskId = taskToDelete.id;
    const taskTitle = taskToDelete.title || "المهمة";

    // Set loading state on button
    deleteBtn.disabled = true;
    deleteBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-spinner" style="display:inline-block; animation: buttonSpin 0.7s linear infinite;">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
            <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        <span>جاري الحذف...</span>
    `;

    const userStr = localStorage.getItem("auth_user");
    const currentUser = userStr ? JSON.parse(userStr) : {};
    const authenticatedUserId = currentUser.userId || currentUser.id || "";
    const userEmail = currentUser.email || "";

    axios
        .post(UrlPost, {
            POST: "Delete a task",
            action: "delete",
            taskId: taskId,
            id: taskId,
            ID_task: taskToDelete.ID_task || taskId,
            title: taskToDelete.title || "",
            description: taskToDelete.description || "",
            status: taskToDelete.status || "",
            category: taskToDelete.category || "",
            priority: taskToDelete.priority || "",
            duration: taskToDelete.duration || "",
            date: taskToDelete.date || "",
            userId: authenticatedUserId,
            "user ID": authenticatedUserId,
            userEmail: userEmail,
            data: {
                taskId: taskId,
                id: taskId,
                ID_task: taskToDelete.ID_task || taskId,
                title: taskToDelete.title || "",
                description: taskToDelete.description || "",
                status: taskToDelete.status || "",
                category: taskToDelete.category || "",
                priority: taskToDelete.priority || "",
                duration: taskToDelete.duration || "",
                date: taskToDelete.date || "",
                userId: authenticatedUserId,
                "user ID": authenticatedUserId,
                userEmail: userEmail,
            },
        })
        .then(function (response) {
            const data = response.data;
            const isSuccess = data && (data.success === true || data.process === "done" || data.status === "success");

            if (isSuccess || !data || data.process !== "error") {
                // Immediately remove card from UI with smooth transition
                if (cardElToDelete && cardElToDelete.parentNode) {
                    cardElToDelete.style.transition = "opacity 0.2s ease, transform 0.2s ease";
                    cardElToDelete.style.opacity = "0";
                    cardElToDelete.style.transform = "scale(0.9)";
                    setTimeout(() => {
                        if (cardElToDelete.parentNode) {
                            cardElToDelete.parentNode.removeChild(cardElToDelete);
                        }
                        updateBoardStats();
                    }, 200);
                } else {
                    updateBoardStats();
                }

                closeTaskDetailsModal();
                showToast("تم الحذف بنجاح", `تم حذف المهمة "${taskTitle}" بنجاح.`, "success", 2500);
            } else {
                const errorMsg = data?.message || data?.error?.message || "فشلت عملية حذف المهمة في السيرفر.";
                showToast("فشل الحذف", errorMsg, "error", 4000);
                deleteBtn.disabled = false;
                deleteBtn.classList.remove("is-confirming");
                deleteBtn.innerHTML = `
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    <span>حذف المهمة</span>
                `;
            }
        })
        .catch(function (error) {
            console.error("Error deleting task:", error);
            const serverMsg = error.response?.data?.message || error.response?.data?.error?.message || "تعذر إتمام طلب الحذف، يرجى التحقق من اتصال السيرفر.";
            showToast("خطأ في الحذف", serverMsg, "error");
            deleteBtn.disabled = false;
            deleteBtn.classList.remove("is-confirming");
            deleteBtn.innerHTML = `
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
                <span>حذف المهمة</span>
            `;
        })
        .finally(function () {
            // Completion callback
        });
}

/**
 * Initializes modal event listeners once on DOM ready.
 */
function initTaskDetailsModalListeners() {
    const overlay = document.getElementById("task-details-modal-overlay");
    const closeBtn = document.getElementById("modal-close-btn");
    const dismissBtn = document.getElementById("modal-dismiss-btn");
    const deleteBtn = document.getElementById("modal-delete-btn");

    if (closeBtn) {
        closeBtn.addEventListener("click", closeTaskDetailsModal);
    }

    if (dismissBtn) {
        dismissBtn.addEventListener("click", closeTaskDetailsModal);
    }

    if (deleteBtn) {
        deleteBtn.addEventListener("click", deleteTaskFromModal);
    }

    if (overlay) {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                closeTaskDetailsModal();
            }
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const activeOverlay = document.getElementById("task-details-modal-overlay");
            if (activeOverlay && activeOverlay.classList.contains("is-active")) {
                closeTaskDetailsModal();
            }
        }
    });
}

/**
 * Main function to fetch tasks from webhook/Notion and populate only today's tasks in sections.
  **/

function GetTasks() {
    const btn = document.querySelector(".btn-new-task");
    const originalContent = btn ? btn.innerHTML : "";
    const todayFormattedDate = getTodayDateString();

    // Update today date display badge if element exists
    const dateBadge = document.getElementById("today-date-badge");
    if (dateBadge) {
        dateBadge.textContent = `مهام اليوم: ${getTodayArabicString()}`;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-spinner" style="display:inline-block; animation: buttonSpin 0.7s linear infinite;">
                <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
                <path d="M12 2a10 10 0 0 1 10 10"></path>
            </svg>
            <span>جاري الجلب...</span>
        `;
    }

    const userStr = localStorage.getItem("auth_user");
    const currentUser = userStr ? JSON.parse(userStr) : {};
    const authenticatedUserId = currentUser.userId || currentUser.id || "";
    const userEmail = currentUser.email || "";

    axios
        .get(UrlGet, {
            params: {
                Get: "get_all_tasks",
                date: todayFormattedDate,
                userId: authenticatedUserId,
                "user ID": authenticatedUserId,
                userEmail: userEmail,
            },
        })
        .then(function (response) {
            console.log("Response data received:", response.data);

            // Check if n8n returned a plain string like "yes"
            if (typeof response.data === "string" && response.data.trim() === "yes") {
                showToast(
                    "إعداد n8n مطلوب",
                    "عقدة Respond to Webhook في n8n مضبوطة على إرجاع نص 'yes' بدلاً من بيانات المهام JSON.",
                    "error",
                    5000
                );
                updateBoardStats();
                return;
            }

            const allTasks = parseTasksResponse(response.data);

            // Filter tasks: display only tasks for today
            const todayTasks = allTasks.filter((task) => isTaskForToday(task.date));

            // Containers for each status
            const pendingList = document.getElementById("cards-pending");
            const progressList = document.getElementById("cards-progress");
            const completedList = document.getElementById("cards-completed");

            if (pendingList) pendingList.innerHTML = "";
            if (progressList) progressList.innerHTML = "";
            if (completedList) completedList.innerHTML = "";

            if (todayTasks.length === 0) {
                showToast("لا توجد مهام اليوم", "لم يتم العثور على أي مهام مسجلة لتاريخ اليوم.", "info");
            } else {
                todayTasks.forEach((task) => {
                    const statusKey = normalizeStatus(task.status);
                    const cardElement = createTaskCardElement(task, statusKey);

                    if (statusKey === "progress" && progressList) {
                        progressList.appendChild(cardElement);
                    } else if (statusKey === "completed" && completedList) {
                        completedList.appendChild(cardElement);
                    } else if (pendingList) {
                        pendingList.appendChild(cardElement);
                    }
                });

                showToast("مهام اليوم", `تم تحميل ${todayTasks.length} مهمة لتاريخ اليوم بنجاح.`, "success");
            }

            updateBoardStats();
        })
        .catch(function (error) {
            console.error("Error fetching tasks:", error);
            showToast("خطأ في الاتصال", "تعذر جلب المهام من السيرفر، يرجى التأكد من تشغيل الـ Webhook في n8n.", "error");
            updateBoardStats();
        })
        .finally(function () {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalContent;
            }
          });
}

// Automatically check authentication, update today badge, initialize drag-and-drop, and fetch tasks on page load/refresh
document.addEventListener("DOMContentLoaded", () => {
    // 1. Check LocalStorage on Every Refresh / Load
    const authUser = localStorage.getItem("auth_user");

    if (!authUser) {
        // User is not signed in -> Redirect to Sign In page
        window.location.href = "auth.html";
        return;
    }

    // 2. User is signed in -> Continue loading the Board
    const dateBadge = document.getElementById("today-date-badge");
    if (dateBadge) {
        dateBadge.textContent = `مهام اليوم: ${getTodayArabicString()}`;
    }
    initDragAndDrop();
    initTaskDetailsModalListeners();
    GetTasks();
});
