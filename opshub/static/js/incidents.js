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
        afficherToast('Veuillez choisir un fichier Excel.', 'erreur');
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
            afficherToast(data.erreur || 'Échec de l\'import', 'erreur');
            return;
        }

        fermerModaleImportIncidents();
        await chargerListeImportsIncidents();
        await ouvrirModaleIncidents(data.lot_id, data.titre);
        afficherToast('Import réussi', 'succes');
    } catch (erreur) {
        afficherToast('Erreur : ' + erreur.message, 'erreur');
        console.error(erreur);
    }
}

// --- Tooltip d'aperçu (ancré à la ligne survolée) ---

let tooltipApercuIncidents = null;

function creerTooltipApercu() {
    if (tooltipApercuIncidents) return tooltipApercuIncidents;
    tooltipApercuIncidents = document.createElement('div');
    tooltipApercuIncidents.id = 'tooltip-apercu-import-incidents';
    tooltipApercuIncidents.style.cssText = `
        position: fixed;
        display: none;
        background: rgb(250, 246, 224);
        border-radius: 12px;
        padding: 0;
        z-index: 1000;
        width: 480px;
        max-height: 320px;
        overflow: hidden;
        box-shadow: 0 12px 32px rgba(0,0,0,0.18);
        border: 1px solid rgba(0,0,0,0.08);
        opacity: 0;
        transform: translateY(-8px);
        transition: opacity 0.18s ease, transform 0.18s ease;
        pointer-events: none;
        display: flex;
        flex-direction: column;
    `;
    document.body.appendChild(tooltipApercuIncidents);
    return tooltipApercuIncidents;
}

function positionnerTooltip(element) {
    if (!tooltipApercuIncidents) return;
    const rect = element.getBoundingClientRect();
    const marge = 10;

    requestAnimationFrame(() => {
        const largeurTooltip = tooltipApercuIncidents.offsetWidth;

        let left = rect.left;
        left = Math.min(left, window.innerWidth - largeurTooltip - marge);
        left = Math.max(left, marge);

        const top = rect.bottom + marge;

        tooltipApercuIncidents.style.left = `${left}px`;
        tooltipApercuIncidents.style.top = `${top}px`;
        tooltipApercuIncidents.style.opacity = '1';
        tooltipApercuIncidents.style.transform = 'translateY(0)';
    });
}

function cacherTooltip() {
    if (!tooltipApercuIncidents) return;
    tooltipApercuIncidents.style.opacity = '0';
    tooltipApercuIncidents.style.transform = 'translateY(-8px)';
    setTimeout(() => {
        if (tooltipApercuIncidents.style.opacity === '0') {
            tooltipApercuIncidents.style.display = 'none';
        }
    }, 180);
}

function afficherTooltip(element, apercu) {
    const tooltip = creerTooltipApercu();

    let lignesHtml = apercu.map(i => `
        <div style="padding:10px 14px; border-bottom:1px solid rgba(0,0,0,0.08);">
            <div style="display:flex; justify-content:space-between; gap:10px; margin-bottom:4px;">
                <span style="color:#111; font-weight:700; font-size:12px;">${echapperHtml(i.incident_id)}</span>
                <span style="color:#666; font-size:11px;">${echapperHtml(i.owner_email)}</span>
            </div>
            <div style="color:#333; font-size:12px; line-height:1.4; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; margin-bottom:4px;">
                ${echapperHtml(i.description) || '<span style="color:#999;">Aucune description</span>'}
            </div>
            <div style="display:flex; gap:8px; font-size:11px; color:#666;">
                <span>Sévérité : ${echapperHtml(i.severite)}</span>
                <span>•</span>
                <span>RCA : ${i.rca_present ? 'Oui' : 'Non'}</span>
            </div>
        </div>
    `).join('');

    tooltip.innerHTML = `
        <div style="padding:12px 14px; border-bottom:1px solid rgba(0,0,0,0.08); flex-shrink:0; background:var(--primary);">
            <span style="color:#111; font-weight:700; font-size:13px;">Aperçu de l'import</span>
        </div>
        <div style="overflow-y:auto;">
            ${lignesHtml}
        </div>
    `;

    tooltip.style.display = 'flex';
    positionnerTooltip(element);
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
            zone.innerHTML = '<p class="empty-state">Accès interdit</p>';
            return;
        }
        let imports = await res.json();

        if (recherche) {
            imports = imports.filter(imp => imp.titre.toLowerCase().includes(recherche.toLowerCase()));
        }

        if (imports.length === 0) {
            zone.innerHTML = '<p class="empty-state">Aucun import pour l\'instant</p>';
            return;
        }

        zone.innerHTML = '';
        const liste = document.createElement('ul');
        liste.style.cssText = 'list-style:none; background:rgb(246,240,204); border-radius:12px; padding:0; margin:0;';

        imports.forEach((imp, index) => {
            const li = document.createElement('li');
            li.style.cssText = `
                display:flex; align-items:center; justify-content:space-between; gap:16px;
                padding:10px 14px;
                border-bottom: 1px solid rgba(0,0,0,.08);
                background: ${index % 2 === 0 ? 'transparent' : 'rgba(255,204,0,.08)'};
            `;

            const titreZone = document.createElement('div');
            titreZone.style.cursor = 'help';
            titreZone.innerHTML = `<strong style="font-size:15px; color:#111;">${echapperHtml(imp.titre)}</strong> <span style="font-size:11px; color:#888;">(${imp.nombre_incidents} incidents — ${imp.cree_le})</span>`;

            titreZone.addEventListener('mouseenter', () => afficherTooltip(titreZone, imp.apercu));
            titreZone.addEventListener('mouseleave', cacherTooltip);

            const actions = document.createElement('div');
            actions.style.cssText = 'display:flex; gap:8px; flex-shrink:0;';

            const btnVoir = document.createElement('button');
            btnVoir.textContent = 'Voir';
            btnVoir.className = 'btn-primary';
            btnVoir.style.cssText = 'padding:6px 14px; font-size:13px;';
            btnVoir.addEventListener('click', () => ouvrirModaleIncidents(imp.id, imp.titre));

            const btnTelecharger = document.createElement('button');
            btnTelecharger.textContent = 'Télécharger';
            btnTelecharger.className = 'btn-secondary';
            btnTelecharger.style.cssText = 'padding:6px 14px; font-size:13px;';
            btnTelecharger.addEventListener('click', () => telechargerLotIncidents(imp.id, 'xlsx'));

            const btnSupprimer = document.createElement('button');
            btnSupprimer.textContent = 'Supprimer';
            btnSupprimer.className = 'btn-delete';
            btnSupprimer.style.cssText = 'padding:6px 14px; font-size:13px;';
            btnSupprimer.addEventListener('click', () => supprimerLotIncidents(imp.id));

            actions.append(btnVoir, btnTelecharger, btnSupprimer);
            li.append(titreZone, actions);
            liste.appendChild(li);
        });

        zone.appendChild(liste);
    } catch (erreur) {
        console.error('Erreur de chargement des imports :', erreur);
        zone.innerHTML = '<p class="empty-state">Erreur de chargement</p>';
    }
}

async function supprimerLotIncidents(lotId) {
    if (!(await confirmerAction('Supprimer tout cet import (tous ses incidents) ?'))) return;

    try {
        const res = await fetch(`/api/incidents-imports/${lotId}/`, { method: 'DELETE', cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
            afficherToast(data.erreur || 'Échec de la suppression', 'erreur');
            return;
        }
        if (lotIncidentsActuelId === lotId) {
            fermerModaleIncidents();
        }
        await chargerListeImportsIncidents();
        afficherToast('Import supprimé', 'succes');
    } catch (erreur) {
        afficherToast('Erreur : ' + erreur.message, 'erreur');
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
    document.getElementById('modale-incidents').style.display = 'flex';
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
            corps.innerHTML = '<tr><td colspan="13">Accès interdit</td></tr>';
            return;
        }
        const data = await res.json();
        incidentsActuels = data.incidents || [];

        const compteur = document.getElementById('compteur-rca');
        if (compteur) compteur.textContent = `${data.sans_rca} sans RCA sur ${data.total} incidents`;

        if (incidentsActuels.length === 0) {
            corps.innerHTML = '<tr><td colspan="13">Aucun incident trouvé</td></tr>';
            return;
        }

        afficherIncidentsEnLecture();
    } catch (erreur) {
        console.error('Erreur de chargement des incidents :', erreur);
        corps.innerHTML = '<tr><td colspan="13">Erreur de chargement</td></tr>';
    }
}

let timerRechercheModaleIncidents = null;
function rechercherDansModaleIncidents() {
    clearTimeout(timerRechercheModaleIncidents);
    const valeur = document.getElementById('recherche-incident-modale').value;
    timerRechercheModaleIncidents = setTimeout(() => chargerIncidentsDuLot(valeur), 300);
}

async function uploaderRca(incidentPk, fichier) {
    if (!fichier) return;
    if (!fichier.name.toLowerCase().endsWith('.pdf')) {
        afficherToast('Le RCA doit être un fichier PDF.', 'erreur');
        return;
    }

    const formData = new FormData();
    formData.append('rca', fichier);

    try {
        const res = await fetch(`/api/incidents/${incidentPk}/rca/`, { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) {
            afficherToast(data.erreur || 'Échec de l\'upload du RCA', 'erreur');
            return;
        }
        await chargerIncidentsDuLot();
        await chargerListeImportsIncidents();
        afficherToast('RCA ajouté', 'succes');
    } catch (erreur) {
        afficherToast('Erreur : ' + erreur.message, 'erreur');
        console.error(erreur);
    }
}

async function supprimerIncident(pk) {
    if (!(await confirmerAction('Supprimer cet incident ?'))) return;

    try {
        const res = await fetch(`/api/incidents/${pk}/`, { method: 'DELETE', cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
            afficherToast(data.erreur || 'Échec de la suppression', 'erreur');
            return;
        }
        await chargerIncidentsDuLot();
        await chargerListeImportsIncidents();
        afficherToast('Incident supprimé', 'succes');
    } catch (erreur) {
        afficherToast('Erreur : ' + erreur.message, 'erreur');
        console.error(erreur);
    }
}

// --- Édition globale ---

function activerModeEditionGlobalIncidents() {
    const corps = document.getElementById('corps-tableau-incidents');
    const champsEditables = ['incident_id', 'description', 'severite', 'impact', 'affected_service', 'root_cause', 'action_resolution', 'statut_rca', 'owner_email'];

    corps.querySelectorAll('tr').forEach(tr => {
        champsEditables.forEach(champ => {
            const td = tr.querySelector(`[data-champ="${champ}"]`);
            if (!td) return;
            const valeur = td.textContent;

            const champsLongs = ['description', 'impact', 'affected_service', 'root_cause', 'action_resolution'];
            if (champsLongs.includes(champ)) {
                td.style.maxWidth = '300px';
                td.style.width = '300px';
            }

            if (champ === 'incident_id') {
    td.style.minWidth = '130px';
    td.style.width = '130px';
}

            let input;
            if (champ === 'statut_rca') {
                input = document.createElement('select');
                [
                    ['provided', 'Provided'],
                    ['not_provided', 'Not Provided'],
                ].forEach(([val, label]) => {
                    const option = document.createElement('option');
                    option.value = val;
                    option.textContent = label;
                    if (label === valeur) option.selected = true;
                    input.appendChild(option);
                });
            } else if (champsLongs.includes(champ)) {
                input = document.createElement('textarea');
                input.value = valeur;
            } else {
                input = document.createElement('input');
                input.type = 'text';
                input.value = valeur;
            }

            input.style.width = '100%';
            input.dataset.champ = champ;

            if (champsLongs.includes(champ)) {
                input.style.resize = 'none';
                input.style.overflow = 'hidden';
                input.style.fontFamily = 'inherit';
                input.style.fontSize = 'inherit';
                input.style.padding = '6px';
                input.style.boxSizing = 'border-box';
                input.style.lineHeight = '1.4';

                const ajusterHauteur = () => {
                    input.style.height = 'auto';
                    input.style.height = input.scrollHeight + 'px';
                };
                input.addEventListener('input', ajusterHauteur);
                requestAnimationFrame(ajusterHauteur);
            }

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
            afficherToast(`${echecs.length} ligne(s) n'ont pas pu être enregistrées.`, 'erreur');
        } else {
            afficherToast('Modifications enregistrées', 'succes');
        }

        document.getElementById('btn-modifier-global-incidents').style.display = '';
        document.getElementById('btn-enregistrer-global-incidents').style.display = 'none';
        document.getElementById('btn-annuler-global-incidents').style.display = 'none';

        await chargerIncidentsDuLot();
        await chargerListeImportsIncidents();
    } catch (erreur) {
        afficherToast('Erreur : ' + erreur.message, 'erreur');
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
                    ? `<a href="${i.rca_url}" target="_blank" class="detail-link">Voir PDF</a>`
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

async function ouvrirApercuLong() {
    if (!lotIncidentsActuelId) return;

    try {
        const res = await fetch(`/api/incidents-imports/${lotIncidentsActuelId}/apercu-long/`, { cache: 'no-store' });
        const data = await res.json();

        const corps = document.getElementById('corps-apercu-long');
        corps.innerHTML = '';

        data.lignes.forEach(l => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${echapperHtml(l.month)}</td>
                <td>${echapperHtml(l.incident_id)}</td>
                <td style="max-width:250px; white-space:pre-wrap;">${echapperHtml(l.description)}</td>
                <td>${echapperHtml(l.date_signalement)}</td>
                <td>${echapperHtml(l.severite)}</td>
                <td>${echapperHtml(l.statut_rca)}</td>
                <td style="max-width:150px; white-space:pre-wrap;">${echapperHtml(l.impact)}</td>
                <td style="max-width:150px; white-space:pre-wrap;">${echapperHtml(l.affected_service)}</td>
                <td style="max-width:150px; white-space:pre-wrap;">${echapperHtml(l.root_cause)}</td>
                <td style="max-width:200px; white-space:pre-wrap;">${echapperHtml(l.action_resolution)}</td>
                <td>${echapperHtml(l.duree)}</td>
                <td>${echapperHtml(l.team)}</td>
                <td>${echapperHtml(l.in_charge)}</td>
                <td>${echapperHtml(l.service_now_status)}</td>
                <td>${echapperHtml(l.close_date)}</td>
                <td>${echapperHtml(l.rca)}</td>
            `;
            corps.appendChild(tr);
        });

        document.getElementById('modale-apercu-long').style.display = 'block';
    } catch (erreur) {
        alert('Erreur lors du chargement de l\'aperçu : ' + erreur.message);
        console.error(erreur);
    }
}

function fermerApercuLong() {
    document.getElementById('modale-apercu-long').style.display = 'none';
}