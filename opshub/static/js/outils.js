// ===============================
// OUVERTURE MODALE AJOUT OUTIL
// ===============================

// Ouvre la modale de creation d'un outil.
function ouvrirModaleAjout() {
    document.getElementById('champ-outil-id').value = '';
    document.getElementById('champ-nom').value = '';
    document.getElementById('champ-lien-acces').value = '';
    document.getElementById('champ-auth').checked = false;
    document.getElementById('champ-statut').checked = true;
    document.getElementById('form-outil').dataset.url = document.getElementById('form-outil').getAttribute('data-url-ajout') || document.getElementById('form-outil').dataset.url;
    document.getElementById('modale-ajout').style.display = 'flex';
}


// ===============================
// MODIFICATION OUTIL
// ===============================

function ouvrirModaleModification(outilId, nom, lienAcces, auth, statut, url, equipeId) {
    // Ouvre la modale de modification d'un outil.
    document.getElementById('champ-outil-id').value = outilId;
    document.getElementById('champ-nom').value = nom;
    document.getElementById('champ-lien-acces').value = lienAcces;
    document.getElementById('champ-auth').checked = auth;
    document.getElementById('champ-statut').checked = statut;

    document.getElementById('form-outil').dataset.url = url;

    const selectEquipe = document.getElementById('select-outil-team');
    if (selectEquipe && equipeId) {
        selectEquipe.value = equipeId;
    }

    document.getElementById('modale-ajout').style.display = 'flex';
}

// ===============================
// SUPPRESSION OUTIL
// ===============================

async function supprimerOutil(outilId, url) {
    // Supprime un outil apres confirmation.
    if (!(await confirmerAction("Supprimer cet outil ?"))) {
        return;
    }

    fetch(url, {
        method: "POST",
        headers: {
            "X-CSRFToken": csrftoken
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.succes) {
            const element = document.getElementById("outil-" + outilId);
            if (element) {
                element.remove();
            }
            afficherToast("Outil supprimé", "succes");
        } else {
            afficherToast(data.erreur, "erreur");
        }
    })
    .catch(() => {
        afficherToast("Erreur réseau.", "erreur");
    });
}


// ===============================
// RECHERCHE OUTILS
// ===============================

const champRechercheOutils = document.getElementById('champ_recherche_outils');

if (champRechercheOutils) {
    champRechercheOutils.addEventListener('input', function() {
        const texte = this.value.toLowerCase();
        const outils = document.querySelectorAll('#liste-outils li');

        outils.forEach(function(outil) {
            const lienNom = outil.querySelector('a');
            const nom = lienNom ? lienNom.textContent.toLowerCase() : outil.textContent.toLowerCase();
            outil.style.display = nom.includes(texte) ? "" : "none";
        });
    });
}


// ===============================
// AJOUT OUTIL TEAM
// ===============================

let selectEquipeCible = null;
let modaleParenteEquipe = null;

function ouvrirModaleEquipe(selectId) {
    // Ouvre la modale de creation d'une equipe d'outils.
    selectEquipeCible = selectId;

    const select = document.getElementById(selectId);
    modaleParenteEquipe = select.closest('.modal-overlay');

    if (modaleParenteEquipe) {
        modaleParenteEquipe.style.display = 'none';
    }

    document.getElementById('modale-outil-team').style.display = 'flex';
}

function fermerModaleEquipe() {
    // Ferme la modale de creation d'equipe.
    document.getElementById('modale-outil-team').style.display = 'none';

    if (modaleParenteEquipe) {
        modaleParenteEquipe.style.display = 'flex';
    }
}

const formOutilTeam = document.getElementById('form-outil-team');

if (formOutilTeam) {
    formOutilTeam.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(this);

        fetch(this.dataset.url, {
            method: "POST",
            headers: {
                "X-CSRFToken": csrftoken
            },
            body: formData
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

                formOutilTeam.reset();
                fermerModaleEquipe();
            } else {
                document.getElementById('message-erreur-outil-team').textContent = JSON.stringify(data.erreurs);
            }
        });
    });
}


// ===============================
// FORMULAIRE OUTIL (AJOUT / MODIF)
// ===============================

const formOutil = document.getElementById('form-outil');

if (formOutil) {
    formOutil.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        const estModification = !!document.getElementById('champ-outil-id').value;

        fetch(this.dataset.url, {
            method: "POST",
            headers: {
                "X-CSRFToken": csrftoken
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.succes) {
                document.getElementById('modale-ajout').style.display = "none";
                formOutil.reset();
                sessionStorage.setItem('toast_message', estModification ? 'Outil modifié' : 'Outil ajouté');
                sessionStorage.setItem('toast_type', 'succes');
                window.location.reload();
            } else {
                document.getElementById('message-erreur').textContent = JSON.stringify(data.erreurs);
            }
        })
        .catch(() => {
            document.getElementById('message-erreur').textContent = "Erreur réseau.";
        });
    });
}

// rendre les fonctions accessibles depuis le HTML

window.ouvrirModaleAjout = ouvrirModaleAjout;
window.ouvrirModaleModification = ouvrirModaleModification;
window.supprimerOutil = supprimerOutil;

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

// Fermer le menu si on clique ailleurs
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

window.toggleMenu = toggleMenu;