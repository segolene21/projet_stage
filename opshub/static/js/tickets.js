let donneesTicket = null;
let ticketsImportes = [];
const TICKETS_API_URL = '/api/tickets/';
const TICKET_EXPORT_URL = '/api/tickets/export/';

async function chargerTicketsImportes() {
    const liste = document.getElementById('liste-tickets-importes');
    if (!liste) return;

    try {
        const response = await fetch(TICKETS_API_URL);
        if (!response.ok) throw new Error('Impossible de charger les tickets');

        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Réponse inattendue du serveur');

        ticketsImportes = data.map(ticket => ({
            id: ticket.ticket_id,
            ticket_id: ticket.ticket_id,
            nom: ticket.ticket_id || ticket.requester || 'Ticket',
            requester: ticket.requester || '',
            appreciation: ticket.feedback || '',
            date: ticket.cree_le || ticket.modifie_le || '',
            donnees: []
        }));

        afficherTicketsImportes();
    } catch (error) {
        console.error(error);
        if (liste) {
            liste.innerHTML = '<p class="empty-state">Erreur de chargement des tickets</p>';
        }
    }
}

function ouvrirModaleImport() {
    const modale = document.getElementById('modale-import');
    if (modale) modale.style.display = 'flex';
}

function fermerModaleImport() {
    const modale = document.getElementById('modale-import');
    if (modale) modale.style.display = 'none';
    document.getElementById('apercu-ticket').style.display = 'none';
    document.getElementById('zone-telechargement').style.display = 'none';
    document.getElementById('btn-confirmer').style.display = 'inline-block';
    document.getElementById('fichier-ticket').value = '';
    document.getElementById('appreciation-client').value = '';
    donneesTicket = null;
}

function fermerApresTelechargement() {
    fermerModaleImport();
}

function previsualiserTicket(input) {
    const fichier = input.files[0];
    if (!fichier) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        donneesTicket = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        let html = '<table style="width:100%; border-collapse:collapse; font-size:12px;">';
        donneesTicket.forEach((row, i) => {
            html += '<tr>';
            row.forEach(cell => {
                if (i === 0) {
                    html += `<th style="background:#1a1a1a; color:#FFCC00; padding:8px; text-align:left; white-space:nowrap;">${cell || ''}</th>`;
                } else {
                    html += `<td style="padding:8px; border-bottom:1px solid #eee; white-space:nowrap;">${cell || ''}</td>`;
                }
            });
            html += '</tr>';
        });
        html += '</table>';

        document.getElementById('tableau-ticket').innerHTML = html;
        document.getElementById('apercu-ticket').style.display = 'block';
    };
    reader.readAsArrayBuffer(fichier);
}

async function confirmerImport() {
    if (!donneesTicket) {
        alert('Veuillez choisir un fichier Excel.');
        return;
    }

    const appreciation = document.getElementById('appreciation-client').value.trim();
    if (!appreciation) {
        alert('Veuillez saisir l\'appréciation du client.');
        return;
    }

    const inputFichier = document.getElementById('fichier-ticket');
    const fichier = inputFichier && inputFichier.files && inputFichier.files[0];
    if (!fichier) {
        alert('Veuillez choisir un fichier Excel.');
        return;
    }

    const formData = new FormData();
    formData.append('fichier', fichier);

    try {
        const response = await fetch('/api/tickets/import/', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.erreur || 'Erreur lors de l\'import');
        }

        const premiereRangee = donneesTicket[1] || [];
        const ticketId = premiereRangee[0];
        if (ticketId) {
            await fetch(`/api/tickets/${encodeURIComponent(ticketId)}/feedback/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify({ feedback: appreciation })
            }).catch(() => console.warn('Feedback non envoyé'));
        }

        document.getElementById('btn-confirmer').style.display = 'none';
        document.getElementById('zone-telechargement').style.display = 'block';
        await chargerTicketsImportes();
    } catch (error) {
        alert(error.message || 'Erreur lors de l\'import du ticket.');
        console.error(error);
    }
}

function telechargerFichier(ticketId) {
    if (ticketId) {
        window.location.href = `${TICKET_EXPORT_URL}?ticket_id=${encodeURIComponent(ticketId)}`;
        return;
    }

    if (!donneesTicket) {
        alert('Aucun ticket sélectionné pour le téléchargement.');
        return;
    }

    const appreciation = document.getElementById('appreciation-client').value.trim();
    const maintenant = new Date().toLocaleString('fr-FR');

    const ticket = {
        donnees: donneesTicket,
        appreciation: appreciation,
        date: maintenant
    };

    const donneesCopie = ticket.donnees.map((row, i) => {
        if (i === 0) {
            return [...row, 'Appréciation client', 'Date d\'importation'];
        } else if (i === 1) {
            return [...row, ticket.appreciation, ticket.date];
        }
        return [...row, '', ''];
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(donneesCopie);
    const colWidths = [];
    donneesCopie.forEach(row => {
        row.forEach((cell, j) => {
            const longueur = cell ? String(cell).length : 10;
            if (!colWidths[j] || colWidths[j] < longueur) {
                colWidths[j] = longueur;
            }
        });
    });
    ws['!cols'] = colWidths.map(w => ({ wch: w + 2 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Ticket');
    XLSX.writeFile(wb, `ticket_preview.xlsx`);
}

function afficherTicketsImportes() {
    const liste = document.getElementById('liste-tickets-importes');
    if (!liste) return;

    if (!ticketsImportes || ticketsImportes.length === 0) {
        liste.innerHTML = '<p class="empty-state">Aucun ticket importé</p>';
        return;
    }

    liste.innerHTML = '';
    ticketsImportes.forEach(ticket => {
        const li = document.createElement('li');
        li.id = `ticket-${ticket.id}`;

        const actionButtons = [`<button onclick="telechargerFichier('${ticket.id}')">Télécharger</button>`];
        if (window.canDeleteTicket) {
            actionButtons.push(`<button class="btn-danger" onclick="supprimerTicket('${ticket.id}')">Supprimer</button>`);
        }

        li.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
                <div>
                    <div class="ticket-nom"><strong>${ticket.nom}</strong></div>
                    <div class="ticket-date">${ticket.requester ? ticket.requester + ' • ' : ''}${ticket.date}${ticket.appreciation ? ' • ' + ticket.appreciation : ''}</div>
                </div>
                <div class="action-menu-wrapper">
                    <button class="btn-three-dots" onclick="toggleMenu(this)">⋮</button>
                    <div class="action-dropdown">
                        ${actionButtons.join('')}
                    </div>
                </div>
            </div>
        `;
        liste.appendChild(li);
    });
}

async function supprimerTicket(id) {
    if (!id) {
        alert('ID du ticket introuvable');
        return;
    }

    if (!confirm('Supprimer ce ticket ?')) return;

    try {
        const response = await fetch(`/api/tickets/${encodeURIComponent(id)}/`, {
            method: 'DELETE',
            headers: { 'X-CSRFToken': csrftoken }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.erreur || 'Erreur lors de la suppression');
        }

        await chargerTicketsImportes();
    } catch (error) {
        alert(error.message || 'Erreur réseau lors de la suppression');
        console.error(error);
    }
}

function toggleMenu(btn) {
    const menu = btn.closest('.action-menu-wrapper')?.querySelector('.action-dropdown');
    if (!menu) return;

    const doitOuvrir = !menu.classList.contains('open');
    document.querySelectorAll('.action-dropdown.open').forEach(d => d.classList.remove('open'));

    if (doitOuvrir) {
        menu.classList.add('open');
    }
}

window.toggleMenu = toggleMenu;

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

document.addEventListener('DOMContentLoaded', function() {
    chargerTicketsImportes();
});
