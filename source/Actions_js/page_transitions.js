/**
 * Page Transitions & Navigation Progress Bar (Industry Standard / Vercel & GitHub Style)
 * Provides 0ms instant feedback with a sleek top progress bar and smooth cross-document transitions.
 */

(function () {
    // 1. Create and inject the sleek top loading bar if not already present
    function createProgressBar() {
        if (document.getElementById("top-nav-progress")) return;
        const bar = document.createElement("div");
        bar.id = "top-nav-progress";
        bar.className = "top-nav-progress";
        bar.innerHTML = '<div class="progress-bar-glow"></div>';
        document.documentElement.appendChild(bar);
        return bar;
    }

    let progressTimer = null;
    let progressVal = 0;

    function startProgress() {
        const bar = document.getElementById("top-nav-progress") || createProgressBar();
        if (!bar) return;

        clearInterval(progressTimer);
        progressVal = 15;
        bar.style.opacity = "1";
        bar.style.transform = `scaleX(${progressVal / 100})`;
        bar.classList.add("is-active");

        // Gradually increment to simulate fast response
        progressTimer = setInterval(() => {
            if (progressVal < 85) {
                progressVal += Math.random() * 15;
                bar.style.transform = `scaleX(${progressVal / 100})`;
            }
        }, 100);
    }

    function completeProgress() {
        const bar = document.getElementById("top-nav-progress");
        if (!bar) return;

        clearInterval(progressTimer);
        bar.style.transform = "scaleX(1)";

        setTimeout(() => {
            bar.style.opacity = "0";
            setTimeout(() => {
                bar.classList.remove("is-active");
                bar.style.transform = "scaleX(0)";
            }, 200);
        }, 120);
    }

    // Initialize on DOMContentLoaded & pageshow
    document.addEventListener("DOMContentLoaded", () => {
        createProgressBar();
        completeProgress();
        bindLinkEvents();
    });

    window.addEventListener("pageshow", () => {
        completeProgress();
    });

    window.addEventListener("beforeunload", () => {
        startProgress();
    });

    function bindLinkEvents() {
        document.addEventListener("click", (e) => {
            const link = e.target.closest("a");
            if (!link) return;

            const href = link.getAttribute("href");
            if (!href) return;

            // Skip anchors, javascript, external links, and special targets
            if (
                href.startsWith("#") ||
                href.startsWith("javascript:") ||
                link.getAttribute("target") === "_blank" ||
                link.hasAttribute("download") ||
                e.ctrlKey ||
                e.metaKey ||
                e.shiftKey ||
                e.altKey
            ) {
                return;
            }

            // Internal pages: trigger 0ms progress bar feedback immediately
            const isInternalPage =
                href.endsWith(".html") ||
                href.includes("index.html") ||
                href.includes("todo.html") ||
                href.includes("auth.html") ||
                href.includes("landing.html") ||
                (!href.includes("://") && !href.startsWith("//"));

            if (isInternalPage) {
                startProgress();
            }
        }, { passive: true });
    }
})();

