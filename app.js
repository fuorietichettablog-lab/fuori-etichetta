/**
 * ============================================================================
 * FUORI ETICHETTA — CORE APPLICATION LOGIC (SUPABASE FULL-STACK)
 * Versione completa con:
 * - Opzione A (Carosello stile Instagram per categoria "Outfit")
 * - Opzione B (Galleria Foto + Player Video sotto l'articolo per "Novità", "Trend", "Consigli")
 * - Retrocompatibilità totale col DB Supabase senza bisogno di nuove colonne
 * ============================================================================
 */

const SUPABASE_URL = 'https://obgewehjfngyppzkwgdd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1XyAu_ImadBP_EYVOliNnw_WDaf7enC';

// Inizializzazione unica del Client Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Stato Globale dell'Applicazione
const state = {
    currentUser: null,
    currentProfile: null,
    isAdmin: false,
    isCollaborator: false,
    settings: { require_collaborator_approval: true },
    articles: [],
    currentCategory: 'all',
    searchQuery: '',
    activeArticle: null,
    editorHotspots: [],      // Cerchietti sui vestiti (Slide 1)
    editorGallery: [],       // URL delle foto aggiuntive
    editorVideoUrl: '',      // URL del video (YouTube, Vimeo o MP4 su Supabase)
    pendingHotspotCoords: null,
    carouselIndex: 0,
    carouselSlides: []
};

// ============================================================================
// UTILITÀ DI SICUREZZA, FORMATTAZIONE E PARSING MEDIA
// ============================================================================

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDate(dateString) {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function generateSlug(title) {
    const base = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    return `${base}-${Date.now().toString().slice(-5)}`;
}

function getDefaultAvatar(name) {
    const initial = (name || 'U').trim().charAt(0).toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
        <rect width="100%" height="100%" fill="#1D1D1F"/>
        <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#FFFFFF" font-family="Inter, sans-serif" font-size="34" font-weight="600">${escapeHTML(initial)}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3800);
}


function isActiveCollaborator() {
    return Boolean(
        state.currentUser &&
        state.currentProfile &&
        state.currentProfile.role === 'collaborator' &&
        state.currentProfile.collaborator_enabled === true &&
        !state.currentProfile.is_banned
    );
}

function canAccessEditorialPanel() {
    return state.isAdmin || isActiveCollaborator();
}

function collaboratorCanPublishDirectly() {
    if (!isActiveCollaborator()) return false;
    return state.currentProfile.can_publish_without_approval === true ||
        state.settings.require_collaborator_approval === false;
}

function getArticleStatusLabel(article) {
    if (article?.approval_status === 'pending') return 'In revisione';
    if (article?.published) return 'Pubblicato';
    if (article?.approval_status === 'approved') return 'Approvato · non pubblicato';
    return 'Bozza';
}

async function loadEditorialSettings() {
    state.settings = { require_collaborator_approval: true };
    if (!state.currentUser) return;

    const { data, error } = await supabaseClient
        .from('editorial_settings')
        .select('require_collaborator_approval')
        .eq('id', 1)
        .maybeSingle();

    if (!error && data) {
        state.settings.require_collaborator_approval = data.require_collaborator_approval !== false;
    }
}

function applyEditorialPanelRoleUI() {
    const btnOpenAdmin = document.getElementById('btn-open-admin');
    const panelTitle = document.getElementById('admin-panel-title');
    const panelSubtitle = document.getElementById('admin-panel-subtitle');
    const publishControl = document.getElementById('admin-publish-control');
    const collaboratorHint = document.getElementById('collaborator-submit-hint');
    const saveButton = document.getElementById('btn-save-article');
    const deleteCurrent = document.getElementById('btn-delete-current-article');
    const manageArticlesTab = document.getElementById('tab-manage-articles-btn');

    document.querySelectorAll('[data-admin-only="true"]').forEach((el) => {
        el.classList.toggle('hidden', !state.isAdmin);
    });

    if (state.isAdmin) {
        if (btnOpenAdmin) btnOpenAdmin.querySelector('span:first-child').textContent = 'Admin';
        if (panelTitle) panelTitle.textContent = 'Pannello di Controllo Admin';
        if (panelSubtitle) panelSubtitle.textContent = 'Pubblica articoli, gestisci collaboratori e modera la community.';
        if (publishControl) publishControl.classList.remove('hidden');
        if (collaboratorHint) collaboratorHint.classList.add('hidden');
        if (deleteCurrent) deleteCurrent.classList.remove('hidden');
        if (manageArticlesTab) manageArticlesTab.textContent = 'Tutti gli Articoli';
    } else if (isActiveCollaborator()) {
        if (btnOpenAdmin) btnOpenAdmin.querySelector('span:first-child').textContent = 'Area Collaboratore';
        if (panelTitle) panelTitle.textContent = 'Area Collaboratore';
        if (panelSubtitle) panelSubtitle.textContent = 'Scrivi e modifica i tuoi articoli. Non puoi eliminare articoli.';
        if (publishControl) publishControl.classList.add('hidden');
        if (collaboratorHint) {
            collaboratorHint.classList.remove('hidden');
            collaboratorHint.innerHTML = collaboratorCanPublishDirectly()
                ? '<strong>Pubblicazione diretta abilitata.</strong> Quando salvi, il tuo articolo viene pubblicato online.'
                : '<strong>Approvazione richiesta.</strong> Quando salvi, l\'articolo viene inviato all\'admin e resta offline finché non viene approvato.';
        }
        if (saveButton) saveButton.textContent = collaboratorCanPublishDirectly() ? 'Pubblica articolo' : 'Invia per approvazione';
        if (deleteCurrent) deleteCurrent.classList.add('hidden');
        if (manageArticlesTab) manageArticlesTab.textContent = 'I miei Articoli';

        const activeAdminOnlyContent = document.querySelector('.admin-tab-content[data-admin-only="true"]:not(.hidden)');
        if (activeAdminOnlyContent) {
            document.querySelectorAll('.admin-tab').forEach((t) => t.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach((c) => c.classList.add('hidden'));
            document.querySelector('[data-tab="tab-editor"]')?.classList.add('active');
            document.getElementById('tab-editor')?.classList.remove('hidden');
        }
    }

    window.dispatchEvent(new CustomEvent('fe-role-change'));
}

function isAtLeast16YearsOld(birthDateString) {
    if (!birthDateString) return false;
    const birth = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age >= 16;
}

/**
 * Estrae in modo sicuro Cerchietti (pins), Foto Extra (gallery) e Video (videoUrl)
 * dal campo JSON `hotspots` del database (o da colonne dedicate se presenti).
 */
function parseArticleMedia(article) {
    const raw = Array.isArray(article?.hotspots) ? article.hotspots : [];
    const pins = [];
    const gallery = [];
    let videoUrl = article?.video_url || '';

    raw.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        if (item.type === 'media_photo' && item.url) {
            gallery.push(item.url);
        } else if (item.type === 'media_video' && item.url) {
            videoUrl = item.url;
        } else if (typeof item.x === 'number' && typeof item.y === 'number') {
            pins.push(item);
        }
    });

    if (Array.isArray(article?.extra_images)) {
        article.extra_images.forEach((url) => {
            if (url && !gallery.includes(url)) gallery.push(url);
        });
    }

    return { pins, gallery, videoUrl };
}

/**
 * Impacchetta Cerchietti + Foto Extra + Video dentro l'array JSON `hotspots`
 * così Supabase lo salva senza richiedere nuove colonne SQL.
 */
function packArticleMedia(pins, gallery, videoUrl) {
    const packed = [];
    (pins || []).forEach((p) => {
        packed.push({
            x: Number(p.x),
            y: Number(p.y),
            label: p.label,
            url: p.url
        });
    });
    (gallery || []).forEach((url) => {
        if (url && typeof url === 'string') {
            packed.push({ type: 'media_photo', url: url.trim() });
        }
    });
    if (videoUrl && typeof videoUrl === 'string' && videoUrl.trim() !== '') {
        packed.push({ type: 'media_video', url: videoUrl.trim() });
    }
    return packed;
}

/**
 * Costruisce il player HTML per qualsiasi URL video (YouTube, Shorts, Vimeo o file MP4/WebM/MOV)
 */
function buildVideoPlayerHTML(videoUrl) {
    if (!videoUrl) return '';
    const cleanUrl = videoUrl.trim();

    // Riconoscimento YouTube (watch?v=, youtu.be/, shorts/)
    const ytMatch = cleanUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch && ytMatch[1]) {
        return `
            <div class="fe-video-Frame">
                <iframe src="https://www.youtube.com/embed/${escapeHTML(ytMatch[1])}?rel=0" 
                        title="Video Articolo" frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen></iframe>
            </div>`;
    }

    // Riconoscimento Vimeo
    const vimeoMatch = cleanUrl.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) {
        return `
            <div class="fe-video-Frame">
                <iframe src="https://player.vimeo.com/video/${escapeHTML(vimeoMatch[1])}" 
                        title="Video Articolo" frameborder="0" 
                        allow="autoplay; fullscreen; picture-in-picture" 
                        allowfullscreen></iframe>
            </div>`;
    }

    // File video diretto (.mp4, .webm, .mov caricato su Supabase o link diretto)
    return `
        <div class="fe-video-Direct">
            <video src="${escapeHTML(cleanUrl)}" controls playsinline preload="metadata" class="fe-native-video"></video>
        </div>`;
}

// Compressione automatica immagini in WebP per risparmiare spazio gratuito su Supabase
async function compressImageFile(file, maxWidth = 1400, quality = 0.82) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    (blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error('Errore durante la compressione immagine'));
                    },
                    'image/webp',
                    quality
                );
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

async function uploadMediaToSupabase(file, folder = 'articles') {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Formato immagine non supportato. Usa JPG, PNG, WebP o GIF.');
    }
    if (file.size > 12 * 1024 * 1024) {
        throw new Error('Immagine troppo grande (massimo 12 MB).');
    }

    const compressedBlob = await compressImageFile(file, folder === 'avatars' ? 400 : 1400);
    const ownerFolder = state.currentUser?.id;
    if (!ownerFolder) throw new Error('Devi essere autenticato per caricare file.');
    const fileName = `${ownerFolder}/${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.webp`;

    const { error } = await supabaseClient.storage
        .from('media')
        .upload(fileName, compressedBlob, { contentType: 'image/webp', upsert: false });

    if (error) throw error;

    const { data } = supabaseClient.storage.from('media').getPublicUrl(fileName);
    return data.publicUrl;
}

async function uploadVideoToSupabase(file) {
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedVideoTypes.includes(file.type)) {
        throw new Error('Formato video non supportato. Usa file MP4, WebM o MOV.');
    }
    // Limite prudenziale di 20 MB per non esaurire il piano gratuito di Supabase
    if (file.size > 20 * 1024 * 1024) {
        throw new Error('Il video supera i 20 MB. Per video lunghi/pesanti caricali su YouTube e incolla il link qui sotto!');
    }

    const ext = file.name.split('.').pop().toLowerCase() || 'mp4';
    const ownerFolder = state.currentUser?.id;
    if (!ownerFolder) throw new Error('Devi essere autenticato per caricare video.');
    const fileName = `${ownerFolder}/videos/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error } = await supabaseClient.storage
        .from('media')
        .upload(fileName, file, { contentType: file.type, upsert: false });

    if (error) throw error;

    const { data } = supabaseClient.storage.from('media').getPublicUrl(fileName);
    return data.publicUrl;
}

// ============================================================================
// INIEZIONE AUTOMATICA STILI E INTERFACCIA GALLERIA / CAROSELLO / VIDEO
// ============================================================================

function injectMultiMediaUIAndStyles() {
    // 1. Inietta il CSS per Carosello (Opzione A), Galleria + Video (Opzione B) e Lightbox
    if (!document.getElementById('fe-multimedia-styles')) {
        const style = document.createElement('style');
        style.id = 'fe-multimedia-styles';
        style.textContent = `
            /* Controlli Carosello Opzione A (Outfit) */
            .fe-carousel-btn {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                width: 42px;
                height: 42px;
                border-radius: 50%;
                background: rgba(29, 29, 31, 0.72);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                color: #fff;
                border: 1px solid rgba(255,255,255,0.25);
                font-size: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 25;
                transition: all 0.2s ease;
                user-select: none;
            }
            .fe-carousel-btn:hover {
                background: rgba(29, 29, 31, 0.92);
                transform: translateY(-50%) scale(1.06);
            }
            .fe-carousel-prev { left: 14px; }
            .fe-carousel-next { right: 14px; }
            .fe-carousel-counter {
                position: absolute;
                top: 14px;
                right: 14px;
                background: rgba(29, 29, 31, 0.75);
                backdrop-filter: blur(6px);
                color: #fff;
                padding: 4px 11px;
                border-radius: 20px;
                font-size: 0.78rem;
                font-weight: 600;
                z-index: 24;
            }
            .fe-carousel-dots {
                display: flex;
                justify-content: center;
                gap: 8px;
                margin-top: 12px;
            }
            .fe-carousel-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #D2D2D7;
                border: none;
                padding: 0;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .fe-carousel-dot.active {
                background: #1D1D1F;
                width: 22px;
                border-radius: 10px;
            }
            /* Video container dentro Carosello o Articolo */
            .fe-video-Frame {
                position: relative;
                width: 100%;
                padding-bottom: 56.25%;
                background: #000;
                border-radius: 16px;
                overflow: hidden;
            }
            .fe-video-Frame iframe {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border: 0;
            }
            .fe-video-Direct {
                width: 100%;
                background: #000;
                border-radius: 16px;
                overflow: hidden;
                display: flex;
                justify-content: center;
            }
            .fe-native-video {
                width: 100%;
                max-height: 640px;
                display: block;
            }
            /* Sezione Opzione B: Galleria & Video sotto il testo per Novità, Trend, Consigli */
            .fe-editorial-media-section {
                margin: 32px 0;
                padding-top: 24px;
                border-top: 1px solid rgba(0,0,0,0.08);
            }
            .fe-editorial-media-title {
                font-size: 1.15rem;
                font-weight: 700;
                margin-bottom: 16px;
                color: #1D1D1F;
            }
            .fe-editorial-gallery-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
                gap: 14px;
                margin-top: 16px;
            }
            .fe-editorial-gallery-item {
                border-radius: 14px;
                overflow: hidden;
                aspect-ratio: 4 / 5;
                background: #F5F5F7;
                cursor: zoom-in;
                border: 1px solid rgba(0,0,0,0.06);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            .fe-editorial-gallery-item:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 24px rgba(0,0,0,0.08);
            }
            .fe-editorial-gallery-item img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }
            /* Miniatura Admin Gallery */
            .fe-admin-extra-box {
                background: #F5F5F7;
                border-radius: 14px;
                padding: 16px;
                margin-top: 14px;
                border: 1px solid rgba(0,0,0,0.07);
            }
            .fe-admin-thumbs-grid {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-top: 12px;
            }
            .fe-admin-thumb-card {
                position: relative;
                width: 84px;
                height: 84px;
                border-radius: 10px;
                overflow: hidden;
                border: 1px solid rgba(0,0,0,0.12);
                background: #fff;
            }
            .fe-admin-thumb-card img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .fe-admin-thumb-remove {
                position: absolute;
                top: 4px;
                right: 4px;
                width: 22px;
                height: 22px;
                border-radius: 50%;
                background: rgba(215, 0, 21, 0.9);
                color: #fff;
                border: none;
                font-size: 13px;
                line-height: 1;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            /* Lightbox ingrandimento foto */
            .fe-lightbox-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.88);
                backdrop-filter: blur(8px);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                cursor: zoom-out;
            }
            .fe-lightbox-backdrop img {
                max-width: 95vw;
                max-height: 90vh;
                border-radius: 12px;
                object-fit: contain;
                box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            }
        `;
        document.head.appendChild(style);
    }

    // 2. Assicura i contenitori per Carosello (Opzione A) e Galleria/Video (Opzione B) nella Vista Articolo
    const imageStage = document.getElementById('article-image-stage');
    if (imageStage && !document.getElementById('fe-carousel-video-holder')) {
        imageStage.style.position = 'relative';

        const videoHolder = document.createElement('div');
        videoHolder.id = 'fe-carousel-video-holder';
        videoHolder.className = 'hidden';
        videoHolder.style.width = '100%';
        imageStage.appendChild(videoHolder);

        const prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.id = 'fe-carousel-prev';
        prevBtn.className = 'fe-carousel-btn fe-carousel-prev hidden';
        prevBtn.setAttribute('aria-label', 'Slide precedente');
        prevBtn.innerHTML = '&#10094;';
        imageStage.appendChild(prevBtn);

        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.id = 'fe-carousel-next';
        nextBtn.className = 'fe-carousel-btn fe-carousel-next hidden';
        nextBtn.setAttribute('aria-label', 'Slide successiva');
        nextBtn.innerHTML = '&#10095;';
        imageStage.appendChild(nextBtn);

        const counterBadge = document.createElement('div');
        counterBadge.id = 'fe-carousel-counter';
        counterBadge.className = 'fe-carousel-counter hidden';
        imageStage.appendChild(counterBadge);

        const dotsBar = document.createElement('div');
        dotsBar.id = 'fe-carousel-dots';
        dotsBar.className = 'fe-carousel-dots hidden';
        imageStage.parentNode.insertBefore(dotsBar, imageStage.nextSibling);
    }

    const articleContentEl = document.getElementById('article-detail-content');
    if (articleContentEl && !document.getElementById('fe-option-b-media-container')) {
        const optionBContainer = document.createElement('div');
        optionBContainer.id = 'fe-option-b-media-container';
        optionBContainer.className = 'fe-editorial-media-section hidden';
        articleContentEl.parentNode.insertBefore(optionBContainer, articleContentEl.nextSibling);
    }

    // 3. Assicura nel Pannello Admin i controlli per Foto Multiple e Video (se non già presenti nell'HTML)
    const workspace = document.getElementById('admin-hotspot-workspace');
    if (workspace && !document.getElementById('admin-extra-media-controls')) {
        const extraBox = document.createElement('div');
        extraBox.id = 'admin-extra-media-controls';
        extraBox.className = 'fe-admin-extra-box';
        extraBox.innerHTML = `
            <h4 style="margin:0 0 6px 0; font-size:0.95rem;">📸 Foto Aggiuntive & 🎬 Video dell'Articolo (Opzionale)</h4>
            <p class="field-help" style="margin-bottom:12px;">
                • Se la categoria è <strong>Outfit (Opzione A)</strong>: le foto extra e il video verranno mostrati in un <strong>Carosello sfogliabile</strong> insieme alla foto principale.<br>
                • Se la categoria è <strong>Novità, Trend o Consigli (Opzione B)</strong>: compariranno in una sezione <strong>Galleria & Video</strong> sotto il testo dell'articolo.
            </p>

            <!-- Caricamento Foto Multiple -->
            <div class="form-group" style="margin-bottom:14px;">
                <label style="font-weight:600; font-size:0.85rem;">Aggiungi altre foto (puoi selezionarne anche più di una insieme):</label>
                <div class="upload-controls" style="margin-top:6px;">
                    <input type="file" id="admin-extra-photos-file" accept="image/*" multiple class="input-file">
                    <span class="or-divider">oppure incolla URL foto extra:</span>
                    <div style="display:flex; gap:8px; width:100%;">
                        <input type="url" id="admin-extra-photo-url-input" class="input-field" placeholder="https://...">
                        <button type="button" id="btn-add-extra-photo-url" class="btn-secondary btn-sm" style="white-space:nowrap;">+ Aggiungi Foto</button>
                    </div>
                </div>
                <div id="admin-extra-photos-list" class="fe-admin-thumbs-grid"></div>
            </div>

            <!-- Caricamento o Link Video -->
            <div class="form-group" style="margin-bottom:0;">
                <label style="font-weight:600; font-size:0.85rem;">Video dell'articolo (Link YouTube / Vimeo / MP4 oppure carica breve clip max 20 MB):</label>
                <div class="upload-controls" style="margin-top:6px;">
                    <input type="url" id="admin-video-url" class="input-field" placeholder="Incolla link YouTube, Shorts, Vimeo o .mp4 diretto...">
                    <span class="or-divider">oppure carica file video (.mp4 / .mov):</span>
                    <input type="file" id="admin-video-file" accept="video/mp4,video/webm,video/quicktime" class="input-file">
                </div>
                <div id="admin-video-preview-status" class="field-help" style="margin-top:6px; color:#1D1D1F; font-weight:500;"></div>
            </div>
        `;
        workspace.parentNode.insertBefore(extraBox, workspace.nextSibling);
    }
}

function openImageLightbox(srcUrl) {
    const backdrop = document.createElement('div');
    backdrop.className = 'fe-lightbox-backdrop';
    backdrop.innerHTML = `<img src="${escapeHTML(srcUrl)}" alt="Ingrandimento">`;
    backdrop.addEventListener('click', () => backdrop.remove());
    document.body.appendChild(backdrop);
}

// ============================================================================
// INIZIALIZZAZIONE E AUTENTICAZIONE
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Imposta data massima nel calendario di registrazione (16 anni fa da oggi)
    const birthInput = document.getElementById('reg-birthdate');
    if (birthInput) {
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() - 16);
        birthInput.max = maxDate.toISOString().split('T')[0];
    }

    // 2. Inietta gli elementi grafici per Multi-Foto e Video e collega i pulsanti UI
    injectMultiMediaUIAndStyles();
    bindUIEvents();

    // 3. Verifica configurazione chiavi
    if (SUPABASE_URL.includes('INSERISCI_QUI')) {
        const loadingEl = document.getElementById('catalog-loading');
        if (loadingEl) {
            loadingEl.innerHTML = `
                <div class="admin-card" style="max-width:560px; margin:0 auto; text-align:left;">
                    <h3>⚙️ Configurazione Iniziale Richiesta</h3>
                    <p style="margin-top:8px;">Apri il file <strong>app.js</strong> e inserisci il tuo <code>SUPABASE_URL</code> e la tua <code>SUPABASE_ANON_KEY</code> nelle prime due righe per collegare il database.</p>
                </div>`;
        }
        return;
    }

    // 4. Carica sessione iniziale con gestione errori garantita
    try {
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError) {
            console.error('Errore lettura sessione:', sessionError);
        }
        await refreshUserSession(session?.user || null);
    } catch (err) {
        console.error('Errore imprevisto durante il recupero sessione:', err);
    }

    // 5. Listener per i cambi di stato successivi (login, logout, recupero password)
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === 'INITIAL_SESSION') return;
        if (event === 'PASSWORD_RECOVERY') {
            openAuthModal('update-password');
        }
        await refreshUserSession(session?.user || null);
    });

    // 6. Carica il catalogo articoli
    await loadCatalogArticles();
});

async function refreshUserSession(user) {
    state.currentUser = user;
    state.currentProfile = null;
    state.isAdmin = false;
    state.isCollaborator = false;
    state.settings = { require_collaborator_approval: true };

    const btnOpenAuth = document.getElementById('btn-open-auth');
    const btnOpenProfile = document.getElementById('btn-open-profile');
    const btnOpenAdmin = document.getElementById('btn-open-admin');

    if (!user) {
        btnOpenAuth.classList.remove('hidden');
        btnOpenProfile.classList.add('hidden');
        btnOpenAdmin.classList.add('hidden');
        updateCommentBoxVisibility();
        return;
    }

    try {
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error || !profile) {
            btnOpenAuth.classList.remove('hidden');
            btnOpenProfile.classList.add('hidden');
            btnOpenAdmin.classList.add('hidden');
            updateCommentBoxVisibility();
            return;
        }

        if (profile.is_banned) {
            await supabaseClient.auth.signOut();
            showToast('Il tuo account è stato sospeso dalla moderazione.');
            return;
        }

        state.currentProfile = profile;
        state.isAdmin = profile.role === 'admin';
        state.isCollaborator = profile.role === 'collaborator' && profile.collaborator_enabled === true;
        await loadEditorialSettings();

        btnOpenAuth.classList.add('hidden');
        btnOpenProfile.classList.remove('hidden');
        document.getElementById('header-user-name').textContent = profile.first_name;
        document.getElementById('header-user-avatar').src = profile.avatar_url || getDefaultAvatar(profile.first_name);

        if (canAccessEditorialPanel()) {
            btnOpenAdmin.classList.remove('hidden');
            if (state.isAdmin) refreshAdminReportBadge();
        } else {
            btnOpenAdmin.classList.add('hidden');
        }

        applyEditorialPanelRoleUI();
        updateCommentBoxVisibility();
    } catch (err) {
        console.error('Errore caricamento profilo utente:', err);
        btnOpenAuth.classList.remove('hidden');
        btnOpenProfile.classList.add('hidden');
        btnOpenAdmin.classList.add('hidden');
    }
}

// ============================================================================
// CATALOGO ARTICOLI (HOMEPAGE) E FILTRI ISTANTANEI
// ============================================================================

async function loadCatalogArticles() {
    const loadingEl = document.getElementById('catalog-loading');
    const gridEl = document.getElementById('articles-grid');
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (gridEl) gridEl.innerHTML = '';

    try {
        const { data: articles, error } = await supabaseClient
            .from('articles')
            .select(`
                *,
                article_likes(count),
                comments(count)
            `)
            .eq('published', true)
            .order('created_at', { ascending: false });

        if (error) {
            showToast('Errore nel caricamento degli articoli.');
            console.error('Errore query articoli:', error);
            state.articles = [];
        } else {
            state.articles = articles || [];
        }
    } catch (err) {
        showToast('Impossibile contattare il server degli articoli.');
        console.error('Eccezione caricamento articoli:', err);
        state.articles = [];
    } finally {
        if (loadingEl) loadingEl.classList.add('hidden');
        renderCatalogGrid();
    }
}

function renderCatalogGrid() {
    const gridEl = document.getElementById('articles-grid');
    const emptyEl = document.getElementById('catalog-empty');
    const countEl = document.getElementById('articles-count');

    const filtered = state.articles.filter((art) => {
        const matchesCat = state.currentCategory === 'all' || art.category === state.currentCategory;
        const q = state.searchQuery.trim().toLowerCase();
        const matchesSearch = !q ||
            art.title.toLowerCase().includes(q) ||
            art.excerpt.toLowerCase().includes(q) ||
            art.category.toLowerCase().includes(q);
        return matchesCat && matchesSearch;
    });

    countEl.textContent = `${filtered.length} ${filtered.length === 1 ? 'articolo' : 'articoli'}`;

    if (filtered.length === 0) {
        gridEl.innerHTML = '';
        emptyEl.classList.remove('hidden');
        return;
    }

    emptyEl.classList.add('hidden');

    gridEl.innerHTML = filtered.map((art, index) => {
        const likesCount = art.article_likes?.[0]?.count || 0;
        const commentsCount = art.comments?.[0]?.count || 0;
        const { pins, gallery, videoUrl } = parseArticleMedia(art);
        const totalPhotos = 1 + gallery.length;
        const wordCount = (art.content || '').trim().split(/\s+/).filter(Boolean).length;
        const readMinutes = Math.max(1, Math.ceil(wordCount / 180));

        const badgesHTML = [];
        if (pins.length > 0) {
            badgesHTML.push(`<span class="fe-media-chip">SHOP · ${pins.length}</span>`);
        }
        if (totalPhotos > 1) {
            badgesHTML.push(`<span class="fe-media-chip">PHOTO · ${totalPhotos}</span>`);
        }
        if (videoUrl) {
            badgesHTML.push(`<span class="fe-media-chip">VIDEO</span>`);
        }

        return `
            <article class="article-card ${index === 0 ? 'article-card--featured' : ''}" data-article-id="${escapeHTML(art.id)}">
                <div class="card-thumb-wrapper">
                    <img src="${escapeHTML(art.cover_image)}" alt="${escapeHTML(art.title)}" class="card-thumb" loading="lazy">
                    ${badgesHTML.length > 0 ? `
                        <div class="card-shop-badge" title="Contenuti multimediali e interattivi">
                            ${badgesHTML.join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="card-body">
                    <div class="card-meta">
                        <span class="badge-category">${escapeHTML(art.category)}</span>
                        <span>•</span>
                        <time>${formatDate(art.created_at)}</time>
                    </div>
                    <h2 class="card-title">${escapeHTML(art.title)}</h2>
                    <p class="card-excerpt">${escapeHTML(art.excerpt)}</p>
                    <div class="card-footer">
                        <div class="card-stats">
                            <span>♥ ${likesCount}</span>
                            <span>💬 ${commentsCount}</span>
                        </div>
                        <span class="card-read-time">${readMinutes} min</span>
                        <span class="card-read-more">Leggi <span aria-hidden="true">↗</span></span>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    gridEl.querySelectorAll('.article-card').forEach((card) => {
        card.addEventListener('click', () => {
            const articleId = card.getAttribute('data-article-id');
            openArticleDetail(articleId);
        });
    });
}

// ============================================================================
// DETTAGLIO ARTICOLO: OPZIONE A (OUTFIT CAROSELLO) vs OPZIONE B (GALLERIA SOTTO)
// ============================================================================

async function openArticleDetail(articleId) {
    const article = state.articles.find((a) => a.id === articleId);
    if (!article) return;

    state.activeArticle = article;
    switchMainView('view-article');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    document.getElementById('article-detail-category').textContent = article.category;
    document.getElementById('article-detail-date').textContent = formatDate(article.created_at);
    document.getElementById('article-detail-title').textContent = article.title;
    document.getElementById('article-detail-excerpt').textContent = article.excerpt;
    document.getElementById('article-detail-content').textContent = article.content;

    const adminQuick = document.getElementById('article-admin-actions');
    const editCurrentBtn = document.getElementById('btn-edit-current-article');
    const deleteCurrentBtn = document.getElementById('btn-delete-current-article');
    const collaboratorOwnsArticle = isActiveCollaborator() && article.author_id === state.currentUser?.id;
    if (state.isAdmin || collaboratorOwnsArticle) {
        adminQuick.classList.remove('hidden');
        editCurrentBtn.classList.remove('hidden');
        deleteCurrentBtn.classList.toggle('hidden', !state.isAdmin);
    } else {
        adminQuick.classList.add('hidden');
    }

    // Estrae Cerchietti, Foto Extra e Video
    const { pins, gallery, videoUrl } = parseArticleMedia(article);

    // Scelta automatica del layout in base alla categoria richiesta:
    // - "Outfit" -> Opzione A (Carosello interattivo in alto)
    // - "Novità", "Trend", "Consigli" -> Opzione B (Foto principale in alto + Galleria e Video sotto)
    const isOutfitCategory = (article.category || '').trim().toLowerCase() === 'outfit';

    if (isOutfitCategory) {
        setupOptionACarousel(article, pins, gallery, videoUrl);
    } else {
        setupOptionBGalleryAndVideo(article, pins, gallery, videoUrl);
    }

    await refreshArticleLikes(article.id);
    await loadArticleComments(article.id);
}

/**
 * OPZIONE A (Categoria OUTFIT):
 * Carosello stile Instagram nel riquadro principale con Foto 1 (dotata di cerchietti),
 * seguita dalle Foto Extra e dall'eventuale Video.
 */
function setupOptionACarousel(article, pins, gallery, videoUrl) {
    // Nasconde il contenitore Opzione B sotto il testo
    const optionBContainer = document.getElementById('fe-option-b-media-container');
    if (optionBContainer) {
        optionBContainer.classList.add('hidden');
        optionBContainer.innerHTML = '';
    }

    const slides = [
        { type: 'image', url: article.cover_image, hasHotspots: true }
    ];
    gallery.forEach((imgUrl) => {
        slides.push({ type: 'image', url: imgUrl, hasHotspots: false });
    });
    if (videoUrl) {
        slides.push({ type: 'video', url: videoUrl, hasHotspots: false });
    }

    state.carouselSlides = slides;
    state.carouselIndex = 0;

    renderCurrentCarouselSlide(pins);
}

function renderCurrentCarouselSlide(pins) {
    const slides = state.carouselSlides;
    const idx = state.carouselIndex;
    const current = slides[idx];

    const mainImg = document.getElementById('article-detail-image');
    const videoHolder = document.getElementById('fe-carousel-video-holder');
    const hotspotsLayer = document.getElementById('article-hotspots-layer');
    const hint = document.getElementById('hotspot-hint');
    const prevBtn = document.getElementById('fe-carousel-prev');
    const nextBtn = document.getElementById('fe-carousel-next');
    const counterBadge = document.getElementById('fe-carousel-counter');
    const dotsBar = document.getElementById('fe-carousel-dots');

    if (!current) return;

    if (current.type === 'video') {
        mainImg.classList.add('hidden');
        hotspotsLayer.classList.add('hidden');
        hint.classList.add('hidden');
        videoHolder.classList.remove('hidden');
        videoHolder.innerHTML = buildVideoPlayerHTML(current.url);
    } else {
        videoHolder.classList.add('hidden');
        videoHolder.innerHTML = '';
        mainImg.classList.remove('hidden');
        mainImg.src = current.url;
        mainImg.alt = state.activeArticle?.title || 'Outfit';

        if (current.hasHotspots) {
            hotspotsLayer.classList.remove('hidden');
            renderArticleHotspots(pins);
        } else {
            hotspotsLayer.classList.add('hidden');
            hint.classList.add('hidden');
        }
    }

    // Mostra o nasconde frecce e indicatori se c'è più di 1 slide
    if (slides.length > 1) {
        prevBtn.classList.remove('hidden');
        nextBtn.classList.remove('hidden');
        counterBadge.classList.remove('hidden');
        dotsBar.classList.remove('hidden');

        counterBadge.textContent = `${idx + 1} / ${slides.length}`;

        dotsBar.innerHTML = slides.map((s, i) => `
            <button type="button" class="fe-carousel-dot ${i === idx ? 'active' : ''}" 
                    data-slide-idx="${i}" 
                    title="${s.type === 'video' ? 'Video' : `Foto ${i + 1}`}"></button>
        `).join('');

        dotsBar.querySelectorAll('.fe-carousel-dot').forEach((dot) => {
            dot.addEventListener('click', () => {
                state.carouselIndex = Number(dot.getAttribute('data-slide-idx'));
                renderCurrentCarouselSlide(pins);
            });
        });

        prevBtn.onclick = (e) => {
            e.stopPropagation();
            state.carouselIndex = (state.carouselIndex - 1 + slides.length) % slides.length;
            renderCurrentCarouselSlide(pins);
        };

        nextBtn.onclick = (e) => {
            e.stopPropagation();
            state.carouselIndex = (state.carouselIndex + 1) % slides.length;
            renderCurrentCarouselSlide(pins);
        };
    } else {
        prevBtn.classList.add('hidden');
        nextBtn.classList.add('hidden');
        counterBadge.classList.add('hidden');
        dotsBar.classList.add('hidden');
    }
}

/**
 * OPZIONE B (Categorie NOVITÀ, TREND, CONSIGLI):
 * Foto principale fissa in alto (con eventuali cerchietti) e sezione
 * Galleria + Player Video dedicata subito sotto il corpo dell'articolo.
 */
function setupOptionBGalleryAndVideo(article, pins, gallery, videoUrl) {
    // Ripristina lo stage principale alla sola Foto di Copertina
    const mainImg = document.getElementById('article-detail-image');
    const videoHolder = document.getElementById('fe-carousel-video-holder');
    const hotspotsLayer = document.getElementById('article-hotspots-layer');
    const prevBtn = document.getElementById('fe-carousel-prev');
    const nextBtn = document.getElementById('fe-carousel-next');
    const counterBadge = document.getElementById('fe-carousel-counter');
    const dotsBar = document.getElementById('fe-carousel-dots');

    if (videoHolder) {
        videoHolder.classList.add('hidden');
        videoHolder.innerHTML = '';
    }
    if (prevBtn) prevBtn.classList.add('hidden');
    if (nextBtn) nextBtn.classList.add('hidden');
    if (counterBadge) counterBadge.classList.add('hidden');
    if (dotsBar) dotsBar.classList.add('hidden');

    mainImg.classList.remove('hidden');
    mainImg.src = article.cover_image;
    mainImg.alt = article.title;
    hotspotsLayer.classList.remove('hidden');
    renderArticleHotspots(pins);

    // Costruisce la sezione Galleria & Video sotto il testo dell'articolo
    const optionBContainer = document.getElementById('fe-option-b-media-container');
    if (!optionBContainer) return;

    if (gallery.length === 0 && !videoUrl) {
        optionBContainer.classList.add('hidden');
        optionBContainer.innerHTML = '';
        return;
    }

    optionBContainer.classList.remove('hidden');

    let html = '';

    if (videoUrl) {
        html += `
            <div style="margin-bottom:${gallery.length > 0 ? '28px' : '0'};">
                <h3 class="fe-editorial-media-title">🎬 Video Approfondimento</h3>
                ${buildVideoPlayerHTML(videoUrl)}
            </div>
        `;
    }

    if (gallery.length > 0) {
        html += `
            <div>
                <h3 class="fe-editorial-media-title">📸 Galleria Fotografica (${gallery.length} ${gallery.length === 1 ? 'foto' : 'foto'})</h3>
                <div class="fe-editorial-gallery-grid">
                    ${gallery.map((imgUrl, idx) => `
                        <div class="fe-editorial-gallery-item" data-zoom-url="${escapeHTML(imgUrl)}" title="Clicca per ingrandire">
                            <img src="${escapeHTML(imgUrl)}" alt="${escapeHTML(article.title)} - Foto ${idx + 2}" loading="lazy">
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    optionBContainer.innerHTML = html;

    optionBContainer.querySelectorAll('[data-zoom-url]').forEach((item) => {
        item.addEventListener('click', () => {
            openImageLightbox(item.getAttribute('data-zoom-url'));
        });
    });
}

function renderArticleHotspots(hotspots) {
    const layer = document.getElementById('article-hotspots-layer');
    const hint = document.getElementById('hotspot-hint');
    layer.innerHTML = '';

    if (!Array.isArray(hotspots) || hotspots.length === 0) {
        hint.classList.add('hidden');
        return;
    }

    hint.classList.remove('hidden');

    hotspots.forEach((spot) => {
        const pin = document.createElement('div');
        pin.className = 'hotspot-pin';
        pin.style.left = `${Number(spot.x).toFixed(2)}%`;
        pin.style.top = `${Number(spot.y).toFixed(2)}%`;
        pin.title = `${spot.label} — Clicca per aprire il sito ufficiale`;

        const card = document.createElement('a');
        card.className = 'hotspot-card hidden';
        card.href = spot.url;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.innerHTML = `
            <span class="hotspot-card-title">${escapeHTML(spot.label)}</span>
            <span class="hotspot-card-cta">Vai al sito ↗</span>
        `;

        pin.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = card.classList.contains('hidden');
            layer.querySelectorAll('.hotspot-card').forEach((c) => c.classList.add('hidden'));
            if (isHidden) {
                card.classList.remove('hidden');
            } else {
                window.open(spot.url, '_blank', 'noopener,noreferrer');
            }
        });

        pin.appendChild(card);
        layer.appendChild(pin);
    });

    document.getElementById('article-image-stage').onclick = () => {
        layer.querySelectorAll('.hotspot-card').forEach((c) => c.classList.add('hidden'));
    };
}

async function refreshArticleLikes(articleId) {
    const btnLike = document.getElementById('btn-like-article');
    const countSpan = document.getElementById('article-like-count');

    const { count } = await supabaseClient
        .from('article_likes')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', articleId);

    countSpan.textContent = count || 0;

    if (!state.currentUser) {
        btnLike.classList.remove('liked');
        return;
    }

    const { data: existing } = await supabaseClient
        .from('article_likes')
        .select('id')
        .eq('article_id', articleId)
        .eq('user_id', state.currentUser.id)
        .maybeSingle();

    if (existing) btnLike.classList.add('liked');
    else btnLike.classList.remove('liked');
}

async function toggleArticleLike() {
    if (!state.currentUser) {
        showToast('Accedi al tuo account per mettere Mi Piace agli articoli.');
        openAuthModal('login');
        return;
    }
    if (!state.activeArticle) return;

    const articleId = state.activeArticle.id;
    const btnLike = document.getElementById('btn-like-article');
    const isLiked = btnLike.classList.contains('liked');

    if (isLiked) {
        await supabaseClient
            .from('article_likes')
            .delete()
            .eq('article_id', articleId)
            .eq('user_id', state.currentUser.id);
    } else {
        const { error } = await supabaseClient
            .from('article_likes')
            .insert({ article_id: articleId, user_id: state.currentUser.id });

        if (error && error.code !== '23505') {
            showToast('Impossibile registrare il like.');
        }
    }

    await refreshArticleLikes(articleId);
    await loadCatalogArticles();
}

// ============================================================================
// SISTEMA COMMENTI STILE iSPAZIO (LIKE 👍, DISLIKE 👎, SEGNALA 🚩, ADMIN DELETE)
// ============================================================================

function updateCommentBoxVisibility() {
    const composeBox = document.getElementById('comment-compose-box');
    const loginPrompt = document.getElementById('comment-login-prompt');

    if (state.currentUser) {
        composeBox.classList.remove('hidden');
        loginPrompt.classList.add('hidden');
    } else {
        composeBox.classList.add('hidden');
        loginPrompt.classList.remove('hidden');
    }
}

async function loadArticleComments(articleId) {
    const listEl = document.getElementById('comments-list');
    const totalEl = document.getElementById('comments-total-count');

    const { data: comments, error } = await supabaseClient
        .from('comments')
        .select(`
            id,
            content,
            created_at,
            user_id,
            public_profiles ( first_name, avatar_url, role ),
            comment_votes ( user_id, vote_type )
        `)
        .eq('article_id', articleId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    const items = comments || [];
    totalEl.textContent = items.length;

    if (items.length === 0) {
        listEl.innerHTML = `<p class="field-help" style="text-align:center; padding:18px;">Nessun commento ancora. Inizia tu la conversazione!</p>`;
        return;
    }

    listEl.innerHTML = items.map((c) => {
        const authorName = c.public_profiles?.first_name || 'Utente';
        const authorAvatar = c.public_profiles?.avatar_url || getDefaultAvatar(authorName);
        const isAuthorAdmin = c.public_profiles?.role === 'admin';

        const votes = c.comment_votes || [];
        const likes = votes.filter((v) => v.vote_type === 1).length;
        const dislikes = votes.filter((v) => v.vote_type === -1).length;

        const myVote = state.currentUser
            ? votes.find((v) => v.user_id === state.currentUser.id)?.vote_type || 0
            : 0;

        const canDelete = state.isAdmin || (state.currentUser && state.currentUser.id === c.user_id);

        return `
            <div class="comment-item" data-comment-id="${escapeHTML(c.id)}">
                <div class="comment-top">
                    <div class="comment-author">
                        <img src="${escapeHTML(authorAvatar)}" alt="${escapeHTML(authorName)}" class="comment-avatar">
                        <div>
                            <span class="comment-author-name">${escapeHTML(authorName)}</span>
                            ${isAuthorAdmin ? `<span class="badge-admin-tag">AUTORE</span>` : ''}
                        </div>
                    </div>
                    <time class="comment-date">${formatDate(c.created_at)}</time>
                </div>
                <div class="comment-text">${escapeHTML(c.content)}</div>
                <div class="comment-actions">
                    <button class="btn-vote ${myVote === 1 ? 'active-vote' : ''}" data-action="like-comment" data-id="${escapeHTML(c.id)}">
                        👍 <span>${likes}</span>
                    </button>
                    <button class="btn-vote ${myVote === -1 ? 'active-vote' : ''}" data-action="dislike-comment" data-id="${escapeHTML(c.id)}">
                        👎 <span>${dislikes}</span>
                    </button>
                    ${canDelete ? `
                        <button class="btn-danger btn-sm" data-action="delete-comment" data-id="${escapeHTML(c.id)}">
                            Elimina
                        </button>
                    ` : ''}
                    <button class="btn-report-comment" data-action="report-comment" data-id="${escapeHTML(c.id)}">
                        🚩 Segnala
                    </button>
                </div>
            </div>
        `;
    }).join('');

    listEl.querySelectorAll('[data-action]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const action = btn.getAttribute('data-action');
            const commentId = btn.getAttribute('data-id');
            if (action === 'like-comment') await handleCommentVote(commentId, 1);
            if (action === 'dislike-comment') await handleCommentVote(commentId, -1);
            if (action === 'report-comment') await handleCommentReport(commentId);
            if (action === 'delete-comment') await handleDeleteComment(commentId);
        });
    });
}

async function handleCommentVote(commentId, voteType) {
    if (!state.currentUser) {
        showToast('Accedi per votare i commenti.');
        openAuthModal('login');
        return;
    }

    const { data: existing } = await supabaseClient
        .from('comment_votes')
        .select('id, vote_type')
        .eq('comment_id', commentId)
        .eq('user_id', state.currentUser.id)
        .maybeSingle();

    if (existing) {
        if (existing.vote_type === voteType) {
            await supabaseClient.from('comment_votes').delete().eq('id', existing.id);
        } else {
            await supabaseClient.from('comment_votes').update({ vote_type: voteType }).eq('id', existing.id);
        }
    } else {
        await supabaseClient.from('comment_votes').insert({
            comment_id: commentId,
            user_id: state.currentUser.id,
            vote_type: voteType
        });
    }

    if (state.activeArticle) {
        await loadArticleComments(state.activeArticle.id);
    }
}

async function handleCommentReport(commentId) {
    if (!state.currentUser) {
        showToast('Accedi per segnalare un commento alla moderazione.');
        openAuthModal('login');
        return;
    }

    const reason = prompt('Indica brevemente il motivo della segnalazione (es. Spam, Offensivo):', 'linguaggi inappropriati / spam');
    if (!reason) return;

    const { error } = await supabaseClient.from('comment_reports').insert({
        comment_id: commentId,
        reporter_id: state.currentUser.id,
        reason: reason.trim().slice(0, 200)
    });

    if (error) {
        if (error.code === '23505') {
            showToast('Hai già segnalato questo commento.');
        } else {
            showToast('Errore durante l\'invio della segnalazione.');
        }
        return;
    }

    showToast('Segnalazione inviata all\'amministratore. Grazie!');
    if (state.isAdmin) refreshAdminReportBadge();
}

async function handleDeleteComment(commentId) {
    if (!confirm('Vuoi davvero eliminare definitivamente questo commento?')) return;

    const { error } = await supabaseClient.from('comments').delete().eq('id', commentId);
    if (error) {
        showToast('Impossibile eliminare il commento.');
        return;
    }

    showToast('Commento eliminato.');
    if (state.activeArticle) await loadArticleComments(state.activeArticle.id);
    if (state.isAdmin) await loadAdminModerationData();
}

// ============================================================================
// PANNELLO AMMINISTRATIVO: CERCHIETTI, FOTO MULTIPLE E VIDEO
// ============================================================================

function renderEditorHotspotsPreview() {
    const layer = document.getElementById('admin-hotspots-layer');
    const listBox = document.getElementById('admin-hotspots-items');
    const countSpan = document.getElementById('admin-hotspots-count');

    layer.innerHTML = '';
    listBox.innerHTML = '';
    countSpan.textContent = state.editorHotspots.length;

    state.editorHotspots.forEach((spot, index) => {
        const pin = document.createElement('div');
        pin.className = 'hotspot-pin';
        pin.style.left = `${Number(spot.x).toFixed(2)}%`;
        pin.style.top = `${Number(spot.y).toFixed(2)}%`;
        pin.title = spot.label;
        layer.appendChild(pin);

        const row = document.createElement('div');
        row.className = 'admin-hotspot-row';
        row.innerHTML = `
            <div>
                <strong>${index + 1}. ${escapeHTML(spot.label)}</strong>
                <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHTML(spot.url)}</div>
            </div>
            <button type="button" class="btn-danger btn-sm" data-remove-spot="${index}">Rimuovi</button>
        `;
        row.querySelector('[data-remove-spot]').addEventListener('click', () => {
            state.editorHotspots.splice(index, 1);
            renderEditorHotspotsPreview();
        });
        listBox.appendChild(row);
    });
}

function renderEditorExtraMediaPreview() {
    const listEl = document.getElementById('admin-extra-photos-list');
    const videoInput = document.getElementById('admin-video-url');
    const videoStatus = document.getElementById('admin-video-preview-status');

    if (listEl) {
        if (state.editorGallery.length === 0) {
            listEl.innerHTML = `<span class="field-help">Nessuna foto extra aggiunta.</span>`;
        } else {
            listEl.innerHTML = state.editorGallery.map((url, idx) => `
                <div class="fe-admin-thumb-card" title="Foto extra ${idx + 2}">
                    <img src="${escapeHTML(url)}" alt="Extra ${idx + 2}">
                    <button type="button" class="fe-admin-thumb-remove" data-remove-extra-photo="${idx}" title="Rimuovi foto">&times;</button>
                </div>
            `).join('');

            listEl.querySelectorAll('[data-remove-extra-photo]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const i = Number(btn.getAttribute('data-remove-extra-photo'));
                    state.editorGallery.splice(i, 1);
                    renderEditorExtraMediaPreview();
                });
            });
        }
    }

    if (videoInput && videoInput.value.trim() !== state.editorVideoUrl) {
        videoInput.value = state.editorVideoUrl || '';
    }

    if (videoStatus) {
        videoStatus.textContent = state.editorVideoUrl
            ? `✅ Video collegato: ${state.editorVideoUrl}`
            : '';
    }
}

async function loadAdminAllArticles() {
    if (!canAccessEditorialPanel()) return;
    const container = document.getElementById('admin-articles-table');
    let query = supabaseClient
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

    if (!state.isAdmin) {
        query = query.eq('author_id', state.currentUser.id);
    }

    const { data, error } = await query;

    if (error) {
        container.innerHTML = `<p class="field-help">Impossibile caricare gli articoli: ${escapeHTML(error.message)}</p>`;
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = `<p class="field-help">${state.isAdmin ? 'Nessun articolo presente.' : 'Non hai ancora scritto articoli.'}</p>`;
        return;
    }

    container.innerHTML = data.map((art) => {
        const { pins, gallery, videoUrl } = parseArticleMedia(art);
        return `
            <div class="admin-list-row">
                <div>
                    <strong>${escapeHTML(art.title)}</strong>
                    <div style="font-size:0.78rem; color:var(--text-secondary);">
                        ${escapeHTML(art.category)} • ${formatDate(art.created_at)} •
                        ${getArticleStatusLabel(art)} •
                        ${pins.length} cerchietti • ${1 + gallery.length} foto ${videoUrl ? '• 🎬 Video' : ''}
                    </div>
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <button class="btn-secondary btn-sm" data-edit-art="${escapeHTML(art.id)}">Modifica</button>
                    ${state.isAdmin ? `<button class="btn-danger btn-sm" data-del-art="${escapeHTML(art.id)}">Elimina</button>` : ''}
                </div>
            </div>
        `;
    }).join('');

    container.querySelectorAll('[data-edit-art]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const art = data.find((a) => a.id === btn.getAttribute('data-edit-art'));
            if (art) populateAdminEditorForEdit(art);
        });
    });

    if (state.isAdmin) {
        container.querySelectorAll('[data-del-art]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-del-art');
                if (!confirm('Eliminare definitivamente questo articolo?')) return;
                const { error: deleteError } = await supabaseClient.from('articles').delete().eq('id', id);
                if (deleteError) {
                    showToast(`Errore eliminazione: ${deleteError.message}`);
                    return;
                }
                showToast('Articolo eliminato.');
                await loadAdminAllArticles();
                await loadCatalogArticles();
                await loadAdminCollaboratorsData();
            });
        });
    }
}

function populateAdminEditorForEdit(article) {
    if (!state.isAdmin && (!isActiveCollaborator() || article.author_id !== state.currentUser?.id)) {
        showToast('Non puoi modificare questo articolo.');
        return;
    }

    document.querySelectorAll('.admin-tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach((c) => c.classList.add('hidden'));
    document.querySelector('[data-tab="tab-editor"]').classList.add('active');
    document.getElementById('tab-editor').classList.remove('hidden');

    document.getElementById('admin-article-id').value = article.id;
    document.getElementById('admin-article-title').value = article.title;
    document.getElementById('admin-article-category').value = article.category;
    document.getElementById('admin-article-excerpt').value = article.excerpt;
    document.getElementById('admin-image-url').value = article.cover_image;
    document.getElementById('admin-article-content').value = article.content;
    document.getElementById('admin-article-published').checked = article.published;

    const previewImg = document.getElementById('admin-preview-img');
    previewImg.src = article.cover_image;
    document.getElementById('admin-hotspot-workspace').classList.remove('hidden');

    const { pins, gallery, videoUrl } = parseArticleMedia(article);
    state.editorHotspots = [...pins];
    state.editorGallery = [...gallery];
    state.editorVideoUrl = videoUrl || '';

    renderEditorHotspotsPreview();
    renderEditorExtraMediaPreview();
    applyEditorialPanelRoleUI();
}

async function refreshAdminReportBadge() {
    if (!state.isAdmin) return;
    const { count } = await supabaseClient
        .from('comment_reports')
        .select('*', { count: 'exact', head: true });

    const b1 = document.getElementById('admin-report-badge');
    const b2 = document.getElementById('tab-report-count');
    if (count && count > 0) {
        b1.textContent = count;
        b2.textContent = count;
        b1.classList.remove('hidden');
        b2.classList.remove('hidden');
    } else {
        b1.classList.add('hidden');
        b2.classList.add('hidden');
    }
}

async function loadAdminModerationData() {
    if (!state.isAdmin) return;
    await refreshAdminReportBadge();

    const reportedBox = document.getElementById('admin-reported-comments-list');
    const allCommentsBox = document.getElementById('admin-all-comments-list');

    const { data: reports } = await supabaseClient
        .from('comment_reports')
        .select(`
            id,
            reason,
            created_at,
            comment_id,
            comments (
                id,
                content,
                public_profiles ( first_name )
            )
        `)
        .order('created_at', { ascending: false });

    if (!reports || reports.length === 0) {
        reportedBox.innerHTML = `<p class="field-help">Nessuna segnalazione in sospeso. 🎉</p>`;
    } else {
        reportedBox.innerHTML = reports.map((r) => `
            <div class="admin-list-row" style="border-color:rgba(215,0,21,0.3); background:#FFF9FA;">
                <div>
                    <strong>Segnalato: "${escapeHTML(r.comments?.content || 'Commento rimosso')}"</strong>
                    <div style="font-size:0.78rem; color:var(--text-secondary);">
                        Scritto da: ${escapeHTML(r.comments?.public_profiles?.first_name || 'Utente')} • Motivo: <strong>${escapeHTML(r.reason)}</strong>
                    </div>
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="btn-secondary btn-sm" data-dismiss-report="${escapeHTML(r.id)}">Ignora</button>
                    <button class="btn-danger btn-sm" data-delete-reported-comment="${escapeHTML(r.comment_id)}">Cancella Commento</button>
                </div>
            </div>
        `).join('');

        reportedBox.querySelectorAll('[data-dismiss-report]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                await supabaseClient.from('comment_reports').delete().eq('id', btn.getAttribute('data-dismiss-report'));
                await loadAdminModerationData();
            });
        });

        reportedBox.querySelectorAll('[data-delete-reported-comment]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                await handleDeleteComment(btn.getAttribute('data-delete-reported-comment'));
            });
        });
    }

    const { data: allComments } = await supabaseClient
        .from('comments')
        .select('id, content, created_at, public_profiles(first_name)')
        .order('created_at', { ascending: false })
        .limit(30);

    allCommentsBox.innerHTML = (allComments || []).map((c) => `
        <div class="admin-list-row">
            <div>
                <strong>${escapeHTML(c.public_profiles?.first_name || 'Utente')}:</strong>
                <span>${escapeHTML(c.content)}</span>
            </div>
            <button class="btn-danger btn-sm" data-admin-del-comm="${escapeHTML(c.id)}">Elimina</button>
        </div>
    `).join('');

    allCommentsBox.querySelectorAll('[data-admin-del-comm]').forEach((btn) => {
        btn.addEventListener('click', () => handleDeleteComment(btn.getAttribute('data-admin-del-comm')));
    });
}

async function loadAdminUsersData() {
    if (!state.isAdmin) return;
    const box = document.getElementById('admin-users-list');
    const { data: users } = await supabaseClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    box.innerHTML = (users || []).map((u) => `
        <div class="admin-list-row">
            <div>
                <strong>${escapeHTML(u.first_name)} ${escapeHTML(u.last_name)}</strong>
                <span class="badge-category" style="margin-left:6px;">${escapeHTML(u.role)}</span>
                <div style="font-size:0.78rem; color:var(--text-secondary);">
                    ${escapeHTML(u.email)} • Tel: ${escapeHTML(u.phone)} • Nato il: ${escapeHTML(u.birth_date)}
                </div>
            </div>
            ${u.role !== 'admin' ? `
                <button class="${u.is_banned ? 'btn-secondary' : 'btn-danger'} btn-sm" data-toggle-ban="${escapeHTML(u.id)}" data-banned="${u.is_banned}">
                    ${u.is_banned ? 'Sblocca Utente' : 'Blocca / Ban'}
                </button>
            ` : ''}
        </div>
    `).join('');

    box.querySelectorAll('[data-toggle-ban]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const uid = btn.getAttribute('data-toggle-ban');
            const currentlyBanned = btn.getAttribute('data-banned') === 'true';
            await supabaseClient.from('profiles').update({ is_banned: !currentlyBanned }).eq('id', uid);
            showToast(!currentlyBanned ? 'Utente bloccato.' : 'Utente sbloccato.');
            await loadAdminUsersData();
        });
    });
}


async function loadAdminCollaboratorsData() {
    if (!state.isAdmin) return;

    await loadEditorialSettings();

    const approvalToggle = document.getElementById('admin-require-approval-toggle');
    const approvalText = document.getElementById('admin-require-approval-status');
    if (approvalToggle) approvalToggle.checked = state.settings.require_collaborator_approval;
    if (approvalText) {
        approvalText.textContent = state.settings.require_collaborator_approval
            ? 'ON — i collaboratori devono essere approvati, salvo permesso individuale.'
            : 'OFF — tutti i collaboratori attivi possono pubblicare direttamente.';
    }

    const [{ data: profiles, error: profilesError }, { data: articles, error: articlesError }] = await Promise.all([
        supabaseClient.from('profiles').select('*').order('created_at', { ascending: false }),
        supabaseClient.from('articles').select('*').order('created_at', { ascending: false })
    ]);

    if (profilesError || articlesError) {
        showToast('Errore nel caricamento dei collaboratori.');
        return;
    }

    const allProfiles = profiles || [];
    const allArticles = articles || [];
    const collaborators = allProfiles.filter((p) => p.role === 'collaborator');
    const candidates = allProfiles.filter((p) => p.role === 'user' && !p.is_banned);
    const pending = allArticles.filter((a) => a.approval_status === 'pending');

    const badge = document.getElementById('tab-pending-count');
    if (badge) {
        if (pending.length > 0) {
            badge.textContent = pending.length;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    const select = document.getElementById('admin-promote-user-select');
    if (select) {
        select.innerHTML = '<option value="">Seleziona un utente...</option>' + candidates.map((u) =>
            `<option value="${escapeHTML(u.id)}">${escapeHTML(u.first_name)} ${escapeHTML(u.last_name)} — ${escapeHTML(u.email)}</option>`
        ).join('');
    }

    const pendingBox = document.getElementById('admin-pending-articles-list');
    if (pendingBox) {
        pendingBox.innerHTML = pending.length === 0
            ? '<p class="field-help">Nessun articolo in attesa di approvazione.</p>'
            : pending.map((art) => {
                const author = allProfiles.find((p) => p.id === art.author_id);
                return `
                    <div class="admin-list-row">
                        <div>
                            <strong>${escapeHTML(art.title)}</strong>
                            <div style="font-size:0.78rem; color:var(--text-secondary);">
                                di ${escapeHTML(author ? `${author.first_name} ${author.last_name}` : 'Collaboratore')} • ${formatDate(art.created_at)} • 🟡 In attesa
                            </div>
                        </div>
                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                            <button class="btn-secondary btn-sm" data-review-edit="${escapeHTML(art.id)}">Modifica</button>
                            <button class="btn-primary btn-sm" data-approve-art="${escapeHTML(art.id)}">Approva e pubblica</button>
                        </div>
                    </div>`;
            }).join('');

        pendingBox.querySelectorAll('[data-review-edit]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const art = allArticles.find((a) => a.id === btn.getAttribute('data-review-edit'));
                if (art) populateAdminEditorForEdit(art);
            });
        });

        pendingBox.querySelectorAll('[data-approve-art]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-approve-art');
                const { error } = await supabaseClient
                    .from('articles')
                    .update({ published: true, approval_status: 'approved', updated_at: new Date().toISOString() })
                    .eq('id', id);
                if (error) {
                    showToast(`Errore approvazione: ${error.message}`);
                    return;
                }
                showToast('Articolo approvato e pubblicato!');
                await loadCatalogArticles();
                await loadAdminAllArticles();
                await loadAdminCollaboratorsData();
            });
        });
    }

    const collabBox = document.getElementById('admin-collaborators-list');
    if (collabBox) {
        collabBox.innerHTML = collaborators.length === 0
            ? '<p class="field-help">Non hai ancora collaboratori.</p>'
            : collaborators.map((u) => {
                const authored = allArticles.filter((a) => a.author_id === u.id);
                const articleLines = authored.length
                    ? authored.map((a) => `<div style="margin-top:4px;">• ${escapeHTML(a.title)} — ${getArticleStatusLabel(a)}</div>`).join('')
                    : '<div style="margin-top:4px;">Nessun articolo scritto.</div>';
                return `
                    <div class="admin-list-row" style="align-items:flex-start;">
                        <div style="min-width:0; flex:1;">
                            <strong>${escapeHTML(u.first_name)} ${escapeHTML(u.last_name)}</strong>
                            <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:3px;">
                                ${escapeHTML(u.email)} • ${u.collaborator_enabled ? '🟢 Attivo' : '🔴 Disabilitato'} •
                                ${u.can_publish_without_approval ? 'Pubblicazione diretta: SÌ' : 'Pubblicazione diretta: NO'} •
                                ${authored.length} ${authored.length === 1 ? 'articolo' : 'articoli'}
                            </div>
                            <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:8px;">${articleLines}</div>
                        </div>
                        <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
                            <button class="${u.collaborator_enabled ? 'btn-danger' : 'btn-secondary'} btn-sm" data-toggle-collab-enabled="${escapeHTML(u.id)}" data-enabled="${u.collaborator_enabled}">
                                ${u.collaborator_enabled ? 'Disabilita' : 'Riabilita'}
                            </button>
                            <button class="btn-secondary btn-sm" data-toggle-direct-publish="${escapeHTML(u.id)}" data-direct="${u.can_publish_without_approval}">
                                ${u.can_publish_without_approval ? 'Revoca pubblicazione diretta' : 'Consenti pubblicazione diretta'}
                            </button>
                            <button class="btn-secondary btn-sm" data-remove-collaborator="${escapeHTML(u.id)}">Rimuovi ruolo</button>
                        </div>
                    </div>`;
            }).join('');

        collabBox.querySelectorAll('[data-toggle-collab-enabled]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const uid = btn.getAttribute('data-toggle-collab-enabled');
                const enabled = btn.getAttribute('data-enabled') === 'true';
                const { error } = await supabaseClient.from('profiles').update({ collaborator_enabled: !enabled }).eq('id', uid);
                if (error) return showToast(`Errore: ${error.message}`);
                showToast(!enabled ? 'Collaboratore riabilitato.' : 'Collaboratore disabilitato.');
                await loadAdminCollaboratorsData();
            });
        });

        collabBox.querySelectorAll('[data-toggle-direct-publish]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const uid = btn.getAttribute('data-toggle-direct-publish');
                const direct = btn.getAttribute('data-direct') === 'true';
                const { error } = await supabaseClient.from('profiles').update({ can_publish_without_approval: !direct }).eq('id', uid);
                if (error) return showToast(`Errore: ${error.message}`);
                showToast(!direct ? 'Pubblicazione diretta concessa.' : 'Pubblicazione diretta revocata.');
                await loadAdminCollaboratorsData();
            });
        });

        collabBox.querySelectorAll('[data-remove-collaborator]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                if (!confirm('Rimuovere il ruolo di collaboratore? Gli articoli già scritti resteranno nel sito.')) return;
                const uid = btn.getAttribute('data-remove-collaborator');
                const { error } = await supabaseClient.from('profiles').update({
                    role: 'user',
                    collaborator_enabled: false,
                    can_publish_without_approval: false
                }).eq('id', uid);
                if (error) return showToast(`Errore: ${error.message}`);
                showToast('Ruolo collaboratore rimosso.');
                await loadAdminCollaboratorsData();
                await loadAdminUsersData();
            });
        });
    }
}

// ============================================================================
// COLLEGAMENTO EVENTI INTERFACCIA (DOM LISTENERS)
// ============================================================================

function switchMainView(viewId) {
    ['view-home', 'view-article', 'view-admin'].forEach((id) => {
        document.getElementById(id).classList.add('hidden');
    });
    document.getElementById(viewId).classList.remove('hidden');
}

function openAuthModal(mode = 'login') {
    const modal = document.getElementById('modal-auth');
    const tabsBar = document.getElementById('auth-tabs-bar');
    modal.classList.remove('hidden');

    ['form-login', 'form-register', 'form-reset-request', 'form-update-password'].forEach((id) => {
        document.getElementById(id).classList.add('hidden');
    });

    document.querySelectorAll('.segment-btn').forEach((b) => b.classList.remove('active'));

    if (mode === 'login') {
        tabsBar.classList.remove('hidden');
        document.getElementById('auth-modal-title').textContent = 'Accedi a Fuori Etichetta';
        document.getElementById('form-login').classList.remove('hidden');
        document.querySelector('[data-auth-view="login"]').classList.add('active');
    } else if (mode === 'register') {
        tabsBar.classList.remove('hidden');
        document.getElementById('auth-modal-title').textContent = 'Crea il tuo Account';
        document.getElementById('form-register').classList.remove('hidden');
        document.querySelector('[data-auth-view="register"]').classList.add('active');
    } else if (mode === 'reset') {
        tabsBar.classList.add('hidden');
        document.getElementById('auth-modal-title').textContent = 'Recupera la tua Password';
        document.getElementById('form-reset-request').classList.remove('hidden');
    } else if (mode === 'update-password') {
        tabsBar.classList.add('hidden');
        document.getElementById('auth-modal-title').textContent = 'Imposta Nuova Password';
        document.getElementById('form-update-password').classList.remove('hidden');
    }
}

function bindUIEvents() {
    document.getElementById('logo-link').addEventListener('click', (e) => {
        e.preventDefault();
        switchMainView('view-home');
    });

    document.querySelectorAll('.cat-pill').forEach((pill) => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.cat-pill').forEach((p) => p.classList.remove('active'));
            pill.classList.add('active');
            state.currentCategory = pill.getAttribute('data-category');
            switchMainView('view-home');
            renderCatalogGrid();
        });
    });

    document.getElementById('search-input').addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        switchMainView('view-home');
        renderCatalogGrid();
    });

    document.getElementById('btn-reset-filters').addEventListener('click', () => {
        state.currentCategory = 'all';
        state.searchQuery = '';
        document.getElementById('search-input').value = '';
        document.querySelectorAll('.cat-pill').forEach((p) => p.classList.remove('active'));
        document.querySelector('[data-category="all"]').classList.add('active');
        renderCatalogGrid();
    });

    document.getElementById('btn-back-home').addEventListener('click', () => switchMainView('view-home'));
    document.getElementById('btn-like-article').addEventListener('click', toggleArticleLike);

    document.getElementById('btn-share-article').addEventListener('click', async () => {
        if (!state.activeArticle) return;
        if (navigator.share) {
            await navigator.share({ title: state.activeArticle.title, url: window.location.href });
        } else {
            await navigator.clipboard.writeText(window.location.href);
            showToast('Link copiato negli appunti!');
        }
    });

    document.getElementById('btn-edit-current-article').addEventListener('click', () => {
        if (!state.activeArticle) return;
        const allowed = state.isAdmin || (isActiveCollaborator() && state.activeArticle.author_id === state.currentUser?.id);
        if (!allowed) return;
        switchMainView('view-admin');
        applyEditorialPanelRoleUI();
        populateAdminEditorForEdit(state.activeArticle);
    });

    document.getElementById('btn-delete-current-article').addEventListener('click', async () => {
        if (!state.isAdmin) {
            showToast('Solo l\'admin può eliminare articoli.');
            return;
        }
        if (!state.activeArticle || !confirm('Vuoi davvero eliminare questo articolo?')) return;
        const { error } = await supabaseClient.from('articles').delete().eq('id', state.activeArticle.id);
        if (error) return showToast(`Errore eliminazione: ${error.message}`);
        showToast('Articolo eliminato.');
        await loadCatalogArticles();
        switchMainView('view-home');
    });

    document.getElementById('form-new-comment').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!state.currentUser || !state.activeArticle) return;
        const textarea = document.getElementById('comment-textarea');
        const text = textarea.value.trim();
        if (!text) return;

        const { error } = await supabaseClient.from('comments').insert({
            article_id: state.activeArticle.id,
            user_id: state.currentUser.id,
            content: text
        });

        if (error) {
            showToast('Impossibile pubblicare il commento. Verifica che la tua email sia confermata.');
            return;
        }

        textarea.value = '';
        showToast('Commento pubblicato!');
        await loadArticleComments(state.activeArticle.id);
        await loadCatalogArticles();
    });

    // Modali Autenticazione
    document.getElementById('btn-open-auth').addEventListener('click', () => openAuthModal('login'));
    document.getElementById('btn-prompt-login').addEventListener('click', () => openAuthModal('login'));
    document.getElementById('btn-close-auth').addEventListener('click', () => {
        document.getElementById('modal-auth').classList.add('hidden');
    });

    document.querySelectorAll('.segment-btn').forEach((btn) => {
        btn.addEventListener('click', () => openAuthModal(btn.getAttribute('data-auth-view')));
    });

    document.getElementById('btn-goto-reset').addEventListener('click', () => openAuthModal('reset'));
    document.getElementById('btn-back-to-login').addEventListener('click', () => openAuthModal('login'));

    document.getElementById('form-login').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            showToast('Credenziali non valide oppure email non ancora verificata.');
            return;
        }
        document.getElementById('modal-auth').classList.add('hidden');
        showToast('Bentornato su Fuori Etichetta!');
    });

    document.getElementById('form-register').addEventListener('submit', async (e) => {
        e.preventDefault();
        const firstName = document.getElementById('reg-firstname').value.trim();
        const lastName = document.getElementById('reg-lastname').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const phone = document.getElementById('reg-phone').value.trim();
        const birthDate = document.getElementById('reg-birthdate').value;
        const password = document.getElementById('reg-password').value;

        if (!isAtLeast16YearsOld(birthDate)) {
            showToast('⛔ Registrazione bloccata: devi avere almeno 16 anni.');
            return;
        }

        const { error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone,
                    birth_date: birthDate,
                    avatar_url: ''
                }
            }
        });

        if (error) {
            showToast(`Errore registrazione: ${error.message}`);
            return;
        }

        document.getElementById('modal-auth').classList.add('hidden');
        showToast('Registrazione completata! Controlla la tua email per cliccare il link di verifica.');
    });

    document.getElementById('form-reset-request').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('reset-email').value.trim();
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
        if (error) {
            showToast(`Errore: ${error.message}`);
            return;
        }
        document.getElementById('modal-auth').classList.add('hidden');
        showToast('Ti abbiamo inviato un\'email con il link per reimpostare la password.');
    });

    document.getElementById('form-update-password').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('new-reset-password').value;
        const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
        if (error) {
            showToast(`Errore: ${error.message}`);
            return;
        }
        document.getElementById('modal-auth').classList.add('hidden');
        showToast('Password aggiornata con successo!');
    });

    // Modale Profilo
    document.getElementById('btn-open-profile').addEventListener('click', () => {
        if (!state.currentProfile) return;
        document.getElementById('profile-firstname').value = state.currentProfile.first_name;
        document.getElementById('profile-email-display').textContent = state.currentProfile.email;
        document.getElementById('profile-modal-avatar').src =
            state.currentProfile.avatar_url || getDefaultAvatar(state.currentProfile.first_name);
        document.getElementById('modal-profile').classList.remove('hidden');
    });

    document.getElementById('btn-close-profile').addEventListener('click', () => {
        document.getElementById('modal-profile').classList.add('hidden');
    });

    document.getElementById('profile-avatar-file').addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            showToast('Caricamento e ottimizzazione foto profilo...');
            const publicUrl = await uploadMediaToSupabase(file, 'avatars');
            document.getElementById('profile-modal-avatar').src = publicUrl;
            state.currentProfile.avatar_url = publicUrl;
        } catch (err) {
            showToast(err.message || 'Errore nel caricamento della foto.');
        }
    });

    document.getElementById('form-profile').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newName = document.getElementById('profile-firstname').value.trim();
        const { error } = await supabaseClient
            .from('profiles')
            .update({
                first_name: newName,
                avatar_url: state.currentProfile.avatar_url
            })
            .eq('id', state.currentUser.id);

        if (error) {
            showToast('Errore nel salvataggio del profilo.');
            return;
        }

        await refreshUserSession(state.currentUser);
        document.getElementById('modal-profile').classList.add('hidden');
        showToast('Profilo aggiornato!');
    });

    document.getElementById('btn-logout').addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        document.getElementById('modal-profile').classList.add('hidden');
        switchMainView('view-home');
        showToast('Hai effettuato il logout.');
    });

    // ========================================================================
    // EVENTI PANNELLO ADMIN: FOTO PRINCIPALE, FOTO EXTRA, VIDEO E CERCHIETTI
    // ========================================================================
    document.getElementById('btn-open-admin').addEventListener('click', async () => {
        if (!canAccessEditorialPanel()) return;
        applyEditorialPanelRoleUI();
        switchMainView('view-admin');
        await loadAdminAllArticles();
        if (state.isAdmin) {
            await loadAdminModerationData();
            await loadAdminUsersData();
            await loadAdminCollaboratorsData();
        }
    });

    document.getElementById('btn-close-admin').addEventListener('click', () => switchMainView('view-home'));

    document.querySelectorAll('.admin-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach((t) => t.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach((c) => c.classList.add('hidden'));
            tab.classList.add('active');
            document.getElementById(tab.getAttribute('data-tab')).classList.remove('hidden');
        });
    });

    const approvalToggle = document.getElementById('admin-require-approval-toggle');
    if (approvalToggle) {
        approvalToggle.addEventListener('change', async () => {
            if (!state.isAdmin) return;
            const value = approvalToggle.checked;
            const { error } = await supabaseClient
                .from('editorial_settings')
                .update({
                    require_collaborator_approval: value,
                    updated_at: new Date().toISOString(),
                    updated_by: state.currentUser.id
                })
                .eq('id', 1);
            if (error) {
                approvalToggle.checked = !value;
                showToast(`Errore impostazione: ${error.message}`);
                return;
            }
            await loadEditorialSettings();
            showToast(value ? 'Approvazione collaboratori attivata.' : 'Approvazione collaboratori disattivata.');
            await loadAdminCollaboratorsData();
        });
    }

    const promoteButton = document.getElementById('btn-promote-collaborator');
    if (promoteButton) {
        promoteButton.addEventListener('click', async () => {
            if (!state.isAdmin) return;
            const select = document.getElementById('admin-promote-user-select');
            const uid = select?.value;
            if (!uid) return showToast('Seleziona prima un utente.');
            const { error } = await supabaseClient.from('profiles').update({
                role: 'collaborator',
                collaborator_enabled: true,
                can_publish_without_approval: false
            }).eq('id', uid);
            if (error) return showToast(`Errore: ${error.message}`);
            showToast('Utente trasformato in collaboratore.');
            await loadAdminCollaboratorsData();
            await loadAdminUsersData();
        });
    }

    // Foto principale di copertina
    document.getElementById('admin-image-file').addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            showToast('Ottimizzazione e caricamento foto principale...');
            const url = await uploadMediaToSupabase(file, 'articles');
            document.getElementById('admin-image-url').value = url;
            document.getElementById('admin-preview-img').src = url;
            document.getElementById('admin-hotspot-workspace').classList.remove('hidden');
            showToast('Foto principale pronta! Clicca sui vestiti per aggiungere i cerchietti.');
        } catch (err) {
            showToast(err.message || 'Errore caricamento immagine.');
        }
    });

    document.getElementById('admin-image-url').addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url.startsWith('http')) {
            document.getElementById('admin-preview-img').src = url;
            document.getElementById('admin-hotspot-workspace').classList.remove('hidden');
        }
    });

    // Caricamento FOTO EXTRA (selezione multipla da iPhone/PC)
    const extraPhotosFileInput = document.getElementById('admin-extra-photos-file');
    if (extraPhotosFileInput) {
        extraPhotosFileInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files || []);
            if (files.length === 0) return;

            showToast(`Caricamento di ${files.length} foto in corso...`);
            for (const file of files) {
                try {
                    const url = await uploadMediaToSupabase(file, 'articles');
                    state.editorGallery.push(url);
                    renderEditorExtraMediaPreview();
                } catch (err) {
                    showToast(err.message || `Errore su ${file.name}`);
                }
            }
            extraPhotosFileInput.value = '';
            showToast('Foto aggiuntive caricate!');
        });
    }

    // Aggiunta FOTO EXTRA tramite link URL
    const btnAddExtraUrl = document.getElementById('btn-add-extra-photo-url');
    if (btnAddExtraUrl) {
        btnAddExtraUrl.addEventListener('click', () => {
            const input = document.getElementById('admin-extra-photo-url-input');
            const url = input ? input.value.trim() : '';
            if (!url.startsWith('http')) {
                showToast('Inserisci un URL immagine valido che inizi con https://');
                return;
            }
            state.editorGallery.push(url);
            input.value = '';
            renderEditorExtraMediaPreview();
            showToast('Foto extra aggiunta alla galleria!');
        });
    }

    // Inserimento VIDEO tramite link (YouTube, Vimeo, MP4)
    const videoUrlInput = document.getElementById('admin-video-url');
    if (videoUrlInput) {
        videoUrlInput.addEventListener('input', (e) => {
            state.editorVideoUrl = e.target.value.trim();
            renderEditorExtraMediaPreview();
        });
    }

    // Caricamento VIDEO diretto da file (clip max 20 MB)
    const videoFileInput = document.getElementById('admin-video-file');
    if (videoFileInput) {
        videoFileInput.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
                showToast('Caricamento video su Supabase in corso...');
                const url = await uploadVideoToSupabase(file);
                state.editorVideoUrl = url;
                renderEditorExtraMediaPreview();
                showToast('Video caricato con successo!');
            } catch (err) {
                showToast(err.message || 'Errore durante il caricamento del video.');
            } finally {
                videoFileInput.value = '';
            }
        });
    }

    // Clic sulla foto nell'Editor Admin per piazzare il cerchietto sul vestito
    document.getElementById('admin-image-preview-box').addEventListener('click', (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
        const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

        state.pendingHotspotCoords = { x: xPercent, y: yPercent };
        document.getElementById('hotspot-label').value = '';
        document.getElementById('hotspot-url').value = '';
        document.getElementById('modal-hotspot').classList.remove('hidden');
        document.getElementById('hotspot-label').focus();
    });

    document.getElementById('btn-close-hotspot').addEventListener('click', () => {
        document.getElementById('modal-hotspot').classList.add('hidden');
    });

    document.getElementById('form-hotspot').addEventListener('submit', (e) => {
        e.preventDefault();
        if (!state.pendingHotspotCoords) return;

        const label = document.getElementById('hotspot-label').value.trim();
        const url = document.getElementById('hotspot-url').value.trim();

        state.editorHotspots.push({
            x: state.pendingHotspotCoords.x,
            y: state.pendingHotspotCoords.y,
            label,
            url
        });

        document.getElementById('modal-hotspot').classList.add('hidden');
        renderEditorHotspotsPreview();
        showToast('Cerchietto aggiunto sulla foto!');
    });

    // Reset Editor Articolo
    document.getElementById('btn-reset-article-form').addEventListener('click', () => {
        document.getElementById('form-admin-article').reset();
        document.getElementById('admin-article-id').value = '';
        state.editorHotspots = [];
        state.editorGallery = [];
        state.editorVideoUrl = '';
        document.getElementById('admin-hotspot-workspace').classList.add('hidden');
        renderEditorHotspotsPreview();
        renderEditorExtraMediaPreview();
        applyEditorialPanelRoleUI();
    });

    // Salvataggio / Pubblicazione Articolo (Create / Update)
    document.getElementById('form-admin-article').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!canAccessEditorialPanel()) return;

        const existingId = document.getElementById('admin-article-id').value;
        const title = document.getElementById('admin-article-title').value.trim();
        const category = document.getElementById('admin-article-category').value;
        const excerpt = document.getElementById('admin-article-excerpt').value.trim();
        const coverImage = document.getElementById('admin-image-url').value.trim();
        const content = document.getElementById('admin-article-content').value.trim();
        const adminPublished = document.getElementById('admin-article-published').checked;

        if (!coverImage) {
            showToast('Carica una foto principale o inserisci l\'URL dell\'immagine di copertina.');
            return;
        }

        if (existingId && !state.isAdmin) {
            const { data: existingArticle, error: ownerCheckError } = await supabaseClient
                .from('articles')
                .select('id, author_id')
                .eq('id', existingId)
                .single();
            if (ownerCheckError || existingArticle?.author_id !== state.currentUser.id) {
                showToast('Non puoi modificare questo articolo.');
                return;
            }
        }

        const combinedMediaPayload = packArticleMedia(
            state.editorHotspots,
            state.editorGallery,
            state.editorVideoUrl
        );

        const payload = {
            title,
            category,
            excerpt,
            cover_image: coverImage,
            content,
            hotspots: combinedMediaPayload,
            updated_at: new Date().toISOString()
        };

        if (state.isAdmin) {
            payload.published = adminPublished;
            payload.approval_status = adminPublished ? 'approved' : 'draft';
        } else {
            payload.published = collaboratorCanPublishDirectly();
            payload.approval_status = collaboratorCanPublishDirectly() ? 'approved' : 'pending';
        }

        let error;
        if (existingId) {
            ({ error } = await supabaseClient.from('articles').update(payload).eq('id', existingId));
        } else {
            payload.slug = generateSlug(title);
            payload.author_id = state.currentUser.id;
            ({ error } = await supabaseClient.from('articles').insert(payload));
        }

        if (error) {
            showToast(`Errore salvataggio: ${error.message}`);
            return;
        }

        if (state.isAdmin) {
            showToast(existingId ? 'Articolo aggiornato!' : (adminPublished ? 'Articolo pubblicato con successo!' : 'Bozza salvata!'));
        } else if (collaboratorCanPublishDirectly()) {
            showToast(existingId ? 'Articolo aggiornato e pubblicato!' : 'Articolo pubblicato!');
        } else {
            showToast(existingId ? 'Modifiche inviate per approvazione!' : 'Articolo inviato per approvazione!');
        }

        document.getElementById('btn-reset-article-form').click();
        await loadCatalogArticles();
        await loadAdminAllArticles();
        if (state.isAdmin) await loadAdminCollaboratorsData();
    });
}
