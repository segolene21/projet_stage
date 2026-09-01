// --- Moteur de visite guidée ---

let etapesTourActuel = [];
let indexTourActuel = 0;

function demarrerVisite(cleConfig) {
    const etapes = CONFIGURATION_TOURS[cleConfig];
    if (!etapes) return;

    etapesTourActuel = etapes;
    indexTourActuel = 0;
    creerOverlayTour();
    afficherEtapeTour();
}

function creerOverlayTour() {
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
    const etape = etapesTourActuel[indexTourActuel];
    if (!etape) { fermerTour(); return; }

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
}

function etapeSuivanteTour() {
    indexTourActuel++;
    if (indexTourActuel >= etapesTourActuel.length) { fermerTour(); return; }
    afficherEtapeTour();
}

function etapePrecedenteTour() {
    if (indexTourActuel > 0) {
        indexTourActuel--;
        afficherEtapeTour();
    }
}

function fermerTour() {
    document.querySelectorAll('.tour-cible').forEach(el => el.classList.remove('tour-cible'));
    const overlay = document.getElementById('tour-overlay');
    const bulle = document.getElementById('tour-bulle');
    if (overlay) overlay.style.display = 'none';
    if (bulle) bulle.style.display = 'none';
}

// --- Configuration : une entrée par page, avec ses étapes ---

const CONFIGURATION_TOURS = {
    tickets: [
        { selecteur: '.outils-header button.btn-primary', texte: "Cliquez ici pour importer un nouveau fichier de tickets depuis ServiceNow." },
        { selecteur: '#recherche-import', texte: "Recherchez un import existant par son titre." },
        { selecteur: '#filtre-periode-type', texte: "Filtrez les imports par période : semaine, mois ou année." },
        { selecteur: '#liste-imports', texte: "Chaque bloc est un import. Survolez le titre pour un aperçu, ou cliquez 'Voir' pour ouvrir le détail complet." },
    ],
    incidents: [
        { selecteur: '.outils-header button.btn-primary', texte: "Importez un fichier d'incidents exporté depuis ServiceNow." },
        { selecteur: '#filtre-periode-type-incidents', texte: "Filtrez les imports par période." },
        { selecteur: '#liste-imports-incidents', texte: "Chaque bloc est un import d'incidents. Cliquez 'Voir' pour ouvrir le détail." },
    ],
    outils: [
        { selecteur: '.outils-header button.btn-primary', texte: "Ajoutez un nouvel outil de monitoring au catalogue." },
        { selecteur: '.filtres-outils, form.filtres-outils', texte: "Filtrez par équipe, service, authentification ou statut." },
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
};

// --- Auto-démarrage si l'URL contient ?tour=xxx ---

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const tour = params.get('tour');
    if (tour && CONFIGURATION_TOURS[tour]) {
        setTimeout(() => demarrerVisite(tour), 500);
    }
});