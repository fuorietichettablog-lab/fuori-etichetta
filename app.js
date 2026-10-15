/**
 * ============================================================================
 * FUORI ETICHETTA — CORE APPLICATION LOGIC (SUPABASE FULL-STACK)
 * ============================================================================
 * ISTRUZIONI: Sostituisci SUPABASE_URL e SUPABASE_ANON_KEY qui sotto
 * con i due valori del tuo progetto Supabase (Project Settings -> API).
 */

const SUPABASE_URL = 'https://obgewehjfngyppzkwgdd.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'sb_publishable_1XyAu_ImadBP_EYVOliNnw_WDaf7enC';

// Inizializzazione Client Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Stato Globale dell'Applicazione
const state = {
    currentUser: null,
    currentProfile: null,
    isAdmin: false,
    articles: [],
    currentCategory: 'all',
    searchQuery: '',
    activeArticle: null,
    editorHotspots: [],      // Cerchietti temporanei durante la creazione/modifica articolo
    pendingHotspotCoords: null
};

// ============================================================================
// UTILITÀ DI SICUREZZA E FORMATTAZIONE (Sanitizzazione XSS & Immagini)
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
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3800);
}

// Verifica matematica >= 16 anni lato Frontend (Doppio controllo oltre al DB)
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
        throw new Error('Formato non supportato. Usa immagini JPG, PNG o WebP.');
    }
    if (file.size > 10 * 1024 * 1024) {
        throw new Error('Immagine troppo grande (massimo 10 MB).');
    }

    const compressedBlob = await compressImageFile(file, folder === 'avatars' ? 400 : 1400);
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.webp`;

    const { error } = await supabaseClient.storage
        .from('media')
        .upload(fileName, compressedBlob, { contentType: 'image/webp', upsert: false });

    if (error) throw error;

    const { data } = supabaseClient.storage.from('media').getPublicUrl(fileName);
    return data.publicUrl;
}

// ============================================================================
// INIZIALIZZAZIONE E AUTENTICAZIONE
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Imposta data massima nel calendario di registrazione (16 anni fa da oggi)
    const birthInput = document.getElementById('reg-birthdate');
    if (birthInput) {
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() - 16);
        birthInput.max = maxDate.toISOString().split('T')[0];
    }

    bindUIEvents();

    // Verifica configurazione chiavi
    if (SUPABASE_URL.includes('INSERISCI_QUI')) {
        document.getElementById('catalog-loading').innerHTML = `
            <div class="admin-card" style="max-width:560px; margin:0 auto; text-align:left;">
                <h3>⚙️ Configurazione Iniziale Richiesta</h3>
                <p style="margin-top:8px;">Apri il file <strong>app.js</strong> e inserisci il tuo <code>SUPABASE_URL</code> e la tua <code>SUPABASE_ANON_KEY</code> nelle prime due righe per collegare il database.</p>
            </div>`;
        return;
    }

    // Listener stato sessione Auth (incluso il link di recupero password dall'email)
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
            openAuthModal('update-password');
        }
        await refreshUserSession(session?.user || null);
    });

    const { data: { session } } = await supabaseClient.auth.getSession();
    await refreshUserSession(session?.user || null);
    await loadCatalogArticles();
});

async function refreshUserSession(user) {
    state.currentUser = user;
    state.currentProfile = null;
    state.isAdmin = false;

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

    // Carica profilo privato dal DB
    const { data: profile, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error || !profile) {
        btnOpenAuth.classList.remove('hidden');
        btnOpenProfile.classList.add('hidden');
        return;
    }

    if (profile.is_banned) {
        await supabaseClient.auth.signOut();
        showToast('Il tuo account è stato sospeso dalla moderazione.');
        return;
    }

    state.currentProfile = profile;
    state.isAdmin = profile.role === 'admin';

    // Aggiorna Header stile iSpazio (Nome + Foto Profilo)
    btnOpenAuth.classList.add('hidden');
    btnOpenProfile.classList.remove('hidden');
    document.getElementById('header-user-name').textContent = profile.first_name;
    document.getElementById('header-user-avatar').src = profile.avatar_url || getDefaultAvatar(profile.first_name);

    if (state.isAdmin) {
        btnOpenAdmin.classList.remove('hidden');
        refreshAdminReportBadge();
    } else {
        btnOpenAdmin.classList.add('hidden');
    }

    updateCommentBoxVisibility();
}

// ============================================================================
// CATALOGO ARTICOLI (HOMEPAGE) E FILTRI ISTANTANEI
// ============================================================================

async function loadCatalogArticles() {
    const loadingEl = document.getElementById('catalog-loading');
    const gridEl = document.getElementById('articles-grid');
    loadingEl.classList.remove('hidden');
    gridEl.innerHTML = '';

    const { data: articles, error } = await supabaseClient
        .from('articles')
        .select(`
            *,
            article_likes(count),
            comments(count)
        `)
        .eq('published', true)
        .order('created_at', { ascending: false });

    loadingEl.classList.add('hidden');

    if (error) {
        showToast('Errore nel caricamento degli articoli.');
        console.error(error);
        return;
    }

    state.articles = articles || [];
    renderCatalogGrid();
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

    gridEl.innerHTML = filtered.map((art) => {
        const likesCount = art.article_likes?.[0]?.count || 0;
        const commentsCount = art.comments?.[0]?.count || 0;
        const hotspots = Array.isArray(art.hotspots) ? art.hotspots : [];
        const hasHotspots = hotspots.length > 0;

        return `
            <article class="article-card" data-article-id="${escapeHTML(art.id)}">
                <div class="card-thumb-wrapper">
                    <img src="${escapeHTML(art.cover_image)}" alt="${escapeHTML(art.title)}" class="card-thumb" loading="lazy">
                    ${hasHotspots ? `
                        <div class="card-shop-badge" title="Contiene capi cliccabili">
                            ● <span>${hotspots.length} capi cliccabili</span>
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
                        <span class="card-read-more">Esplora →</span>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    // Rendiamo ogni card interamente cliccabile
    gridEl.querySelectorAll('.article-card').forEach((card) => {
        card.addEventListener('click', () => {
            const articleId = card.getAttribute('data-article-id');
            openArticleDetail(articleId);
        });
    });
}

// ============================================================================
// DETTAGLIO ARTICOLO, CERCHIETTI "SHOP THE LOOK" E LIKE UNIVOCO
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
    document.getElementById('article-detail-image').src = article.cover_image;
    document.getElementById('article-detail-image').alt = article.title;
    document.getElementById('article-detail-content').textContent = article.content;

    // Mostra azioni rapide se Admin
    const adminQuick = document.getElementById('article-admin-actions');
    if (state.isAdmin) adminQuick.classList.remove('hidden');
    else adminQuick.classList.add('hidden');

    // Disegna i cerchietti cliccabili sui vestiti (Hotspots)
    renderArticleHotspots(article.hotspots || []);

    // Carica stato Like univoco e Commenti
    await refreshArticleLikes(article.id);
    await loadArticleComments(article.id);
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
        pin.style.left = `${ Number(spot.x).toFixed(2) }%`;
        pin.style.top = `${ Number(spot.y).toFixed(2) }%`;
        pin.title = `${spot.label} — Clicca per aprire il sito ufficiale`;

        // Cartellino con nome capo e apertura diretta del sito ufficiale
        const card = document.createElement('a');
        card.className = 'hotspot-card hidden';
        card.href = spot.url;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.innerHTML = `
            <span class="hotspot-card-title">${escapeHTML(spot.label)}</span>
            <span class="hotspot-card-cta">Vai al sito ↗</span>
        `;

        // Su Desktop/iPhone: il primo tap mostra o apre direttamente il negozio
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

    // Chiudi i cartellini cliccando fuori sulla foto
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

    // Eventi sui pulsanti di ogni commento
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

    const reason = prompt('Indica brevemente il motivo della segnalazione (es. Spam, Offensivo):', ' linguaggi inappropriati / spam');
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
// PANNELLO AMMINISTRATIVO & CREATORE VISUALE CERCHIETTI VESTITI
// ============================================================================

function renderEditorHotspotsPreview() {
    const layer = document.getElementById('admin-hotspots-layer');
    const listBox = document.getElementById('admin-hotspots-items');
    const countSpan = document.getElementById('admin-hotspots-count');

    layer.innerHTML = '';
    listBox.innerHTML = '';
    countSpan.textContent = state.editorHotspots.length;

    state.editorHotspots.forEach((spot, index) => {
        // Disegna il cerchietto sull'anteprima
        const pin = document.createElement('div');
        pin.className = 'hotspot-pin';
        pin.style.left = `${spot.x.toFixed(2)}%`;
        pin.style.top = `${spot.y.toFixed(2)}%`;
        pin.title = spot.label;
        layer.appendChild(pin);

        // Aggiunge riga nella lista sotto la foto per poterlo rimuovere
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

async function loadAdminAllArticles() {
    const container = document.getElementById('admin-articles-table');
    const { data, error } = await supabaseClient
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return;

    if (!data || data.length === 0) {
        container.innerHTML = `<p class="field-help">Nessun articolo presente.</p>`;
        return;
    }

    container.innerHTML = data.map((art) => `
        <div class="admin-list-row">
            <div>
                <strong>${escapeHTML(art.title)}</strong>
                <div style="font-size:0.78rem; color:var(--text-secondary);">
                    ${escapeHTML(art.category)} • ${formatDate(art.created_at)} •
                    ${art.published ? '🟢 Pubblicato' : '🟠 Bozza'} •
                    ${(art.hotspots || []).length} cerchietti
                </div>
            </div>
            <div style="display:flex; gap:8px;">
                <button class="btn-secondary btn-sm" data-edit-art="${escapeHTML(art.id)}">Modifica</button>
                <button class="btn-danger btn-sm" data-del-art="${escapeHTML(art.id)}">Elimina</button>
            </div>
        </div>
    `).join('');

    container.querySelectorAll('[data-edit-art]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const art = data.find((a) => a.id === btn.getAttribute('data-edit-art'));
            if (art) populateAdminEditorForEdit(art);
        });
    });

    container.querySelectorAll('[data-del-art]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-del-art');
            if (!confirm('Eliminare definitivamente questo articolo?')) return;
            await supabaseClient.from('articles').delete().eq('id', id);
            showToast('Articolo eliminato.');
            await loadAdminAllArticles();
            await loadCatalogArticles();
        });
    });
}

function populateAdminEditorForEdit(article) {
    document.querySelectorAll('.admin-tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach((c) => c.classList.add('hidden'));
    document.querySelector('[data-tab="tab-editor"]').classList.add('active');
    document.getElementById('tab-editor').classList.remove('hidden');

    document.getElementById('admin-article-id').value = article.id;
    document.getElementById('admin-article-title').value = article.title;
    document.getElementById('admin-article-category').value = article.category;
    document.getElementById('admin-article-excerpt').value = article.excerpt;
    document.getElementById('admin-article- image-url');
    document.getElementById('admin-image-url').value = article.cover_image;
    document.getElementById('admin-article-content').value = article.content;
    document.getElementById('admin-article-published').checked = article.published;

    const previewImg = document.getElementById('admin-preview-img');
    previewImg.src = article.cover_image;
    document.getElementById('admin-hotspot-workspace').classList.remove('hidden');

    state.editorHotspots = Array.isArray(article.hotspots) ? [...article.hotspots] : [];
    renderEditorHotspotsPreview();
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

    // Ultimi commenti globali
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
    // Navigazione Logo e Categorie
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

    // Navigazione Articolo
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

    // Azioni rapide Admin sull'articolo corrente
    document.getElementById('btn-edit-current-article').addEventListener('click', () => {
        if (!state.activeArticle) return;
        switchMainView('view-admin');
        populateAdminEditorForEdit(state.activeArticle);
    });

    document.getElementById('btn-delete-current-article').addEventListener('click', async () => {
        if (!state.activeArticle || !confirm('Vuoi davvero eliminare questo articolo?')) return;
        await supabaseClient.from('articles').delete().eq('id', state.activeArticle.id);
        showToast('Articolo eliminato.');
        await loadCatalogArticles();
        switchMainView('view-home');
    });

    // Invio Nuovo Commento
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

    // Login Submit
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

    // Registrazione con Controllo Obbligatorio >= 16 Anni + Verifica Email
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

// Recupero Password via Email
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
        if (error) {
            showToast(`Errore: ${error.message}`);
            return;
        }
        document.getElementById('modal-auth').classList.add('hidden');
        showToast('Ti abbiamo inviato un\'email con il link per reimpostare la password.');
    });

    // Salvataggio Nuova Password
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

    // Modale Profilo Stile iSpazio (Solo Nome + Foto Profilo)
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
    // EVENTI PANNELLO ADMIN & POSIZIONAMENTO CERCHIETTI SULLA FOTO
    // ========================================================================
    document.getElementById('btn-open-admin').addEventListener('click', async () => {
        if (!state.isAdmin) return;
        switchMainView('view-admin');
        await loadAdminAllArticles();
        await loadAdminModerationData();
        await loadAdminUsersData();
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

    // Caricamento foto articolo da file (con compressione WebP automatica)
    document.getElementById('admin-image-file').addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            showToast('Ottimizzazione e caricamento foto outfit in corso...');
            const url = await uploadMediaToSupabase(file, 'articles');
            document.getElementById('admin-image-url').value = url;
            document.getElementById('admin-preview-img').src = url;
            document.getElementById('admin-hotspot-workspace').classList.remove('hidden');
            showToast('Foto pronta! Ora clicca sui vestiti nella foto per aggiungere i cerchietti.');
        } catch (err) {
            showToast(err.message || 'Errore caricamento immagine.');
        }
    });

    // Inserimento URL immagine manuale
    document.getElementById('admin-image-url').addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url.startsWith('http')) {
            document.getElementById('admin-preview-img').src = url;
            document.getElementById('admin-hotspot-workspace').classList.remove('hidden');
        }
    });

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
        document.getElementById('admin-hotspot-workspace').classList.add('hidden');
        renderEditorHotspotsPreview();
    });

    // Salvataggio / Pubblicazione Articolo (Create / Update)
    document.getElementById('form-admin-article').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!state.isAdmin) return;

        const existingId = document.getElementById('admin-article-id').value;
        const title = document.getElementById('admin-article-title').value.trim();
        const category = document.getElementById('admin-article-category').value;
        const excerpt = document.getElementById('admin-article-excerpt').value.trim();
        const coverImage = document.getElementById('admin-image-url').value.trim();
        const content = document.getElementById('admin-article-content').value.trim();
        const published = document.getElementById('admin-article-published').checked;

        if (!coverImage) {
            showToast('Carica una foto o inserisci l\'URL dell\'immagine di copertina.');
            return;
        }

        const payload = {
            title,
            category,
            excerpt,
            cover_image: coverImage,
            content,
            hotspots: state.editorHotspots,
            published,
            author_id: state.currentUser.id,
            updated_at: new Date().toISOString()
        };

        let error;
        if (existingId) {
            ({ error } = await supabaseClient.from('articles').update(payload).eq('id', existingId));
        } else {
            payload.slug = generateSlug(title);
            ({ error } = await supabaseClient.from('articles').insert(payload));
        }

        if (error) {
            showToast(`Errore salvataggio: ${error.message}`);
            return;
        }

        showToast(existingId ? 'Articolo aggiornato!' : 'Articolo pubblicato con successo!');
        document.getElementById('btn-reset-article-form').click();
        await loadCatalogArticles();
        await loadAdminAllArticles();
    });
}
