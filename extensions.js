/**
 * FUORI ETICHETTA - ESTENSIONI E MODIFICHE ESTERNE
 * Modulo 1: Convertitore Markdown per gli articoli
 */

function formatMarkdown(text) {
    if (!text) return '';
    
    // 1. Sicurezza: neutralizza i tag HTML pericolosi per evitare problemi
    let safeText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
        
    // 2. Converte il Grassetto (**testo**)
    safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 3. Converte i Titoli H3 (### testo)
    safeText = safeText.replace(/^###\s+(.*)$/gim, '<h3 style="margin-top: 32px; margin-bottom: 12px; font-size: 1.3rem; color: #1d1d1f;">$1</h3>');
    
    // 4. Gestisce i paragrafi e i ritorni a capo (singoli e doppi)
    const blocks = safeText.split(/\n\s*\n/);
    const htmlBlocks = blocks.map(block => {
        // Se il blocco è già diventato un Titolo, lo lasciamo intatto
        if (block.trim().startsWith('<h3')) {
            return block;
        }
        // Altrimenti lo trasformiamo in un paragrafo, convertendo gli "A Capo" singoli in veri <br>
        return `<p style="margin-bottom: 18px; line-height: 1.6;">${block.replace(/\n/g, '<br>')}</p>`;
    });
    
    return htmlBlocks.join('');
}

// Cerchiamo il box che contiene il testo dell'articolo
const articleContainer = document.getElementById('article-detail-content');

if (articleContainer) {
    // Creiamo un "Osservatore" che guarda il box in tempo reale
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            // Se app.js ha appena caricato il testo grezzo e nient'altro...
            if (articleContainer.childNodes.length === 1 && articleContainer.firstChild.nodeType === Node.TEXT_NODE) {
                const rawText = articleContainer.textContent;
                
                if (rawText.trim() !== '') {
                    // Lo traduciamo in HTML impaginato e lo sostituiamo all'istante
                    articleContainer.innerHTML = formatMarkdown(rawText);
                }
            }
        });
    });

    // Avviamo il nostro Osservatore invisibile
    observer.observe(articleContainer, { childList: true });
}
document.addEventListener("DOMContentLoaded", () => {
    // 1. Correzione Categorie nel Pannello Admin
    const adminCategory = document.getElementById("admin-article-category");
    if (adminCategory) {
        adminCategory.innerHTML = `
            <option value="Outfit">Outfit</option>
            <option value="Novità">Novità</option>
            <option value="Articoli">Articoli</option>
        `;
    }

    // 2. Correzione Categorie nel Menu Pubblico in alto
    const publicNav = document.querySelector(".category-nav");
    if (publicNav) {
        publicNav.innerHTML = `
            <button class="cat-pill active" data-category="all">Tutti</button>
            <button class="cat-pill" data-category="Outfit">Outfit</button>
            <button class="cat-pill" data-category="Novità">Novità</button>
            <button class="cat-pill" data-category="Articoli">Articoli</button>
        `;
    }
/* ==========================================================================
   FUORI ETICHETTA — STUDIO EDITORIALE PRO (BENTO 2-COLUMN REDESIGN)
   ========================================================================== */
(function initFuoriEtichettaStudioPro() {
    const setupStudio = () => {
        // 1. AGGIORNAMENTO CATEGORIE (Outfit, Novità, Articoli) SENZA ROMPERE GLI EVENTI DI APP.JS
        const adminCatSelect = document.getElementById("admin-article-category");
        if (adminCatSelect) {
            adminCatSelect.innerHTML = `
                <option value="Outfit">Outfit</option>
                <option value="Novità">Novità</option>
                <option value="Articoli">Articoli</option>
            `;
        }

        // Aggiorniamo i bottoni della Homepage modificando quelli esistenti (così mantengono il click listener di app.js!)
        const navPills = document.querySelectorAll(".category-nav .cat-pill");
        if (navPills.length >= 4) {
            // Pill 0 = Tutti, Pill 1 = Outfit, Pill 2 = Novità
            navPills[3].setAttribute("data-category", "Articoli");
            navPills[3].textContent = "Articoli";
            if (navPills[4]) navPills[4].style.display = "none"; // Nasconde "Consigli" senza rompere il DOM
        }

        // 2. TRASFORMAZIONE STRUTTURALE DEL FORM IN "STUDIO 2 COLONNE"
        const form = document.getElementById("form-admin-article");
        if (!form || form.dataset.studioUpgraded === "true") return;
        form.dataset.studioUpgraded = "true";

        // Recuperiamo gli elementi originali (non ne cancelliamo nessuno per non rompere app.js)
        const titleInput = document.getElementById("admin-article-title");
        const catSelect = document.getElementById("admin-article-category");
        const excerptInput = document.getElementById("admin-article-excerpt");
        const contentInput = document.getElementById("admin-article-content");
        const fileInput = document.getElementById("admin-image-file");
        const urlInput = document.getElementById("admin-image-url");
        const hotspotWorkspace = document.getElementById("admin-hotspot-workspace");
        const publishCheckbox = document.getElementById("admin-article-published");
        const btnReset = document.getElementById("btn-reset-article-form");
        const btnSave = document.getElementById("btn-save-article");

        // Modifica testi e placeholder per un tono più "Pro"
        if (titleInput) titleInput.placeholder = "Inserisci un titolo d'impatto...";
        if (excerptInput) excerptInput.placeholder = "Sottotitolo editoriale o sintesi per l'anteprima in catalogo (max 220 caratteri)...";
        if (contentInput) contentInput.placeholder = "Inizia a scrivere l'articolo qui...\n\nUsa invio per separare i paragrafi e dare respiro alla lettura.";
        if (btnSave) btnSave.innerHTML = `<span>Pubblica Contenuto</span>`;
        if (btnReset) btnReset.innerHTML = `<span>Ripristina</span>`;

        // Creiamo lo scheletro della nuova Dashboard a 2 colonne dentro il form
        const studioLayout = document.createElement("div");
        studioLayout.className = "fe-studio-grid";

        studioLayout.innerHTML = `
            <!-- COLONNA SINISTRA: FOGLIO DI SCRITTURA -->
            <div class="fe-studio-main">
                <div class="fe-studio-paper">
                    <div class="fe-paper-header">
                        <span class="fe-paper-badge">EDITOR PRINCIPALE</span>
                        <div class="fe-word-metrics">
                            <span id="fe-char-counter">0 caratteri</span>
                            <span class="fe-metric-sep">•</span>
                            <span id="fe-read-time">~1 min di lettura</span>
                        </div>
                    </div>
                    <div id="fe-slot-title" class="fe-slot-title"></div>
                    <div id="fe-slot-excerpt" class="fe-slot-excerpt"></div>
                    <div class="fe-paper-divider"></div>
                    <div id="fe-slot-content" class="fe-slot-content"></div>
                </div>
                <!-- Slot per eventuali estensioni extra (es. gallerie/video Opzione B) -->
                <div id="fe-slot-extensions"></div>
            </div>

            <!-- COLONNA DESTRA: INSPECTOR & CONTROLLI -->
            <aside class="fe-studio-sidebar">
                <!-- Card 1: Pubblicazione & Stato -->
                <div class="fe-inspector-card fe-card-publish">
                    <div class="fe-card-head">
                        <span class="fe-card-title">Stato e Visibilità</span>
                        <span id="fe-status-pill" class="fe-status-pill is-live">Online</span>
                    </div>
                    <div id="fe-slot-publish-toggle" class="fe-toggle-row"></div>
                    <div id="fe-slot-actions" class="fe-actions-stack"></div>
                </div>

                <!-- Card 2: Formato & Categoria -->
                <div class="fe-inspector-card">
                    <div class="fe-card-head">
                        <span class="fe-card-title">Formato Contenuto</span>
                    </div>
                    <p class="fe-card-sub">Seleziona la sezione del catalogo in cui pubblicare:</p>
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

                <!-- Card 3: Media & Shop The Look -->
                <div class="fe-inspector-card">
                    <div class="fe-card-head">
                        <span class="fe-card-title">Copertina & Hotspot</span>
                        <span class="fe-card-tag">Shop the Look</span>
                    </div>
                    <label for="admin-image-file" class="fe-upload-dropzone" id="fe-visual-dropzone">
                        <div class="fe-dropzone-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                                <rect x="3" y="3" width="18" height="18" rx="4"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <path d="M21 15l-5-5L5 21"></path>
                            </svg>
                        </div>
                        <div class="fe-dropzone-text">
                            <strong>Carica foto da dispositivo</strong>
                            <span>Tocca per scegliere da Libreria o File</span>
                        </div>
                    </label>
                    <div id="fe-slot-file-input" class="fe-hidden-file"></div>
                    <div class="fe-url-box">
                        <span class="fe-url-label">Oppure usa link diretto:</span>
                        <div id="fe-slot-url-input"></div>
                    </div>
                    <div class="fe-hotspot-tip">
                        <span>🎯</span>
                        <p>Dopo aver caricato la foto, <strong>tocca sui capi nell'anteprima</strong> qui sotto per fissare i tag di acquisto.</p>
                    </div>
                    <div id="fe-slot-hotspot-stage"></div>
                </div>
            </aside>
        `;

        // Spostiamo gli input reali dentro gli slot del nuovo layout
        studioLayout.querySelector("#fe-slot-title").appendChild(titleInput);
        studioLayout.querySelector("#fe-slot-excerpt").appendChild(excerptInput);
        studioLayout.querySelector("#fe-slot-content").appendChild(contentInput);
        studioLayout.querySelector("#fe-slot-category-hidden").appendChild(catSelect);
        studioLayout.querySelector("#fe-slot-file-input").appendChild(fileInput);
        studioLayout.querySelector("#fe-slot-url-input").appendChild(urlInput);
        studioLayout.querySelector("#fe-slot-hotspot-stage").appendChild(hotspotWorkspace);

        // Costruiamo uno switch moderno per la checkbox "Pubblica immediatamente"
        const toggleContainer = studioLayout.querySelector("#fe-slot-publish-toggle");
        const switchLabel = document.createElement("label");
        switchLabel.className = "fe-ios-switch-row";
        switchLabel.setAttribute("for", "admin-article-published");
        switchLabel.innerHTML = `
            <div class="fe-switch-text">
                <strong>Pubblica subito</strong>
                <span>Rendi subito visibile nel catalogo</span>
            </div>
            <div class="fe-ios-switch-wrap"></div>
        `;
        switchLabel.querySelector(".fe-ios-switch-wrap").appendChild(publishCheckbox);
        const sliderSpan = document.createElement("span");
        sliderSpan.className = "fe-ios-slider";
        switchLabel.querySelector(".fe-ios-switch-wrap").appendChild(sliderSpan);
        toggleContainer.appendChild(switchLabel);

        // Spostiamo i bottoni Salva e Reset
        const actionsSlot = studioLayout.querySelector("#fe-slot-actions");
        actionsSlot.appendChild(btnSave);
        actionsSlot.appendChild(btnReset);

        // Nascondiamo i vecchi contenitori vuoti rimasti nel form e aggiungiamo la nuova griglia
        Array.from(form.children).forEach(child => {
            if (child.tagName !== "INPUT" && child !== studioLayout) {
                // Se ci sono blocchi iniettati da altri script (es. media extra), li spostiamo sotto il foglio
                if (child.id && !child.classList.contains("form-group") && !child.classList.contains("form-row-2") && !child.classList.contains("admin-form-actions")) {
                    studioLayout.querySelector("#fe-slot-extensions").appendChild(child);
                } else {
                    child.style.display = "none";
                }
            }
        });
        form.appendChild(studioLayout);

        // 3. INTERATTIVITÀ STUDIO: PILLOLE CATEGORIA SINCRONIZZATE COL SELECT
        const segBtns = studioLayout.querySelectorAll("#fe-cat-pills-ui .fe-seg-btn");
        const syncCategoryPills = (val) => {
            segBtns.forEach(b => b.classList.toggle("active", b.dataset.val === val));
        };
        segBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                catSelect.value = btn.dataset.val;
                catSelect.dispatchEvent(new Event("change", { bubbles: true }));
                syncCategoryPills(btn.dataset.val);
            });
        });
        catSelect.addEventListener("change", () => syncCategoryPills(catSelect.value));
        syncCategoryPills(catSelect.value || "Outfit");

        // 4. INTERATTIVITÀ: BADGE STATO ONLINE / BOZZA
        const statusPill = studioLayout.querySelector("#fe-status-pill");
        const updateStatusBadge = () => {
            if (publishCheckbox.checked) {
                statusPill.textContent = "Pubblico";
                statusPill.className = "fe-status-pill is-live";
            } else {
                statusPill.textContent = "Bozza Privata";
                statusPill.className = "fe-status-pill is-draft";
            }
        };
        publishCheckbox.addEventListener("change", updateStatusBadge);
        updateStatusBadge();

        // 5. CONTATORE PAROLE & TEMPO DI LETTURA LIVE + AUTO-RESIZE
        const charCounter = studioLayout.querySelector("#fe-char-counter");
        const readTime = studioLayout.querySelector("#fe-read-time");
        const updateMetrics = () => {
            const text = (contentInput.value || "").trim();
            const chars = text.length;
            const words = text ? text.split(/\s+/).length : 0;
            const mins = Math.max(1, Math.ceil(words / 200));
            charCounter.textContent = `${words} parole · ${chars} car.`;
            readTime.textContent = `~${mins} min lettura`;
        };
        contentInput.addEventListener("input", updateMetrics);
        updateMetrics();

        // Feedback visivo quando selezioni un file dal telefono/PC
        fileInput.addEventListener("change", () => {
            const dropText = studioLayout.querySelector(".fe-dropzone-text strong");
            if (fileInput.files && fileInput.files[0] && dropText) {
                dropText.textContent = "✓ " + fileInput.files[0].name;
            }
        });
    };

    // 6. FOGLIO DI STILE PREMIUM (BENTO STUDIO UI)
    const injectStudioStyles = () => {
        if (document.getElementById("fe-studio-pro-css")) return;
        const style = document.createElement("style");
        style.id = "fe-studio-pro-css";
        style.textContent = `
            /* Sfondo generale e Header Admin */
            #view-admin {
                max-width: 1280px !important;
                margin: 0 auto !important;
                padding: 28px 20px 80px !important;
            }
            #view-admin .admin-top-bar {
                background: #111113 !important;
                color: #ffffff !important;
                padding: 24px 28px !important;
                border-radius: 20px !important;
                margin-bottom: 24px !important;
                box-shadow: 0 12px 32px rgba(0,0,0,0.12) !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
            }
            #view-admin .admin-top-bar .catalog-title {
                color: #ffffff !important;
                font-size: 1.45rem !important;
                letter-spacing: -0.02em !important;
                margin-bottom: 4px !important;
            }
            #view-admin .admin-top-bar .catalog-subtitle {
                color: #a1a1aa !important;
                font-size: 0.9rem !important;
                margin: 0 !important;
            }
            #view-admin #btn-close-admin {
                background: rgba(255,255,255,0.12) !important;
                color: #ffffff !important;
                border: 1px solid rgba(255,255,255,0.18) !important;
                border-radius: 12px !important;
                padding: 10px 18px !important;
                font-weight: 600 !important;
                backdrop-filter: blur(10px) !important;
            }
            #view-admin #btn-close-admin:hover {
                background: rgba(255,255,255,0.22) !important;
            }

            /* Barra Navigazione Tabs in stile macOS Segmented Control */
            #view-admin .admin-tabs {
                background: #e4e4e7 !important;
                padding: 5px !important;
                border-radius: 14px !important;
                display: inline-flex !important;
                gap: 4px !important;
                margin-bottom: 28px !important;
                border: none !important;
                flex-wrap: wrap !important;
            }
            #view-admin .admin-tab {
                border: none !important;
                background: transparent !important;
                color: #52525b !important;
                font-weight: 600 !important;
                font-size: 0.88rem !important;
                padding: 10px 18px !important;
                border-radius: 10px !important;
                transition: all 0.2s ease !important;
            }
            #view-admin .admin-tab.active {
                background: #ffffff !important;
                color: #111113 !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important;
            }

            /* Reset del vecchio contenitore form */
            #form-admin-article {
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                max-width: 100% !important;
            }

            /* GRIGLIA BENTO A 2 COLONNE */
            .fe-studio-grid {
                display: grid;
                grid-template-columns: minmax(0, 1fr) 380px;
                gap: 24px;
                align-items: start;
            }

            /* COLONNA SINISTRA: FOGLIO DI SCRITTURA */
            .fe-studio-paper {
                background: #ffffff;
                border: 1px solid #e4e4e7;
                border-radius: 22px;
                padding: 36px 42px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.03);
            }
            .fe-paper-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
                padding-bottom: 14px;
                border-bottom: 1px solid #f4f4f5;
            }
            .fe-paper-badge {
                font-size: 0.72rem;
                font-weight: 700;
                letter-spacing: 0.08em;
                color: #71717a;
                background: #f4f4f5;
                padding: 5px 10px;
                border-radius: 6px;
            }
            .fe-word-metrics {
                font-size: 0.8rem;
                color: #a1a1aa;
                font-weight: 500;
            }
            .fe-metric-sep { margin: 0 6px; }

            /* Input Titolo, Sottotitolo e Corpo */
            #admin-article-title {
                width: 100% !important;
                font-size: 2.1rem !important;
                font-weight: 800 !important;
                letter-spacing: -0.03em !important;
                line-height: 1.2 !important;
                border: none !important;
                background: transparent !important;
                padding: 0 !important;
                margin-bottom: 16px !important;
                color: #111113 !important;
                box-shadow: none !important;
                outline: none !important;
            }
            #admin-article-title::placeholder { color: #d4d4d8 !important; font-weight: 700 !important; }

            #admin-article-excerpt {
                width: 100% !important;
                font-size: 1.05rem !important;
                font-weight: 500 !important;
                color: #52525b !important;
                border: none !important;
                border-left: 3px solid #111113 !important;
                border-radius: 0 !important;
                background: #fafafa !important;
                padding: 10px 14px !important;
                margin-bottom: 24px !important;
                box-shadow: none !important;
                outline: none !important;
            }

            .fe-paper-divider {
                height: 1px;
                background: linear-gradient(to right, #e4e4e7 0%, transparent 100%);
                margin-bottom: 24px;
            }

            #admin-article-content {
                width: 100% !important;
                min-height: 520px !important;
                font-size: 1.08rem !important;
                line-height: 1.75 !important;
                color: #18181b !important;
                border: none !important;
                background: transparent !important;
                padding: 0 !important;
                box-shadow: none !important;
                outline: none !important;
                resize: vertical !important;
            }

            /* COLONNA DESTRA: SIDEBAR INSPECTOR */
            .fe-studio-sidebar {
                display: flex;
                flex-direction: column;
                gap: 18px;
                position: sticky;
                top: 88px;
            }
            .fe-inspector-card {
                background: #ffffff;
                border: 1px solid #e4e4e7;
                border-radius: 20px;
                padding: 22px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.03);
            }
            .fe-card-head {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 14px;
            }
            .fe-card-title {
                font-size: 0.92rem;
                font-weight: 700;
                color: #111113;
                letter-spacing: -0.01em;
            }
            .fe-card-sub {
                font-size: 0.82rem;
                color: #71717a;
                margin: -6px 0 12px 0;
            }
            .fe-card-tag {
                font-size: 0.7rem;
                font-weight: 700;
                text-transform: uppercase;
                background: #f4f4f5;
                color: #3f3f46;
                padding: 4px 8px;
                border-radius: 6px;
            }

            /* Pillola Stato Online / Bozza */
            .fe-status-pill {
                font-size: 0.75rem;
                font-weight: 700;
                padding: 4px 10px;
                border-radius: 999px;
                display: inline-flex;
                align-items: center;
                gap: 5px;
            }
            .fe-status-pill::before {
                content: "";
                width: 6px;
                height: 6px;
                border-radius: 50%;
            }
            .fe-status-pill.is-live {
                background: #dcfce7;
                color: #15803d;
            }
            .fe-status-pill.is-live::before { background: #16a34a; }
            .fe-status-pill.is-draft {
                background: #fef3c7;
                color: #b45309;
            }
            .fe-status-pill.is-draft::before { background: #d97706; }

            /* Switch iOS per Pubblicazione */
            .fe-ios-switch-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #fafafa;
                border: 1px solid #f4f4f5;
                padding: 12px 14px;
                border-radius: 12px;
                cursor: pointer;
                margin-bottom: 16px;
            }
            .fe-switch-text strong {
                display: block;
                font-size: 0.86rem;
                color: #18181b;
            }
            .fe-switch-text span {
                font-size: 0.75rem;
                color: #71717a;
            }
            .fe-ios-switch-wrap {
                position: relative;
                width: 44px;
                height: 26px;
                flex-shrink: 0;
            }
            .fe-ios-switch-wrap input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            .fe-ios-slider {
                position: absolute;
                inset: 0;
                background-color: #d4d4d8;
                border-radius: 34px;
                transition: 0.25s;
            }
            .fe-ios-slider::before {
                position: absolute;
                content: "";
                height: 20px;
                width: 20px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                border-radius: 50%;
                transition: 0.25s;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            .fe-ios-switch-wrap input:checked + .fe-ios-slider {
                background-color: #111113;
            }
            .fe-ios-switch-wrap input:checked + .fe-ios-slider::before {
                transform: translateX(18px);
            }

            /* Bottoni Azione Salva / Reset */
            .fe-actions-stack {
                display: grid;
                grid-template-columns: 1fr auto;
                gap: 10px;
            }
            #btn-save-article {
                background: #111113 !important;
                color: #ffffff !important;
                border: none !important;
                border-radius: 12px !important;
                padding: 13px 18px !important;
                font-weight: 700 !important;
                font-size: 0.92rem !important;
                cursor: pointer !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.12) !important;
                transition: transform 0.15s ease, background 0.15s ease !important;
            }
            #btn-save-article:hover { background: #27272a !important; }
            #btn-save-article:active { transform: scale(0.98) !important; }

            #btn-reset-article-form {
                background: #f4f4f5 !important;
                color: #52525b !important;
                border: none !important;
                border-radius: 12px !important;
                padding: 13px 14px !important;
                font-weight: 600 !important;
                font-size: 0.85rem !important;
            }

            /* Selettore Categorie a Pillole */
            .fe-cat-segmented {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
            }
            .fe-seg-btn {
                background: #fafafa;
                border: 1.5px solid #e4e4e7;
                border-radius: 12px;
                padding: 11px 8px;
                font-size: 0.85rem;
                font-weight: 600;
                color: #52525b;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                transition: all 0.18s ease;
            }
            .fe-seg-dot {
                width: 7px;
                height: 7px;
                border-radius: 50%;
                background: #d4d4d8;
            }
            .fe-seg-btn.active {
                background: #111113;
                border-color: #111113;
                color: #ffffff;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .fe-seg-btn.active .fe-seg-dot {
                background: #22c55e;
            }

            /* Dropzone Upload Foto */
            .fe-upload-dropzone {
                display: flex;
                align-items: center;
                gap: 14px;
                background: #fafafa;
                border: 1.5px dashed #d4d4d8;
                border-radius: 14px;
                padding: 16px;
                cursor: pointer;
                transition: all 0.2s ease;
                margin-bottom: 14px;
            }
            .fe-upload-dropzone:hover {
                border-color: #111113;
                background: #f4f4f5;
            }
            .fe-dropzone-icon {
                width: 44px;
                height: 44px;
                border-radius: 10px;
                background: #ffffff;
                border: 1px solid #e4e4e7;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #111113;
                flex-shrink: 0;
            }
            .fe-dropzone-text strong {
                display: block;
                font-size: 0.86rem;
                color: #18181b;
                margin-bottom: 2px;
            }
            .fe-dropzone-text span {
                font-size: 0.76rem;
                color: #71717a;
            }
            .fe-hidden-file input[type="file"] {
                display: none !important;
            }

            .fe-url-box {
                margin-bottom: 14px;
            }
            .fe-url-label {
                display: block;
                font-size: 0.76rem;
                font-weight: 600;
                color: #71717a;
                margin-bottom: 6px;
            }
            #admin-image-url {
                width: 100% !important;
                font-size: 0.85rem !important;
                padding: 10px 12px !important;
                border-radius: 10px !important;
                border: 1px solid #e4e4e7 !important;
                background: #fafafa !important;
            }

            .fe-hotspot-tip {
                display: flex;
                align-items: flex-start;
                gap: 8px;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                padding: 10px 12px;
                margin-bottom: 14px;
            }
            .fe-hotspot-tip p {
                margin: 0;
                font-size: 0.78rem;
                line-height: 1.4;
                color: #475569;
            }

            /* Mobile & iPhone Optimization */
            @media (max-width: 960px) {
                .fe-studio-grid {
                    grid-template-columns: 1fr;
                }
                .fe-studio-sidebar {
                    position: static;
                }
                .fe-studio-paper {
                    padding: 24px 20px;
                }
                #admin-article-title {
                    font-size: 1.65rem !important;
                }
                #view-admin .admin-top-bar {
                    flex-direction: column !important;
                    align-items: flex-start !important;
                    gap: 14px !important;
                }
            }
        `;
        document.head.appendChild(style);
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            injectStudioStyles();
            setupStudio();
        });
    } else {
        injectStudioStyles();
        setupStudio();
    }
})();
