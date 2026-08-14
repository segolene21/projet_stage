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
            zone.innerHTML = '<p>Aucun import pour l\'instant</p>';
            return;
        }

        zone.innerHTML = '';
        imports.forEach(imp => {
            const bloc = document.createElement('div');
            bloc.className = 'bloc-import';
            bloc.innerHTML = `
                <div class="bloc-import-header">
                    <h3>${echapperHtml(imp.titre)} <span style="font-size:11px; color:#888;">(${imp.nombre_tickets} tickets — ${imp.cree_le})</span></h3>
                    <div>
                        <button onclick="ouvrirModaleTickets(${imp.id}, '${echapperHtml(imp.titre)}')">Voir</button>
                        <button onclick="telechargerLot(${imp.id}, 'xlsx')">Télécharger</button>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr><th>ID</th><th>State</th><th>Requester</th><th>Details</th><th>Feedback</th></tr>
                    </thead>
                    <tbody>
                        ${imp.apercu.map(t => `
                            <tr>
                                <td>${echapperHtml(t.ticket_id)}</td>
                                <td>${echapperHtml(t.state)}</td>
                                <td>${echapperHtml(t.requester)}</td>
                                <td style="max-width:300px; white-space:normal; word-wrap:break-word;">${echapperHtml(t.details)}</td>
                                <td>${echapperHtml(t.feedback)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            zone.appendChild(bloc);
        });
    } catch (erreur) {
        console.error('Erreur de chargement des imports :', erreur);
        zone.innerHTML = '<p>Erreur de chargement</p>';
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