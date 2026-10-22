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

    // 3. Iniezione del nuovo Design Minimalista per l'Editor
    const cleanAdminStyle = document.createElement("style");
    cleanAdminStyle.innerHTML = `
        /* Trasforma il box admin in un foglio di scrittura pulito */
        #form-admin-article {
            background: #ffffff !important;
            border: none !important;
            box-shadow: 0 10px 40px rgba(0,0,0,0.08) !important;
            border-radius: 20px !important;
            padding: 40px !important;
            max-width: 800px !important;
            margin: 0 auto !important;
        }

        /* Nascondi le vecchie etichette testuali (tranne quelle dell'immagine) */
        label[for="admin-article-title"],
        label[for="admin-article-category"],
        label[for="admin-article-excerpt"],
        label[for="admin-article-content"] {
            display: none !important;
        }

        /* Stile Titolo Gigante */
        #admin-article-title {
            font-size: 2.5rem !important;
            font-weight: 800 !important;
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            box-shadow: none !important;
            margin-bottom: 15px !important;
            color: #1d1d1f !important;
        }
        #admin-article-title::placeholder { color: #d2d2d7 !important; }

        /* Stile Categoria */
        #admin-article-category {
            border: 1px solid #e5e5ea !important;
            border-radius: 20px !important;
            padding: 8px 16px !important;
            font-weight: 600 !important;
            background: #f5f5f7 !important;
            width: auto !important;
            display: inline-block !important;
            margin-bottom: 20px !important;
            cursor: pointer !important;
        }

        /* Stile Anteprima (Sottotitolo) */
        #admin-article-excerpt {
            font-size: 1.2rem !important;
            border: none !important;
            border-left: 4px solid #000 !important;
            border-radius: 0 !important;
            background: transparent !important;
            padding: 5px 0 5px 15px !important;
            margin-bottom: 30px !important;
            box-shadow: none !important;
        }

        /* Stile Testo Completo */
        #admin-article-content {
            font-size: 1.15rem !important;
            line-height: 1.8 !important;
            border: none !important;
            background: transparent !important;
            padding: 20px 0 !important;
            box-shadow: none !important;
            min-height: 500px !important;
            resize: none !important;
            color: #333 !important;
        }

        /* Area di caricamento foto più elegante */
        .upload-controls {
            background: #f5f5f7 !important;
            border: 1px dashed #d2d2d7 !important;
            padding: 20px !important;
            border-radius: 12px !important;
            margin-bottom: 20px !important;
        }
    `;
    document.head.appendChild(cleanAdminStyle);
});
