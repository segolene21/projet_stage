const formMotCle = document.getElementById('form-mot-cle');

if (formMotCle) {
    formMotCle.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(this);

        fetch(this.dataset.url, {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.succes) {
                const tbody = document.querySelector('#table-mots-cles tbody');
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${data.intitule}</td><td>${data.contact}</td><td>${data.equipe}</td><td></td>`;
                tbody.appendChild(tr);
                document.getElementById('modale-ajout-mc').style.display = 'none';
                formMotCle.reset();
            } else {
                document.getElementById('message-erreur-mc').textContent = JSON.stringify(data.erreurs);
            }
        });
    });
}


function modifierMotCle(motCleId, url) {
    const formData = new FormData(document.getElementById('form-modifier-mc-' + motCleId));

    fetch(url, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.succes) {
            document.getElementById('intitule-' + motCleId).textContent = data.intitule;
            document.getElementById('contact-' + motCleId).textContent = data.contact;
            document.getElementById('equipe-' + motCleId).textContent = data.equipe;
            document.getElementById('modale-modifier-mc-' + motCleId).style.display = 'none';
        } else {
            alert(JSON.stringify(data.erreurs));
        }
    });
}


function supprimerMotCle(motCleId, url) {
    if (!confirm('Supprimer ce mot-clé ?')) return;

    fetch(url, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
    })
    .then(response => response.json())
    .then(data => {
        if (data.succes) {
            document.getElementById('mot-cle-' + motCleId).remove();
        } else {
            alert(data.erreur);
        }
    });
}


const champRechercheMotsCles = document.getElementById('champ_recherche_mots_cles');

if (champRechercheMotsCles) {
    champRechercheMotsCles.addEventListener('input', function() {
        const texte = this.value.toLowerCase();
        const lignes = document.querySelectorAll('#table-mots-cles tbody tr');

        lignes.forEach(function(ligne) {
            const contenu = ligne.textContent.toLowerCase();
            ligne.style.display = contenu.includes(texte) ? '' : 'none';
        });
    });
}