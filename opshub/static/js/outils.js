function ouvrirModaleAjout() {
    document.getElementById('champ-outil-id').value = '';
    document.getElementById('champ-nom').value = '';
    document.getElementById('champ-lien-acces').value = '';
    document.getElementById('champ-auth').checked = false;
    document.getElementById('champ-statut').checked = true;
    document.getElementById('form-outil').dataset.url = document.getElementById('form-outil').getAttribute('data-url-ajout') || document.getElementById('form-outil').dataset.url;
    document.getElementById('modale-ajout').style.display = 'block';
}

function ouvrirModaleModification(outilId, nom, lienAcces, auth, statut, url) {
    document.getElementById('champ-outil-id').value = outilId;
    document.getElementById('champ-nom').value = nom;
    document.getElementById('champ-lien-acces').value = lienAcces;
    document.getElementById('champ-auth').checked = auth;
    document.getElementById('champ-statut').checked = statut;
    document.getElementById('form-outil').dataset.url = url;
    document.getElementById('modale-ajout').style.display = 'block';
}


const formOutil = document.getElementById('form-outil');
const urlAjoutOutil = formOutil ? formOutil.dataset.url : null;

if (formOutil) {
    formOutil.addEventListener('submit', function(e) {
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
                document.getElementById('message-erreur').textContent = JSON.stringify(data.erreurs);
            }
        });
    });
}


function supprimerOutil(outilId, url) {
    if (!confirm('Supprimer cet outil ?')) return;

    fetch(url, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
    })
    .then(response => response.json())
    .then(data => {
        if (data.succes) {
            document.getElementById('outil-' + outilId).remove();
        } else {
            alert(data.erreur);
        }
    });
}


const champRechercheOutils = document.getElementById('champ_recherche_outils');

if (champRechercheOutils) {
    champRechercheOutils.addEventListener('input', function() {
        const texte = this.value.toLowerCase();
        const items = document.querySelectorAll('#liste-outils li');

        items.forEach(function(item) {
            const nom = item.textContent.toLowerCase();
            item.style.display = nom.includes(texte) ? '' : 'none';
        });
    });
}

const formOutilTeam = document.getElementById('form-outil-team');

if (formOutilTeam) {
    formOutilTeam.addEventListener('submit', function(e) {
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
                const select = document.getElementById('select-outil-team');
                const option = document.createElement('option');
                option.value = data.id;
                option.textContent = data.nom;
                option.selected = true;
                select.appendChild(option);

                document.getElementById('modale-outil-team').style.display = 'none';
                formOutilTeam.reset();
            } else {
                document.getElementById('message-erreur-outil-team').textContent = JSON.stringify(data.erreurs);
            }
        });
    });
}