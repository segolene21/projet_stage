// Gere les actions d'administration des utilisateurs.
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
                sessionStorage.setItem('toast_message', 'Utilisateur enregistré');
                sessionStorage.setItem('toast_type', 'succes');
                location.reload();
            } else {
                document.getElementById('message-erreur-utilisateur').textContent = JSON.stringify(data.erreurs);
            }
        });
    });
}


function toggleStatut(userId, url) {
    // Active ou desactive le compte utilisateur cible.
    fetch(url, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
    })
    .then(response => response.json())
    .then(data => {
        if (data.succes) {
            document.getElementById('statut-' + userId).textContent = data.actif ? 'Actif' : 'Inactif';
            afficherToast(data.actif ? 'Utilisateur activé' : 'Utilisateur désactivé', 'succes');
        } else {
            afficherToast(data.erreur, 'erreur');
        }
    });
}


async function supprimerUtilisateur(userId, url) {
    // Supprime un utilisateur apres confirmation.
    if (!(await confirmerAction('Supprimer cet utilisateur ?'))) return;

    fetch(url, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
    })
    .then(response => response.json())
    .then(data => {
        if (data.succes) {
            document.getElementById('user-' + userId).remove();
            afficherToast('Utilisateur supprimé', 'succes');
        } else {
            afficherToast(data.erreur, 'erreur');
        }
    });
}