/* ==========================================================================
   FUORI ETICHETTA - EXTENSIONS, STUDIO ADMIN PRO & ISPAZIO LAYOUT
   (Safe Mode: Anti-Loop Infinito + Async Edit Commenti Definitivo)
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

        var topWrapper = document.querySelector(".interactive-media-wrapper");
        if (topWrapper) {
            var topImgs = topWrapper.querySelectorAll("img");
            for (var i = 0; i < topImgs.length; i++) {
                var src = topImgs[i].getAttribute("src") || topImgs[i].src;
                if (!src || src.indexOf("avatar") !== -1 || src.indexOf("icon") !== -1) continue;
                if (topImgs[i].id !== "article-detail-image" && src !== mainSrc) {
                    if (urls.indexOf(src) === -1) urls.push(src);
                    if (topImgs[i].style.display !== "none") topImgs[i].style.display = "none";
                }
            }
            var controls = topWrapper.querySelectorAll("button, .carousel-indicators, [class*='dot'], [class*='pagination'], [class*='nav'], [class*='arrow']");
            for (var c = 0; c < controls.length; c++) {
                if (controls[c].style.display !== "none") controls[c].style.display = "none";
            }
        }

        var bottomWrapper = document.getElementById("fe-option-b-media-container");
        if (bottomWrapper) {
            var botImgs = bottomWrapper.querySelectorAll("img");
            for (var j = 0; j < botImgs.length; j++) {
                var bSrc = botImgs[j].getAttribute("src") || botImgs[j].src;
                if (!bSrc) continue;
                if (urls.indexOf(bSrc) === -1) urls.push(bSrc);
                if (botImgs[j].style.display !== "none") botImgs[j].style.display = "none";
            }
            if (!bottomWrapper.querySelector("iframe, video") && bottomWrapper.style.display !== "none") {
                bottomWrapper.style.display = "none";
            }
        }

        if (urls.length === 0) return;

        var inlines = contentBox.querySelectorAll(".fe-inline-extra-photo");
        if (inlines.length === urls.length) return;

        for (var k = 0; k < inlines.length; k++) {
            if (inlines[k].parentNode) inlines[k].parentNode.removeChild(inlines[k]);
        }

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


    /* ==========================================================================
       3. OSSERVATORE SICURO ANTI-CRASH
       ========================================================================== */

    function initArticleObserver() {
        var viewArticle = document.getElementById("view-article");
        var articleContainer = document.getElementById("article-detail-content");
        if (!viewArticle) return;

        function runEnhancements() {
            if (viewArticle.classList.contains("hidden")) return;
            if (articleContainer && articleContainer.childNodes.length === 1 && articleContainer.firstChild.nodeType === 3) {
                var rawText = articleContainer.textContent;
                if (rawText && rawText.trim() !== "") {
                    articleContainer.innerHTML = formatMarkdown(rawText);
                }
            }
            updatePublicReadingTime();
            killCarouselAndDistributePhotos();
        }

        var obs = new MutationObserver(function () {
            obs.disconnect(); 
            runEnhancements();
            obs.observe(viewArticle, { childList: true, subtree: true });
        });

        obs.observe(viewArticle, { childList: true, subtree: true });
    }


    /* ==========================================================================
       4. MODIFICA DEI PROPRI COMMENTI (BLINDATO CON ASYNC/AWAIT & TRY/CATCH)
       ========================================================================== */

    function initCommentsEditor() {
        var commentsList = document.getElementById("comments-list");
        if (!commentsList) return;

        // Sensore che individua i nuovi commenti per aggiungere il tasto "Modifica"
        var obs = new MutationObserver(function () {
            obs.disconnect();
            var deleteBtns = commentsList.querySelectorAll('button[data-action="delete-comment"]');
            for (var i = 0; i < deleteBtns.length; i++) {
                var btn = deleteBtns[i];
                if (!btn.dataset.editAdded) {
                    btn.dataset.editAdded = "true";
                    var editBtn = document.createElement("button");
                    editBtn.className = "btn-secondary btn-sm fe-btn-edit-comment";
                    editBtn.textContent = "✏️ Modifica";
                    editBtn.style.marginRight = "8px";
                    btn.parentNode.insertBefore(editBtn, btn);
                }
            }
            obs.observe(commentsList, { childList: true, subtree: true });
        });
        
        obs.observe(commentsList, { childList: true, subtree: true });

        // Gestione Click Asincrona Protetta
        commentsList.addEventListener("click", async function(e) {
            
            // Apertura editor
            var btnEdit = e.target.closest(".fe-btn-edit-comment");
            if (btnEdit) {
                e.preventDefault();
                var commentItem = btnEdit.closest(".comment-item");
                var textContainer = commentItem.querySelector(".comment-text");
                var actionsContainer = commentItem.querySelector(".comment-actions");
                var commentId = commentItem.getAttribute("data-comment-id");

                var currentText = textContainer.textContent || textContainer.innerText;
                commentItem.dataset.originalText = currentText;

                textContainer.innerHTML = 
                    '<textarea class="fe-edit-textarea" style="width:100%; border:1px solid #e4e4e7; border-radius:8px; padding:10px; font-family:inherit; font-size:0.9rem; min-height:80px; margin-bottom:10px; outline:none;">' + 
                    currentText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + 
                    '</textarea>' +
                    '<div style="display:flex; gap:8px;">' +
                        '<button class="btn-primary btn-sm fe-btn-save-edit" data-id="' + commentId + '">Salva Modifiche</button>' +
                        '<button class="btn-secondary btn-sm fe-btn-cancel-edit">Annulla</button>' +
                    '</div>';

                actionsContainer.style.display = "none";
                return;
            }

            // Annullamento modifica
            var btnCancel = e.target.closest(".fe-btn-cancel-edit");
            if (btnCancel) {
                e.preventDefault();
                var commentItemC = btnCancel.closest(".comment-item");
                var textContainerC = commentItemC.querySelector(".comment-text");
                var actionsContainerC = commentItemC.querySelector(".comment-actions");

                textContainerC.textContent = commentItemC.dataset.originalText;
                actionsContainerC.style.display = "";
                return;
            }

            // Salvataggio su database (TRY-CATCH)
            var btnSave = e.target.closest(".fe-btn-save-edit");
            if (btnSave) {
                e.preventDefault();
                var commentItemS = btnSave.closest(".comment-item");
                var textareaS = commentItemS.querySelector(".fe-edit-textarea");
                var newText = textareaS.value.trim();
                var cId = btnSave.getAttribute("data-id");
                
                if (!newText) return;

                btnSave.textContent = "Salvataggio in corso...";
                btnSave.disabled = true;
                textareaS.disabled = true;

                try {
                    // Verifica che il client del database esista
                    if (typeof supabaseClient === "undefined" || !supabaseClient) {
                        throw new Error("Connessione al database non rilevata.");
                    }

                    // Tenta la scrittura a schermo bloccato
                    var response = await supabaseClient.from('comments').update({ content: newText }).eq('id', cId);

                    // Verifica se Supabase ha rimandato un errore interno (es: RLS Permission Error)
                    if (response.error) {
                        throw new Error(response.error.message);
                    }

                    // Se arriviamo qui, il salvataggio è andato a buon fine
                    var textContainerS = commentItemS.querySelector(".comment-text");
                    var actionsContainerS = commentItemS.querySelector(".comment-actions");
                    textContainerS.textContent = newText;
                    actionsContainerS.style.display = "";

                } catch (err) {
                    // Se fallisce, ripristina i tasti e mostra il motivo
                    alert("Impossibile salvare il commento. Motivo: " + (err.message || "Permessi insufficienti o errore di rete."));
                    btnSave.textContent = "Salva Modifiche";
                    btnSave.disabled = false;
                    textareaS.disabled = false;
                }
            }
        });
    }

    /* ==========================================================================
       5. CATEGORIE
       ========================================================================== */

    function fixCategories() {
        var categories = ["Outfit", "Novità", "Articoli"];
        var navPills = document.querySelectorAll(".category-nav .cat-pill");

        if (navPills.length >= 4) {
            for (var i = 0; i < categories.length; i++) {
                if (navPills[i + 1]) {
                    navPills[i + 1].setAttribute("data-category", categories[i]);
                    navPills[i + 1].textContent = categories[i];
                }
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
        if (categories.indexOf(currentValue) !== -1) adminSelect.value = currentValue;
        else adminSelect.value = "Outfit";
    }

    /* ==========================================================================
       6. CSS ARTICOLI PUBBLICI E ADMIN PRO (MANTENUTI E COMPATTATI)
       ========================================================================== */

    function injectStyles() {
        if (!document.getElementById("fe-article-styles")) {
            var pubCss = [
                ".fe-article-paragraph { margin: 0 0 22px; line-height: 1.75; }",
                ".fe-article-h2 { margin: 38px 0 16px; font-size: 1.65rem; line-height: 1.2; font-weight: 800; color: #111111; }",
                ".fe-article-h3 { margin: 32px 0 14px; font-size: 1.3rem; line-height: 1.25; font-weight: 750; color: #18181b; }",
                "#article-detail-content strong { font-weight: 800; } #article-detail-content em { font-style: italic; }",
                ".fe-public-reading-time { display: inline-flex; align-items: center; gap: 7px; margin: 10px 0 24px; padding: 8px 14px; background: #f4f4f5; color: #18181b; border: 1px solid #e4e4e7; border-radius: 999px; font-size: 0.82rem; font-weight: 700; line-height: 1; }",
                ".fe-inline-extra-photo { display: block; width: 100%; max-width: 900px; margin: 40px auto; padding: 0; text-align: center; }",
                ".fe-inline-extra-photo img { display: block; width: 100%; max-width: 100%; max-height: 850px; height: auto; margin: 0 auto; object-fit: cover; border-radius: 16px; box-shadow: 0 12px 35px rgba(0, 0, 0, 0.08); }",
                "@media (max-width: 600px) { .fe-public-reading-time { margin-bottom: 14px; font-size: 0.75rem; } .fe-inline-extra-photo { margin-top: 26px; margin-bottom: 26px; } .fe-inline-extra-photo img { border-radius: 12px; } }"
            ].join("\n");
            var stylePub = document.createElement("style");
            stylePub.id = "fe-article-styles";
            stylePub.appendChild(document.createTextNode(pubCss));
            document.head.appendChild(stylePub);
        }

        if (!document.getElementById("fe-pro-admin-styles")) {
            var admCss = `
                #view-admin:not(.hidden) {
                    max-width: 1500px !important;
                    margin: 0 auto !important;
                    padding: 30px 30px 90px !important;
                    display: grid !important;
                    grid-template-columns: 238px minmax(0, 1fr) !important;
                    grid-template-areas: "header header" "nav content" !important;
                    gap: 22px 26px !important;
                    align-items: start !important;
                    box-sizing: border-box !important;
                }
                #view-admin *, #view-admin *::before, #view-admin *::after { box-sizing: border-box !important; }
                #view-admin button, #view-admin input, #view-admin textarea, #view-admin select { font-family: inherit !important; }

                #view-admin .admin-top-bar {
                    grid-area: header !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: space-between !important;
                    gap: 24px !important;
                    min-height: 104px !important;
                    margin: 0 !important;
                    padding: 22px 26px !important;
                    background: linear-gradient(135deg, #09090b 0%, #18181b 68%, #27272a 100%) !important;
                    color: #ffffff !important;
                    border-radius: 22px !important;
                    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.13) !important;
                    overflow: hidden !important;
                    position: relative !important;
                }
                #view-admin .admin-top-bar::after {
                    content: "" !important;
                    position: absolute !important;
                    width: 210px !important;
                    height: 210px !important;
                    right: 16% !important;
                    top: -125px !important;
                    border-radius: 50% !important;
                    background: rgba(255,255,255,0.045) !important;
                    pointer-events: none !important;
                }
                #view-admin .admin-top-bar > div:first-child { min-width: 0 !important; position: relative !important; z-index: 1 !important; }
                #view-admin .admin-top-bar .catalog-title {
                    color: #ffffff !important;
                    font-size: clamp(1.25rem, 2vw, 1.7rem) !important;
                    font-weight: 850 !important;
                    letter-spacing: -0.035em !important;
                    margin: 0 !important;
                    line-height: 1.15 !important;
                }
                #view-admin .admin-top-bar .catalog-subtitle {
                    display: block !important;
                    max-width: 720px !important;
                    margin: 7px 0 0 !important;
                    color: rgba(255,255,255,0.66) !important;
                    font-size: 0.84rem !important;
                    line-height: 1.45 !important;
                }
                .fe-panel-meta { display: flex !important; align-items: center !important; flex-wrap: wrap !important; gap: 8px !important; margin-top: 12px !important; }
                .fe-panel-role-pill {
                    display: inline-flex !important;
                    align-items: center !important;
                    min-height: 25px !important;
                    padding: 4px 9px !important;
                    border: 1px solid rgba(255,255,255,0.16) !important;
                    background: rgba(255,255,255,0.09) !important;
                    color: #ffffff !important;
                    border-radius: 999px !important;
                    font-size: 0.66rem !important;
                    font-weight: 850 !important;
                    letter-spacing: 0.075em !important;
                    text-transform: uppercase !important;
                }
                .fe-panel-user-name { color: rgba(255,255,255,0.62) !important; font-size: 0.74rem !important; font-weight: 650 !important; }
                #view-admin #btn-close-admin {
                    position: relative !important;
                    z-index: 1 !important;
                    flex: 0 0 auto !important;
                    min-height: 42px !important;
                    padding: 9px 14px !important;
                    background: rgba(255,255,255,0.08) !important;
                    color: #ffffff !important;
                    border: 1px solid rgba(255,255,255,0.17) !important;
                    border-radius: 11px !important;
                    font-size: 0.79rem !important;
                    font-weight: 750 !important;
                    cursor: pointer !important;
                    transition: 0.18s ease !important;
                }
                #view-admin #btn-close-admin:hover { background: rgba(255,255,255,0.15) !important; transform: translateY(-1px) !important; }

                #view-admin .admin-tabs {
                    grid-area: nav !important;
                    position: sticky !important;
                    top: 22px !important;
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: stretch !important;
                    gap: 6px !important;
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 10px !important;
                    background: #ffffff !important;
                    border: 1px solid #e4e4e7 !important;
                    border-radius: 18px !important;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.045) !important;
                }
                #view-admin .admin-tab.hidden, #view-admin .admin-tab-content.hidden, #view-admin [data-admin-only="true"].hidden { display: none !important; }
                #view-admin .admin-tabs::before {
                    content: "NAVIGAZIONE" !important;
                    padding: 7px 9px 5px !important;
                    color: #a1a1aa !important;
                    font-size: 0.63rem !important;
                    font-weight: 850 !important;
                    letter-spacing: 0.09em !important;
                }
                #view-admin .admin-tab {
                    position: relative !important;
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: flex-start !important;
                    justify-content: center !important;
                    width: 100% !important;
                    min-height: 58px !important;
                    padding: 10px 38px 10px 12px !important;
                    background: transparent !important;
                    color: #3f3f46 !important;
                    border: 1px solid transparent !important;
                    border-radius: 12px !important;
                    text-align: left !important;
                    font-size: 0.82rem !important;
                    line-height: 1.2 !important;
                    font-weight: 780 !important;
                    cursor: pointer !important;
                    transition: 0.16s ease !important;
                }
                #view-admin .admin-tab::after { display: block !important; margin-top: 4px !important; color: #a1a1aa !important; font-size: 0.66rem !important; font-weight: 600 !important; line-height: 1.25 !important; }
                #view-admin .admin-tab[data-tab="tab-editor"]::after { content: "Scrittura e media" !important; }
                #view-admin .admin-tab[data-tab="tab-manage-articles"]::after { content: "Archivio editoriale" !important; }
                #view-admin .admin-tab[data-tab="tab-collaborators"]::after { content: "Permessi e approvazioni" !important; }
                #view-admin .admin-tab[data-tab="tab-moderation"]::after { content: "Segnalazioni e commenti" !important; }
                #view-admin .admin-tab[data-tab="tab-users"]::after { content: "Account registrati" !important; }
                #view-admin .admin-tab:hover { background: #f7f7f8 !important; color: #09090b !important; }
                #view-admin .admin-tab.active { background: #09090b !important; color: #ffffff !important; border-color: #09090b !important; box-shadow: 0 7px 18px rgba(0,0,0,0.11) !important; }
                #view-admin .admin-tab.active::after { color: rgba(255,255,255,0.55) !important; }
                #view-admin .admin-tab .badge-alert { position: absolute !important; right: 10px !important; top: 10px !important; }
                #view-admin > .admin-tab-content:not(.hidden) { grid-area: content !important; min-width: 0 !important; }

                #view-admin > .admin-tab-content > .admin-card,
                #view-admin #tab-collaborators > .admin-card {
                    background: #ffffff !important;
                    border: 1px solid #e4e4e7 !important;
                    border-radius: 18px !important;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.035) !important;
                }
                #view-admin > .admin-tab-content > .admin-card { padding: 22px !important; }
                #view-admin .admin-card h3 { margin: 0 0 7px !important; color: #18181b !important; font-size: 1rem !important; font-weight: 820 !important; letter-spacing: -0.018em !important; }
                #view-admin .field-help { color: #71717a !important; line-height: 1.5 !important; }
                #view-admin .divider { margin: 24px 0 !important; border-color: #ececef !important; }

                #tab-collaborators:not(.hidden) {
                    display: grid !important;
                    grid-template-columns: minmax(260px, 0.78fr) minmax(0, 1.45fr) !important;
                    grid-template-areas: "settings pending" "add people" !important;
                    gap: 18px !important;
                    align-items: start !important;
                }
                #tab-collaborators:not(.hidden) > .admin-card { margin: 0 !important; padding: 22px !important; }
                #tab-collaborators:not(.hidden) > .admin-card:nth-child(1) { grid-area: settings !important; }
                #tab-collaborators:not(.hidden) > .admin-card:nth-child(2) { grid-area: add !important; }
                #tab-collaborators:not(.hidden) > .admin-card:nth-child(3) { grid-area: pending !important; }
                #tab-collaborators:not(.hidden) > .admin-card:nth-child(4) { grid-area: people !important; }
                #tab-collaborators #admin-require-approval-toggle { width: 17px !important; height: 17px !important; accent-color: #09090b !important; }
                #tab-collaborators .checkbox-group { padding: 14px !important; background: #fafafa !important; border: 1px solid #ececef !important; border-radius: 12px !important; }
                #tab-collaborators #admin-promote-user-select { min-height: 44px !important; border-radius: 11px !important; background: #fafafa !important; }
                #tab-collaborators #btn-promote-collaborator { min-height: 44px !important; border-radius: 11px !important; font-weight: 780 !important; }

                #view-admin .admin-list-container { display: flex !important; flex-direction: column !important; gap: 9px !important; margin-top: 14px !important; }
                #view-admin .admin-list-row {
                    display: grid !important;
                    grid-template-columns: minmax(0,1fr) auto !important;
                    gap: 14px !important;
                    align-items: center !important;
                    padding: 14px 15px !important;
                    background: #fafafa !important;
                    border: 1px solid #ececef !important;
                    border-radius: 13px !important;
                    transition: 0.15s ease !important;
                }
                #view-admin .admin-list-row:hover { background: #ffffff !important; border-color: #d4d4d8 !important; box-shadow: 0 7px 20px rgba(0,0,0,0.035) !important; }
                #view-admin .admin-list-row strong { color: #18181b !important; font-weight: 790 !important; }
                #view-admin .admin-list-row .btn-sm { min-height: 34px !important; border-radius: 9px !important; white-space: nowrap !important; }

                #form-admin-article { display: block !important; margin: 0 !important; padding: 0 !important; background: transparent !important; border: none !important; box-shadow: none !important; }
                #form-admin-article .fe-admin-layout { display: grid !important; grid-template-columns: minmax(0, 1.62fr) minmax(310px, 0.78fr) !important; gap: 20px !important; align-items: start !important; }
                #form-admin-article .fe-admin-main, #form-admin-article .fe-admin-sidebar { min-width: 0 !important; display: flex !important; flex-direction: column !important; gap: 14px !important; }
                .fe-editor-section-heading { padding: 1px 2px 2px !important; }
                .fe-editor-section-heading strong { display: block !important; color: #18181b !important; font-size: 0.93rem !important; font-weight: 850 !important; letter-spacing: -0.015em !important; }
                .fe-editor-section-heading span { display: block !important; margin-top: 3px !important; color: #a1a1aa !important; font-size: 0.69rem !important; line-height: 1.35 !important; }
                #form-admin-article .fe-admin-card { width: 100% !important; margin: 0 !important; padding: 20px !important; background: #ffffff !important; border: 1px solid #e4e4e7 !important; border-radius: 16px !important; box-shadow: 0 7px 22px rgba(0,0,0,0.03) !important; }
                #form-admin-article .fe-editor-basics { padding: 22px !important; }
                #form-admin-article .fe-editor-basics .form-row-2 { margin: 0 0 16px !important; }
                #form-admin-article .fe-editor-basics .form-group { margin: 0 !important; padding: 0 !important; background: transparent !important; border: 0 !important; box-shadow: none !important; }
                #form-admin-article .fe-editor-basics .fe-box-excerpt { margin-top: 16px !important; }
                #form-admin-article .fe-box-content { padding: 22px !important; }
                #form-admin-article label { display: block !important; margin: 0 0 8px !important; color: #71717a !important; font-size: 0.68rem !important; font-weight: 850 !important; letter-spacing: 0.06em !important; text-transform: uppercase !important; }
                #form-admin-article .checkbox-group label { margin: 0 !important; color: #18181b !important; font-size: 0.84rem !important; font-weight: 720 !important; letter-spacing: 0 !important; text-transform: none !important; }
                #form-admin-article input[type='text'], #form-admin-article input[type='url'], #form-admin-article input[type='email'], #form-admin-article select, #form-admin-article textarea { width: 100% !important; color: #18181b !important; background: #fafafa !important; border: 1px solid #e4e4e7 !important; border-radius: 11px !important; outline: none !important; transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease !important; }
                #form-admin-article input[type='text'], #form-admin-article input[type='url'], #form-admin-article input[type='email'], #form-admin-article select { min-height: 43px !important; padding: 10px 12px !important; font-size: 0.9rem !important; }
                #form-admin-article textarea { padding: 14px !important; resize: vertical !important; }
                #form-admin-article input:focus, #form-admin-article textarea:focus, #form-admin-article select:focus { background: #ffffff !important; border-color: #18181b !important; box-shadow: 0 0 0 3px rgba(24,24,27,0.055) !important; }
                #admin-article-title { min-height: auto !important; padding: 5px 0 10px !important; background: transparent !important; border: none !important; border-bottom: 2px solid #e4e4e7 !important; border-radius: 0 !important; box-shadow: none !important; color: #09090b !important; font-size: clamp(1.5rem, 2.2vw, 2.1rem) !important; font-weight: 850 !important; letter-spacing: -0.038em !important; }
                #admin-article-title:focus { border-bottom-color: #09090b !important; box-shadow: none !important; }
                #admin-article-excerpt { min-height: 76px !important; font-size: 0.94rem !important; line-height: 1.55 !important; }
                #admin-article-content { min-height: 570px !important; padding: 20px !important; background: #fbfbfb !important; color: #18181b !important; font-family: Georgia, 'Times New Roman', serif !important; font-size: 1.04rem !important; line-height: 1.82 !important; border-radius: 13px !important; }
                #admin-article-content:focus { background: #ffffff !important; }
                .fe-writing-stats { display: flex !important; flex-wrap: wrap !important; gap: 7px !important; margin-top: 10px !important; }
                .fe-stat-pill { display: inline-flex !important; align-items: center !important; min-height: 27px !important; padding: 5px 9px !important; background: #f4f4f5 !important; color: #71717a !important; border-radius: 999px !important; font-size: 0.68rem !important; font-weight: 720 !important; }
                .fe-cat-pills { display: grid !important; grid-template-columns: repeat(3, minmax(0,1fr)) !important; gap: 7px !important; margin-top: 5px !important; }
                .fe-cat-btn { min-height: 40px !important; padding: 8px !important; background: #fafafa !important; color: #52525b !important; border: 1px solid #e4e4e7 !important; border-radius: 10px !important; font-size: 0.81rem !important; font-weight: 760 !important; cursor: pointer !important; transition: 0.15s ease !important; }
                .fe-cat-btn:hover { background: #f4f4f5 !important; color: #09090b !important; transform: translateY(-1px) !important; }
                .fe-cat-btn.active { background: #09090b !important; color: #ffffff !important; border-color: #09090b !important; }
                #form-admin-article input[type='file'] { width: 100% !important; padding: 10px !important; background: #fafafa !important; border: 1.5px dashed #d4d4d8 !important; border-radius: 11px !important; color: #52525b !important; font-size: 0.76rem !important; cursor: pointer !important; }
                #form-admin-article input[type='file']::file-selector-button { margin-right: 10px !important; padding: 7px 10px !important; background: #18181b !important; color: #ffffff !important; border: none !important; border-radius: 8px !important; font-weight: 750 !important; font-size: 0.74rem !important; cursor: pointer !important; }
                #form-admin-article img { max-width: 100% !important; height: auto !important; border-radius: 12px !important; }
                #form-admin-article .field-help, #form-admin-article .or-divider { color: #a1a1aa !important; font-size: 0.71rem !important; line-height: 1.45 !important; }
                #form-admin-article .fe-box-extra p { margin: 6px 0 !important; color: #71717a !important; font-size: 0.74rem !important; line-height: 1.45 !important; }
                #form-admin-article .checkbox-group { display: flex !important; align-items: center !important; gap: 10px !important; padding: 14px 15px !important; background: #fafafa !important; border: 1px solid #e4e4e7 !important; border-radius: 13px !important; }
                #form-admin-article input[type='checkbox'] { width: 17px !important; height: 17px !important; accent-color: #09090b !important; cursor: pointer !important; }
                #collaborator-submit-hint { margin: 0 !important; padding: 14px 15px !important; background: #f8fafc !important; border: 1px solid #e2e8f0 !important; border-left: 3px solid #18181b !important; border-radius: 12px !important; color: #475569 !important; font-size: 0.76rem !important; line-height: 1.5 !important; box-shadow: none !important; }
                #form-admin-article .admin-form-actions { display: grid !important; grid-template-columns: minmax(0,0.72fr) minmax(0,1.35fr) !important; gap: 8px !important; width: 100% !important; padding: 4px 0 0 !important; background: transparent !important; border: none !important; box-shadow: none !important; }
                #btn-save-article { min-height: 48px !important; padding: 12px 18px !important; background: #09090b !important; color: #ffffff !important; border: 1px solid #09090b !important; border-radius: 11px !important; font-size: 0.88rem !important; font-weight: 820 !important; cursor: pointer !important; transition: 0.15s ease !important; }
                #btn-save-article:hover { transform: translateY(-1px) !important; box-shadow: 0 8px 20px rgba(0,0,0,0.14) !important; }
                #btn-reset-article-form { min-height: 48px !important; padding: 12px 14px !important; background: #ffffff !important; color: #52525b !important; border: 1px solid #e4e4e7 !important; border-radius: 11px !important; font-size: 0.79rem !important; font-weight: 720 !important; cursor: pointer !important; }
                #btn-reset-article-form:hover { background: #f4f4f5 !important; color: #09090b !important; }
                .fe-role-collaborator #collaborator-submit-hint:not(.hidden) { background: #fffaf0 !important; border-color: #fde7b2 !important; border-left-color: #b7791f !important; color: #744210 !important; }

                @media (min-width: 981px) {
                    #form-admin-article .fe-admin-sidebar { position: sticky !important; top: 22px !important; }
                }
                @media (max-width: 1180px) {
                    #view-admin:not(.hidden) { grid-template-columns: 210px minmax(0,1fr) !important; padding: 22px 20px 70px !important; gap: 18px !important; }
                    #form-admin-article .fe-admin-layout { grid-template-columns: minmax(0,1.38fr) minmax(280px,0.82fr) !important; gap: 16px !important; }
                    #admin-article-content { min-height: 500px !important; }
                }
                @media (max-width: 980px) {
                    #view-admin:not(.hidden) { display: block !important; padding: 18px 16px 65px !important; }
                    #view-admin .admin-top-bar { margin-bottom: 14px !important; min-height: 88px !important; border-radius: 18px !important; }
                    #view-admin .admin-tabs { position: static !important; display: flex !important; flex-direction: row !important; width: 100% !important; overflow-x: auto !important; gap: 6px !important; margin-bottom: 16px !important; padding: 6px !important; border-radius: 14px !important; }
                    #view-admin .admin-tabs::before { display: none !important; }
                    #view-admin .admin-tab { flex: 0 0 auto !important; width: auto !important; min-width: 145px !important; min-height: 48px !important; padding: 8px 30px 8px 11px !important; }
                    #view-admin .admin-tab::after { font-size: 0.62rem !important; }
                    #form-admin-article .fe-admin-layout { display: flex !important; flex-direction: column !important; gap: 14px !important; }
                    #form-admin-article .fe-admin-main, #form-admin-article .fe-admin-sidebar { width: 100% !important; }
                    #form-admin-article .fe-admin-sidebar { position: static !important; }
                    #tab-collaborators:not(.hidden) { grid-template-columns: 1fr !important; grid-template-areas: "settings" "add" "pending" "people" !important; }
                    #admin-article-content { min-height: 440px !important; }
                }
                @media (max-width: 600px) {
                    #view-admin:not(.hidden) { padding: 10px 8px 50px !important; }
                    #view-admin .admin-top-bar { min-height: 0 !important; padding: 17px !important; gap: 12px !important; align-items: flex-start !important; border-radius: 15px !important; }
                    #view-admin .admin-top-bar .catalog-title { font-size: 1.12rem !important; }
                    #view-admin .admin-top-bar .catalog-subtitle { font-size: 0.73rem !important; }
                    #view-admin #btn-close-admin { padding: 7px 9px !important; font-size: 0.7rem !important; }
                    .fe-panel-meta { margin-top: 9px !important; }
                    #view-admin .admin-tab { min-width: 132px !important; }
                    #form-admin-article .fe-admin-card, #view-admin > .admin-tab-content > .admin-card, #tab-collaborators:not(.hidden) > .admin-card { padding: 15px !important; border-radius: 14px !important; }
                    #admin-article-title { font-size: 1.35rem !important; }
                    #admin-article-content { min-height: 390px !important; padding: 15px !important; font-size: 1rem !important; }
                    .fe-cat-pills { grid-template-columns: 1fr !important; }
                    #form-admin-article .admin-form-actions { grid-template-columns: 1fr !important; }
                    #btn-save-article, #btn-reset-article-form { width: 100% !important; }
                    #view-admin .admin-list-row { grid-template-columns: 1fr !important; }
                }
            `;
            var styleAdm = document.createElement("style");
            styleAdm.id = "fe-pro-admin-styles";
            styleAdm.appendChild(document.createTextNode(admCss));
            document.head.appendChild(styleAdm);
        }
    }

    function addCardClass(el) { if(el) el.classList.add("fe-admin-card"); }
    function closestUsefulContainer(el) { return el ? (el.closest(".form-group") || el.parentElement) : null; }

    function buildAdminLayout() {
        var form = document.getElementById("form-admin-article");
        if (!form || form.dataset.feLayoutReady === "true") return;

        var title = document.getElementById("admin-article-title");
        var category = document.getElementById("admin-article-category");
        var excerpt = document.getElementById("admin-article-excerpt");
        var content = document.getElementById("admin-article-content");
        var imageFile = document.getElementById("admin-image-file");
        var published = document.getElementById("admin-article-published");
        var saveButton = document.getElementById("btn-save-article");
        var collaboratorHint = document.getElementById("collaborator-submit-hint");

        if (!title || !content) return;

        var titleCategoryRow = title.closest(".form-row-2");
        var titleBox = closestUsefulContainer(title);
        var categoryBox = closestUsefulContainer(category);
        var excerptBox = closestUsefulContainer(excerpt);
        var contentBox = closestUsefulContainer(content);
        var mediaBox = closestUsefulContainer(imageFile);
        var publishBox = closestUsefulContainer(published);
        var actionsBox = saveButton ? (saveButton.closest(".admin-form-actions") || saveButton.parentElement) : null;

        var extraBox = document.getElementById("admin-extra-media-controls");
        if (!extraBox) {
            var children = Array.prototype.slice.call(form.children);
            for (var i = 0; i < children.length; i++) {
                if (children[i] && children[i].textContent.indexOf("Foto Aggiuntive") !== -1) {
                    extraBox = children[i];
                    break;
                }
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

        var mainHeading = document.createElement("div");
        mainHeading.className = "fe-editor-section-heading";
        mainHeading.innerHTML = "<strong>Contenuto editoriale</strong><span>Titolo, categoria, anteprima e testo dell'articolo.</span>";
        main.appendChild(mainHeading);

        var basics = document.createElement("div");
        basics.className = "fe-admin-card fe-editor-basics";
        if (titleCategoryRow && titleCategoryRow !== form) {
            basics.appendChild(titleCategoryRow);
        } else {
            if (titleBox && titleBox !== form) basics.appendChild(titleBox);
            if (categoryBox && categoryBox !== form && categoryBox !== titleBox) basics.appendChild(categoryBox);
        }
        if (excerptBox && excerptBox !== form && !basics.contains(excerptBox)) basics.appendChild(excerptBox);
        main.appendChild(basics);

        if (contentBox && contentBox !== form) {
            main.appendChild(contentBox);
            addCardClass(contentBox);
        }

        var sideHeading = document.createElement("div");
        sideHeading.className = "fe-editor-section-heading";
        sideHeading.innerHTML = "<strong>Media e pubblicazione</strong><span>Copertina, foto extra, video e stato dell'articolo.</span>";
        sidebar.appendChild(sideHeading);

        [mediaBox, extraBox, collaboratorHint, publishBox, actionsBox].forEach(function (box) {
            if (!box || box === form || box === layout || sidebar.contains(box)) return;
            sidebar.appendChild(box);
            if (!box.classList.contains("admin-form-actions") && box !== collaboratorHint) addCardClass(box);
        });

        Array.prototype.slice.call(form.children).forEach(function (element) {
            if (element === layout || element.tagName === "SCRIPT" || element.tagName === "STYLE") return;
            if (element.matches && element.matches("input[type='hidden']")) {
                form.insertBefore(element, layout);
                return;
            }
            var hasMeaningfulContent = (element.textContent || "").trim() || element.querySelector("input, textarea, select, button, img");
            if (!hasMeaningfulContent) {
                element.remove();
                return;
            }
            main.appendChild(element);
            if (!element.classList.contains("admin-form-actions")) addCardClass(element);
        });

        form.dataset.feLayoutReady = "true";
    }

    function upgradeBoxes() {
        var excerpt = document.getElementById("admin-article-excerpt");
        if (excerpt) {
            var excerptBox = closestUsefulContainer(excerpt);
            if (excerptBox) {
                excerptBox.classList.add("fe-box-excerpt"); addCardClass(excerptBox);
                var excerptLabel = excerptBox.querySelector("label");
                if (excerptLabel) excerptLabel.textContent = "Sottotitolo / Anteprima";
            }
            excerpt.placeholder = "Scrivi una breve introduzione che invogli il lettore ad aprire l'articolo...";
        }

        var content = document.getElementById("admin-article-content");
        if (content) {
            var contentBox = closestUsefulContainer(content);
            if (contentBox) {
                contentBox.classList.add("fe-box-content"); addCardClass(contentBox);
                var contentLabel = contentBox.querySelector("label");
                if (contentLabel) contentLabel.textContent = "Contenuto articolo";
            }
            content.placeholder = "Scrivi qui il tuo articolo...\n\nVai a capo per dividere i paragrafi: le foto extra verranno inserite automaticamente in mezzo al testo (stile iSpazio).";
        }

        var imageFile = document.getElementById("admin-image-file");
        if (imageFile) {
            var mediaBox = closestUsefulContainer(imageFile);
            if (mediaBox) {
                mediaBox.classList.add("fe-box-media"); addCardClass(mediaBox);
                var mediaLabel = mediaBox.querySelector("label");
                if (mediaLabel) mediaLabel.textContent = "Copertina articolo";
            }
        }
        var imageUrl = document.getElementById("admin-image-url");
        if (imageUrl) imageUrl.placeholder = "Oppure incolla l'URL dell'immagine...";

        var form = document.getElementById("form-admin-article");
        if (form) {
            form.querySelectorAll("div").forEach(function(element) {
                if (element.textContent.indexOf("Foto Aggiuntive") !== -1) element.classList.add("fe-box-extra");
            });
        }
        var publishedLabel = document.querySelector("label[for='admin-article-published']");
        if (publishedLabel) publishedLabel.textContent = "Pubblica subito online";
        var saveButton = document.getElementById("btn-save-article");
        if (saveButton) saveButton.setAttribute("aria-label", "Salva articolo");
        var resetButton = document.getElementById("btn-reset-article-form");
        if (resetButton) resetButton.textContent = "Pulisci";
    }

    function createCategoryButtons() {
        var select = document.getElementById("admin-article-category");
        if (!select) return;
        var existing = document.getElementById("fe-custom-cat-pills");
        if (existing) { syncCategoryButtons(); return; }

        var categories = ["Outfit", "Novità", "Articoli"];
        var wrapper = document.createElement("div");
        wrapper.id = "fe-custom-cat-pills"; wrapper.className = "fe-cat-pills";

        categories.forEach(function (category) {
            var button = document.createElement("button");
            button.type = "button";
            button.className = "fe-cat-btn" + (select.value === category ? " active" : "");
            button.textContent = category;
            button.addEventListener("click", function () {
                select.value = category;
                select.dispatchEvent(new Event("change", { bubbles: true }));
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
            if (buttons[i].textContent.trim() === select.value) buttons[i].classList.add("active");
            else buttons[i].classList.remove("active");
        }
    }

    function createWritingStats() {
        var textarea = document.getElementById("admin-article-content");
        if (!textarea || !textarea.parentElement) return;
        var stats = document.getElementById("fe-writing-stats");
        if (!stats) {
            stats = document.createElement("div");
            stats.id = "fe-writing-stats"; stats.className = "fe-writing-stats";
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
            var collaborator = typeof state !== "undefined" && state.currentProfile && state.currentProfile.role === "collaborator" && state.currentProfile.collaborator_enabled === true;
            if (collaborator) {
                var direct = state.currentProfile.can_publish_without_approval === true || (state.settings && state.settings.require_collaborator_approval === false);
                button.textContent = direct ? "Pubblica articolo" : "Invia per approvazione";
                return;
            }
            if (!checkbox) { button.textContent = "Salva articolo"; return; }
            button.textContent = checkbox.checked ? "Pubblica articolo" : "Salva bozza";
        }
        if (checkbox && checkbox.dataset.fePublishReady !== "true") {
            checkbox.addEventListener("change", updateButton);
            checkbox.dataset.fePublishReady = "true";
        }
        if (button.dataset.feRoleListener !== "true") {
            window.addEventListener("fe-role-change", updateButton);
            button.dataset.feRoleListener = "true";
        }
        updateButton();
    }

    function setupResetSync() {
        var resetButton = document.getElementById("btn-reset-article-form");
        if (!resetButton || resetButton.dataset.feResetReady === "true") return;
        resetButton.addEventListener("click", function () {
            setTimeout(function () { syncCategoryButtons(); createWritingStats(); setupPublishButton(); }, 50);
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


    function upgradePanelIdentity() {
        var view = document.getElementById("view-admin");
        var topBar = view ? view.querySelector(".admin-top-bar") : null;
        if (!view || !topBar) return;

        var identityBox = topBar.querySelector(":scope > div:first-child");
        if (!identityBox) return;

        var meta = document.getElementById("fe-panel-meta");
        if (!meta) {
            meta = document.createElement("div");
            meta.id = "fe-panel-meta";
            meta.className = "fe-panel-meta";
            meta.innerHTML = '<span id="fe-panel-role-pill" class="fe-panel-role-pill"></span><span id="fe-panel-user-name" class="fe-panel-user-name"></span>';
            identityBox.appendChild(meta);
        }

        var isAdminRole = typeof state !== "undefined" && state.isAdmin === true;
        var isCollabRole = typeof state !== "undefined" && state.currentProfile && state.currentProfile.role === "collaborator" && state.currentProfile.collaborator_enabled === true;
        view.classList.toggle("fe-role-admin", isAdminRole);
        view.classList.toggle("fe-role-collaborator", !isAdminRole && isCollabRole);

        var rolePill = document.getElementById("fe-panel-role-pill");
        var userName = document.getElementById("fe-panel-user-name");
        if (rolePill) rolePill.textContent = isAdminRole ? "Amministratore" : (isCollabRole ? "Collaboratore" : "Area editoriale");

        if (userName) {
            var profile = typeof state !== "undefined" ? state.currentProfile : null;
            var name = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") : "";
            userName.textContent = name ? "• " + name : "";
        }
    }

    function setupProfessionalRoleSync() {
        if (window.feProfessionalRoleSyncReady) return;
        window.addEventListener("fe-role-change", function () {
            upgradePanelIdentity();
            setTimeout(upgradePanelIdentity, 30);
        });
        window.feProfessionalRoleSyncReady = true;
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
        upgradePanelIdentity();
        setupProfessionalRoleSync();
    }

    function initAdminObserver() {
        var form = document.getElementById("form-admin-article");
        if (!form) return;
        var obs = new MutationObserver(function () {
            obs.disconnect();
            upgradeBoxes();
            createCategoryButtons();
            createWritingStats();
            setupPublishButton();
            syncCategoryButtons();
            obs.observe(form, { childList: true, subtree: true });
        });
        obs.observe(form, { childList: true, subtree: true });
    }

    function initAll() {
        injectStyles();
        fixCategories();
        upgradeAdminPanel();
        
        initArticleObserver();
        initAdminObserver();
        initCommentsEditor();

        setTimeout(function () { upgradeAdminPanel(); }, 250);
        setTimeout(function () { upgradeAdminPanel(); }, 800);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAll);
    } else {
        initAll();
    }

})();
