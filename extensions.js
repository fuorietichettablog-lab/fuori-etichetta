/* ==========================================================================
   FUORI ETICHETTA — EXTENSIONS, ATELIER CMS DASHBOARD & ISPAZIO ENGINE
   Compatibile al 100% con app.js e Supabase
   ========================================================================== */

(function () {
    "use strict";

    /* ==========================================================================
       1. FORMATTAZIONE MARKDOWN, PROGRESS BAR & TEMPO DI LETTURA
       ========================================================================== */

    function escapeHtml(text) {
        if (!text) return "";
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function formatMarkdown(text) {
        if (!text) return "";
        var safeText = escapeHtml(text);

        safeText = safeText.replace(/^###\s+(.*)$/gim, '<h3 class="fe-article-h3">$1</h3>');
        safeText = safeText.replace(/^##\s+(.*)$/gim, '<h2 class="fe-article-h2">$1</h2>');
        safeText = safeText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        safeText = safeText.replace(/\*(.*?)\*/g, "<em>$1</em>");

        var blocks = safeText.split(/\n\s*\n/);
        var htmlBlocks = [];

        for (var i = 0; i < blocks.length; i++) {
            var block = blocks[i].trim();
            if (!block) continue;
            if (block.indexOf('<h2 class="fe-article-h2">') === 0 || block.indexOf('<h3 class="fe-article-h3">') === 0) {
                htmlBlocks.push(block);
            } else {
                htmlBlocks.push('<p class="fe-article-paragraph">' + block.replace(/\n/g, "<br>") + "</p>");
            }
        }
        return htmlBlocks.join("");
    }

    function updatePublicReadingTime() {
        var articleContainer = document.getElementById("article-detail-content");
        var viewArticle = document.getElementById("view-article");
        if (!articleContainer || !viewArticle || viewArticle.classList.contains("hidden")) return;

        var rawText = (articleContainer.textContent || "").trim();
        if (!rawText) return;

        var words = rawText.split(/\s+/).filter(Boolean).length;
        var minutes = Math.max(1, Math.ceil(words / 180));
        var newText = "⏱ Tempo di lettura stimato: " + minutes + " min (" + words + " parole)";

        var header = document.querySelector("#view-article .article-header");
        if (header) {
            var badge = document.getElementById("fe-public-reading-time");
            if (!badge) {
                badge = document.createElement("div");
                badge.id = "fe-public-reading-time";
                badge.className = "fe-public-reading-time";
                header.appendChild(badge);
            }
            if (badge.textContent !== newText) {
                badge.textContent = newText;
            }
        }
    }

    function initReadingProgressBar() {
        var bar = document.getElementById("fe-reading-progress-bar");
        if (!bar) return;

        window.addEventListener("scroll", function () {
            var viewArticle = document.getElementById("view-article");
            if (!viewArticle || viewArticle.classList.contains("hidden")) {
                bar.style.width = "0%";
                return;
            }
            var scrollTop = window.scrollY || document.documentElement.scrollTop;
            var docHeight = document.documentElement.scrollHeight - window.innerHeight;
            var pct = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
            bar.style.width = pct + "%";
        }, { passive: true });
    }

    /* ==========================================================================
       2. DISTRIBUZIONE FOTO IN MEZZO AL TESTO (STILE ISPAZIO + OUTFIT SUPPORT)
       ========================================================================== */

    function killCarouselAndDistributePhotos() {
        var viewArticle = document.getElementById("view-article");
        var contentBox = document.getElementById("article-detail-content");
        if (!viewArticle || !contentBox || viewArticle.classList.contains("hidden")) return;

        var urls = [];
        var mainImg = document.getElementById("article-detail-image");
        var mainSrc = mainImg ? (mainImg.getAttribute("src") || mainImg.src) : "";

        // 1. Legge direttamente da state.carouselSlides o state.activeArticle (fondamentale per categoria Outfit)
        if (typeof state !== "undefined" && state.activeArticle) {
            if (mainImg && state.activeArticle.cover_image && mainSrc !== state.activeArticle.cover_image) {
                mainImg.src = state.activeArticle.cover_image;
                mainSrc = state.activeArticle.cover_image;
            }
            if (Array.isArray(state.carouselSlides)) {
                state.carouselSlides.forEach(function (s) {
                    if (s && s.type === "image" && s.url && s.url !== mainSrc && urls.indexOf(s.url) === -1) {
                        urls.push(s.url);
                    }
                });
            }
            if (typeof parseArticleMedia === "function") {
                var parsed = parseArticleMedia(state.activeArticle);
                if (parsed && Array.isArray(parsed.gallery)) {
                    parsed.gallery.forEach(function (u) {
                        if (u && u !== mainSrc && urls.indexOf(u) === -1) urls.push(u);
                    });
                }
            }
        }

        // 2. Nasconde i controlli del carosello superiore
        var topWrapper = document.querySelector(".interactive-media-wrapper");
        if (topWrapper) {
            var controls = topWrapper.querySelectorAll(
                "#fe-carousel-prev, #fe-carousel-next, #fe-carousel-counter, #fe-carousel-dots, .fe-carousel-btn, .fe-carousel-dots"
            );
            for (var c = 0; c < controls.length; c++) {
                controls[c].classList.add("hidden");
                controls[c].style.display = "none";
            }
        }

        // 3. Raccoglie e nasconde la galleria in fondo pagina (Opzione B)
        var bottomWrapper = document.getElementById("fe-option-b-media-container");
        if (bottomWrapper) {
            var botImgs = bottomWrapper.querySelectorAll("img");
            for (var j = 0; j < botImgs.length; j++) {
                var bSrc = botImgs[j].getAttribute("src") || botImgs[j].src;
                if (!bSrc) continue;
                if (bSrc !== mainSrc && urls.indexOf(bSrc) === -1) urls.push(bSrc);
                botImgs[j].style.display = "none";
            }
            if (!bottomWrapper.querySelector("iframe, video")) {
                bottomWrapper.style.display = "none";
            }
        }

        if (urls.length === 0) return;

        var inlines = contentBox.querySelectorAll(".fe-inline-extra-photo");
        if (inlines.length === urls.length) return;

        for (var k = 0; k < inlines.length; k++) {
            inlines[k].remove();
        }

        var blocks = contentBox.querySelectorAll("p, h2, h3");
        if (blocks.length <= 1) {
            var rawHtml = contentBox.innerHTML;
            var parts = rawHtml.split(/(?:<br\s*\/?>)+/i).map(function (s) { return s.trim(); }).filter(Boolean);
            if (parts.length <= 1) {
                var textOnly = (contentBox.textContent || "").trim();
                var sentences
