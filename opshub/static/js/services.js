document.getElementById('form-service').addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = new FormData(this);

    fetch(this.dataset.url, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.succes) {
            const li = document.createElement('li');
            li.textContent = data.nom;
            document.getElementById('liste-services').appendChild(li);
            document.getElementById('modale-ajout-service').style.display = 'none';
            this.reset();
        } else {
            document.getElementById('message-erreur-service').textContent = JSON.stringify(data.erreurs);
        }
    });
});

function modifierService(serviceId, url) {
    const formData = new FormData(document.getElementById('form-modifier-service-' + serviceId));

    fetch(url, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.succes) {
            document.getElementById('nom-service-' + serviceId).textContent = data.nom;
        } else {
            alert(JSON.stringify(data.erreurs));
        }
    });
}

function supprimerService(serviceId, url) {
    if (!confirm('Supprimer ce service ?')) return;

    fetch(url, {
        method: 'POST',
    })
    .then(response => response.json())
    .then(data => {
        if (data.succes) {
            document.getElementById('service-' + serviceId).remove();
        } else {
            alert(data.erreur);
        }
    });
}