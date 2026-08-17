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
        alert('Veuillez choisir un fichier Excel.');
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
            alert(data.erreur || 'Échec de l\'import');
            return;
        }

        fermerModaleImport();
        await chargerListeImports();
        // Ouvre directement la modale du lot fraîchement importé
        await ouvrirModaleTickets(data.lot_id, data.titre);
    } catch (erreur) {
        alert('Erreur : ' + erreur.message);
        console.error(erreur);
    }
}

// --- Liste des imports (extraits en tableau) ---

// --- Liste des imports (extraits en tableau) ---

async function chargerListeImports(recherche = '') {
    const zone = document.getElementById('liste-imports');
    if (!zone) return;

    try {
        const res = await fetch('/api/imports/');
        if (res.status === 403) {
            zone.innerHTML = '<p>Accès interdit</p>';
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
                border-bottom: 1px solid rgba(0,0,0,.08);
                background: ${index % 2 === 0 ? 'transparent' : 'rgba(255,204,0,.08)'};
            `;

            // Lignes aperçu (3 max)
            const apercuRows = (imp.apercu || []).slice(0, 3).map(t => `
                <tr style="opacity:0.7;">
                    <td style="padding:5px 14px 5px 40px; font-size:12px; color:#555; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:150px;">${echapperHtml(t.ticket_id)}</td>
                    <td style="padding:5px 8px; font-size:12px; color:#555; white-space:nowrap;">${echapperHtml(t.state)}</td>
                    <td style="padding:5px 8px; font-size:12px; color:#555; white-space:nowrap;">${echapperHtml(t.requester)}</td>
                    <td style="padding:5px 8px; font-size:12px; color:#555; max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${echapperHtml(t.details)}</td>
                    <td style="padding:5px 8px; font-size:12px; color:#555;">${echapperHtml(t.feedback)}</td>
                </tr>
            `).join('');

            const ombre = (imp.apercu || []).length > 3
                ? `<div style="height:28px; background:linear-gradient(to bottom, rgba(246,240,204,0), rgba(246,240,204,0.95)); margin:-4px 0 0; border-radius:0 0 8px 8px;"></div>`
                : '';

            li.innerHTML = `
                <div style="display:flex; align-items:center; gap:16px; padding:10px 14px;">
                    <span style="font-weight:700; font-size:15px; color:#111; flex:1;">${echapperHtml(imp.titre)}</span>
                    <span style="font-size:11px; color:#888; white-space:nowrap;">${imp.nombre_tickets} ticket${imp.nombre_tickets > 1 ? 's' : ''} — ${imp.cree_le}</span>
                    <button class="btn-primary" style="padding:6px 14px; font-size:13px; white-space:nowrap;"
                        onclick="ouvrirModaleTickets(${imp.id}, '${echapperHtml(imp.titre)}')">
                        Voir
                    </button>
                </div>
                ${apercuRows ? `
                <div style="overflow:hidden;">
                    <table style="width:100%; border-collapse:collapse;">
                        <tbody>${apercuRows}</tbody>
                    </table>
                    ${ombre}
                </div>` : ''}
            `;
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
    document.getElementById('modale-tickets').style.display = 'block';
    document.getElementById('recherche-ticket-modale').value = '';
    await chargerTicketsDuLot();
}

function fermerModaleTickets() {
    document.getElementById('modale-tickets').style.display = 'none';
    lotActuelId = null;
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
        const tickets = data.tickets || [];

        if (tickets.length === 0) {
            corps.innerHTML = '<tr><td colspan="7">Aucun ticket</td></tr>';
            return;
        }

        corps.innerHTML = '';
        tickets.forEach(t => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="cellule-editable" data-champ="ticket_id" data-pk="${t.id}">${echapperHtml(t.ticket_id)}</td>
                <td class="cellule-editable" data-champ="state" data-pk="${t.id}">${echapperHtml(t.state)}</td>
                <td class="cellule-editable" data-champ="requester" data-pk="${t.id}">${echapperHtml(t.requester)}</td>
                <td class="cellule-editable" data-champ="details" data-pk="${t.id}" style="max-width:300px;">${echapperHtml(t.details)}</td>
                <td class="cellule-editable" data-champ="feedback" data-pk="${t.id}">${echapperHtml(t.feedback)}</td>
                <td>${echapperHtml(t.modifie_le)}</td>
                <td><button class="btn-delete" onclick="supprimerTicket(${t.id})">Supprimer</button></td>
            `;
            corps.appendChild(tr);
        });
    

        activerEditionInline();
    } catch (erreur) {
        console.error('Erreur de chargement des tickets :', erreur);
        corps.innerHTML = '<tr><td colspan="7">Erreur de chargement</td></tr>';
    }
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
                        alert(data.erreur || 'Échec de la modification');
                        cellule.textContent = valeurActuelle;
                        return;
                    }
                    cellule.textContent = nouvelleValeur;
                    await chargerListeImports();
                } catch (erreur) {
                    alert('Erreur : ' + erreur.message);
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
    if (!confirm('Supprimer ce ticket ?')) return;

    try {
        const res = await fetch(`/api/tickets/${pk}/`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) {
            alert(data.erreur || 'Échec de la suppression');
            return;
        }
        await chargerTicketsDuLot();
        await chargerListeImports();
    } catch (erreur) {
        alert('Erreur : ' + erreur.message);
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
    if (!confirm('Supprimer tout cet import (tous ses tickets) ?')) return;

    try {
        const res = await fetch(`/api/imports/${lotId}/`, { method: 'DELETE', cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
            alert(data.erreur || 'Échec de la suppression');
            return;
        }

        if (lotActuelId === lotId) {
            fermerModaleTickets();
        }

        await chargerListeImports();
    } catch (erreur) {
        alert('Erreur : ' + erreur.message);
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

            const input = champ === 'details'
                ? document.createElement('textarea')
                : document.createElement('input');
            if (champ !== 'details') input.type = 'text';
            input.value = valeur;
            input.style.width = '100%';
            input.dataset.champ = champ;

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
            alert(`${echecs.length} ligne(s) n'ont pas pu être enregistrées : ${echecs.map(e => e.data.erreur).join(', ')}`);
        }

        document.getElementById('btn-modifier-global').style.display = '';
        document.getElementById('btn-enregistrer-global').style.display = 'none';
        document.getElementById('btn-annuler-global').style.display = 'none';

        await chargerTicketsDuLot();
        await chargerListeImports();
    } catch (erreur) {
        alert('Erreur : ' + erreur.message);
        console.error(erreur);
    }
}

function supprimerLotActuel() {
    if (!lotActuelId) return;
    supprimerLot(lotActuelId);
}