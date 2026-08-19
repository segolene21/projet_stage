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

// --- Liste des imports (extraits en tableau) ---
async function chargerListeImports(recherche = '') {
    const zone = document.getElementById('liste-imports');
    if (!zone) return;

    try {
        const res = await fetch('/api/imports/', { cache: 'no-store' });
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
            ligne.style.cssText = 'display:flex; align-items:center; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;';

            const titreZone = document.createElement('div');
            titreZone.innerHTML = `<strong>${echapperHtml(imp.titre)}</strong> <span style="font-size:11px; color:#888;">(${imp.nombre_tickets} tickets — ${imp.cree_le})</span>`;
            titreZone.style.cursor = 'help';

            titreZone.addEventListener('mouseenter', (e) => afficherTooltipTickets(e, imp.apercu));
            titreZone.addEventListener('mousemove', (e) => positionnerTooltip(e));
            titreZone.addEventListener('mouseleave', cacherTooltip);

            const actions = document.createElement('div');
            const btnVoir = document.createElement('button');
            btnVoir.textContent = 'Voir';
            btnVoir.addEventListener('click', () => ouvrirModaleTickets(imp.id, imp.titre));

            const btnTelecharger = document.createElement('button');
            btnTelecharger.textContent = 'Télécharger';
            btnTelecharger.addEventListener('click', () => telechargerLot(imp.id, 'xlsx'));

            const btnSupprimer = document.createElement('button');
            btnSupprimer.textContent = 'Supprimer';
            btnSupprimer.className = 'btn-delete';
            btnSupprimer.addEventListener('click', () => supprimerLot(imp.id));

            actions.append(btnVoir, btnTelecharger, btnSupprimer);
            ligne.append(titreZone, actions);
            zone.appendChild(ligne);
        });
    } catch (erreur) {
        console.error('Erreur de chargement des imports :', erreur);
        zone.innerHTML = '<p>Erreur de chargement</p>';
    }
}

function afficherTooltipTickets(evenement, apercu) {
    const tooltip = creerTooltipApercu();

    let html = '<table style="border-collapse:collapse; width:100%;">';
    html += '<tr><th style="text-align:left; padding:4px; border-bottom:1px solid #ccc;">ID</th><th style="text-align:left; padding:4px; border-bottom:1px solid #ccc;">State</th><th style="text-align:left; padding:4px; border-bottom:1px solid #ccc;">Requester</th><th style="text-align:left; padding:4px; border-bottom:1px solid #ccc;">Details</th><th style="text-align:left; padding:4px; border-bottom:1px solid #ccc;">Feedback</th></tr>';

    apercu.forEach(t => {
        html += `<tr>
            <td style="padding:4px; border-bottom:1px solid #eee;">${echapperHtml(t.ticket_id)}</td>
            <td style="padding:4px; border-bottom:1px solid #eee;">${echapperHtml(t.state)}</td>
            <td style="padding:4px; border-bottom:1px solid #eee;">${echapperHtml(t.requester)}</td>
            <td style="padding:4px; border-bottom:1px solid #eee; max-width:250px;">${echapperHtml(t.details)}</td>
            <td style="padding:4px; border-bottom:1px solid #eee;">${echapperHtml(t.feedback)}</td>
        </tr>`;
    });
    html += '</table>';

    tooltip.innerHTML = html;
    tooltip.style.display = 'block';
    positionnerTooltip(evenement);
}
// --- Modale : tableau complet d'un import, édition inline ---

async function ouvrirModaleTickets(lotId, titre) {
    lotActuelId = lotId;
    document.getElementById('titre-modale-tickets').textContent = titre || 'Tickets';
    document.getElementById('modale-tickets').style.display = 'block';
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

    try {
        const url = recherche
            ? `/api/imports/${lotActuelId}/tickets/?q=${encodeURIComponent(recherche)}`
            : `/api/imports/${lotActuelId}/tickets/`;
        const res = await fetch(url);
        if (res.status === 403) {
            corps.innerHTML = '<tr><td colspan="7">Accès interdit</td></tr>';
            return;
        }
        const data = await res.json();
        ticketsActuels = data.tickets || [];

        if (ticketsActuels.length === 0) {
            corps.innerHTML = '<tr><td colspan="7">Aucun ticket</td></tr>';
            return;
        }

        afficherTicketsEnLecture();
    } catch (erreur) {
        console.error('Erreur de chargement des tickets :', erreur);
        corps.innerHTML = '<tr><td colspan="7">Erreur de chargement</td></tr>';
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
    const champsEditables = ['ticket_id', 'state', 'requester', 'details', 'feedback'];

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
    const corps = document.getElementById('corps-tableau-tickets');
    const lignes = corps.querySelectorAll('tr');
    const requetes = [];

    lignes.forEach(tr => {
        const pk = tr.dataset.pk;
        const donnees = {};
        tr.querySelectorAll('[data-champ]').forEach(td => {
            const input = td.querySelector('input, textarea');
            if (input) donnees[input.dataset.champ] = input.value;
        });

        requetes.push(
            fetch(`/api/tickets/${pk}/`, {
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
            afficherToast(`${echecs.length} ligne(s) n'ont pas pu être enregistrées : ${echecs.map(e => e.data.erreur).join(', ')}`, 'erreur');
        } else {
            afficherToast('Modifications enregistrées', 'succes');
        }

        document.getElementById('btn-modifier-global').style.display = '';
        document.getElementById('btn-enregistrer-global').style.display = 'none';
        document.getElementById('btn-annuler-global').style.display = 'none';

        await chargerTicketsDuLot();
        await chargerListeImports();
    } catch (erreur) {
        afficherToast('Erreur : ' + erreur.message, 'erreur');
        console.error(erreur);
    }
}

function supprimerLotActuel() {
    if (!lotActuelId) return;
    supprimerLot(lotActuelId);
}