/**
 * FUORI ETICHETTA — ESTENSIONI & STUDIO EDITORIALE PRO
 * File completo pronto all'uso (Sostituisce interamente extensions.js)
 */

// ============================================================================
// MODULO 1: FORMATTAZIONE MARKDOWN ARTICOLI
// ============================================================================
function formatMarkdown(text) {
    if (!text) return '';
    
    let safeText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
        
    safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    safeText = safeText.replace(/^###\s+(.*)$/gim, '<h3 style="margin-top: 32px; margin-bottom: 12px; font-size: 1.3rem; color: #1d1d1f;">$1</h3>');
    
    const blocks = safeText.split(/\n\s*\n/);
    const htmlBlocks = blocks.map(block => {
        if (block.trim().startsWith('<h3')) {
            return block;
        }
        return `<p style="margin-bottom: 18px; line-height: 1.6;">${block.replace(/\n/g, '<br>')}</p>`;
    });
    
    return htmlBlocks.join('');
}

const articleContainer = document.getElementById('article-detail-content');
if (articleContainer) {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(() => {
            if (articleContainer.childNodes.length === 1 && articleContainer.firstChild.nodeType === Node.TEXT_NODE) {
                const rawText = articleContainer.textContent;
                if (rawText.trim() !== '') {
                    articleContainer.innerHTML = formatMarkdown(rawText);
                }
            }
        });
    });
    observer.observe(articleContainer, { childList: true });
}

// ============================================================================
// MODULO 2: STUDIO EDITORIALE PRO (BENTO 2-COLUMN WORKSPACE)
// ============================================================================
(function initFuoriEtichettaStudioPro() {

    const injectStudioStyles = () => {
        if (document.getElementById("fe-studio-pro-css")) return;
        const style = document.createElement("style");
        style.id = "fe-studio-pro-css";
        style.textContent = `
            /* Layout Generale Area Admin */
            #view-admin {
                max-width: 1320px !important;
                margin: 0 auto !important;
                padding: 24px 20px 90px !important;
            }

            /* Top Bar Dark Pro */
            #view-admin .admin-top-bar {
                background: #09090b !important;
                color: #ffffff !important;
                padding: 20px 28px !important;
                border-radius: 18px !important;
                margin-bottom: 20px !important;
                box-shadow: 0 10px 30px rgba(0,0,0,0.10) !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
            }
            #view-admin .admin-top-bar .catalog-title {
                color: #ffffff !important;
                font-size: 1.35rem !important;
                font-weight: 700 !important;
                letter-spacing: -0.02em !important;
                margin: 0 !important;
            }
            #view-admin .admin-top-bar .catalog-subtitle {
                display: none !important;
            }
            #view-admin #btn-close-admin {
                background: rgba(255,255,255,0.12) !important;
                color: #ffffff !important;
                border: 1px solid rgba(255,255,255,0.16) !important;
                border-radius: 10px !important;
                padding: 9px 16px !important;
                font-size: 0.85rem !important;
                font-weight: 600 !important;
                cursor: pointer !important;
            }
            #view-admin #btn-close-admin:hover {
                background: rgba(255,255,255,0.2) !important;
            }

            /* Navigazione Tab Segmented Control */
            #view-admin .admin-tabs {
                background: #e4e4e7 !important;
                padding: 4px !important;
                border-radius: 12px !important;
                display: inline-flex !important;
                gap: 4px !important;
                margin-bottom: 24px !important;
                border: none !important;
                flex-wrap: wrap !important;
            }
            #view-admin .admin-tab {
                border: none !important;
                background: transparent !important;
                color: #52525b !important;
                font-weight: 600 !important;
                font-size: 0.85rem !important;
                padding: 9px 16px !important;
                border-radius: 9px !important;
                cursor: pointer !important;
                transition: all 0.15s ease !important;
            }
            #view-admin .admin-tab.active {
                background: #ffffff !important;
                color: #09090b !important;
                box-shadow: 0 2px 6px rgba(0,0,0,0.08) !important;
            }

            /* Reset Vecchio Form */
            #form-admin-article {
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                max-width: 100% !important;
            }

            /* Griglia a 2 Colonne: Editor a Sinistra, Controlli a Destra */
            .fe-studio-grid {
                display: grid !important;
                grid-template-columns: minmax(0, 1fr) 400px !important;
                gap: 24px !important;
                align-items: start !important;
            }

            /* Colonna Sinistra: Foglio di Scrittura */
            .fe-studio-paper {
                background: #ffffff !important;
                border: 1px solid #e4e4e7 !important;
                border-radius: 20px !important;
                padding: 32px 38px !important;
                box-shadow: 0 4px 20px rgba(0,0,0,0.03) !important;
            }
            .fe-paper-header {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                margin-bottom: 22px !important;
                padding-bottom: 14px !important;
                border-bottom: 1px solid #f4f4f5 !important;
            }
            .fe-paper-badge {
                font-size: 0.7rem !important;
                font-weight: 700 !important;
                letter-spacing: 0.08em !important;
                color: #52525b !important;
                background: #f4f4f5 !important;
                padding: 5px 10px !important;
                border-radius: 6px !important;
            }
            .fe-word-metrics {
                font-size: 0.8rem !important;
                color: #a1a1aa !important;
                font-weight: 500 !important;
            }

            /* Barra di Formattazione Rapida */
            .fe-format-toolbar {
                display: flex !important;
                gap: 6px !important;
                margin-bottom: 14px !important;
            }
            .fe-fmt-btn {
                background: #f4f4f5 !important;
                border: 1px solid #e4e4e7 !important;
                border-radius: 8px !important;
                padding: 5px 11px !important;
                font-size: 0.78rem !important;
                font-weight: 600 !important;
                color: #27272a !important;
                cursor: pointer !important;
            }
            .fe-fmt-btn:hover {
                background: #e4e4e7 !important;
            }

            /* Input Titolo, Sottotitolo e Testo */
            #admin-article-title {
                width: 100% !important;
                font-size: 2rem !important;
                font-weight: 800 !important;
                letter-spacing: -0.03em !important;
                line-height: 1.2 !important;
                border: none !important;
                background: transparent !important;
                padding: 4px 0 !important;
                margin-bottom: 14px !important;
                color: #09090b !important;
                box-shadow: none !important;
                outline: none !important;
            }
            #admin-article-title::placeholder {
                color: #d4d4d8 !important;
            }

            #admin-article-excerpt {
                width: 100% !important;
                font-size: 1rem !important;
                font-weight: 500 !important;
                color: #3f3f46 !important;
                border: none !important;
                border-left: 3px solid #09090b !important;
                border-radius: 0 8px 8px 0 !important;
                background: #fafafa !important;
                padding: 10px 14px !important;
                margin-bottom: 22px !important;
                box-shadow: none !important;
                outline: none !important;
            }

            #admin-article-content {
                width: 100% !important;
                min-height: 480px !important;
                font-size: 1.05rem !important;
                line-height: 1.75 !important;
                color: #18181b !important;
                border: none !important;
                background: transparent !important;
                padding: 8px 0 !important;
                box-shadow: none !important;
                outline: none !important;
                resize: vertical !important;
            }

            /* Colonna Destra: Inspector Laterale */
            .fe-studio-sidebar {
                display: flex !important;
                flex-direction: column !important;
                gap: 16px !important;
                position: sticky !important;
                top: 84px !important;
            }
            .fe-inspector-card {
                background: #ffffff !important;
                border: 1px solid #e4e4e7 !important;
                border-radius: 18px !important;
                padding: 20px !important;
                box-shadow: 0 4px 14px rgba(0,0,0,0.025) !important;
            }
            .fe-card-head {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                margin-bottom: 12px !important;
            }
            .fe-card-title {
                font-size: 0.88rem !important;
                font-weight: 700 !important;
                color: #09090b !important;
                text-transform: uppercase !important;
                letter-spacing: 0.04em !important;
            }

            /* Badge Pubblico / Bozza */
            .fe-status-pill {
                font-size: 0.72rem !important;
                font-weight: 700 !important;
                padding: 4px 10px !important;
                border-radius: 999px !important;
            }
            .fe-status-pill.is-live {
                background: #dcfce7 !important;
                color: #15803d !important;
            }
            .fe-status-pill.is-draft {
                background: #fef3c7 !important;
                color: #b45309 !important;
            }

            /* Switch iOS */
            .fe-ios-switch-row {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                background: #fafafa !important;
                border: 1px solid #f4f4f5 !important;
                padding: 10px 14px !important;
                border-radius: 12px !important;
                cursor: pointer !important;
                margin-bottom: 14px !important;
            }
            .fe-switch-text strong {
                display: block !important;
                font-size: 0.85rem !important;
                color: #18181b !important;
            }
            .fe-ios-switch-wrap {
                position: relative !important;
                width: 42px !important;
                height: 24px !important;
            }
            .fe-ios-switch-wrap input {
                opacity: 0 !important;
                width: 0 !important;
                height: 0 !important;
            }
            .fe-ios-slider {
                position: absolute !important;
                inset: 0 !important;
                background-color: #d4d4d8 !important;
                border-radius: 24px !important;
                transition: 0.2s !important;
            }
            .fe-ios-slider::before {
                position: absolute !important;
                content: "" !important;
                height: 18px !important;
                width: 18px !important;
                left: 3px !important;
                bottom: 3px !important;
                background-color: #ffffff !important;
                border-radius: 50% !important;
                transition: 0.2s !important;
            }
            .fe-ios-switch-wrap input:checked + .fe-ios-slider {
                background-color: #09090b !important;
            }
            .fe-ios-switch-wrap input:checked + .fe-ios-slider::before {
                transform: translateX(18px) !important;
            }

            /* Bottoni Pubblica & Reset */
            .fe-actions-stack {
                display: grid !important;
                grid-template-columns: 1fr auto !important;
                gap: 8px !important;
            }
            #btn-save-article {
                background: #09090b !important;
                color: #ffffff !important;
                border: none !important;
                border-radius: 11px !important;
                padding: 12px 16px !important;
                font-weight: 700 !important;
                font-size: 0.9rem !important;
                cursor: pointer !important;
            }
            #btn-reset-article-form {
                background: #f4f4f5 !important;
                color: #52525b !important;
                border: none !important;
                border-radius: 11px !important;
                padding: 12px 14px !important;
                font-weight: 600 !important;
                font-size: 0.84rem !important;
                cursor: pointer !important;
            }

            /* Selettore Categorie 3 Bottoni (Outfit, Novità, Articoli) */
            .fe-cat-segmented {
                display: grid !important;
                grid-template-columns: repeat(3, 1fr) !important;
                gap: 8px !important;
            }
            .fe-seg-btn {
                background: #fafafa !important;
                border: 1.5px solid #e4e4e7 !important;
                border-radius: 11px !important;
                padding: 10px 6px !important;
                font-size: 0.84rem !important;
                font-weight: 600 !important;
                color: #52525b !important;
                cursor: pointer !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 6px !important;
            }
            .fe-seg-dot {
                width: 7px !important;
                height: 7px !important;
                border-radius: 50% !important;
                background: #d4d4d8 !important;
            }
            .fe-seg-btn.active {
                background: #09090b !important;
                border-color: #09090b !important;
                color: #ffffff !important;
            }
            .fe-seg-btn.active .fe-seg-dot {
                background: #22c55e !important;
            }

            /* Dropzone Copertina */
            .fe-upload-dropzone {
                display: flex !important;
                align-items: center !important;
                gap: 12px !important;
                background: #fafafa !important;
                border: 1.5px dashed #d4d4d8 !important;
                border-radius: 12px !important;
                padding: 14px !important;
                cursor: pointer !important;
                margin-bottom: 12px !important;
            }
            .fe-upload-dropzone:hover {
                border-color: #09090b !important;
                background: #f4f4f5 !important;
            }
            .fe-dropzone-icon {
                width: 40px !important;
                height: 40px !important;
                border-radius: 10px !important;
                background: #ffffff !important;
                border: 1px solid #e4e4e7 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                flex-shrink: 0 !important;
            }
            .fe-dropzone-text strong {
                display: block !important;
                font-size: 0.84rem !important;
                color: #18181b !important;
            }
            .fe-dropzone-text span {
                font-size: 0.74rem !important;
                color: #71717a !important;
            }
            .fe-hidden-file input[type="file"] {
                display: none !important;
            }
            #admin-image-url {
                width: 100% !important;
                font-size: 0.84rem !important;
                padding: 9px 12px !important;
                border-radius: 10px !important;
                border: 1px solid #e4e4e7 !important;
                background: #fafafa !important;
            }

            /* Pulizia automatica del blocco Galleria & Video iniettato da app.js */
            #fe-slot-extra-media > div {
                background: #ffffff !important;
                border: 1px solid #e4e4e7 !important;
                border-radius: 18px !important;
                padding: 20px !important;
                margin: 0 !important;
                box-shadow: 0 4px 14px rgba(0,0,0,0.025) !important;
            }
            #fe-slot-extra-media p,
            #fe-slot-extra-media .field-help {
                display: none !important; /* Nasconde i lunghi suggerimenti testuali */
            }

            @media (max-width: 960px) {
                .fe-studio-grid {
                    grid-template-columns: 1fr !important;
                }
                .fe-studio-sidebar {
                    position: static !important;
                }
                .fe-studio-paper {
                    padding: 22px 18px !important;
                }
            }
        `;
        document.head.appendChild(style);
    };

    const setupStudio = () => {
        // 1. Imposta le 3 categorie corrette nel menu Admin: Outfit, Novità, Articoli
        const catSelect = document.getElementById("admin-article-category");
        if (catSelect) {
            catSelect.innerHTML = `
                <option value="Outfit">Outfit</option>
                <option value="Novità">Novità</option>
                <option value="Articoli">Articoli</option>
            `;
        }

        // 2. Imposta le categorie corrette nella barra pubblica senza perdere gli eventi di app.js
        const navPills = document.querySelectorAll(".category-nav .cat-pill");
        if (navPills.length >= 4) {
            navPills[3].setAttribute("data-category", "Articoli");
            navPills[3].textContent = "Articoli";
            if (navPills[4]) navPills[4].style.display = "none";
        }

        // 3. Costruzione interfaccia Studio a 2 colonne
        const form = document.getElementById("form-admin-article");
        if (!form || form.dataset.studioUpgraded === "true") return;
        form.dataset.studioUpgraded = "true";

        const titleInput = document.getElementById("admin-article-title");
        const excerptInput = document.getElementById("admin-article-excerpt");
        const contentInput = document.getElementById("admin-article-content");
        const fileInput = document.getElementById("admin-image-file");
        const urlInput = document.getElementById("admin-image-url");
        const hotspotWorkspace = document.getElementById("admin-hotspot-workspace");
        const publishCheckbox = document.getElementById("admin-article-published");
        const btnReset = document.getElementById("btn-reset-article-form");
        const btnSave = document.getElementById("btn-save-article");

        if (titleInput) titleInput.placeholder = "Titolo dell'articolo...";
        if (excerptInput) excerptInput.placeholder = "Sottotitolo / Sintesi breve per l'anteprima...";
        if (contentInput) contentInput.placeholder = "Scrivi qui il contenuto...";
        if (btnSave) btnSave.textContent = "Pubblica";
        if (btnReset) btnReset.textContent = "Pulisci";

        const studioLayout = document.createElement("div");
        studioLayout.className = "fe-studio-grid";

        studioLayout.innerHTML = `
            <div class="fe-studio-main">
                <div class="fe-studio-paper">
                    <div class="fe-paper-header">
                        <span class="fe-paper-badge">EDITOR</span>
                        <div class="fe-word-metrics">
                            <span id="fe-char-counter">0 parole</span> · <span id="fe-read-time">1 min</span>
                        </div>
                    </div>
                    <div id="fe-slot-title"></div>
                    <div id="fe-slot-excerpt"></div>
                    <div class="fe-format-toolbar">
                        <button type="button" class="fe-fmt-btn" id="fe-btn-bold"><strong>B</strong> Grassetto</button>
                        <button type="button" class="fe-fmt-btn" id="fe-btn-h3">Titolo Paragrafo</button>
                    </div>
                    <div id="fe-slot-content"></div>
                </div>
            </div>

            <aside class="fe-studio-sidebar">
                <div class="fe-inspector-card">
                    <div class="fe-card-head">
                        <span class="fe-card-title">Pubblicazione</span>
                        <span id="fe-status-pill" class="fe-status-pill is-live">Online</span>
                    </div>
                    <div id="fe-slot-publish-toggle"></div>
                    <div id="fe-slot-actions" class="fe-actions-stack"></div>
                </div>

                <div class="fe-inspector-card">
                    <div class="fe-card-head">
                        <span class="fe-card-title">Categoria</span>
                    </div>
                    <div class="fe-cat-segmented" id="fe-cat-pills-ui">
                        <button type="button" class="fe-seg-btn active" data-val="Outfit">
                            <span class="fe-seg-dot"></span> Outfit
                        </button>
                        <button type="button" class="fe-seg-btn" data-val="Novità">
                            <span class="fe-seg-dot"></span> Novità
                        </button>
                        <button type="button" class="fe-seg-btn" data-val="Articoli">
                            <span class="fe-seg-dot"></span> Articoli
                        </button>
                    </div>
                    <div id="fe-slot-category-hidden" style="display:none;"></div>
                </div>

                <div class="fe-inspector-card">
                    <div class="fe-card-head">
                        <span class="fe-card-title">Copertina & Hotspot</span>
                    </div>
                    <label for="admin-image-file" class="fe-upload-dropzone">
                        <div class="fe-dropzone-icon">📷</div>
                        <div class="fe-dropzone-text">
                            <strong>Carica Immagine</strong>
                            <span>Tocca per scegliere il file</span>
                        </div>
                    </label>
                    <div id="fe-slot-file-input" class="fe-hidden-file"></div>
                    <div id="fe-slot-url-input"></div>
                    <div id="fe-slot-hotspot-stage" style="margin-top: 12px;"></div>
                </div>

                <div id="fe-slot-extra-media"></div>
            </aside>
        `;

        // Spostamento campi negli slot
        studioLayout.querySelector("#fe-slot-title").appendChild(titleInput);
        studioLayout.querySelector("#fe-slot-excerpt").appendChild(excerptInput);
        studioLayout.querySelector("#fe-slot-content").appendChild(contentInput);
        studioLayout.querySelector("#fe-slot-category-hidden").appendChild(catSelect);
        studioLayout.querySelector("#fe-slot-file-input").appendChild(fileInput);
        studioLayout.querySelector("#fe-slot-url-input").appendChild(urlInput);
        studioLayout.querySelector("#fe-slot-hotspot-stage").appendChild(hotspotWorkspace);

        // Creazione Switch iOS
        const switchLabel = document.createElement("label");
        switchLabel.className = "fe-ios-switch-row";
        switchLabel.setAttribute("for", "admin-article-published");
        switchLabel.innerHTML = `
            <div class="fe-switch-text"><strong>Visibile nel sito</strong></div>
            <div class="fe-ios-switch-wrap"></div>
        `;
        switchLabel.querySelector(".fe-ios-switch-wrap").appendChild(publishCheckbox);
        const sliderSpan = document.createElement("span");
        sliderSpan.className = "fe-ios-slider";
        switchLabel.querySelector(".fe-ios-switch-wrap").appendChild(sliderSpan);
        studioLayout.querySelector("#fe-slot-publish-toggle").appendChild(switchLabel);

        // Bottoni Azione
        const actionsSlot = studioLayout.querySelector("#fe-slot-actions");
        actionsSlot.appendChild(btnSave);
        actionsSlot.appendChild(btnReset);

        // Sposta eventuali box extra (come "Foto Aggiuntive & Video" creati da app.js) nella sidebar e nasconde il vecchio markup
        const moveExtraBoxes = () => {
            Array.from(form.children).forEach(child => {
                if (child.tagName !== "INPUT" && child !== studioLayout) {
                    if (child.textContent.includes("Foto Aggiuntive") || child.querySelector("input[type='file']")) {
                        studioLayout.querySelector("#fe-slot-extra-media").appendChild(child);
                    } else {
                        child.style.display = "none";
                    }
                }
            });
        };
        moveExtraBoxes();
        form.appendChild(studioLayout);

        // Osservatore per catturare anche i blocchi che app.js inietta in ritardo
        const formObserver = new MutationObserver(() => moveExtraBoxes());
        formObserver.observe(form, { childList: true });

        // Bottoni formattazione rapida (Grassetto / H3)
        studioLayout.querySelector("#fe-btn-bold").addEventListener("click", () => {
            const start = contentInput.selectionStart;
            const end = contentInput.selectionEnd;
            const sel = contentInput.value.substring(start, end) || "testo in grassetto";
            contentInput.setRangeText(`**${sel}**`, start, end, "end");
            contentInput.focus();
        });
        studioLayout.querySelector("#fe-btn-h3").addEventListener("click", () => {
            const start = contentInput.selectionStart;
            const end = contentInput.selectionEnd;
            const sel = contentInput.value.substring(start, end) || "Titolo Paragrafo";
            contentInput.setRangeText(`\n### ${sel}\n`, start, end, "end");
            contentInput.focus();
        });

        // Sincronizzazione bottoni Categorie (Outfit, Novità, Articoli)
        const segBtns = studioLayout.querySelectorAll("#fe-cat-pills-ui .fe-seg-btn");
        const syncPills = (val) => {
            segBtns.forEach(b => b.classList.toggle("active", b.dataset.val === val));
        };
        segBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                catSelect.value = btn.dataset.val;
                catSelect.dispatchEvent(new Event("change", { bubbles: true }));
                syncPills(btn.dataset.val);
            });
        });
        catSelect.addEventListener("change", () => syncPills(catSelect.value));
        syncPills(catSelect.value || "Outfit");

        // Stato Online / Bozza
        const statusPill = studioLayout.querySelector("#fe-status-pill");
        const updateStatus = () => {
            statusPill.textContent = publishCheckbox.checked ? "Online" : "Bozza";
            statusPill.className = "fe-status-pill " + (publishCheckbox.checked ? "is-live" : "is-draft");
        };
        publishCheckbox.addEventListener("change", updateStatus);
        updateStatus();

        // Contatore parole
        const charCounter = studioLayout.querySelector("#fe-char-counter");
        const readTime = studioLayout.querySelector("#fe-read-time");
        const updateMetrics = () => {
            const text = (contentInput.value || "").trim();
            const words = text ? text.split(/\s+/).length : 0;
            charCounter.textContent = `${words} parole`;
            readTime.textContent = `${Math.max(1, Math.ceil(words / 200))} min`;
        };
        contentInput.addEventListener("input", updateMetrics);
        updateMetrics();

        // Nome file caricato
        fileInput.addEventListener("change", () => {
            const dropText = studioLayout.querySelector(".fe-dropzone-text strong");
            if (fileInput.files && fileInput.files[0] && dropText) {
                dropText.textContent = "✓ " + fileInput.files[0].name;
            }
        });
    };

    const boot = () => {
        injectStudioStyles();
        setupStudio();
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
