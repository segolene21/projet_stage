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