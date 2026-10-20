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
