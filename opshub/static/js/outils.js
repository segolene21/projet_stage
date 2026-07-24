// --- AJOUTER ---
document.getElementById('form-outil').addEventListener('submit', function(e) {
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
            document.getElementById('liste-outils').appendChild(li);
            document.getElementById('modale-ajout').style.display = 'none';
            this.reset();
        } else {
            document.getElementById('message-erreur').textContent = JSON.stringify(data.erreurs);
        }
    });
});


// --- MODIFIER ---
function modifierOutil(outilId, url) {
    const formData = new FormData(document.getElementById('form-modifier-' + outilId));

    fetch(url, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.succes) {
            document.getElementById('nom-outil-' + outilId).textContent = data.nom;
        } else {
            alert(JSON.stringify(data.erreurs));
        }
    });
}


// --- SUPPRIMER ---
function supprimerOutil(outilId, url) {
    if (!confirm('Supprimer cet outil ?')) return;

    fetch(url, {
        method: 'POST',
    })
    .then(response => response.json())
    .then(data => {
        if (data.succes) {
            document.getElementById('outil-' + outilId).remove();
        } else {
            alert(data.erreur);
        }
    });


const champRecherche = document.getElementById('champ_recherche_outils');

if (champRecherche) {
    champRecherche.addEventListener('input', function() {
        const texte = this.value.toLowerCase();
        const items = document.querySelectorAll('#liste-outils li');

        items.forEach(function(item) {
            const nom = item.textContent.toLowerCase();
            item.style.display = nom.includes(texte) ? '' : 'none';
        });
    });
}
}