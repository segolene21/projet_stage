
const formUtilisateur = document.getElementById('form-utilisateur');

if (formUtilisateur) {
    formUtilisateur.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(this);

        fetch(this.dataset.url, {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.succes) {
                location.reload();
            } else {
                document.getElementById('message-erreur-utilisateur').textContent = JSON.stringify(data.erreurs);
            }
        });
    });
}


function toggleStatut(userId, url) {
    fetch(url, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
    })
    .then(response => response.json())
    .then(data => {
        if (data.succes) {
            document.getElementById('statut-' + userId).textContent = data.actif ? 'Actif' : 'Inactif';
        } else {
            alert(data.erreur);
        }
    });
}


function supprimerUtilisateur(userId, url) {
    if (!confirm('Supprimer cet utilisateur ?')) return;

    fetch(url, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
    })
    .then(response => response.json())
    .then(data => {
        if (data.succes) {
            document.getElementById('user-' + userId).remove();
        } else {
            alert(data.erreur);
        }
    });
}