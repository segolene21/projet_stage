const formService = document.getElementById('form-service');

if (formService) {
    formService.addEventListener('submit', function(e) {
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
                formService.reset();
            } else {
                document.getElementById('message-erreur-service').textContent = JSON.stringify(data.erreurs);
            }
        });
    });
}



function supprimerService(serviceId, url) {
    if (!confirm('Supprimer ce service ?')) return;

    fetch(url, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken
        },
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

function modifierService(serviceId, url) {

    const form = document.getElementById(
        'form-modifier-service-' + serviceId
    );

    const formData = new FormData(form);

    console.log("URL envoyée :", url);
    console.log("Données :");

    for (let element of formData.entries()) {
        console.log(element[0], element[1]);
    }


    fetch(url, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken
        },
        body: formData
    })

    .then(response => {

        console.log("Réponse reçue");
        console.log("Status :", response.status);

        return response.json();

    })

    .then(data => {

        console.log("Django répond :", data);

        if (data.succes) {

    // Fermer la modale
    const modale = document.getElementById(
        'modale-modifier-service-' + serviceId
    );

    if (modale) {
        modale.style.display = 'none';
    }

    // Recharger la page pour afficher les changements
    setTimeout(function() {
        window.location.reload();
    }, 300);

}

    })

    .catch(error => {

        console.error("Erreur fetch :", error);

    });
}

const champRechercheServices = document.getElementById('champ_recherche_services');

if (champRechercheServices) {
    champRechercheServices.addEventListener('input', function() {
        const texte = this.value.toLowerCase();
        const items = document.querySelectorAll('#liste-services li');

        items.forEach(function(item) {
            const nom = item.textContent.toLowerCase();
            item.style.display = nom.includes(texte) ? '' : 'none';
        });
    });
}