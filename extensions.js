/* ==========================================================================
   FUORI ETICHETTA - EXTENSIONS & STUDIO ADMIN PRO
   Motore Articoli iSpazio (Foto inline, Tempo Lettura, Carousel Destroyer)
   ========================================================================== */

(function () {
    "use strict";

    /* ==========================================================================
       1. FORMATTAZIONE MARKDOWN & TEMPO DI LETTURA
       ========================================================================== */

    function escapeHtml(text) {
        if (!text) return "";
        return text
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

        var header = document.querySelector("#view-article .article-header");
        if (header) {
            var badge = document.getElementById("fe-public-reading-time");
            if (!badge) {
                badge = document.createElement("div");
                badge.id = "fe-public-reading-time";
                badge.className = "fe-public-reading-time";
                header.appendChild(badge);
            }
            badge.textContent = "⏱ Tempo di lettura stimato: " + minutes + " min (" + words + " parole)";
        }
    }


    /* ==========================================================================
       2. CAROUSEL DESTROYER E DISTRIBUZIONE FOTO (STILE ISPAZIO)
       ========================================================================== */

    function killCarouselAndDistributePhotos() {
        var viewArticle = document.getElementById("view-article");
        var contentBox = document.getElementById("article-detail-content");
        if (!viewArticle || !contentBox || viewArticle.classList.contains("hidden")) return;

        var urls = [];
        var mainImg = document.getElementById("article-detail-image");
        var mainSrc = mainImg ? (mainImg.getAttribute("src") || mainImg.src) : "";

        // ESTREMA PULIZIA IN ALTO: Cerca tutte le immagini nel wrapper superiore e distrugge il carosello
        var topWrapper = document.querySelector(".interactive-media-wrapper");
        if (topWrapper) {
            var topImgs = topWrapper.querySelectorAll("img");
            for (var i = 0; i < topImgs.length; i++) {
                var src = topImgs[i].getAttribute("src") || topImgs[i].src;
                if (!src || src.indexOf("avatar") !== -1 || src.indexOf("icon") !== -1) continue;
                
                // Se non è l'immagine di copertina, la salva e la nasconde
                if (topImgs[i].id !== "article-detail-image" && src !== mainSrc) {
                    if (urls.indexOf(src) === -1) urls.push(src);
                    topImgs[i].style.display = "none";
                }
            }

            // Distrugge le frecce (< >) e i pallini di navigazione generati da app.js
            var controls = topWrapper.querySelectorAll("button, .carousel-indicators, [class*='dot'], [class*='pagination'], [class*='nav'], [class*='arrow']");
            for (var c = 0; c < controls.length; c++) {
                controls[c].style.display = "none";
            }
        }

        // PULIZIA IN BASSO: Prende le immagini dalla sezione extra a fondo pagina (se esistono)
        var bottomWrapper = document.getElementById("fe-option-b-media-container");
        if (bottomWrapper) {
            var botImgs = bottomWrapper.querySelectorAll("img");
            for (var j = 0; j < botImgs.length; j++) {
                var bSrc = botImgs[j].getAttribute("src") || botImgs[j].src;
                if (!bSrc) continue;
                if (urls.indexOf(bSrc) === -1) urls.push(bSrc);
                botImgs[j].style.display = "none";
            }
            if (!bottomWrapper.querySelector("iframe, video")) {
                bottomWrapper.style.display = "none";
            }
        }

        if (urls.length === 0) return;

        // Controlla se abbiamo già distribuito le foto per non farlo due volte
        var inlines = contentBox.querySelectorAll(".fe-inline-extra-photo");
        if (inlines.length === urls.length) return;

        for (var k = 0; k < inlines.length; k++) {
            if (inlines[k].parentNode) inlines[k].parentNode.removeChild(inlines[k]);
        }

        // Se il testo è un blocco unico (zero a capo), lo divide forzatamente in paragrafi
        var blocks = contentBox.querySelectorAll("p, h2, h3");
        if (blocks.length <= 1) {
            var rawHtml = contentBox.innerHTML;
            var parts = rawHtml.split(/(?:<br\s*\/?>)+/i);
            var cleanParts = [];
            for (var p = 0; p < parts.length; p++) {
                if (parts[p].trim()) cleanParts.push(parts[p].trim());
            }
            if (cleanParts.length > 1) {
                var newHtml = "";
                for (var q = 0; q < cleanParts.length; q++) {
                    newHtml += '<p class="fe-article-paragraph">' + cleanParts[q] + "</p>";
                }
                contentBox.innerHTML = newHtml;
                blocks = contentBox.querySelectorAll("p");
            }
        }

        // Matematica: divide il testo in blocchi per piazzare la foto esattamente in mezzo
        var totalBlocks = blocks.length;
        var step = Math.max(1, Math.floor(totalBlocks / (urls.length + 1)));

        for (var u = 0; u < urls.length; u++) {
            var figure = document.createElement("figure");
            figure.className = "fe-inline-extra-photo";
            var newImg = document.createElement("img");
            newImg.src = urls[u];
            newImg.loading = "lazy";
            figure.appendChild(newImg);

            var idx = Math.min(((u + 1) * step) - 1, totalBlocks - 1);
            if (idx < 0) idx = 0;

            if (blocks[idx] && blocks[idx].parentNode === contentBox) {
                if (blocks[idx].nextSibling) {
                    contentBox.insertBefore(figure, blocks[idx].nextSibling);
                } else {
                    contentBox.appendChild(figure);
                }
            } else {
                contentBox.appendChild(figure);
            }
        }
    }


    function initArticleObserver() {
        var viewArticle = document.getElementById("view-article");
        var articleContainer = document.getElementById("article-detail-content");

        if (!viewArticle) return;

        var processing = false;

        function runEnhancements() {
            if (processing || viewArticle.classList.contains("hidden")) return;

            if (articleContainer && articleContainer.childNodes.length === 1 && articleContainer.firstChild.nodeType === 3) {
                var rawText = articleContainer.textContent;
                if (rawText && rawText.trim() !== "") {
                    processing = true;
                    articleContainer.innerHTML = formatMarkdown(rawText);
                    processing = false;
                }
            }
            updatePublicReadingTime();
            killCarouselAndDistributePhotos();
        }

        // Il MutationObserver lancia i controlli in loop quando app.js modifica la pagina
        var obs = new MutationObserver(function () {
            runEnhancements();
            // Ritardi multipli per distruggere il carosello non appena app.js lo crea
            setTimeout(runEnhancements, 50);
            setTimeout(runEnhancements, 200);
            setTimeout(runEnhancements, 600);
            setTimeout(runEnhancements, 1200);
        });

        obs.observe(viewArticle, { childList: true, subtree: true, attributes: true });
    }


    /* ==========================================================================
       3. CATEGORIE
       ========================================================================== */

    function fixCategories() {
        var categories = ["Outfit", "Novità", "Articoli"];
        var navPills = document.querySelectorAll(".category-nav .cat-pill");

        if (navPills.length >= 4) {
            for (var i = 0; i < categories.length; i++) {
                var pill = navPills[i + 1];
                if (!pill) continue;
                pill.setAttribute("data-category", categories[i]);
                pill.textContent = categories[i];
            }
            for (var j = 4; j < navPills.length; j++) {
                navPills[j].style.display = "none";
            }
        }

        var adminSelect = document.getElementById("admin-article-category");
        if (!adminSelect) return;
        var currentValue = adminSelect.value;
        adminSelect.innerHTML = "";

        categories.forEach(function (category) {
            var option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            adminSelect.appendChild(option);
        });

        if (categories.indexOf(currentValue) !== -1) {
            adminSelect.value = currentValue;
        } else {
            adminSelect.value = "Outfit";
        }
    }


    /* ==========================================================================
       4. CSS ARTICOLI PUBBLICI (ISPAZIO STYLE)
       ========================================================================== */

    function injectArticleStyles() {
        if (document.getElementById("fe-article-styles")) return;

        var css = [
            ".fe-article-paragraph { margin: 0 0 22px; line-height: 1.75; }",
            ".fe-article-h2 { margin: 38px 0 16px; font-size: 1.65rem; line-height: 1.2; font-weight: 800; color: #111111; }",
            ".fe-article-h3 { margin: 32px 0 14px; font-size: 1.3rem; line-height: 1.25; font-weight: 750; color: #18181b; }",
            "#article-detail-content strong { font-weight: 800; }",
            "#article-detail-content em { font-style: italic; }",

            ".fe-public-reading-time { display: inline-flex; align-items: center; gap: 7px; margin: 10px 0 24px; padding: 8px 14px; background: #f4f4f5; color: #18181b; border: 1px solid #e4e4e7; border-radius: 999px; font-size: 0.82rem; font-weight: 700; line-height: 1; }",

            ".fe-inline-extra-photo { display: block; width: 100%; max-width: 900px; margin: 40px auto; padding: 0; text-align: center; }",
            ".fe-inline-extra-photo img { display: block; width: 100%; max-width: 100%; max-height: 850px; height: auto; margin: 0 auto; object-fit: cover; border-radius: 16px; box-shadow: 0 12px 35px rgba(0, 0, 0, 0.08); }",

            "@media (max-width: 600px) {",
            "  .fe-public-reading-time { margin-bottom: 14px; font-size: 0.75rem; }",
            "  .fe-inline-extra-photo { margin-top: 26px; margin-bottom: 26px; }",
            "  .fe-inline-extra-photo img { border-radius: 12px; }",
            "}"
        ].join("\n");

        var style = document.createElement("style");
        style.id = "fe-article-styles";
        style.type = "text/css";
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
    }


    /* ==========================================================================
       5. CSS ADMIN PRO (INTATTO)
       ========================================================================== */

    function injectProStyles() {
        if (document.getElementById("fe-pro-admin-styles")) return;

        var css = [
            "#view-admin { max-width: 1450px !important; margin: 0 auto !important; padding: 26px 28px 90px !important; box-sizing: border-box !important; }",
            "#view-admin *, #view-admin *::before, #view-admin *::after { box-sizing: border-box !important; }",
            "#view-admin button, #view-admin input, #view-admin textarea, #view-admin select { font-family: inherit !important; }",

            "#view-admin .admin-top-bar { display: flex !important; align-items: center !important; justify-content: space-between !important; min-height: 76px !important; margin-bottom: 20px !important; padding: 18px 22px !important; background: linear-gradient(135deg, #09090b 0%, #18181b 100%) !important; color: #ffffff !important; border-radius: 18px !important; box-shadow: 0 14px 35px rgba(0, 0, 0, 0.10) !important; }",
            "#view-admin .admin-top-bar .catalog-title { color: #ffffff !important; font-size: 1.2rem !important; font-weight: 800 !important; letter-spacing: -0.02em !important; margin: 0 !important; }",
            "#view-admin .admin-top-bar .catalog-subtitle { display: none !important; }",
            "#view-admin #btn-close-admin { min-height: 38px !important; padding: 8px 14px !important; background: rgba(255, 255, 255, 0.1) !important; color: #ffffff !important; border: 1px solid rgba(255, 255, 255, 0.18) !important; border-radius: 10px !important; font-size: 0.82rem !important; font-weight: 700 !important; cursor: pointer !important; transition: 0.2s ease !important; }",
            "#view-admin #btn-close-admin:hover { background: rgba(255, 255, 255, 0.18) !important; transform: translateY(-1px) !important; }",

            "#view-admin .admin-tabs { display: inline-flex !important; align-items: center !important; flex-wrap: wrap !important; gap: 5px !important; margin-bottom: 22px !important; padding: 5px !important; background: #e4e4e7 !important; border-radius: 12px !important; border: none !important; }",
            "#view-admin .admin-tab { min-height: 36px !important; padding: 8px 14px !important; background: transparent !important; color: #52525b !important; border: none !important; border-radius: 9px !important; font-size: 0.8rem !important; font-weight: 700 !important; cursor: pointer !important; transition: 0.15s ease !important; }",
            "#view-admin .admin-tab:hover { color: #111111 !important; }",
            "#view-admin .admin-tab.active { background: #ffffff !important; color: #09090b !important; box-shadow: 0 2px 7px rgba(0, 0, 0, 0.08) !important; }",

            "#form-admin-article { display: block !important; margin: 0 !important; padding: 0 !important; background: transparent !important; border: none !important; box-shadow: none !important; }",
            "#form-admin-article .fe-admin-layout { display: grid !important; grid-template-columns: minmax(0, 1.75fr) minmax(320px, 0.85fr) !important; gap: 22px !important; align-items: start !important; }",
            "#form-admin-article .fe-admin-main, #form-admin-article .fe-admin-sidebar { min-width: 0 !important; }",
            "#form-admin-article .fe-admin-main { display: flex !important; flex-direction: column !important; gap: 16px !important; }",
            "#form-admin-article .fe-admin-sidebar { display: flex !important; flex-direction: column !important; gap: 16px !important; }",

            "#form-admin-article .fe-admin-card { width: 100% !important; margin: 0 !important; padding: 20px !important; background: #ffffff !important; border: 1px solid #e4e4e7 !important; border-radius: 16px !important; box-shadow: 0 7px 22px rgba(0, 0, 0, 0.035) !important; }",
            "#form-admin-article .fe-box-content { padding: 22px !important; }",

            "#form-admin-article label { display: block !important; margin: 0 0 8px !important; color: #71717a !important; font-size: 0.71rem !important; font-weight: 800 !important; letter-spacing: 0.055em !important; text-transform: uppercase !important; }",
            "#form-admin-article .checkbox-group label { margin: 0 !important; color: #18181b !important; font-size: 0.88rem !important; font-weight: 700 !important; letter-spacing: 0 !important; text-transform: none !important; }",

            "#form-admin-article input[type='text'], #form-admin-article input[type='url'], #form-admin-article input[type='email'], #form-admin-article select, #form-admin-article textarea { width: 100% !important; color: #18181b !important; background: #fafafa !important; border: 1px solid #e4e4e7 !important; border-radius: 11px !important; outline: none !important; transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease !important; }",
            "#form-admin-article input[type='text'], #form-admin-article input[type='url'], #form-admin-article input[type='email'], #form-admin-article select { min-height: 43px !important; padding: 10px 12px !important; font-size: 0.9rem !important; }",
            "#form-admin-article textarea { padding: 14px !important; resize: vertical !important; }",
            "#form-admin-article input:focus, #form-admin-article textarea:focus, #form-admin-article select:focus { background: #ffffff !important; border-color: #18181b !important; box-shadow: 0 0 0 3px rgba(24, 24, 27, 0.06) !important; }",

            "#admin-article-title { min-height: auto !important; padding: 4px 0 10px !important; background: transparent !important; border: none !important; border-bottom: 2px solid #e4e4e7 !important; border-radius: 0 !important; box-shadow: none !important; color: #09090b !important; font-size: clamp(1.45rem, 2vw, 2rem) !important; font-weight: 850 !important; letter-spacing: -0.035em !important; }",
            "#admin-article-title:focus { border-bottom-color: #09090b !important; box-shadow: none !important; }",
            "#admin-article-excerpt { min-height: 90px !important; font-size: 0.95rem !important; line-height: 1.55 !important; }",
            "#admin-article-content { min-height: 540px !important; padding: 18px !important; background: #fbfbfb !important; color: #18181b !important; font-family: Georgia, 'Times New Roman', serif !important; font-size: 1.04rem !important; line-height: 1.8 !important; border-radius: 13px !important; }",
            "#admin-article-content:focus { background: #ffffff !important; }",

            ".fe-writing-stats { display: flex !important; flex-wrap: wrap !important; gap: 8px !important; margin-top: 10px !important; }",
            ".fe-stat-pill { display: inline-flex !important; align-items: center !important; min-height: 28px !important; padding: 5px 9px !important; background: #f4f4f5 !important; color: #52525b !important; border-radius: 999px !important; font-size: 0.72rem !important; font-weight: 700 !important; }",

            ".fe-cat-pills { display: grid !important; grid-template-columns: repeat(3, minmax(0, 1fr)) !important; gap: 7px !important; margin-top: 5px !important; }",
            ".fe-cat-btn { min-height: 40px !important; padding: 8px !important; background: #fafafa !important; color: #52525b !important; border: 1px solid #e4e4e7 !important; border-radius: 10px !important; font-size: 0.82rem !important; font-weight: 750 !important; cursor: pointer !important; transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease, border-color 0.15s ease !important; }",
            ".fe-cat-btn:hover { background: #f4f4f5 !important; color: #09090b !important; transform: translateY(-1px) !important; }",
            ".fe-cat-btn.active { background: #09090b !important; color: #ffffff !important; border-color: #09090b !important; }",

            "#form-admin-article input[type='file'] { width: 100% !important; padding: 10px !important; background: #fafafa !important; border: 1.5px dashed #d4d4d8 !important; border-radius: 11px !important; color: #52525b !important; font-size: 0.78rem !important; cursor: pointer !important; }",
            "#form-admin-article input[type='file']::file-selector-button { margin-right: 10px !important; padding: 7px 10px !important; background: #18181b !important; color: #ffffff !important; border: none !important; border-radius: 8px !important; font-weight: 700 !important; font-size: 0.76rem !important; cursor: pointer !important; }",
            "#form-admin-article img { max-width: 100% !important; height: auto !important; border-radius: 12px !important; }",
            "#form-admin-article .image-preview, #form-admin-article .admin-image-preview, #form-admin-article [class*='preview'] img { width: 100% !important; }",

            "#form-admin-article .field-help, #form-admin-article .or-divider { color: #a1a1aa !important; font-size: 0.73rem !important; }",
            "#form-admin-article .fe-box-extra p { margin: 6px 0 !important; color: #71717a !important; font-size: 0.76rem !important; line-height: 1.45 !important; }",

            "#form-admin-article .checkbox-group { display: flex !important; align-items: center !important; gap: 10px !important; padding: 15px 16px !important; background: #fafafa !important; border: 1px solid #e4e4e7 !important; border-radius: 13px !important; }",
            "#form-admin-article input[type='checkbox'] { width: 17px !important; height: 17px !important; accent-color: #09090b !important; cursor: pointer !important; }",

            "#form-admin-article .admin-form-actions { display: grid !important; grid-template-columns: minmax(0, 1fr) auto !important; gap: 9px !important; width: 100% !important; padding: 0 !important; background: transparent !important; border: none !important; box-shadow: none !important; }",
            "#btn-save-article { min-height: 47px !important; padding: 12px 18px !important; background: #09090b !important; color: #ffffff !important; border: 1px solid #09090b !important; border-radius: 11px !important; font-size: 0.9rem !important; font-weight: 800 !important; cursor: pointer !important; transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease !important; }",
            "#btn-save-article:hover { transform: translateY(-1px) !important; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.14) !important; }",
            "#btn-save-article:active { transform: translateY(0) !important; }",
            "#btn-reset-article-form { min-height: 47px !important; padding: 12px 15px !important; background: #ffffff !important; color: #52525b !important; border: 1px solid #e4e4e7 !important; border-radius: 11px !important; font-size: 0.82rem !important; font-weight: 700 !important; cursor: pointer !important; transition: background 0.15s ease, color 0.15s ease !important; }",
            "#btn-reset-article-form:hover { background: #f4f4f5 !important; color: #09090b !important; }",

            "@media (min-width: 1101px) { #form-admin-article .fe-admin-sidebar { position: sticky !important; top: 20px !important; } }",
            "@media (max-width: 1100px) { #view-admin { padding: 20px 18px 70px !important; } #form-admin-article .fe-admin-layout { grid-template-columns: minmax(0, 1.45fr) minmax(290px, 0.85fr) !important; gap: 16px !important; } #admin-article-content { min-height: 470px !important; } }",
            "@media (max-width: 860px) { #view-admin { padding: 14px 12px 60px !important; } #view-admin .admin-top-bar { min-height: 64px !important; padding: 14px 16px !important; border-radius: 14px !important; } #view-admin .admin-tabs { display: flex !important; width: 100% !important; overflow-x: auto !important; white-space: nowrap !important; } #view-admin .admin-tab { flex: 0 0 auto !important; } #form-admin-article .fe-admin-layout { display: flex !important; flex-direction: column !important; gap: 14px !important; } #form-admin-article .fe-admin-main, #form-admin-article .fe-admin-sidebar { width: 100% !important; } #form-admin-article .fe-admin-sidebar { position: static !important; } #admin-article-content { min-height: 420px !important; } }",
            "@media (max-width: 560px) { #view-admin { padding: 10px 8px 50px !important; } #view-admin .admin-top-bar { gap: 10px !important; } #view-admin .admin-top-bar .catalog-title { font-size: 1rem !important; } #view-admin #btn-close-admin { padding: 7px 10px !important; font-size: 0.74rem !important; } #form-admin-article .fe-admin-card { padding: 15px !important; border-radius: 13px !important; } #admin-article-title { font-size: 1.35rem !important; } #admin-article-content { min-height: 380px !important; padding: 14px !important; font-size: 1rem !important; } .fe-cat-pills { grid-template-columns: 1fr !important; } #form-admin-article .admin-form-actions { grid-template-columns: 1fr !important; } #btn-save-article, #btn-reset-article-form { width: 100% !important; } }"
        ].join("\n");

        var style = document.createElement("style");
        style.id = "fe-pro-admin-styles";
        style.type = "text/css";
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
    }


    /* ==========================================================================
       6. UTILITY DOM (INTATTO)
       ========================================================================== */

    function addCardClass(element) {
        if (!element) return;
        element.classList.add("fe-admin-card");
    }

    function closestUsefulContainer(element) {
        if (!element) return null;
        return (element.closest(".form-group") || element.parentElement);
    }


    /* ==========================================================================
       7. CREA LAYOUT ADMIN (INTATTO)
       ========================================================================== */

    function buildAdminLayout() {
        var form = document.getElementById("form-admin-article");
        if (!form) return;
        if (form.dataset.feLayoutReady === "true") return;

        var title = document.getElementById("admin-article-title");
        var category = document.getElementById("admin-article-category");
        var excerpt = document.getElementById("admin-article-excerpt");
        var content = document.getElementById("admin-article-content");
        var imageFile = document.getElementById("admin-image-file");
        var published = document.getElementById("admin-article-published");
        var saveButton = document.getElementById("btn-save-article");
        
        if (!title || !content) return;

        var titleBox = closestUsefulContainer(title);
        var categoryBox = closestUsefulContainer(category);
        var excerptBox = closestUsefulContainer(excerpt);
        var contentBox = closestUsefulContainer(content);
        var mediaBox = closestUsefulContainer(imageFile);
        var publishBox = closestUsefulContainer(published);

        var actionsBox = null;
        if (saveButton) {
            actionsBox = saveButton.closest(".admin-form-actions") || saveButton.parentElement;
        }

        var extraBox = null;
        var formChildren = Array.prototype.slice.call(form.children);
        for (var i = 0; i < formChildren.length; i++) {
            var child = formChildren[i];
            if (child && child.textContent && child.textContent.indexOf("Foto Aggiuntive") !== -1) {
                extraBox = child;
                break;
            }
        }

        var layout = document.createElement("div");
        layout.className = "fe-admin-layout";
        var main = document.createElement("div");
        main.className = "fe-admin-main";
        var sidebar = document.createElement("div");
        sidebar.className = "fe-admin-sidebar";

        layout.appendChild(main);
        layout.appendChild(sidebar);
        form.insertBefore(layout, form.firstChild);

        var movedMain = [];
        [titleBox, categoryBox, excerptBox, contentBox].forEach(function (box) {
            if (box && movedMain.indexOf(box) === -1 && box !== form && box !== layout) {
                movedMain.push(box);
                main.appendChild(box);
                addCardClass(box);
            }
        });

        var movedSidebar = [];
        [mediaBox, extraBox, publishBox, actionsBox].forEach(function (box) {
            if (box && movedSidebar.indexOf(box) === -1 && box !== form && box !== layout && movedMain.indexOf(box) === -1) {
                movedSidebar.push(box);
                sidebar.appendChild(box);
                if (!box.classList.contains("admin-form-actions")) addCardClass(box);
            }
        });

        var remaining = Array.prototype.slice.call(form.children);
        remaining.forEach(function (element) {
            if (element === layout || element.tagName === "SCRIPT" || element.tagName === "STYLE") return;
            main.appendChild(element);
            if (!element.classList.contains("admin-form-actions")) addCardClass(element);
        });

        form.dataset.feLayoutReady = "true";
    }


    /* ==========================================================================
       8. PERSONALIZZAZIONE BOX (INTATTO)
       ========================================================================== */

    function upgradeBoxes() {
        var excerpt = document.getElementById("admin-article-excerpt");
        if (excerpt) {
            var excerptBox = closestUsefulContainer(excerpt);
            if (excerptBox) {
                excerptBox.classList.add("fe-box-excerpt");
                addCardClass(excerptBox);
                var excerptLabel = excerptBox.querySelector("label");
                if (excerptLabel) excerptLabel.textContent = "Sottotitolo / Anteprima";
            }
            excerpt.placeholder = "Scrivi una breve introduzione che invogli il lettore ad aprire l'articolo...";
        }

        var content = document.getElementById("admin-article-content");
        if (content) {
            var contentBox = closestUsefulContainer(content);
            if (contentBox) {
                contentBox.classList.add("fe-box-content");
                addCardClass(contentBox);
                var contentLabel = contentBox.querySelector("label");
                if (contentLabel) contentLabel.textContent = "Contenuto articolo";
            }
            content.placeholder = "Scrivi qui il tuo articolo...\n\nVai a capo per dividere i paragrafi: le foto extra verranno inserite automaticamente in mezzo al testo (stile iSpazio).";
        }

        var imageFile = document.getElementById("admin-image-file");
        if (imageFile) {
            var mediaBox = closestUsefulContainer(imageFile);
            if (mediaBox) {
                mediaBox.classList.add("fe-box-media");
                addCardClass(mediaBox);
                var mediaLabel = mediaBox.querySelector("label");
                if (mediaLabel) mediaLabel.textContent = "Copertina articolo";
            }
        }

        var imageUrl = document.getElementById("admin-image-url");
        if (imageUrl) imageUrl.placeholder = "Oppure incolla l'URL dell'immagine...";

        var form = document.getElementById("form-admin-article");
        if (form) {
            var allElements = form.querySelectorAll("div");
            for (var i = 0; i < allElements.length; i++) {
                var element = allElements[i];
                if (element.textContent && element.textContent.indexOf("Foto Aggiuntive") !== -1) {
                    element.classList.add("fe-box-extra");
                }
            }
        }

        var publishedLabel = document.querySelector("label[for='admin-article-published']");
        if (publishedLabel) publishedLabel.textContent = "Pubblica subito online";

        var saveButton = document.getElementById("btn-save-article");
        if (saveButton) saveButton.setAttribute("aria-label", "Salva articolo");

        var resetButton = document.getElementById("btn-reset-article-form");
        if (resetButton) resetButton.textContent = "Pulisci";
    }


    /* ==========================================================================
       9. CATEGORIE A BOTTONI (INTATTO)
       ========================================================================== */

    function createCategoryButtons() {
        var select = document.getElementById("admin-article-category");
        if (!select) return;

        var existing = document.getElementById("fe-custom-cat-pills");
        if (existing) {
            syncCategoryButtons();
            return;
        }

        var categories = ["Outfit", "Novità", "Articoli"];
        var wrapper = document.createElement("div");
        wrapper.id = "fe-custom-cat-pills";
        wrapper.className = "fe-cat-pills";

        categories.forEach(function (category) {
            var button = document.createElement("button");
            button.type = "button";
            button.className = "fe-cat-btn" + (select.value === category ? " active" : "");
            button.textContent = category;

            button.addEventListener("click", function () {
                select.value = category;
                var event = new Event("change", { bubbles: true });
                select.dispatchEvent(event);
                syncCategoryButtons();
            });

            wrapper.appendChild(button);
        });

        select.style.display = "none";
        select.parentElement.appendChild(wrapper);
    }

    function syncCategoryButtons() {
        var select = document.getElementById("admin-article-category");
        var wrapper = document.getElementById("fe-custom-cat-pills");
        if (!select || !wrapper) return;

        var buttons = wrapper.querySelectorAll(".fe-cat-btn");
        for (var i = 0; i < buttons.length; i++) {
            if (buttons[i].textContent.trim() === select.value) {
                buttons[i].classList.add("active");
            } else {
                buttons[i].classList.remove("active");
            }
        }
    }


    /* ==========================================================================
       10. STATISTICHE ADMIN E ALTRE UTILITY (INTATTE)
       ========================================================================== */

    function createWritingStats() {
        var textarea = document.getElementById("admin-article-content");
        if (!textarea || !textarea.parentElement) return;

        var stats = document.getElementById("fe-writing-stats");
        if (!stats) {
            stats = document.createElement("div");
            stats.id = "fe-writing-stats";
            stats.className = "fe-writing-stats";
            stats.innerHTML = '<span class="fe-stat-pill" id="fe-word-count">0 parole</span><span class="fe-stat-pill" id="fe-char-count">0 caratteri</span><span class="fe-stat-pill" id="fe-reading-time">0 min lettura</span>';
            textarea.parentElement.appendChild(stats);
        }

        function updateStats() {
            var text = textarea.value.trim();
            var words = text ? text.split(/\s+/).filter(Boolean).length : 0;
            var chars = textarea.value.length;
            var readingMinutes = words === 0 ? 0 : Math.max(1, Math.ceil(words / 200));

            var wordCount = document.getElementById("fe-word-count");
            var charCount = document.getElementById("fe-char-count");
            var readingTime = document.getElementById("fe-reading-time");

            if (wordCount) wordCount.textContent = words + (words === 1 ? " parola" : " parole");
            if (charCount) charCount.textContent = chars + (chars === 1 ? " carattere" : " caratteri");
            if (readingTime) readingTime.textContent = readingMinutes + " min lettura";
        }

        if (textarea.dataset.feStatsReady !== "true") {
            textarea.addEventListener("input", updateStats);
            textarea.dataset.feStatsReady = "true";
        }
        updateStats();
    }

    function setupPublishButton() {
        var checkbox = document.getElementById("admin-article-published");
        var button = document.getElementById("btn-save-article");
        if (!button) return;

        function updateButton() {
            if (!checkbox) {
                button.textContent = "Salva articolo";
                return;
            }
            button.textContent = checkbox.checked ? "Pubblica articolo" : "Salva bozza";
        }

        if (checkbox && checkbox.dataset.fePublishReady !== "true") {
            checkbox.addEventListener("change", updateButton);
            checkbox.dataset.fePublishReady = "true";
        }
        updateButton();
    }

    function setupResetSync() {
        var resetButton = document.getElementById("btn-reset-article-form");
        if (!resetButton || resetButton.dataset.feResetReady === "true") return;

        resetButton.addEventListener("click", function () {
            setTimeout(function () {
                syncCategoryButtons();
                createWritingStats();
                setupPublishButton();
            }, 50);
        });
        resetButton.dataset.feResetReady = "true";
    }

    function improveAccessibility() {
        var title = document.getElementById("admin-article-title");
        var excerpt = document.getElementById("admin-article-excerpt");
        var content = document.getElementById("admin-article-content");

        if (title) { title.setAttribute("autocomplete", "off"); title.setAttribute("spellcheck", "true"); }
        if (excerpt) excerpt.setAttribute("spellcheck", "true");
        if (content) content.setAttribute("spellcheck", "true");
    }

    function upgradeAdminPanel() {
        var form = document.getElementById("form-admin-article");
        if (!form) return;
        fixCategories();
        upgradeBoxes();
        createCategoryButtons();
        buildAdminLayout();
        createWritingStats();
        setupPublishButton();
        setupResetSync();
        improveAccessibility();
    }

    function initAdminObserver() {
        var form = document.getElementById("form-admin-article");
        if (!form) return;

        var scheduled = false;
        var observer = new MutationObserver(function (mutations) {
            var relevant = false;
            for (var i = 0; i < mutations.length; i++) {
                if (mutations[i].addedNodes && mutations[i].addedNodes.length) {
                    relevant = true;
                    break;
                }
            }
            if (!relevant || scheduled) return;

            scheduled = true;
            requestAnimationFrame(function () {
                scheduled = false;
                upgradeBoxes();
                createCategoryButtons();
                createWritingStats();
                setupPublishButton();
                syncCategoryButtons();
            });
        });
        observer.observe(form, { childList: true, subtree: true });
    }

    /* ==========================================================================
       11. INIZIALIZZAZIONE GLOBALE
       ========================================================================== */

    function initAll() {
        injectArticleStyles();
        injectProStyles();
        fixCategories();
        upgradeAdminPanel();
        
        // Avvia l'osservatore che intercetta i caroselli e formatta l'articolo pubblico
        initArticleObserver();
        initAdminObserver();

        setTimeout(function () { upgradeAdminPanel(); }, 250);
        setTimeout(function () { upgradeAdminPanel(); }, 800);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAll);
    } else {
        initAll();
    }

})();
