/* ==========================================================================
   FUORI ETICHETTA - EXTENSIONS & STUDIO ADMIN PRO (ZERO-ERROR VERSION)
   ========================================================================== */

(function() {
    "use strict";

    // --- 1. CONVERTITORE MARKDOWN ARTICOLI ---
    function formatMarkdown(text) {
        if (!text) return "";
        var safeText = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        safeText = safeText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        safeText = safeText.replace(/^###\s+(.*)$/gim, '<h3 style="margin-top:32px;margin-bottom:12px;font-size:1.3rem;color:#1d1d1f;">$1</h3>');

        var blocks = safeText.split(/\n\s*\n/);
        var htmlBlocks = [];
        for (var i = 0; i < blocks.length; i++) {
            var b = blocks[i].trim();
            if (!b) continue;
            if (b.indexOf("<h3") === 0) {
                htmlBlocks.push(b);
            } else {
                htmlBlocks.push('<p style="margin-bottom:18px;line-height:1.6;">' + b.replace(/\n/g, "<br>") + "</p>");
            }
        }
        return htmlBlocks.join("");
    }

    function initMarkdownObserver() {
        var articleContainer = document.getElementById("article-detail-content");
        if (!articleContainer) return;

        var observer = new MutationObserver(function(mutations) {
            for (var i = 0; i < mutations.length; i++) {
                if (articleContainer.childNodes.length === 1 && articleContainer.firstChild.nodeType === 3) {
                    var rawText = articleContainer.textContent;
                    if (rawText && rawText.trim() !== "") {
                        articleContainer.innerHTML = formatMarkdown(rawText);
                    }
                }
            }
        });
        observer.observe(articleContainer, { childList: true });
    }

    // --- 2. CATEGORIE CORRETTE (OUTFIT, NOVITÀ, ARTICOLI) ---
    function fixCategories() {
        // Menu pubblico in Homepage (modifica i bottoni esistenti per non perdere il click di app.js)
        var navPills = document.querySelectorAll(".category-nav .cat-pill");
        if (navPills.length >= 4) {
            navPills[1].setAttribute("data-category", "Outfit");
            navPills[1].textContent = "Outfit";

            navPills[2].setAttribute("data-category", "Novità");
            navPills[2].textContent = "Novità";

            navPills[3].setAttribute("data-category", "Articoli");
            navPills[3].textContent = "Articoli";

            for (var i = 4; i < navPills.length; i++) {
                navPills[i].style.display = "none";
            }
        }

        // Menu Select nel Pannello Admin
        var adminSelect = document.getElementById("admin-article-category");
        if (adminSelect) {
            var currentVal = adminSelect.value;
            adminSelect.innerHTML = "";
            var cats = ["Outfit", "Novità", "Articoli"];
            for (var j = 0; j < cats.length; j++) {
                var opt = document.createElement("option");
                opt.value = cats[j];
                opt.textContent = cats[j];
                adminSelect.appendChild(opt);
            }
            if (cats.indexOf(currentVal) !== -1) {
                adminSelect.value = currentVal;
            } else {
                adminSelect.value = "Outfit";
            }
        }
    }

    // --- 3. CSS STUDIO PRO (INIETTATO SENza TOCCARE IL DOM DI APP.JS) ---
    function injectProStyles() {
        if (document.getElementById("fe-pro-admin-styles")) return;

        var css = [
            "/* Contenitore Generale Admin */",
            "#view-admin { max-width: 1280px !important; margin: 0 auto !important; padding: 24px 20px 80px !important; }",
            
            "/* Top Bar Nera Stile Pro */",
            "#view-admin .admin-top-bar { background: #09090b !important; color: #fff !important; padding: 20px 26px !important; border-radius: 16px !important; margin-bottom: 20px !important; display: flex !important; justify-content: space-between !important; align-items: center !important; box-shadow: 0 10px 25px rgba(0,0,0,0.08) !important; }",
            "#view-admin .admin-top-bar .catalog-title { color: #fff !important; font-size: 1.3rem !important; font-weight: 700 !important; margin: 0 !important; }",
            "#view-admin .admin-top-bar .catalog-subtitle { display: none !important; }",
            "#view-admin #btn-close-admin { background: rgba(255,255,255,0.14) !important; color: #fff !important; border: 1px solid rgba(255,255,255,0.2) !important; border-radius: 10px !important; padding: 8px 16px !important; font-weight: 600 !important; }",

            "/* Barra Tab Stile Segmented Control */",
            "#view-admin .admin-tabs { background: #e4e4e7 !important; padding: 4px !important; border-radius: 12px !important; display: inline-flex !important; gap: 4px !important; margin-bottom: 24px !important; border: none !important; }",
            "#view-admin .admin-tab { background: transparent !important; border: none !important; color: #52525b !important; font-weight: 600 !important; font-size: 0.86rem !important; padding: 8px 16px !important; border-radius: 9px !important; }",
            "#view-admin .admin-tab.active { background: #ffffff !important; color: #09090b !important; box-shadow: 0 2px 6px rgba(0,0,0,0.08) !important; }",

            "/* Griglia Form a 2 Colonne */",
            "#form-admin-article { display: grid !important; grid-template-columns: minmax(0, 1.65fr) minmax(320px, 1fr) !important; gap: 20px !important; background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; align-items: start !important; }",

            "/* Nasconde suggerimenti lunghi e divisori inutili */",
            "#form-admin-article .field-help, #form-admin-article .or-divider { display: none !important; }",

            "/* Card Stile Bento per ogni sezione */",
            "#form-admin-article > div { background: #ffffff !important; border: 1px solid #e4e4e7 !important; border-radius: 18px !important; padding: 22px 24px !important; margin: 0 !important; box-shadow: 0 4px 16px rgba(0,0,0,0.025) !important; }",

            "/* Posizionamento Colonna Sinistra (Titolo, Anteprima, Testo) */",
            "#form-admin-article .form-row-2 { grid-column: 1 !important; display: flex !important; flex-direction: column !important; gap: 14px !important; }",
            "#form-admin-article . fe-box-excerpt { grid-column: 1 !important; }",
            "#form-admin-article .fe-box-content { grid-column: 1 !important; }",

            "/* Posizionamento Colonna Destra (Copertina, Galleria/Video, Pubblicazione) */",
            "#form-admin-article .fe-box-media { grid-column: 2 !important; }",
            "#form-admin-article .fe-box-extra { grid-column: 2 !important; }",
            "#form-admin-article .checkbox-group { grid-column: 2 !important; display: flex !important; align-items: center !important; gap: 10px !important; background: #fafafa !important; padding: 14px 18px !important; }",
            "#form-admin-article .admin-form-actions { grid-column: 2 !important; display: flex !important; flex-direction: row-reverse !important; gap: 10px !important; background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }",

            "/* Tipografia Label Pulita */",
            "#form-admin-article label { font-size: 0.75rem !important; font-weight: 700 !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; color: #71717a !important; margin-bottom: 8px !important; display: block !important; }",
            "#form-admin-article .checkbox-group label { text-transform: none !important; font-size: 0.88rem !important; color: #18181b !important; margin: 0 !important; letter-spacing: 0 !important; }",

            "/* Stile Campi di Testo Moderni */",
            "#admin-article-title { font-size: 1.5rem !important; font-weight: 800 !important; border: none !important; border-bottom: 2px solid #f4f4f5 !important; border-radius: 0 !important; padding: 8px 0 !important; background: transparent !important; box-shadow: none !important; }",
            "#admin-article-title:focus { border-bottom-color: #09090b !important; outline: none !important; }",
            "#admin-article-excerpt { background: #fafafa !important; border: 1px solid #e4e4e7 !important; border-radius: 10px !important; padding: 10px 14px !important; font-size: 0.95rem !important; }",
            "#admin-article-content { min-height: 420px !important; font-size: 1.05rem !important; line-height: 1.75 !important; border: 1px solid #f4f4f5 !important; background: #fafafa !important; border-radius: 12px !important; padding: 16px !important; }",
            "#admin-article-content:focus { background: #ffffff !important; border-color: #09090b !important; outline: none !important; }",

            "/* Bottoni Categorie Segmentati (Outfit, Novità, Articoli) */",
            ".fe-cat-pills { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; margin-top: 4px !important; }",
            ".fe-cat-btn { background: #fafafa !important; border: 1.5px solid #e4e4e7 !important; border-radius: 10px !important; padding: 10px 8px !important; font-size: 0.85rem !important; font-weight: 600 !important; color: #52525b !important; cursor: pointer !important; text-align: center !important; transition: all 0.15s ease !important; }",
            ".fe-cat-btn.active { background: #09090b !important; border-color: #09090b !important; color: #ffffff !important; }",

            "/* Upload Controls */",
            "#form-admin-article .upload-controls { display: flex !important; flex-direction: column !important; gap: 10px !important; }",
            "#form-admin-article input[type='file'] { background: #fafafa !important; border: 1.5px dashed #d4d4d8 !important; padding: 12px !important; border-radius: 10px !important; font-size: 0.82rem !important; width: 100% !important; cursor: pointer !important; }",
            "#form-admin-article input[type='url'], #form-admin-article input[type='text'] { border-radius: 10px !important; border: 1px solid #e4e4e7 !important; padding: 10px 12px !important; font-size: 0.88rem !important; }",

            "/* Bottoni Finali Salva e Reset */",
            "#btn-save-article { flex: 1 !important; background: #09090b !important; color: #ffffff !important; border: none !important; border-radius: 12px !important; padding: 14px 20px !important; font-weight: 700 !important; font-size: 0.95rem !important; cursor: pointer !important; }",
            "#btn-reset-article-form { background: #ffffff !important; color: #52525b !important; border: 1px solid #e4e4e7 !important; border-radius: 12px !important; padding: 14px 16px !important; font-weight: 600 !important; font-size: 0.88rem !important; cursor: pointer !important; }",

            "/* Responsive per iPhone e schermi piccoli */",
            "@media (max-width: 920px) {",
            "  #form-admin-article { grid-template-columns: 1fr !important; }",
            "  #form-admin-article > div, #form-admin-article .form-row-2, #form-admin-article .fe-box-media, #form-admin-article .fe-box-extra, #form-admin-article .checkbox-group, #form-admin-article .admin-form-actions { grid-column: 1 !important; }",
            "}"
        ].join("\n");

        var styleNode = document.createElement("style");
        styleNode.id = "fe-pro-admin-styles";
        styleNode.type = "text/css";
        styleNode.appendChild(document.createTextNode(css));
        document.head.appendChild(styleNode);
    }

    // --- 4. APPLICAZIONE CLASSI E WIDGET CATEGORIE ---
    function upgradeAdminPanel() {
        var form = document.getElementById("form-admin-article");
        if (!form) return;

        // Tagga i box genitori senza spostare gli input (100% compatibile con app.js)
        var excerptInput = document.getElementById("admin-article-excerpt");
        if (excerptInput && excerptInput.parentElement) {
            excerptInput.parentElement.classList.add("fe-box-excerpt");
            var lblEx = excerptInput.parentElement.querySelector("label");
            if (lblEx) lblEx.textContent = "Sottotitolo / Anteprima";
            excerptInput.placeholder = "Breve sintesi dell'articolo...";
        }

        var contentInput = document.getElementById("admin-article-content");
        if (contentInput && contentInput.parentElement) {
            contentInput.parentElement.classList.add("fe-box-content");
            var lblCon = contentInput.parentElement.querySelector("label");
            if (lblCon) lblCon.textContent = "Contenuto Articolo";
            contentInput.placeholder = "Scrivi qui il testo...";
        }

        var fileInput = document.getElementById("admin-image-file");
        if (fileInput) {
            var mediaGroup = fileInput.closest(".form-group");
            if (mediaGroup) {
                mediaGroup.classList.add("fe-box-media");
                var lblMed = mediaGroup.querySelector("label");
                if (lblMed) lblMed.textContent = "Copertina & Hotspot";
            }
        }

        var urlInput = document.getElementById("admin-image-url");
        if (urlInput) {
            urlInput.placeholder = "Oppure incolla URL immagine copertina...";
        }

        // Individua il box "Foto Aggiuntive & Video" creato da app.js e lo pulisce
        var children = form.children;
        for (var i = 0; i < children.length; i++) {
            var el = children[i];
            if (el.textContent && el.textContent.indexOf("Foto Aggiuntive") !== -1) {
                el.classList.add("fe-box-extra");
                var allP = el.querySelectorAll("p");
                for (var k = 0; k < allP.length; k++) {
                    allP[k].style.display = "none";
                }
            }
        }

        // Sostituisce visivamente la tendina Categoria con 3 bottoni rapidi (Outfit, Novità, Articoli)
        var catSelect = document.getElementById("admin-article-category");
        if (catSelect && !document.getElementById("fe-custom-cat-pills")) {
            catSelect.style.display = "none";
            var pillWrap = document.createElement("div");
            pillWrap.id = "fe-custom-cat-pills";
            pillWrap.className = "fe-cat-pills";

            var categories = ["Outfit", "Novità", "Articoli"];
            categories.forEach(function(catName) {
                var btn = document.createElement("button");
                btn.type = "button";
                btn.className = "fe-cat-btn" + (catSelect.value === catName ? " active" : "");
                btn.textContent = catName;
                btn.addEventListener("click", function() {
                    catSelect.value = catName;
                    var ev = document.createEvent("HTMLEvents");
                    ev.initEvent("change", true, false);
                    catSelect.dispatchEvent(ev);

                    var allBtns = pillWrap.querySelectorAll(".fe-cat-btn");
                    for (var m = 0; m < allBtns.length; m++) {
                        allBtns[m].classList.remove("active");
                    }
                    btn.classList.add("active");
                });
                pillWrap.appendChild(btn);
            });

            catSelect.parentElement.appendChild(pillWrap);
        }

        // Accorcia i testi prolissi rimasti
        var chkLabel = document.querySelector("label[for='admin-article-published']");
        if (chkLabel) chkLabel.textContent = "Pubblica subito online";

        var btnSave = document.getElementById("btn-save-article");
        if (btnSave) btnSave.textContent = "Pubblica";

        var btnReset = document.getElementById("btn-reset-article-form");
        if (btnReset) btnReset.textContent = "Pulisci";
    }

    function initAll() {
        injectProStyles();
        fixCategories();
        upgradeAdminPanel();
        initMarkdownObserver();

        // Se app.js inietta il box Foto Aggiuntive un istante dopo, lo intercettiamo subito
        var form = document.getElementById("form-admin-article");
        if (form) {
            var formObs = new MutationObserver(function() {
                upgradeAdminPanel();
            });
            formObs.observe(form, { childList: true });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAll);
    } else {
        initAll();
    }
})();
