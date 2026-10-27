/* ==========================================================================
   FUORI ETICHETTA - MODIFICA COMMENTI UTENTE
   ========================================================================== */

(function () {
    "use strict";

    function initCommentsEditor() {
        var commentsList = document.getElementById("comments-list");
        if (!commentsList) return;

        // 1. Aggiunge il tasto "Modifica" accanto a "Elimina"
        var obs = new MutationObserver(function () {
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
        });
        
        obs.observe(commentsList, { childList: true, subtree: true });

        // 2. Gestisce i click su Modifica, Salva e Annulla
        commentsList.addEventListener("click", function(e) {
            
            // Tasto: Modifica
            var btnEdit = e.target.closest(".fe-btn-edit-comment");
            if (btnEdit) {
                var commentItem = btnEdit.closest(".comment-item");
                var textContainer = commentItem.querySelector(".comment-text");
                var actionsContainer = commentItem.querySelector(".comment-actions");
                var commentId = commentItem.getAttribute("data-comment-id");

                var currentText = textContainer.textContent || textContainer.innerText;
                commentItem.dataset.originalText = currentText;

                // Trasforma il testo in una casella di modifica
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

            // Tasto: Annulla
            var btnCancel = e.target.closest(".fe-btn-cancel-edit");
            if (btnCancel) {
                var commentItemC = btnCancel.closest(".comment-item");
                var textContainerC = commentItemC.querySelector(".comment-text");
                var actionsContainerC = commentItemC.querySelector(".comment-actions");

                textContainerC.textContent = commentItemC.dataset.originalText;
                actionsContainerC.style.display = "";
                return;
            }

            // Tasto: Salva
            var btnSave = e.target.closest(".fe-btn-save-edit");
            if (btnSave) {
                var commentItemS = btnSave.closest(".comment-item");
                var newText = commentItemS.querySelector(".fe-edit-textarea").value.trim();
                var cId = btnSave.getAttribute("data-id");

                if (!newText) return;

                btnSave.textContent = "Salvataggio...";
                btnSave.disabled = true;

                // Salva nel database Supabase
                if (window.supabaseClient) {
                    window.supabaseClient
                        .from('comments')
                        .update({ content: newText })
                        .eq('id', cId)
                        .then(function(res) {
                            if (res.error) {
                                alert("Si è verificato un errore durante la modifica.");
                                btnSave.textContent = "Salva Modifiche";
                                btnSave.disabled = false;
                            } else {
                                var textContainerS = commentItemS.querySelector(".comment-text");
                                var actionsContainerS = commentItemS.querySelector(".comment-actions");
                                textContainerS.textContent = newText;
                                actionsContainerS.style.display = "";
                            }
                        });
                }
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initCommentsEditor);
    } else {
        initCommentsEditor();
    }
})();
