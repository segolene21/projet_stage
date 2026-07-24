

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
                alert('Utilisateur ' + data.username + ' créé avec le rôle ' + data.role);
                document.getElementById('modale-ajout-utilisateur').style.display = 'none';
                formUtilisateur.reset();
            } else {
                document.getElementById('message-erreur-utilisateur').textContent = JSON.stringify(data.erreurs);
            }
        });
    });
}