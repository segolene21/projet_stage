let donneesTicket = null;
let lotActuelId = null;

function echapperHtml(texte) {
    const div = document.createElement('div');
    div.textContent = texte || '';
    return div.innerHTML;
}

// --- Import ---

function fermerModaleImport() {
    document.getElementById('modale-import').style.display = 'none';
    document.getElementById('apercu-ticket').style.display = 'none';
    document.getElementById('fichier-ticket').value = '';
    document.getElementById('titre-import').value = '';
    donneesTicket = null;

document.querySelector('#modale-import .modal-box').style.background = '';
}

function previsualiserTicket(input) {
    const fichier = input.files[0];
    if (!fichier) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const lignes = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        donneesTicket = lignes;

        if (lignes.length === 0) {
            document.getElementById('tableau-ticket').innerHTML = '<p>Fichier vide</p>';
            document.getElementById('apercu-ticket').style.display = 'block';
            return;
        }

        const entetes = Object.keys(lignes[0]);
        const colId = entetes[0];

        let html = '<table style="width:100%; border-collapse:collapse; font-size:12px;">';
        html += '<tr>';
        entetes.forEach(e => {
            html += `<th style="background:#1a1a1a; color:#FFCC00; padding:8px; text-align:left;">${echapperHtml(e)}</th>`;
        });
        html += '<th style="background:#1a1a1a; color:#FFCC00; padding:8px;">Feedback</th></tr>';

        lignes.forEach(ligne => {
            const ticketId = ligne[colId];
            html += '<tr>';
            entetes.forEach(e => {
                html += `<td style="padding:8px; border-bottom:1px solid #eee; max-width:250px; white-space:normal; word-wrap:break-word;">${echapperHtml(ligne[e])}</td>`;
            });
            html += `<td><input type="text" class="feedback-import" data-ticket-id="${echapperHtml(ticketId)}" placeholder="Feedback (optionnel)" /></td>`;
            html += '</tr>';
        });
        html += '</table>';

        document.getElementById('tableau-ticket').innerHTML = html;
        document.querySelector('#modale-import .modal-box').style.maxWidth = '1200px';
document.querySelector('#modale-import .modal-box').style.background = '#ffffff';
document.getElementById('apercu-ticket').style.display = 'block';
    };
    reader.readAsArrayBuffer(fichier);
}
 

async function confirmerImport() {
    const inputFichier = document.getElementById('fichier-ticket');
    const fichier = inputFichier.files[0];
    if (!fichier) {
        afficherToast('Veuillez choisir un fichier Excel.', 'erreur');
        return;
    }

    const titre = document.getElementById('titre-import').value.trim();

    const feedbacks = {};
    document.querySelectorAll('.feedback-import').forEach(input => {
        if (input.value.trim()) {
            feedbacks[input.dataset.ticketId] = input.value.trim();
        }
    });

    const formData = new FormData();
    formData.append('fichier', fichier);
    formData.append('titre', titre);
    formData.append('feedbacks', JSON.stringify(feedbacks));

    try {
        const res = await fetch('/api/imports/import/', { method: 'POST', body: formData });
        const data = await res.json();

        if (!res.ok) {
            afficherToast(data.erreur || 'Échec de l\'import', 'erreur');
            return;
        }

        fermerModaleImport();
        await chargerListeImports();
        // Ouvre directement la modale du lot fraîchement importé
        await ouvrirModaleTickets(data.lot_id, data.titre);
        afficherToast('Import réussi', 'succes');
    } catch (erreur) {
        afficherToast('Erreur : ' + erreur.message, 'erreur');
        console.error(erreur);
    }
}

// --- Tooltip d'aperçu (ancré à la ligne survolée) ---
let tooltipApercu = null;

function creerTooltipApercu() {
    if (tooltipApercu) return tooltipApercu;
    tooltipApercu = document.createElement('div');
    tooltipApercu.id = 'tooltip-apercu-import';
    tooltipApercu.style.cssText = `
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
    document.body.appendChild(tooltipApercu);
    return tooltipApercu;
}

function positionnerTooltipSurElement(element) {
    if (!tooltipApercu) return;
    const rect = element.getBoundingClientRect();
    const marge = 10;

    requestAnimationFrame(() => {
        const largeurTooltip = tooltipApercu.offsetWidth;

        let left = rect.left;
        left = Math.min(left, window.innerWidth - largeurTooltip - marge);
        left = Math.max(left, marge);

        const top = rect.bottom + marge;

        tooltipApercu.style.left = `${left}px`;
        tooltipApercu.style.top = `${top}px`;
        tooltipApercu.style.opacity = '1';
        tooltipApercu.style.transform = 'translateY(0)';
    });
}

function cacherTooltip() {
    if (!tooltipApercu) return;
    tooltipApercu.style.opacity = '0';
    tooltipApercu.style.transform = 'translateY(-8px)';
    setTimeout(() => {
        if (tooltipApercu.style.opacity === '0') {
            tooltipApercu.style.display = 'none';
        }
    }, 180);
}

function afficherTooltipTickets(element, apercu) {
    const tooltip = creerTooltipApercu();

    let lignesHtml = apercu.map(t => `
        <div style="padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.08);">
            <div style="display:flex; justify-content:space-between; gap:10px; margin-bottom:4px;">
                <span style="color:#FFCC00; font-weight:700; font-size:12px;">${echapperHtml(t.ticket_id)}</span>
                <span style="color:#aaa; font-size:11px;">${echapperHtml(t.requester)}</span>
            </div>
            <div style="color:#eee; font-size:12px; line-height:1.4; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">
                ${echapperHtml(t.details) || '<span style="color:#666;">Aucun détail</span>'}
            </div>
        </div>
    `).join('');

    tooltip.innerHTML = `
    <div style="padding:12px 14px; border-bottom:1px solid var(--border); flex-shrink:0; background:var(--primary);">
        <span style="color:#111; font-weight:700; font-size:13px;">Aperçu de l'import</span>
    </div>
    <div style="overflow-y:auto;">
        ${apercu.map(t => `
            <div style="padding:10px 14px; border-bottom:1px solid var(--border);">
                <div style="display:flex; justify-content:space-between; gap:10px; margin-bottom:4px;">
                    <span style="color:#111; font-weight:700; font-size:12px;">${echapperHtml(t.ticket_id)}</span>
                    <span style="color:var(--muted); font-size:11px;">${echapperHtml(t.requester)}</span>
                </div>
                <div style="color:#333; font-size:12px; line-height:1.4; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">
                    ${echapperHtml(t.details) || '<span style="color:#999;">Aucun détail</span>'}
                </div>
            </div>
        `).join('')}
    </div>
`;
    tooltip.style.display = 'flex';
    positionnerTooltipSurElement(element);
}

// --- Liste des imports (extraits en tableau) ---

async function chargerListeImports(recherche = '') {
    const zone = document.getElementById('liste-imports');
    if (!zone) return;

    const periodeType = document.getElementById('filtre-periode-type')?.value || '';
    const annee = document.getElementById('filtre-annee')?.value || '';
    const mois = document.getElementById('filtre-mois')?.value || '';
    const semaine = document.getElementById('filtre-semaine')?.value || '';

    const params = new URLSearchParams();
    if (periodeType) params.set('periode_type', periodeType);
    if (annee) params.set('annee', annee);
    if (mois) params.set('mois', mois);
    if (semaine) params.set('semaine', semaine);

    try {
        const res = await fetch(`/api/imports/?${params.toString()}`, { cache: 'no-store' });
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
        liste.id = 'liste-imports-ul';
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
            titreZone.innerHTML = `<strong style="font-size:15px; color:#111;">${echapperHtml(imp.titre)}</strong> <span style="font-size:11px; color:#888;">(${imp.nombre_tickets} tickets — ${imp.cree_le})</span>`;

            titreZone.addEventListener('mouseenter', () => afficherTooltipTickets(titreZone, imp.apercu));
            titreZone.addEventListener('mouseleave', cacherTooltip);

            const actions = document.createElement('div');
            actions.style.cssText = 'display:flex; gap:8px; flex-shrink:0;';

            const btnVoir = document.createElement('button');
            btnVoir.textContent = 'Voir';
            btnVoir.className = 'btn-primary';
            btnVoir.style.cssText = 'padding:6px 14px; font-size:13px;';
            btnVoir.addEventListener('click', () => ouvrirModaleTickets(imp.id, imp.titre));

            const btnTelecharger = document.createElement('button');
            btnTelecharger.textContent = 'Télécharger';
            btnTelecharger.className = 'btn-secondary';
            btnTelecharger.style.cssText = 'padding:6px 14px; font-size:13px;';
            btnTelecharger.addEventListener('click', () => telechargerLot(imp.id, 'xlsx'));

            const btnSupprimer = document.createElement('button');
            btnSupprimer.textContent = 'Supprimer';
            btnSupprimer.className = 'btn-delete';
            btnSupprimer.style.cssText = 'padding:6px 14px; font-size:13px;';
            btnSupprimer.addEventListener('click', () => supprimerLot(imp.id));

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

let timerRechercheImports = null;
function rechercherImports() {
    clearTimeout(timerRechercheImports);
    const valeur = document.getElementById('recherche-import').value;
    timerRechercheImports = setTimeout(() => chargerListeImports(valeur), 300);
}

// --- Modale : tableau complet d'un import, édition inline ---

async function ouvrirModaleTickets(lotId, titre) {
    lotActuelId = lotId;
    document.getElementById('titre-modale-tickets').textContent = titre || 'Tickets';
    document.getElementById('modale-tickets').style.display = 'flex';
    document.getElementById('recherche-ticket-modale').value = '';
    await chargerTicketsDuLot();
}

function fermerModaleTickets() {
    document.getElementById('modale-tickets').style.display = 'none';
    lotActuelId = null;
}

let timerRechercheModale = null;
function rechercherDansModale() {
    clearTimeout(timerRechercheModale);
    const valeur = document.getElementById('recherche-ticket-modale').value;
    timerRechercheModale = setTimeout(() => chargerTicketsDuLot(valeur), 300);
}

function activerEditionInline() {
    document.querySelectorAll('.cellule-editable').forEach(cellule => {
        cellule.addEventListener('click', function gererClic() {
            if (cellule.querySelector('input')) return;

            const valeurActuelle = cellule.textContent;
            const champ = cellule.dataset.champ;
            const pk = cellule.dataset.pk;

            const input = document.createElement('input');
            input.type = 'text';
            input.value = valeurActuelle;
            input.style.width = '100%';

            cellule.textContent = '';
            cellule.appendChild(input);
            input.focus();

            const valider = async () => {
                const nouvelleValeur = input.value;
                if (nouvelleValeur === valeurActuelle) {
                    cellule.textContent = valeurActuelle;
                    return;
                }

                try {
                    const res = await fetch(`/api/tickets/${pk}/`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ [champ]: nouvelleValeur }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                        afficherToast(data.erreur || 'Échec de la modification', 'erreur');
                        cellule.textContent = valeurActuelle;
                        return;
                    }
                    cellule.textContent = nouvelleValeur;
                    await chargerListeImports();
                } catch (erreur) {
                    afficherToast('Erreur : ' + erreur.message, 'erreur');
                    cellule.textContent = valeurActuelle;
                }
            };

            input.addEventListener('blur', valider);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') input.blur();
                if (e.key === 'Escape') { cellule.textContent = valeurActuelle; }
            });
        }, { once: true });
    });
}

async function supprimerTicket(pk) {
    if (!(await confirmerAction('Supprimer ce ticket ?'))) return;

    try {
        const res = await fetch(`/api/tickets/${pk}/`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) {
            afficherToast(data.erreur || 'Échec de la suppression', 'erreur');
            return;
        }
        await chargerTicketsDuLot();
        await chargerListeImports();
        afficherToast('Ticket supprimé', 'succes');
    } catch (erreur) {
        afficherToast('Erreur : ' + erreur.message, 'erreur');
        console.error(erreur);
    }
}

// --- Téléchargement ---

function telechargerLot(lotId, format) {
    window.location.href = `/api/imports/${lotId}/export/?format=${format}`;
}

function telechargerLotActuel(format) {
    if (!lotActuelId) return;
    telechargerLot(lotActuelId, format);
}

// --- Init ---

document.addEventListener('DOMContentLoaded', () => {
    chargerListeImports();
});

async function supprimerLot(lotId) {
    if (!(await confirmerAction('Supprimer tout cet import (tous ses tickets) ?'))) return;

    try {
        const res = await fetch(`/api/imports/${lotId}/`, { method: 'DELETE', cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
            afficherToast(data.erreur || 'Échec de la suppression', 'erreur');
            return;
        }

        if (lotActuelId === lotId) {
            fermerModaleTickets();
        }

        await chargerListeImports();
        afficherToast('Import supprimé', 'succes');
    } catch (erreur) {
        afficherToast('Erreur : ' + erreur.message, 'erreur');
        console.error(erreur);
    }
}
async function chargerTicketsDuLot(recherche = '') {
    const corps = document.getElementById('corps-tableau-tickets');
    if (!corps || !lotActuelId) return;

    const assigneA = document.getElementById('filtre-assigned-to')?.value || '';
    const params = new URLSearchParams();
    if (recherche) params.set('q', recherche);
    if (assigneA) params.set('assigned_to', assigneA);

    try {
        const url = `/api/imports/${lotActuelId}/tickets/?${params.toString()}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (res.status === 403) {
            corps.innerHTML = '<tr><td colspan="8">Accès interdit</td></tr>';
            return;
        }
        const data = await res.json();
        ticketsActuels = data.tickets || [];

        remplirFiltreAssignation(data.repartition || [], assigneA);

        if (ticketsActuels.length === 0) {
            corps.innerHTML = '<tr><td colspan="8">Aucun ticket trouvé</td></tr>';
            return;
        }

        afficherTicketsEnLecture();
    } catch (erreur) {
        console.error('Erreur de chargement des tickets :', erreur);
        corps.innerHTML = '<tr><td colspan="8">Erreur de chargement</td></tr>';
    }
}

function remplirFiltreAssignation(repartition, valeurSelectionnee) {
    const select = document.getElementById('filtre-assigned-to');
    if (!select) return;

    select.innerHTML = '<option value="">Tous les assignés</option>';
    repartition.forEach(r => {
        const option = document.createElement('option');
        option.value = r.assigned_to;
        option.textContent = `${r.assigned_to} (${r.total})`;
        select.appendChild(option);
    });
    select.value = valeurSelectionnee;

    const compteur = document.getElementById('compteur-assignation');
    if (compteur) {
        const total = repartition.reduce((somme, r) => somme + r.total, 0);
        compteur.textContent = `${repartition.length} personnes assignées, ${total} tickets au total`;
    }
}
function afficherTicketsEnLecture() {
    const corps = document.getElementById('corps-tableau-tickets');
    corps.innerHTML = '';

    ticketsActuels.forEach(t => {
        const tr = document.createElement('tr');
        tr.dataset.pk = t.id;

        tr.innerHTML = `
            <td data-champ="ticket_id">${echapperHtml(t.ticket_id)}</td>
            <td data-champ="state">${echapperHtml(t.state)}</td>
            <td data-champ="requester">${echapperHtml(t.requester)}</td>
            <td data-champ="assigned_to">${echapperHtml(t.assigned_to)}</td>
            <td data-champ="details" style="max-width:300px; white-space:pre-wrap; word-wrap:break-word;">${echapperHtml(t.details)}</td>
            <td data-champ="feedback">${echapperHtml(t.feedback)}</td>
            <td>${echapperHtml(t.modifie_le)}</td>
            <td><button class="btn-delete" data-action="supprimer">Supprimer</button></td>
        `;
        tr.querySelector('[data-action="supprimer"]').addEventListener('click', () => supprimerTicket(t.id));
        corps.appendChild(tr);
    });
}

function activerModeEditionGlobal() {
    const corps = document.getElementById('corps-tableau-tickets');
    const champsEditables = ['ticket_id', 'state', 'requester', 'assigned_to', 'details', 'feedback'];

    corps.querySelectorAll('tr').forEach(tr => {
        champsEditables.forEach(champ => {
            const td = tr.querySelector(`[data-champ="${champ}"]`);
            if (!td) return;
            const valeur = td.textContent;

            if (champ === 'details') {
                td.style.maxWidth = '500px';
                td.style.width = '500px';
            }

            const input = champ === 'details'
                ? document.createElement('textarea')
                : document.createElement('input');
            if (champ !== 'details') input.type = 'text';
            input.value = valeur;
            input.style.width = '100%';
            input.dataset.champ = champ;

            if (champ === 'details') {
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

    document.getElementById('btn-modifier-global').style.display = 'none';
    document.getElementById('btn-enregistrer-global').style.display = '';
    document.getElementById('btn-annuler-global').style.display = '';
}

function annulerModificationsGlobales() {
    afficherTicketsEnLecture();
    document.getElementById('btn-modifier-global').style.display = '';
    document.getElementById('btn-enregistrer-global').style.display = 'none';
    document.getElementById('btn-annuler-global').style.display = 'none';
}

async function enregistrerModificationsGlobales() {
    const btn = document.getElementById('btn-enregistrer-global');
    const corps = document.getElementById('corps-tableau-tickets');
    const lignes = corps.querySelectorAll('tr');
    const champsEditables = ['ticket_id', 'state', 'requester', 'assigned_to', 'details', 'feedback'];

    btn.disabled = true;
    btn.textContent = 'Enregistrement...';

    const requetes = [];

    lignes.forEach(tr => {
        const pk = tr.dataset.pk;
        const ticketOriginal = ticketsActuels.find(t => String(t.id) === String(pk));
        if (!ticketOriginal) return;

        const donnees = {};
        let aChange = false;

        champsEditables.forEach(champ => {
            const td = tr.querySelector(`[data-champ="${champ}"]`);
            const input = td?.querySelector('input, textarea');
            if (!input) return;

            const nouvelleValeur = input.value;
            if (nouvelleValeur !== (ticketOriginal[champ] || '')) {
                donnees[champ] = nouvelleValeur;
                aChange = true;
            }
        });

        if (aChange) {
            requetes.push(
                fetch(`/api/tickets/${pk}/`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(donnees),
                }).then(res => res.json().then(data => ({ ok: res.ok, pk, data })))
            );
        }
    });

    if (requetes.length === 0) {
        document.getElementById('btn-modifier-global').style.display = '';
        btn.style.display = 'none';
        document.getElementById('btn-annuler-global').style.display = 'none';
        btn.disabled = false;
        btn.textContent = 'Enregistrer';
        afficherToast('Aucune modification à enregistrer', 'info');
        return;
    }

    try {
        const resultats = await Promise.all(requetes);
        const echecs = resultats.filter(r => !r.ok);

        if (echecs.length > 0) {
            afficherToast(`${echecs.length} ligne(s) n'ont pas pu être enregistrées.`, 'erreur');
        } else {
            afficherToast('Modifications enregistrées', 'succes');
        }

        document.getElementById('btn-modifier-global').style.display = '';
        btn.style.display = 'none';
        document.getElementById('btn-annuler-global').style.display = 'none';

        await chargerTicketsDuLot();
        await chargerListeImports();
    } catch (erreur) {
        afficherToast('Erreur : ' + erreur.message, 'erreur');
        console.error(erreur);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Enregistrer';
    }
}
function supprimerLotActuel() {
    if (!lotActuelId) return;
    supprimerLot(lotActuelId);
}

function changerTypeFiltre() {
    const type = document.getElementById('filtre-periode-type').value;
    const selectAnnee = document.getElementById('filtre-annee');
    const selectMois = document.getElementById('filtre-mois');
    const inputSemaine = document.getElementById('filtre-semaine');

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

    chargerListeImports();
}

function reinitialiserFiltresImports() {
    document.getElementById('filtre-periode-type').value = '';
    document.getElementById('filtre-annee').style.display = 'none';
    document.getElementById('filtre-mois').style.display = 'none';
    document.getElementById('filtre-semaine').style.display = 'none';
    document.getElementById('filtre-semaine').value = '';
    chargerListeImports();
}