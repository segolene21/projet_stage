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
}  // ← accolade ajoutée ici pour fermer supprimerOutil


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