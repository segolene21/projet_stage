// --- Moteur de visite guidée ---

// Stocke l'etape courante de la visite guidee.
let etapesTourActuel = [];
let indexTourActuel = 0;

function demarrerVisite(cleConfig) {
    // Demarre la visite guidee correspondant a la page.
    const etapes = CONFIGURATION_TOURS[cleConfig];
    if (!etapes || !Array.isArray(etapes) || etapes.length === 0) return;

    etapesTourActuel = etapes;
    indexTourActuel = 0;
    creerOverlayTour();
    afficherEtapeTour();
}

function creerOverlayTour() {
    // Cree l'arriere-plan de la visite guidee.
    if (document.getElementById('tour-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'tour-overlay';
    overlay.className = 'tour-overlay';
    document.body.appendChild(overlay);

    const bulle = document.createElement('div');
    bulle.id = 'tour-bulle';
    bulle.className = 'tour-bulle';
    bulle.innerHTML = `
        <p id="tour-texte"></p>
        <div class="tour-actions">
            <span id="tour-progression"></span>
            <div>
                <button id="tour-precedent" onclick="etapePrecedenteTour()">Précédent</button>
                <button id="tour-suivant" onclick="etapeSuivanteTour()">Suivant</button>
                <button id="tour-fermer" onclick="fermerTour()">Terminer</button>
            </div>
        </div>
    `;
    document.body.appendChild(bulle);
}
function afficherEtapeTour() {
    // Affiche l'etape active de la visite guidee.
    const etape = etapesTourActuel[indexTourActuel];
    if (!etape) { fermerTour(); return; }

    if (etape.avant) etape.avant();

    document.querySelectorAll('.tour-cible').forEach(el => el.classList.remove('tour-cible'));

    const cible = document.querySelector(etape.selecteur);
    const bulle = document.getElementById('tour-bulle');
    const overlay = document.getElementById('tour-overlay');

    if (!cible) {
        etapeSuivanteTour();
        return;
    }

    cible.classList.add('tour-cible');
    cible.scrollIntoView({ behavior: 'smooth', block: 'center' });
    overlay.style.display = 'block';

    setTimeout(() => {
        const rect = cible.getBoundingClientRect();
        bulle.style.top = `${rect.bottom + window.scrollY + 12}px`;
        bulle.style.left = `${Math.max(12, rect.left + window.scrollX)}px`;
        bulle.style.display = 'block';
    }, 300);

    document.getElementById('tour-texte').textContent = etape.texte;
    document.getElementById('tour-progression').textContent = `${indexTourActuel + 1} / ${etapesTourActuel.length}`;
    document.getElementById('tour-precedent').style.visibility = indexTourActuel === 0 ? 'hidden' : 'visible';
    document.getElementById('tour-suivant').style.display = indexTourActuel === etapesTourActuel.length - 1 ? 'none' : 'inline-block';
    document.getElementById('tour-fermer').style.display = 'inline-block';
}

function etapeSuivanteTour() {
    // Passe a l'etape suivante de la visite.
    indexTourActuel++;
    if (indexTourActuel >= etapesTourActuel.length) { fermerTour(); return; }
    afficherEtapeTour();
}

function etapePrecedenteTour() {
    // Revient a l'etape precedente de la visite.
    if (indexTourActuel > 0) {
        indexTourActuel--;
        afficherEtapeTour();
    }
}

function fermerTour() {
    // Ferme la visite guidee et nettoie son interface.
    document.querySelectorAll('.tour-cible').forEach(el => el.classList.remove('tour-cible'));
    const overlay = document.getElementById('tour-overlay');
    const bulle = document.getElementById('tour-bulle');
    if (overlay) overlay.style.display = 'none';
    if (bulle) bulle.style.display = 'none';
}

// --- Configuration : une entrée par page, avec ses étapes ---

const CONFIGURATION_TOURS = {

    outils: [
        { selecteur: '.outils-header button.btn-primary', texte: "Ajoutez un nouvel outil de monitoring au catalogue." },
        { selecteur: '#champ_recherche_outils', texte: "Recherchez un outil par son nom." },
        { selecteur: 'select[name="team"]', texte: "Filtrez les outils par équipe responsable." },
        { selecteur: 'select[name="authentification"]', texte: "Filtrez selon que l'outil nécessite ou non une authentification." },
        { selecteur: 'select[name="statut"]', texte: "Filtrez les outils actifs ou inactifs." },
        { selecteur: '#champ-nom', texte: "Formulaire d'ajout : le nom de l'outil.", avant: () => { const m = document.getElementById('modale-ajout'); if (m) m.style.display = 'flex'; } },
        { selecteur: '#champ-lien-acces', texte: "L'URL ou lien d'accès à l'outil." },
        { selecteur: '#champ-auth', texte: "Cochez si une authentification est requise pour cet outil." },
        { selecteur: '#champ-statut', texte: "Décochez pour créer l'outil directement en statut inactif." },
        { selecteur: '#select-outil-team', texte: "Choisissez l'équipe responsable, avec ses contacts." },
        { selecteur: '#liste-outils', texte: "La liste des outils existants. Cliquez sur un nom pour voir sa fiche détaillée.", avant: () => { const m = document.getElementById('modale-ajout'); if (m) m.style.display = 'none'; } },
    ],

    services: [
        { selecteur: '.outils-header button.btn-primary', texte: "Ajoutez un nouveau service." },
        { selecteur: '#champ_recherche_services', texte: "Recherchez un service par son nom." },
        { selecteur: 'select[name="outil"]', texte: "Filtrez les services couverts par un outil précis." },
        { selecteur: '#modale-ajout-service input[name="nom"]', texte: "Le nom du service.", avant: () => { const m = document.getElementById('modale-ajout-service'); if (m) m.style.display = 'flex'; } },
        { selecteur: '#modale-ajout-service textarea[name="description"]', texte: "Une description du service." },
        { selecteur: '#modale-ajout-service .checkbox-list', texte: "Cochez le ou les outils de monitoring qui couvrent ce service." },
        { selecteur: '#liste-services', texte: "La liste des services existants, avec Modifier et Supprimer.", avant: () => { const m = document.getElementById('modale-ajout-service'); if (m) m.style.display = 'none'; } },
    ],

    mots_cles: [
        { selecteur: '.outils-header button.btn-primary', texte: "Ajoutez un nouveau mot-clé d'assignation." },
        { selecteur: '#champ_recherche_mots_cles', texte: "Recherchez un mot-clé." },
        { selecteur: 'select[name="equipe"]', texte: "Filtrez les mots-clés par équipe." },
        { selecteur: '#modale-ajout-mc input[name="intitule"]', texte: "L'intitulé du mot-clé.", avant: () => { const m = document.getElementById('modale-ajout-mc'); if (m) m.style.display = 'flex'; } },
        { selecteur: '#select-equipe-ajout', texte: "L'équipe à laquelle rattacher ce mot-clé." },
        { selecteur: '#modale-ajout-mc .btn-secondary[onclick*="ouvrirModaleEquipe"]', texte: "Pas d'équipe existante ? Créez-en une nouvelle ici." },
        { selecteur: '#table-mots-cles', texte: "Le tableau des mots-clés, avec le nombre de membres de chaque équipe.", avant: () => { const m = document.getElementById('modale-ajout-mc'); if (m) m.style.display = 'none'; } },
    ],

    tickets: [
        { selecteur: '.outils-header button.btn-primary', texte: "Importez un fichier de tickets exporté depuis ServiceNow." },
        { selecteur: '#recherche-import', texte: "Recherchez un import existant par son titre." },
        { selecteur: '#filtre-periode-type', texte: "Filtrez les imports par semaine, mois ou année." },
        { selecteur: '#titre-import', texte: "Donnez un titre à votre import, par exemple 'Tickets semaine 33'.", avant: () => { const m = document.getElementById('modale-import'); if (m) m.style.display = 'flex'; } },
        { selecteur: '#fichier-ticket', texte: "Sélectionnez votre fichier Excel ServiceNow ici." },
        { selecteur: '#btn-confirmer', texte: "Une fois l'aperçu vérifié, cliquez ici pour valider l'import.", avant: () => { const m = document.getElementById('modale-import'); if (m) m.style.display = 'none'; } },
        { selecteur: '#liste-imports', texte: "Chaque bloc représente un import. Survolez le titre pour un aperçu, ou cliquez 'Voir' pour ouvrir le détail complet." },
    ],

    incidents: [
        { selecteur: '.outils-header button.btn-primary', texte: "Importez un fichier d'incidents exporté depuis ServiceNow." },
        { selecteur: '#frequence-rappels', texte: "Réglez ici la fréquence (en jours) des relances automatiques pour les RCA manquants." },
        { selecteur: '#filtre-periode-type-incidents', texte: "Filtrez les imports par période." },
        { selecteur: '#titre-import-incidents', texte: "Donnez un titre à votre import d'incidents.", avant: () => { const m = document.getElementById('modale-import-incidents'); if (m) m.style.display = 'flex'; } },
        { selecteur: '#fichier-incidents', texte: "Sélectionnez le fichier Excel ServiceNow des incidents." },
        { selecteur: '#liste-imports-incidents', texte: "Chaque bloc est un import d'incidents. Cliquez 'Voir' pour ouvrir le détail.", avant: () => { const m = document.getElementById('modale-import-incidents'); if (m) m.style.display = 'none'; } },
    ],

    feedback: [
        { selecteur: '.outils-header button.btn-primary', texte: "Soumettez un feedback sur un shift." },
        { selecteur: '#filtre_feedbacks', texte: "Filtrez les feedbacks par shift ou par date." },
        { selecteur: '#modale-feedback select[name="plage_shift"]', texte: "Choisissez la plage horaire concernée : matin, après-midi ou nuit.", avant: () => { const m = document.getElementById('modale-feedback'); if (m) m.style.display = 'flex'; } },
        { selecteur: '#modale-feedback textarea[name="description"]', texte: "Décrivez votre retour sur ce shift." },
        { selecteur: '#liste-feedbacks', texte: "Chaque carte est un feedback. Vous pouvez supprimer les vôtres.", avant: () => { const m = document.getElementById('modale-feedback'); if (m) m.style.display = 'none'; } },
    ],

    parametres: [
        { selecteur: '#toggle-theme', texte: "Basculez entre le mode clair et le mode sombre." },
        { selecteur: '.modal-box form', texte: "Modifiez votre prénom, nom, email ou adresse ici." },
        { selecteur: '.settings-link', texte: "Cliquez ici pour changer votre mot de passe." },
    ],

    utilisateurs: [
        { selecteur: '.outils-header button.btn-primary', texte: "Créez un nouveau compte utilisateur et assignez-lui un rôle." },
        { selecteur: '.filtres-recherche', texte: "Recherchez un utilisateur ou filtrez par statut actif/inactif." },
        { selecteur: '.btn-action-edit', texte: "Ce bouton active ou désactive un compte." },
    ],

    plaintes: [
    { selecteur: '.outils-header button.btn-primary', texte: "Soumettez une plainte, anonyme si vous le souhaitez." },
    { selecteur: '#filtre_plaintes', texte: "Filtrez les plaintes par texte." },
    { selecteur: '#filtre_date_plaintes', texte: "Filtrez les plaintes par date." },
    { selecteur: '#modale-plainte textarea[name="contenu"]', texte: "Décrivez votre plainte ici.", avant: () => { const m = document.getElementById('modale-plainte'); if (m) m.style.display = 'flex'; } },
    { selecteur: '#modale-plainte input[name="anonyme"]', texte: "Cochez cette case pour soumettre votre plainte de façon anonyme." },
    { selecteur: '#liste-plaintes', texte: "Chaque carte est une plainte. Vous pouvez supprimer les vôtres.", avant: () => { const m = document.getElementById('modale-plainte'); if (m) m.style.display = 'none'; } },
],
recommandations: [
    { selecteur: '.outils-header button.btn-primary', texte: "Soumettez une recommandation pour améliorer les process." },
    { selecteur: '#filtre_recommandations', texte: "Filtrez les recommandations par texte." },
    { selecteur: '#filtre_date_recommandations', texte: "Filtrez les recommandations par date." },
    { selecteur: '#modale-recommandation textarea[name="contenu"]', texte: "Décrivez votre recommandation ici.", avant: () => { const m = document.getElementById('modale-recommandation'); if (m) m.style.display = 'flex'; } },
    { selecteur: '#liste-recommandations', texte: "Chaque carte est une recommandation. Vous pouvez supprimer les vôtres.", avant: () => { const m = document.getElementById('modale-recommandation'); if (m) m.style.display = 'none'; } },
],

};
// --- Auto-démarrage si l'URL contient ?tour=xxx ---

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const tour = params.get('tour');
    if (tour && CONFIGURATION_TOURS[tour]) {
        setTimeout(() => demarrerVisite(tour), 500);
    }
});