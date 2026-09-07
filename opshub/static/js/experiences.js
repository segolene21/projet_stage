// --- FEEDBACK ---

// Gere les formulaires et filtres des experiences membres.
const formFeedback = document.getElementById('form-feedback');

if (formFeedback) {
    formFeedback.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(this);

        fetch(this.dataset.url, {
            method: 'POST',
            headers: {'X-CSRFToken': csrftoken},
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.succes) {
                sessionStorage.setItem('toast_message', 'Feedback ajouté');
                sessionStorage.setItem('toast_type', 'succes');
                location.reload();
            } else {
                document.getElementById('message-erreur-feedback').textContent = JSON.stringify(data.erreurs);
            }
        });
    });
}

// Supprime un feedback apres confirmation de l'utilisateur.
async function supprimerFeedback(feedbackId, url) {
    if (!(await confirmerAction('Supprimer ce feedback ?'))) return;

    fetch(url, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
    })
    .then(response => response.json())
    .then(data => {
        if (data.succes) {
            document.getElementById('feedback-' + feedbackId).remove();
            afficherToast('Feedback supprimé', 'succes');
        } else {
            afficherToast(data.erreur, 'erreur');
        }
    });
}


// --- RECOMMANDATION ---

const formRecommandation = document.getElementById('form-recommandation');

if (formRecommandation) {
    formRecommandation.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(this);

        fetch(this.dataset.url, {
            method: 'POST',
            headers: {'X-CSRFToken': csrftoken},
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.succes) {
                sessionStorage.setItem('toast_message', 'Recommandation ajoutée');
                sessionStorage.setItem('toast_type', 'succes');
                location.reload();
            } else {
                document.getElementById('message-erreur-recommandation').textContent = JSON.stringify(data.erreurs);
            }
        });
    });
}

// Supprime une recommandation apres confirmation.
async function supprimerRecommandation(recommandationId, url) {
    if (!(await confirmerAction('Supprimer cette recommandation ?'))) return;

    fetch(url, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
    })
    .then(response => response.json())
    .then(data => {
        if (data.succes) {
            document.getElementById('recommandation-' + recommandationId).remove();
            afficherToast('Recommandation supprimée', 'succes');
        } else {
            afficherToast(data.erreur, 'erreur');
        }
    });
}


// --- PLAINTE ---

const formPlainte = document.getElementById('form-plainte');

if (formPlainte) {
    formPlainte.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(this);

        fetch(this.dataset.url, {
            method: 'POST',
            headers: {'X-CSRFToken': csrftoken},
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.succes) {
                sessionStorage.setItem('toast_message', 'Plainte ajoutée');
                sessionStorage.setItem('toast_type', 'succes');
                location.reload();
            } else {
                document.getElementById('message-erreur-plainte').textContent = JSON.stringify(data.erreurs);
            }
        });
    });
}

// Supprime une plainte apres confirmation.
async function supprimerPlainte(plainteId, url) {
    if (!(await confirmerAction('Supprimer cette plainte ?'))) return;

    fetch(url, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
    })
    .then(response => response.json())
    .then(data => {
        if (data.succes) {
            document.getElementById('plainte-' + plainteId).remove();
            afficherToast('Plainte supprimée', 'succes');
        } else {
            afficherToast(data.erreur, 'erreur');
        }
    });
}


// --- FILTRES ---

const filtreTexteFeedbacks = document.getElementById('filtre_feedbacks');
const filtreDateFeedbacks = document.getElementById('filtre_date_feedbacks');

// Filtre les feedbacks par texte et par date.
function appliquerFiltresFeedbacks() {
    const texte = filtreTexteFeedbacks ? filtreTexteFeedbacks.value.toLowerCase() : '';
    const date = filtreDateFeedbacks ? filtreDateFeedbacks.value : '';

    document.querySelectorAll('#liste-feedbacks li').forEach(function(item) {
        const contenuTexte = item.textContent.toLowerCase();
        const dateItem = item.dataset.date;

        const correspondTexte = texte === '' || contenuTexte.includes(texte);
        const correspondDate = date === '' || dateItem === date;

        item.style.display = (correspondTexte && correspondDate) ? '' : 'none';
    });
}

if (filtreTexteFeedbacks) {
    filtreTexteFeedbacks.addEventListener('input', appliquerFiltresFeedbacks);
}
if (filtreDateFeedbacks) {
    filtreDateFeedbacks.addEventListener('input', appliquerFiltresFeedbacks);
}
const filtreTextePlaintes = document.getElementById('filtre_plaintes');
const filtreDatePlaintes = document.getElementById('filtre_date_plaintes');

// Filtre les plaintes par texte et par date.
function appliquerFiltresPlaintes() {
    const texte = filtreTextePlaintes ? filtreTextePlaintes.value.toLowerCase() : '';
    const date = filtreDatePlaintes ? filtreDatePlaintes.value : '';

    document.querySelectorAll('#liste-plaintes li').forEach(function(item) {
        const correspondTexte = texte === '' || item.textContent.toLowerCase().includes(texte);
        const correspondDate = date === '' || item.dataset.date === date;
        item.style.display = (correspondTexte && correspondDate) ? '' : 'none';
    });
}

if (filtreTextePlaintes) filtreTextePlaintes.addEventListener('input', appliquerFiltresPlaintes);
if (filtreDatePlaintes) filtreDatePlaintes.addEventListener('input', appliquerFiltresPlaintes);


const filtreTexteRecommandations = document.getElementById('filtre_recommandations');
const filtreDateRecommandations = document.getElementById('filtre_date_recommandations');

// Filtre les recommandations par texte et par date.
function appliquerFiltresRecommandations() {
    const texte = filtreTexteRecommandations ? filtreTexteRecommandations.value.toLowerCase() : '';
    const date = filtreDateRecommandations ? filtreDateRecommandations.value : '';

    document.querySelectorAll('#liste-recommandations li').forEach(function(item) {
        const correspondTexte = texte === '' || item.textContent.toLowerCase().includes(texte);
        const correspondDate = date === '' || item.dataset.date === date;
        item.style.display = (correspondTexte && correspondDate) ? '' : 'none';
    });
}

if (filtreTexteRecommandations) filtreTexteRecommandations.addEventListener('input', appliquerFiltresRecommandations);
if (filtreDateRecommandations) filtreDateRecommandations.addEventListener('input', appliquerFiltresRecommandations);