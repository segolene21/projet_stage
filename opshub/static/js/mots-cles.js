function toggleMenu(btn) {
    const menu = btn.closest('.action-menu-wrapper')?.querySelector('.action-dropdown');

    if (!menu) {
        return;
    }

    const doitOuvrir = !menu.classList.contains('open');
    document.querySelectorAll('.action-dropdown.open').forEach(d => d.classList.remove('open'));

    if (doitOuvrir) {
        menu.classList.add('open');
    }
}

window.toggleMenu = toggleMenu;

document.addEventListener('click', function(e) {
    const wrapper = e.target.closest('.action-menu-wrapper');

    if (!wrapper) {
        document.querySelectorAll('.action-dropdown.open').forEach(d => d.classList.remove('open'));
        return;
    }

    if (!e.target.closest('.btn-three-dots') && !e.target.closest('.action-dropdown')) {
        document.querySelectorAll('.action-dropdown.open').forEach(d => d.classList.remove('open'));
    }
});

const formMotCle = document.getElementById('form-mot-cle');

if (formMotCle) {
    formMotCle.addEventListener('submit', function(e) {
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
                sessionStorage.setItem('toast_message', 'Mot-clé ajouté');
                sessionStorage.setItem('toast_type', 'succes');
                location.reload();
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
        headers: {'X-CSRFToken': csrftoken},
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.succes) {
            document.getElementById('intitule-' + motCleId).textContent = data.intitule;
            document.getElementById('equipe-' + motCleId).textContent = data.equipe;
            document.getElementById('modale-modifier-mc-' + motCleId).style.display = 'none';
            afficherToast('Mot-clé modifié', 'succes');
        } else {
            afficherToast(JSON.stringify(data.erreurs), 'erreur');
        }
    });
}


async function supprimerMotCle(motCleId, url) {
    if (!(await confirmerAction('Supprimer ce mot-clé ?'))) return;

    fetch(url, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
    })
    .then(response => response.json())
    .then(data => {
        if (data.succes) {
            document.getElementById('mot-cle-' + motCleId).remove();
            afficherToast('Mot-clé supprimé', 'succes');
        } else {
            afficherToast(data.erreur || 'Impossible de supprimer le mot-clé.', 'erreur');
        }
    })
    .catch(error => {
        console.error('Erreur suppression mot-clé :', error);
        afficherToast('Erreur réseau lors de la suppression du mot-clé.', 'erreur');
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


// --- ÉQUIPE (créée depuis n'importe quel select cible) ---

let selectEquipeCible = null;
let modaleParenteEquipe = null;

function ouvrirModaleEquipe(selectId) {
    selectEquipeCible = selectId;

    const select = document.getElementById(selectId);
    modaleParenteEquipe = select.closest('.modal-overlay');

    if (modaleParenteEquipe) {
        modaleParenteEquipe.style.display = 'none';
    }

    document.getElementById('modale-equipe').style.display = 'flex';
}

function fermerModaleEquipe() {
    document.getElementById('modale-equipe').style.display = 'none';

    if (modaleParenteEquipe) {
        modaleParenteEquipe.style.display = 'flex';
    }
}

const formEquipe = document.getElementById('form-equipe');

if (formEquipe) {
    formEquipe.addEventListener('submit', function(e) {
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
                const select = document.getElementById(selectEquipeCible);
                const option = document.createElement('option');
                option.value = data.id;
                option.textContent = data.nom;
                option.selected = true;
                select.appendChild(option);

                formEquipe.reset();
                fermerModaleEquipe();
                afficherToast('Équipe créée', 'succes');
            } else {
                document.getElementById('message-erreur-equipe').textContent = JSON.stringify(data.erreurs);
            }
        });
    });
}