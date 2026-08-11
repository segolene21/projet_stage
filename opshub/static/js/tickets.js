let donneesTicket = null;

function fermerModaleImport() {
    document.getElementById('modale-import').style.display = 'none';
    document.getElementById('apercu-ticket').style.display = 'none';
    document.getElementById('zone-telechargement').style.display = 'none';
    document.getElementById('btn-confirmer').style.display = 'inline-block';
    document.getElementById('fichier-ticket').value = '';
    document.getElementById('appreciation-client').value = '';
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

// Récupère le cookie CSRF (nécessaire pour les requêtes POST/DELETE Django)
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie) {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
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

    const fichier = document.getElementById('fichier-ticket').files[0];
    const formData = new FormData();
    formData.append('fichier', fichier);

    try {
        // 1. Envoie le fichier Excel au backend pour import en base
        const resImport = await fetch('/api/tickets/import/', {
            method: 'POST',
            body: formData,
        });
        if (!resImport.ok) throw new Error('Échec de l\'import');
        const resultatImport = await resImport.json();

        // 2. Récupère l'ID du ticket (première colonne, première ligne de données)
        const premiereRangee = donneesTicket[1] || [];
        const ticketId = premiereRangee[0];

        // 3. Envoie le feedback/appréciation pour ce ticket
        const resFeedback = await fetch(`/api/tickets/${ticketId}/feedback/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify({ feedback: appreciation }),
        });
        if (!resFeedback.ok) throw new Error('Échec de l\'enregistrement du feedback');

        document.getElementById('btn-confirmer').style.display = 'none';
        document.getElementById('zone-telechargement').style.display = 'block';

        await afficherTicketsImportes();
    } catch (erreur) {
        alert('Erreur : ' + erreur.message);
        console.error(erreur);
    }
}

// Télécharge tous les tickets depuis la base (génération Excel côté backend)
function telechargerFichier() {
    window.location.href = '/api/tickets/export/';
}

function fermerApresTelechargement() {
    fermerModaleImport();
}

async function afficherTicketsImportes() {
    const liste = document.getElementById('liste-tickets-importes');
    if (!liste) return;

    try {
        const res = await fetch('/api/tickets/');
        const tickets = await res.json();

        if (tickets.length === 0) {
            liste.innerHTML = '<p class="empty-state">Aucun ticket importé</p>';
            return;
        }

        liste.innerHTML = '';
        tickets.forEach(ticket => {
            const li = document.createElement('li');
            li.id = `ticket-${ticket.ticket_id}`;
            li.innerHTML = `
                <span>${ticket.ticket_id}</span>
                <span style="font-size:11px; color:#888;">${ticket.modifie_le}</span>
                <div class="card-actions">
                    <button class="btn-edit" onclick="telechargerFichier()">Télécharger</button>
                    <button class="btn-delete" onclick="supprimerTicket('${ticket.ticket_id}')">Supprimer</button>
                </div>
            `;
            liste.appendChild(li);
        });
    } catch (erreur) {
        console.error('Erreur de chargement des tickets :', erreur);
        liste.innerHTML = '<p class="empty-state">Erreur de chargement</p>';
    }
}

async function supprimerTicket(ticketId) {
    if (!confirm('Supprimer ce ticket ?')) return;

    try {
        const res = await fetch(`/api/tickets/${ticketId}/`, {
            method: 'DELETE',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
        });
        if (!res.ok) throw new Error('Échec de la suppression');
        await afficherTicketsImportes();
    } catch (erreur) {
        alert('Erreur : ' + erreur.message);
        console.error(erreur);
    }
}

// Afficher les tickets au chargement de la page
document.addEventListener('DOMContentLoaded', afficherTicketsImportes);
function ouvrirModaleImport() {
    const modale = document.getElementById('modale-import');
    modale.style.display = 'flex';
}