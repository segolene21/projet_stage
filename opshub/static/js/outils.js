// ===============================
// OUVERTURE MODALE AJOUT OUTIL
// ===============================

function ouvrirModaleAjout() {

    document.getElementById('champ-outil-id').value = '';
    document.getElementById('champ-nom').value = '';
    document.getElementById('champ-lien-acces').value = '';
    document.getElementById('champ-auth').checked = false;
    document.getElementById('champ-statut').checked = true;

    const form = document.getElementById('form-outil');

    if (form) {
        form.dataset.url = form.dataset.urlAjout || form.dataset.url;
    }

    document.getElementById('modale-ajout').style.display = 'block';
}


// ===============================
// MODIFICATION OUTIL
// ===============================

function ouvrirModaleModification(outilId, nom, lienAcces, auth, statut, url) {

    document.getElementById('champ-outil-id').value = outilId;
    document.getElementById('champ-nom').value = nom;
    document.getElementById('champ-lien-acces').value = lienAcces;
    document.getElementById('champ-auth').checked = auth;
    document.getElementById('champ-statut').checked = statut;

    document.getElementById('form-outil').dataset.url = url;

    document.getElementById('modale-ajout').style.display = 'block';
}


// ===============================
// SUPPRESSION OUTIL
// ===============================

function supprimerOutil(outilId, url) {

    if (!confirm("Supprimer cet outil ?")) {
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

        } else {

            alert(data.erreur);
        }

    })

    .catch(() => {

        alert("Erreur réseau.");

    });

}



// ===============================
// RECHERCHE OUTILS
// ===============================

const champRechercheOutils = document.getElementById(
    'champ_recherche_outils'
);


if (champRechercheOutils) {

    champRechercheOutils.addEventListener(
        'input',
        function() {

            const texte = this.value.toLowerCase();

            const outils = document.querySelectorAll(
                '#liste-outils li'
            );


            outils.forEach(function(outil) {

                const nom = outil.textContent.toLowerCase();

                if (nom.includes(texte)) {

                    outil.style.display = "";

                } else {

                    outil.style.display = "none";

                }

            });

        }
    );

}



// ===============================
// AJOUT OUTIL TEAM
// ===============================

const formOutilTeam = document.getElementById(
    'form-outil-team'
);


if (formOutilTeam) {


    formOutilTeam.addEventListener(
        'submit',
        function(e) {


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


                    const select =
                    document.getElementById(
                        'select-outil-team'
                    );


                    const option =
                    document.createElement('option');


                    option.value = data.id;

                    option.textContent = data.nom;

                    option.selected = true;


                    select.appendChild(option);



                    document.getElementById(
                        'modale-outil-team'
                    ).style.display = "none";


                    formOutilTeam.reset();



                } else {


                    document.getElementById(
                        'message-erreur-outil-team'
                    ).textContent =
                    JSON.stringify(data.erreurs);


                }


            });


        }
    );

}



// ===============================
// FORMULAIRE OUTIL (AJOUT / MODIF)
// ===============================

const formOutil = document.getElementById(
    'form-outil'
);



if (formOutil) {


    formOutil.addEventListener(
        'submit',
        function(e) {


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


                    document.getElementById(
                        'modale-ajout'
                    ).style.display = "none";


                    formOutil.reset();


                    window.location.reload();


                } else {


                    document.getElementById(
                        'message-erreur'
                    ).textContent =
                    JSON.stringify(data.erreurs);


                }


            })


            .catch(() => {


                document.getElementById(
                    'message-erreur'
                ).textContent =
                "Erreur réseau.";


            });



        }
    );

}



// rendre les fonctions accessibles depuis le HTML

window.ouvrirModaleAjout = ouvrirModaleAjout;

window.ouvrirModaleModification = ouvrirModaleModification;

window.supprimerOutil = supprimerOutil;