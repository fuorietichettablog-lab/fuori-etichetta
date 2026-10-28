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

        // Il layout amministrativo viene ora gestito dal foglio style.css

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


    /* ==========================================================================
       7. DASHBOARD CMS PROFESSIONALE — MENU, SOTTOMENU E WORKSPACE
       ========================================================================== */

    function feIconSvg(name) {
        var icons = {
            pen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
            archive: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"/><path d="M5 6v14h14V6"/><path d="M8 10h8"/><path d="M9 14h6"/></svg>',
            team: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
            shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>',
            users: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-4-4h-1"/></svg>',
            back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/><path d="M9 12h12"/></svg>',
            menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
            dashboard: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
            collapse: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>'
        };
        return icons[name] || icons.archive;
    }

    function decorateCmsNavButton(button, iconName, title, caption) {
        if (!button) return;
        var badge = button.querySelector('.badge-alert');
        if (badge) badge.remove();
        button.innerHTML =
            '<span class="fe-nav-icon">' + feIconSvg(iconName) + '</span>' +
            '<span class="fe-nav-copy"><strong>' + title + '</strong><small>' + caption + '</small></span>';
        if (badge) button.appendChild(badge);
    }

    function updateCmsNavGroups() {
        var nav = document.querySelector('#view-admin .admin-tabs');
        if (!nav) return;
        nav.querySelectorAll('.fe-nav-group').forEach(function (group) {
            var visible = Array.prototype.some.call(group.querySelectorAll('.admin-tab'), function (button) {
                return !button.classList.contains('hidden');
            });
            group.classList.toggle('hidden', !visible);
        });

        var isAdminRole = typeof state !== 'undefined' && state.isAdmin === true;
        var brandMode = document.getElementById('fe-nav-brand-mode');
        if (brandMode) brandMode.textContent = isAdminRole ? 'Editorial CMS' : 'Writer Studio';

        decorateCmsNavButton(document.querySelector('[data-tab="tab-dashboard"]'), 'dashboard', 'Panoramica', 'Stato e scorciatoie');
        decorateCmsNavButton(document.querySelector('[data-tab="tab-editor"]'), 'pen', 'Scrivi articolo', 'Crea o modifica contenuti');
        decorateCmsNavButton(document.querySelector('[data-tab="tab-manage-articles"]'), 'archive', isAdminRole ? 'Archivio articoli' : 'I miei articoli', isAdminRole ? 'Gestisci tutti i contenuti' : 'Controlla i tuoi contenuti');
        decorateCmsNavButton(document.querySelector('[data-tab="tab-collaborators"]'), 'team', 'Collaboratori', 'Team, permessi e approvazioni');
        decorateCmsNavButton(document.querySelector('[data-tab="tab-moderation"]'), 'shield', 'Moderazione', 'Commenti e segnalazioni');
        decorateCmsNavButton(document.querySelector('[data-tab="tab-users"]'), 'users', 'Utenti', 'Account registrati');
    }

    function updateCmsWorkspaceHeader() {
        var view = document.getElementById('view-admin');
        if (!view) return;
        var active = view.querySelector('.admin-tab.active');
        var key = active ? active.getAttribute('data-tab') : 'tab-editor';
        var title = document.getElementById('admin-panel-title');
        var subtitle = document.getElementById('admin-panel-subtitle');
        var isAdminRole = typeof state !== 'undefined' && state.isAdmin === true;
        var copy = {
            'tab-dashboard': [isAdminRole ? 'Panoramica redazione' : 'Il tuo studio editoriale', isAdminRole ? 'Una vista rapida su contenuti, revisioni e attività della community.' : 'Scrivi, controlla e gestisci i tuoi contenuti in un unico spazio.'],
            'tab-editor': [isAdminRole ? 'Scrivi un articolo' : 'Scrivi il tuo articolo', isAdminRole ? 'Crea un nuovo contenuto o modifica un articolo esistente.' : 'Prepara il contenuto e invialo alla redazione quando è pronto.'],
            'tab-manage-articles': [isAdminRole ? 'Archivio articoli' : 'I miei articoli', isAdminRole ? 'Controlla stato, modifiche e pubblicazione di tutti gli articoli.' : 'Controlla lo stato dei tuoi articoli e riaprili per modificarli.'],
            'tab-collaborators': ['Gestione collaboratori', 'Approva gli articoli, gestisci il team e assegna i permessi editoriali.'],
            'tab-moderation': ['Moderazione community', 'Controlla segnalazioni e commenti pubblicati sul sito.'],
            'tab-users': ['Utenti registrati', 'Consulta gli account e gestisci eventuali blocchi.']
        };
        var selected = copy[key] || copy['tab-dashboard'];
        if (title) title.textContent = selected[0];
        if (subtitle) subtitle.textContent = selected[1];

        var eyebrow = document.getElementById('fe-workspace-eyebrow');
        if (!eyebrow) {
            eyebrow = document.createElement('div');
            eyebrow.id = 'fe-workspace-eyebrow';
            eyebrow.className = 'fe-workspace-eyebrow';
            var top = view.querySelector('.admin-top-bar > div:first-child');
            if (top) top.insertBefore(eyebrow, top.firstChild);
        }
        if (eyebrow) eyebrow.textContent = isAdminRole ? 'FUORI ETICHETTA / AMMINISTRAZIONE' : 'FUORI ETICHETTA / AREA COLLABORATORE';
    }

    function showCollaboratorSubpanel(panelName) {
        var root = document.getElementById('tab-collaborators');
        if (!root) return;
        var cards = root.querySelectorAll(':scope > .admin-card[data-fe-collab-panel]');
        cards.forEach(function (card) {
            card.classList.toggle('fe-subpanel-hidden', card.getAttribute('data-fe-collab-panel') !== panelName);
        });
        root.querySelectorAll('.fe-collab-subnav-btn').forEach(function (button) {
            button.classList.toggle('active', button.getAttribute('data-fe-collab-target') === panelName);
        });
    }

    function setupCollaboratorSubmenu() {
        var root = document.getElementById('tab-collaborators');
        if (!root || root.dataset.feSubmenuReady === 'true') return;
        var cards = Array.prototype.slice.call(root.querySelectorAll(':scope > .admin-card'));
        if (cards.length < 4) return;
        cards[0].setAttribute('data-fe-collab-panel', 'settings');
        cards[1].setAttribute('data-fe-collab-panel', 'add');
        cards[2].setAttribute('data-fe-collab-panel', 'pending');
        cards[3].setAttribute('data-fe-collab-panel', 'people');

        var subnav = document.createElement('div');
        subnav.className = 'fe-collab-subnav';
        subnav.innerHTML =
            '<button type="button" class="fe-collab-subnav-btn active" data-fe-collab-target="pending"><span>Da approvare</span><small>Revisioni in attesa</small></button>' +
            '<button type="button" class="fe-collab-subnav-btn" data-fe-collab-target="people"><span>Collaboratori</span><small>Elenco e permessi</small></button>' +
            '<button type="button" class="fe-collab-subnav-btn" data-fe-collab-target="add"><span>Aggiungi</span><small>Nuovo collaboratore</small></button>' +
            '<button type="button" class="fe-collab-subnav-btn" data-fe-collab-target="settings"><span>Impostazioni</span><small>Regole di approvazione</small></button>';
        root.insertBefore(subnav, root.firstChild);
        subnav.addEventListener('click', function (event) {
            var button = event.target.closest('.fe-collab-subnav-btn');
            if (!button) return;
            showCollaboratorSubpanel(button.getAttribute('data-fe-collab-target'));
        });
        root.dataset.feSubmenuReady = 'true';
        showCollaboratorSubpanel('pending');
    }

    function closeCmsMobileNav() {
        var view = document.getElementById('view-admin');
        if (view) view.classList.remove('fe-mobile-nav-open');
    }

    function buildCmsNavigation() {
        var view = document.getElementById('view-admin');
        var nav = view ? view.querySelector('.admin-tabs') : null;
        if (!view || !nav) return;

        if (nav.dataset.feCmsReady !== 'true') {
            nav.classList.add('fe-cms-sidebar');
            var dashboard = nav.querySelector('[data-tab="tab-dashboard"]');
            var editor = nav.querySelector('[data-tab="tab-editor"]');
            var archive = nav.querySelector('[data-tab="tab-manage-articles"]');
            var collaborators = nav.querySelector('[data-tab="tab-collaborators"]');
            var moderation = nav.querySelector('[data-tab="tab-moderation"]');
            var users = nav.querySelector('[data-tab="tab-users"]');

            var brand = document.createElement('div');
            brand.className = 'fe-nav-brand';
            brand.innerHTML = '<span class="fe-nav-brand-mark">FE</span><span><strong>Fuori Etichetta</strong><small id="fe-nav-brand-mode">Editorial CMS</small></span>';
            nav.insertBefore(brand, nav.firstChild);

            var collapseToggle = document.createElement('button');
            collapseToggle.type = 'button';
            collapseToggle.className = 'fe-sidebar-collapse';
            collapseToggle.setAttribute('aria-label', 'Riduci o espandi il menu');
            collapseToggle.setAttribute('title', 'Riduci o espandi il menu');
            collapseToggle.innerHTML = feIconSvg('collapse');
            brand.appendChild(collapseToggle);
            collapseToggle.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                view.classList.toggle('fe-sidebar-collapsed');
                try { localStorage.setItem('feSidebarCollapsed', view.classList.contains('fe-sidebar-collapsed') ? '1' : '0'); } catch (e) {}
            });
            try {
                if (localStorage.getItem('feSidebarCollapsed') === '1') view.classList.add('fe-sidebar-collapsed');
            } catch (e) {}

            function makeGroup(label, buttons) {
                var group = document.createElement('div');
                group.className = 'fe-nav-group';
                group.innerHTML = '<div class="fe-nav-group-title">' + label + '</div>';
                buttons.forEach(function (button) { if (button) group.appendChild(button); });
                nav.appendChild(group);
                return group;
            }
            makeGroup('WORKSPACE', [dashboard]);
            makeGroup('CONTENUTI', [editor, archive]);
            makeGroup('TEAM EDITORIALE', [collaborators]);
            makeGroup('COMMUNITY', [moderation, users]);

            var closeButton = document.getElementById('btn-close-admin');
            var footer = document.createElement('div');
            footer.className = 'fe-nav-footer';
            if (closeButton) {
                closeButton.innerHTML = '<span class="fe-nav-footer-icon">' + feIconSvg('back') + '</span><span>Torna al sito</span>';
                footer.appendChild(closeButton);
            }
            nav.appendChild(footer);

            var mobileToggle = document.createElement('button');
            mobileToggle.type = 'button';
            mobileToggle.id = 'fe-mobile-nav-toggle';
            mobileToggle.className = 'fe-mobile-nav-toggle';
            mobileToggle.setAttribute('aria-label', 'Apri menu editoriale');
            mobileToggle.innerHTML = feIconSvg('menu');
            var topBar = view.querySelector('.admin-top-bar');
            if (topBar) topBar.insertBefore(mobileToggle, topBar.firstChild);
            mobileToggle.addEventListener('click', function () { view.classList.toggle('fe-mobile-nav-open'); });

            var overlay = document.createElement('button');
            overlay.type = 'button';
            overlay.className = 'fe-mobile-nav-overlay';
            overlay.setAttribute('aria-label', 'Chiudi menu');
            overlay.addEventListener('click', closeCmsMobileNav);
            view.appendChild(overlay);

            nav.addEventListener('click', function (event) {
                var tab = event.target.closest('.admin-tab');
                if (!tab) return;
                setTimeout(function () {
                    updateCmsWorkspaceHeader();
                    if (tab.getAttribute('data-tab') === 'tab-collaborators') showCollaboratorSubpanel('pending');
                    closeCmsMobileNav();
                }, 0);
            });

            nav.dataset.feCmsReady = 'true';
        }

        setupCollaboratorSubmenu();
        updateCmsNavGroups();
        updateCmsWorkspaceHeader();
    }

    function setupCmsRoleSync() {
        if (window.feCmsRoleSyncReady) return;
        window.addEventListener('fe-role-change', function () {
            setTimeout(function () {
                buildCmsNavigation();
                updateCmsNavGroups();
                updateCmsWorkspaceHeader();
            }, 40);
        });
        window.feCmsRoleSyncReady = true;
    }

    function openCmsTab(tabId) {
        var button = document.querySelector('#view-admin .admin-tab[data-tab="' + tabId + '"]');
        var panel = document.getElementById(tabId);
        if (!button || !panel || button.classList.contains('hidden')) return;
        document.querySelectorAll('#view-admin .admin-tab').forEach(function (t) { t.classList.remove('active'); });
        document.querySelectorAll('#view-admin .admin-tab-content').forEach(function (c) { c.classList.add('hidden'); });
        button.classList.add('active');
        panel.classList.remove('hidden');
        updateCmsWorkspaceHeader();
        if (tabId === 'tab-collaborators') showCollaboratorSubpanel('pending');
        closeCmsMobileNav();
    }

    function updateDashboardMetrics() {
        var dashboard = document.getElementById('tab-dashboard');
        if (!dashboard) return;
        var isAdminRole = typeof state !== 'undefined' && state.isAdmin === true;
        var published = (typeof state !== 'undefined' && Array.isArray(state.articles)) ? state.articles.length : 0;
        var archiveRows = document.querySelectorAll('#admin-articles-table .admin-list-row').length;
        var pendingRows = document.querySelectorAll('#admin-pending-articles-list .admin-list-row').length;
        var reportBadge = document.getElementById('admin-report-badge');
        var reportCount = reportBadge ? parseInt(reportBadge.textContent || '0', 10) || 0 : 0;

        var name = '';
        if (typeof state !== 'undefined' && state.currentProfile) {
            name = [state.currentProfile.first_name, state.currentProfile.last_name].filter(Boolean).join(' ');
        }
        var greeting = document.getElementById('fe-dashboard-greeting');
        var intro = document.getElementById('fe-dashboard-intro');
        var role = document.getElementById('fe-dashboard-role');
        var archiveLabel = document.getElementById('fe-metric-archive-label');
        if (greeting) greeting.textContent = name ? 'Bentornato, ' + name + '.' : 'Bentornato nella redazione.';
        if (intro) intro.textContent = isAdminRole ? 'Controlla contenuti, revisioni, collaboratori e community da un unico workspace.' : 'Scrivi i tuoi articoli, controllane lo stato e continua a lavorare senza distrazioni.';
        if (role) role.textContent = isAdminRole ? 'Amministrazione' : 'Writer Studio';
        if (archiveLabel) archiveLabel.textContent = isAdminRole ? 'Articoli in archivio' : 'I miei articoli';

        var pubEl = document.getElementById('fe-metric-published');
        var arcEl = document.getElementById('fe-metric-archive');
        var penEl = document.getElementById('fe-metric-pending');
        var repEl = document.getElementById('fe-metric-reports');
        if (pubEl) pubEl.textContent = String(published);
        if (arcEl) arcEl.textContent = archiveRows ? String(archiveRows) : '0';
        if (penEl) penEl.textContent = String(pendingRows);
        if (repEl) repEl.textContent = String(reportCount);
    }

    function setupDashboardExperience() {
        var view = document.getElementById('view-admin');
        if (!view || view.dataset.feDashboardReady === 'true') return;
        view.addEventListener('click', function (event) {
            var shortcut = event.target.closest('[data-fe-open-tab]');
            if (!shortcut) return;
            event.preventDefault();
            openCmsTab(shortcut.getAttribute('data-fe-open-tab'));
        });
        var observer = new MutationObserver(function () { updateDashboardMetrics(); });
        ['admin-articles-table', 'admin-pending-articles-list', 'admin-reported-comments-list'].forEach(function (id) {
            var node = document.getElementById(id);
            if (node) observer.observe(node, { childList: true, subtree: true });
        });
        window.addEventListener('fe-role-change', function () { setTimeout(updateDashboardMetrics, 60); });
        view.dataset.feDashboardReady = 'true';
        updateDashboardMetrics();
    }

    function initPublicExperience() {
        if (document.body.dataset.fePublicReady === 'true') return;
        var explore = document.getElementById('btn-hero-explore');
        var latest = document.getElementById('btn-hero-latest');
        if (explore) explore.addEventListener('click', function () {
            var anchor = document.getElementById('fe-catalog-anchor');
            if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        if (latest) latest.addEventListener('click', function () {
            var first = document.querySelector('#articles-grid .article-card');
            if (first) first.click();
            else {
                var anchor = document.getElementById('fe-catalog-anchor');
                if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });

        var grid = document.getElementById('articles-grid');
        if (grid) {
            var cardObserver = new MutationObserver(function () {
                Array.prototype.forEach.call(grid.querySelectorAll('.article-card'), function (card, index) {
                    card.style.setProperty('--fe-card-index', String(index));
                });
            });
            cardObserver.observe(grid, { childList: true });
        }
        document.body.dataset.fePublicReady = 'true';
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
        buildCmsNavigation();
        setupCmsRoleSync();
        setupDashboardExperience();
        updateDashboardMetrics();
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
        buildCmsNavigation();
        setupCmsRoleSync();
        
        initPublicExperience();
        initArticleObserver();
        initAdminObserver();
        initCommentsEditor();

        setTimeout(function () { upgradeAdminPanel(); updateDashboardMetrics(); }, 250);
        setTimeout(function () { upgradeAdminPanel(); updateDashboardMetrics(); }, 800);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAll);
    } else {
        initAll();
    }

})();
