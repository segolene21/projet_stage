let donneesIncidents = null;
let lotIncidentsActuelId = null;
let incidentsActuels = [];

function echapperHtml(texte) {
    const div = document.createElement('div');
    div.textContent = texte || '';
    return div.innerHTML;
}

// --- Import ---

function fermerModaleImportIncidents() {
    document.getElementById('modale-import-incidents').style.display = 'none';
    document.getElementById('apercu-incidents').style.display = 'none';
    document.getElementById('fichier-incidents').value = '';
    document.getElementById('titre-import-incidents').value = '';
    donneesIncidents = null;
}

function previsualiserIncidents(input) {
    const fichier = input.files[0];
    if (!fichier) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const lignes = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        donneesIncidents = lignes;

        if (lignes.length === 0) {
            document.getElementById('tableau-apercu-incidents').innerHTML = '<p>Fichier vide</p>';
            document.getElementById('apercu-incidents').style.display = 'block';
            return;
        }

        const entetes = Object.keys(lignes[0]);
        let html = '<table style="width:100%; border-collapse:collapse; font-size:12px;">';
        html += '<tr>';
        entetes.forEach(e => {
            html += `<th style="background:#1a1a1a; color:#FFCC00; padding:8px; text-align:left;">${echapperHtml(e)}</th>`;
        });
        html += '</tr>';

        lignes.forEach(ligne => {
            html += '<tr>';
            entetes.forEach(e => {
                html += `<td style="padding:8px; border-bottom:1px solid #eee; max-width:250px; white-space:pre-wrap; word-wrap:break-word;">${echapperHtml(ligne[e])}</td>`;
            });
            html += '</tr>';
        });
        html += '</table>';

        document.getElementById('tableau-apercu-incidents').innerHTML = html;
        document.getElementById('apercu-incidents').style.display = 'block';
    };
    reader.readAsArrayBuffer(fichier);
}

async function confirmerImportIncidents() {
    const inputFichier = document.getElementById('fichier-incidents');
    const fichier = inputFichier.files[0];
    if (!fichier) {
        alert('Veuillez choisir un fichier Excel.');
        return;
    }

    const titre = document.getElementById('titre-import-incidents').value.trim();

    const formData = new FormData();
    formData.append('fichier', fichier);
    formData.append('titre', titre);

    try {
        const res = await fetch('/api/incidents-imports/import/', { method: 'POST', body: formData });
        const data = await res.json();

        if (!res.ok) {
            alert(data.erreur || 'Échec de l\'import');
            return;
        }

        fermerModaleImportIncidents();
        await chargerListeImportsIncidents();
        await ouvrirModaleIncidents(data.lot_id, data.titre);
    } catch (erreur) {
        alert('Erreur : ' + erreur.message);
        console.error(erreur);
    }
}

// --- Liste des imports ---

let tooltipApercu = null;

function creerTooltipApercu() {
    if (tooltipApercu) return tooltipApercu;
    tooltipApercu = document.createElement('div');
    tooltipApercu.id = 'tooltip-apercu-import';
    tooltipApercu.style.cssText = `
        position: fixed;
        display: none;
        background: white;
        border: 1px solid #ccc;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        border-radius: 6px;
        padding: 10px;
        z-index: 1000;
        max-width: 700px;
        max-height: 400px;
        overflow: auto;
        font-size: 12px;
    `;
    document.body.appendChild(tooltipApercu);
    return tooltipApercu;
}

function afficherTooltip(evenement, apercu) {
    const tooltip = creerTooltipApercu();

    let html = '<table style="border-collapse:collapse; width:100%;">';
    html += '<tr><th style="text-align:left; padding:4px; border-bottom:1px solid #ccc;">ID</th><th style="text-align:left; padding:4px; border-bottom:1px solid #ccc;">Description</th><th style="text-align:left; padding:4px; border-bottom:1px solid #ccc;">Severity</th><th style="text-align:left; padding:4px; border-bottom:1px solid #ccc;">Owner</th><th style="text-align:left; padding:4px; border-bottom:1px solid #ccc;">RCA</th></tr>';

    apercu.forEach(i => {
        html += `<tr>
            <td style="padding:4px; border-bottom:1px solid #eee;">${echapperHtml(i.incident_id)}</td>
            <td style="padding:4px; border-bottom:1px solid #eee; max-width:250px;">${echapperHtml(i.description)}</td>
            <td style="padding:4px; border-bottom:1px solid #eee;">${echapperHtml(i.severite)}</td>
            <td style="padding:4px; border-bottom:1px solid #eee;">${echapperHtml(i.owner_email)}</td>
            <td style="padding:4px; border-bottom:1px solid #eee;">${i.rca_present ? 'Oui' : 'Non'}</td>
        </tr>`;
    });
    html += '</table>';

    tooltip.innerHTML = html;
    tooltip.style.display = 'block';

    positionnerTooltip(evenement);
}

function positionnerTooltip(evenement) {
    if (!tooltipApercu) return;
    const marge = 12;
    let x = evenement.clientX + marge;
    let y = evenement.clientY + marge;

    const largeurTooltip = tooltipApercu.offsetWidth;
    const hauteurTooltip = tooltipApercu.offsetHeight;

    if (x + largeurTooltip > window.innerWidth) {
        x = evenement.clientX - largeurTooltip - marge;
    }
    if (y + hauteurTooltip > window.innerHeight) {
        y = evenement.clientY - hauteurTooltip - marge;
    }

    tooltipApercu.style.left = `${x}px`;
    tooltipApercu.style.top = `${y}px`;
}

function cacherTooltip() {
    if (tooltipApercu) tooltipApercu.style.display = 'none';
}
async function chargerListeImportsIncidents(recherche = '') {
    const zone = document.getElementById('liste-imports-incidents');
    if (!zone) return;

    const periodeType = document.getElementById('filtre-periode-type-incidents')?.value || '';
    const annee = document.getElementById('filtre-annee-incidents')?.value || '';
    const mois = document.getElementById('filtre-mois-incidents')?.value || '';
    const semaine = document.getElementById('filtre-semaine-incidents')?.value || '';

    const params = new URLSearchParams();
    if (periodeType) params.set('periode_type', periodeType);
    if (annee) params.set('annee', annee);
    if (mois) params.set('mois', mois);
    if (semaine) params.set('semaine', semaine);

    try {
        const res = await fetch(`/api/incidents-imports/?${params.toString()}`, { cache: 'no-store' });
        if (res.status === 403) {
            zone.innerHTML = '<p>Accès interdit</p>';
            return;
        }
        let imports = await res.json();

        if (recherche) {
            imports = imports.filter(imp => imp.titre.toLowerCase().includes(recherche.toLowerCase()));
        }

        if (imports.length === 0) {
            zone.innerHTML = '<p>Aucun import pour l\'instant</p>';
            return;
        }

        zone.innerHTML = '';
        imports.forEach(imp => {
            const ligne = document.createElement('div');
            ligne.className = 'ligne-import';
            ligne.style.cssText = 'display:flex; align-items:center; justify-content:space-between; padding:10px; border-bottom:1px solid #eee; cursor:default;';

            const titreZone = document.createElement('div');
            titreZone.innerHTML = `<strong>${echapperHtml(imp.titre)}</strong> <span style="font-size:11px; color:#888;">(${imp.nombre_incidents} incidents — ${imp.cree_le})</span>`;
            titreZone.style.cursor = 'help';

            titreZone.addEventListener('mouseenter', (e) => afficherTooltip(e, imp.apercu));
            titreZone.addEventListener('mousemove', (e) => positionnerTooltip(e));
            titreZone.addEventListener('mouseleave', cacherTooltip);

            const actions = document.createElement('div');
            const btnVoir = document.createElement('button');
            btnVoir.textContent = 'Voir';
            btnVoir.addEventListener('click', () => ouvrirModaleIncidents(imp.id, imp.titre));

            const btnTelecharger = document.createElement('button');
            btnTelecharger.textContent = 'Télécharger';
            btnTelecharger.addEventListener('click', () => telechargerLotIncidents(imp.id, 'xlsx'));

            const btnSupprimer = document.createElement('button');
            btnSupprimer.textContent = 'Supprimer';
            btnSupprimer.className = 'btn-delete';
            btnSupprimer.addEventListener('click', () => supprimerLotIncidents(imp.id));

            actions.append(btnVoir, btnTelecharger, btnSupprimer);
            ligne.append(titreZone, actions);
            zone.appendChild(ligne);
        });
    } catch (erreur) {
        console.error('Erreur de chargement des imports :', erreur);
        zone.innerHTML = '<p>Erreur de chargement</p>';
    }
}

async function supprimerLotIncidents(lotId) {
    if (!confirm('Supprimer tout cet import (tous ses incidents) ?')) return;

    try {
        const res = await fetch(`/api/incidents-imports/${lotId}/`, { method: 'DELETE', cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
            alert(data.erreur || 'Échec de la suppression');
            return;
        }
        if (lotIncidentsActuelId === lotId) {
            fermerModaleIncidents();
        }
        await chargerListeImportsIncidents();
    } catch (erreur) {
        alert('Erreur : ' + erreur.message);
        console.error(erreur);
    }
}

function supprimerLotIncidentsActuel() {
    if (!lotIncidentsActuelId) return;
    supprimerLotIncidents(lotIncidentsActuelId);
}

// --- Modale : tableau complet, édition globale ---

async function ouvrirModaleIncidents(lotId, titre) {
    lotIncidentsActuelId = lotId;
    document.getElementById('titre-modale-incidents').textContent = titre || 'Incidents';
    document.getElementById('modale-incidents').style.display = 'block';
    document.getElementById('recherche-incident-modale').value = '';
    document.getElementById('filtre-rca').value = '';
    await chargerIncidentsDuLot();
}

function fermerModaleIncidents() {
    document.getElementById('modale-incidents').style.display = 'none';
    lotIncidentsActuelId = null;
}

async function chargerIncidentsDuLot(recherche = '') {
    const corps = document.getElementById('corps-tableau-incidents');
    if (!corps || !lotIncidentsActuelId) return;

    const rcaStatut = document.getElementById('filtre-rca')?.value || '';
    const params = new URLSearchParams();
    if (recherche) params.set('q', recherche);
    if (rcaStatut) params.set('rca', rcaStatut);

    try {
        const url = `/api/incidents-imports/${lotIncidentsActuelId}/incidents/?${params.toString()}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (res.status === 403) {
            corps.innerHTML = '<tr><td colspan="9">Accès interdit</td></tr>';
            return;
        }
        const data = await res.json();
        incidentsActuels = data.incidents || [];

        const compteur = document.getElementById('compteur-rca');
        if (compteur) compteur.textContent = `${data.sans_rca} sans RCA sur ${data.total} incidents`;

        if (incidentsActuels.length === 0) {
            corps.innerHTML = '<tr><td colspan="9">Aucun incident trouvé</td></tr>';
            return;
        }

        afficherIncidentsEnLecture();
    } catch (erreur) {
        console.error('Erreur de chargement des incidents :', erreur);
        corps.innerHTML = '<tr><td colspan="9">Erreur de chargement</td></tr>';
    }
}

let timerRechercheModaleIncidents = null;
function rechercherDansModaleIncidents() {
    clearTimeout(timerRechercheModaleIncidents);
    const valeur = document.getElementById('recherche-incident-modale').value;
    timerRechercheModaleIncidents = setTimeout(() => chargerIncidentsDuLot(valeur), 300);
}
const champsEditables = ['incident_id', 'description', 'severite', 'impact', 'affected_service', 'root_cause', 'action_resolution', 'statut_rca', 'owner_email',];

async function uploaderRca(incidentPk, fichier) {
    if (!fichier) return;
    if (!fichier.name.toLowerCase().endsWith('.pdf')) {
        alert('Le RCA doit être un fichier PDF.');
        return;
    }

    const formData = new FormData();
    formData.append('rca', fichier);

    try {
        const res = await fetch(`/api/incidents/${incidentPk}/rca/`, { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) {
            alert(data.erreur || 'Échec de l\'upload du RCA');
            return;
        }
        await chargerIncidentsDuLot();
        await chargerListeImportsIncidents();
    } catch (erreur) {
        alert('Erreur : ' + erreur.message);
        console.error(erreur);
    }
}

async function supprimerIncident(pk) {
    if (!confirm('Supprimer cet incident ?')) return;

    try {
        const res = await fetch(`/api/incidents/${pk}/`, { method: 'DELETE', cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
            alert(data.erreur || 'Échec de la suppression');
            return;
        }
        await chargerIncidentsDuLot();
        await chargerListeImportsIncidents();
    } catch (erreur) {
        alert('Erreur : ' + erreur.message);
        console.error(erreur);
    }
}

// --- Édition globale ---

function activerModeEditionGlobalIncidents() {
    const corps = document.getElementById('corps-tableau-incidents');
    const champsEditables = ['incident_id', 'description', 'severite', 'impact', 'owner_email', 'statut'];

    corps.querySelectorAll('tr').forEach(tr => {
        champsEditables.forEach(champ => {
            const td = tr.querySelector(`[data-champ="${champ}"]`);
            if (!td) return;
            const valeur = td.textContent;

            let input;
            if (champ === 'statut') {
                input = document.createElement('select');
                ['ouvert', 'en_cours', 'resolu', 'ferme'].forEach(val => {
                    const option = document.createElement('option');
                    option.value = val;
                    option.textContent = val;
                    if (val === valeur) option.selected = true;
                    input.appendChild(option);
                });
            } else if (champ === 'description' || champ === 'impact') {
                input = document.createElement('textarea');
                input.value = valeur;
            } else {
                input = document.createElement('input');
                input.type = 'text';
                input.value = valeur;
            }
            input.style.width = '100%';
            input.dataset.champ = champ;

            td.textContent = '';
            td.appendChild(input);
        });
    });

    document.getElementById('btn-modifier-global-incidents').style.display = 'none';
    document.getElementById('btn-enregistrer-global-incidents').style.display = '';
    document.getElementById('btn-annuler-global-incidents').style.display = '';
}

function annulerModificationsGlobalesIncidents() {
    afficherIncidentsEnLecture();
    document.getElementById('btn-modifier-global-incidents').style.display = '';
    document.getElementById('btn-enregistrer-global-incidents').style.display = 'none';
    document.getElementById('btn-annuler-global-incidents').style.display = 'none';
}

async function enregistrerModificationsGlobalesIncidents() {
    const corps = document.getElementById('corps-tableau-incidents');
    const lignes = corps.querySelectorAll('tr');
    const requetes = [];

    lignes.forEach(tr => {
        const pk = tr.dataset.pk;
        const donnees = {};
        tr.querySelectorAll('[data-champ]').forEach(td => {
            const input = td.querySelector('input, textarea, select');
            if (input) donnees[input.dataset.champ] = input.value;
        });

        requetes.push(
            fetch(`/api/incidents/${pk}/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(donnees),
            }).then(res => res.json().then(data => ({ ok: res.ok, pk, data })))
        );
    });

    try {
        const resultats = await Promise.all(requetes);
        const echecs = resultats.filter(r => !r.ok);

        if (echecs.length > 0) {
            alert(`${echecs.length} ligne(s) n'ont pas pu être enregistrées.`);
        }

        document.getElementById('btn-modifier-global-incidents').style.display = '';
        document.getElementById('btn-enregistrer-global-incidents').style.display = 'none';
        document.getElementById('btn-annuler-global-incidents').style.display = 'none';

        await chargerIncidentsDuLot();
        await chargerListeImportsIncidents();
    } catch (erreur) {
        alert('Erreur : ' + erreur.message);
        console.error(erreur);
    }
}

// --- Téléchargement ---

function telechargerLotIncidents(lotId, format) {
    window.location.href = `/api/incidents-imports/${lotId}/export/?format=${format}`;
}

function telechargerLotIncidentsActuel(format) {
    if (!lotIncidentsActuelId) return;
    telechargerLotIncidents(lotIncidentsActuelId, format);
}

// --- Init ---

document.addEventListener('DOMContentLoaded', () => {
    chargerListeImportsIncidents();
});

function afficherIncidentsEnLecture() {
    const corps = document.getElementById('corps-tableau-incidents');
    corps.innerHTML = '';

    incidentsActuels.forEach(i => {
        const tr = document.createElement('tr');
        tr.dataset.pk = i.id;

        tr.innerHTML = `
            <td data-champ="incident_id">${echapperHtml(i.incident_id)}</td>
            <td data-champ="description" style="max-width:250px; white-space:pre-wrap; word-wrap:break-word;">${echapperHtml(i.description)}</td>
            <td>${echapperHtml(i.date_signalement)}</td>
            <td data-champ="severite">${echapperHtml(i.severite)}</td>
            <td data-champ="impact" style="max-width:200px; white-space:pre-wrap; word-wrap:break-word;">${echapperHtml(i.impact)}</td>
            <td data-champ="affected_service" style="max-width:200px; white-space:pre-wrap; word-wrap:break-word;">${echapperHtml(i.affected_service)}</td>
            <td data-champ="root_cause" style="max-width:200px; white-space:pre-wrap; word-wrap:break-word;">${echapperHtml(i.root_cause)}</td>
            <td data-champ="action_resolution" style="max-width:200px; white-space:pre-wrap; word-wrap:break-word;">${echapperHtml(i.action_resolution)}</td>
            <td>${echapperHtml(i.duree)}</td>
            <td data-champ="statut_rca">${echapperHtml(i.statut_rca)}</td>
            <td data-champ="owner_email">${echapperHtml(i.owner_email)}</td>
            <td data-role="rca-cell">
                ${i.rca_present
                    ? `<a href="${i.rca_url}" target="_blank">Voir PDF</a>`
                    : `<input type="file" accept=".pdf" data-action="upload-rca" />`
                }
            </td>
            <td><button class="btn-delete" data-action="supprimer">Supprimer</button></td>
        `;

        tr.querySelector('[data-action="supprimer"]').addEventListener('click', () => supprimerIncident(i.id));
        const inputRca = tr.querySelector('[data-action="upload-rca"]');
        if (inputRca) inputRca.addEventListener('change', () => uploaderRca(i.id, inputRca.files[0]));

        corps.appendChild(tr);
    });
}
function changerTypeFiltreIncidents() {
    const type = document.getElementById('filtre-periode-type-incidents').value;
    const selectAnnee = document.getElementById('filtre-annee-incidents');
    const selectMois = document.getElementById('filtre-mois-incidents');
    const inputSemaine = document.getElementById('filtre-semaine-incidents');

    selectAnnee.style.display = (type === 'annee' || type === 'mois' || type === 'semaine') ? 'inline-block' : 'none';
    selectMois.style.display = (type === 'mois') ? 'inline-block' : 'none';
    inputSemaine.style.display = (type === 'semaine') ? 'inline-block' : 'none';

    if (selectAnnee.options.length === 0) {
        const anneeActuelle = new Date().getFullYear();
        for (let a = anneeActuelle; a >= anneeActuelle - 5; a--) {
            const option = document.createElement('option');
            option.value = a;
            option.textContent = a;
            selectAnnee.appendChild(option);
        }
    }

    chargerListeImportsIncidents();
}

function reinitialiserFiltresImportsIncidents() {
    document.getElementById('filtre-periode-type-incidents').value = '';
    document.getElementById('filtre-annee-incidents').style.display = 'none';
    document.getElementById('filtre-mois-incidents').style.display = 'none';
    document.getElementById('filtre-semaine-incidents').style.display = 'none';
    document.getElementById('filtre-semaine-incidents').value = '';
    chargerListeImportsIncidents();
}