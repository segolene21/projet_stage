// --- FEEDBACK ---

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
                location.reload();
            } else {
                document.getElementById('message-erreur-feedback').textContent = JSON.stringify(data.erreurs);
            }
        });
    });
}

function supprimerFeedback(feedbackId, url) {
    if (!confirm('Supprimer ce feedback ?')) return;

    fetch(url, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
    })
    .then(response => response.json())
    .then(data => {
        if (data.succes) {
            document.getElementById('feedback-' + feedbackId).remove();
        } else {
            alert(data.erreur);
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
                location.reload();
            } else {
                document.getElementById('message-erreur-recommandation').textContent = JSON.stringify(data.erreurs);
            }
        });
    });
}

function supprimerRecommandation(recommandationId, url) {
    if (!confirm('Supprimer cette recommandation ?')) return;

    fetch(url, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
    })
    .then(response => response.json())
    .then(data => {
        if (data.succes) {
            document.getElementById('recommandation-' + recommandationId).remove();
        } else {
            alert(data.erreur);
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
                location.reload();
            } else {
                document.getElementById('message-erreur-plainte').textContent = JSON.stringify(data.erreurs);
            }
        });
    });
}

function supprimerPlainte(plainteId, url) {
    if (!confirm('Supprimer cette plainte ?')) return;

    fetch(url, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
    })
    .then(response => response.json())
    .then(data => {
        if (data.succes) {
            document.getElementById('plainte-' + plainteId).remove();
        } else {
            alert(data.erreur);
        }
    });
}


// --- FILTRES ---

const filtreTexteFeedbacks = document.getElementById('filtre_feedbacks');
const filtreDateFeedbacks = document.getElementById('filtre_date_feedbacks');

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