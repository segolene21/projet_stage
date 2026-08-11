let donneesTicket = null;
let ticketsImportes = JSON.parse(localStorage.getItem('ticketsImportes') || '[]');

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

function confirmerImport() {
    if (!donneesTicket) {
        alert('Veuillez choisir un fichier Excel.');
        return;
    }
    const appreciation = document.getElementById('appreciation-client').value.trim();
    if (!appreciation) {
        alert('Veuillez saisir l\'appréciation du client.');
        return;
    }

    document.getElementById('btn-confirmer').style.display = 'none';
    document.getElementById('zone-telechargement').style.display = 'block';

    // Sauvegarder dans localStorage pour affichage dans la liste
    const maintenant = new Date().toLocaleString('fr-FR');
    const entetes = donneesTicket[0] || [];
    const premiereRangee = donneesTicket[1] || [];
    
    // Trouver le numéro du ticket (première colonne généralement)
    const nomTicket = premiereRangee[0] || 'Ticket sans nom';
    
    const ticket = {
        id: Date.now(),
        nom: nomTicket,
        appreciation: appreciation,
        date: maintenant,
        donnees: donneesTicket
    };

    ticketsImportes.push(ticket);
    localStorage.setItem('ticketsImportes', JSON.stringify(ticketsImportes));
    afficherTicketsImportes();
}

function telechargerFichier(ticketId) {
    let ticket;
    if (ticketId) {
        ticket = ticketsImportes.find(t => t.id === ticketId);
    } else {
        const appreciation = document.getElementById('appreciation-client').value.trim();
        const maintenant = new Date().toLocaleString('fr-FR');
        ticket = { donnees: donneesTicket, appreciation, date: maintenant };
    }

    if (!ticket) return;

    const donneesCopie = ticket.donnees.map((row, i) => {
        if (i === 0) {
            return [...row, 'Appréciation client', 'Date d\'importation'];
        } else if (i === 1) {
            return [...row, ticket.appreciation, ticket.date];
        } else {
            return [...row, '', ''];
        }
    });

    // Ajuster la largeur des colonnes
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(donneesCopie);

    // Calculer la largeur de chaque colonne
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
    XLSX.writeFile(wb, `ticket_${ticket.id || 'import'}.xlsx`);
}

function fermerApresTelechargement() {
    fermerModaleImport();
}

function afficherTicketsImportes() {
    const liste = document.getElementById('liste-tickets-importes');
    if (!liste) return;

    if (ticketsImportes.length === 0) {
        liste.innerHTML = '<p class="empty-state">Aucun ticket importé</p>';
        return;
    }

    liste.innerHTML = '';
    ticketsImportes.forEach(ticket => {
        const li = document.createElement('li');
        li.id = `ticket-${ticket.id}`;
        li.innerHTML = `
            <span>${ticket.nom}</span>
            <span style="font-size:11px; color:#888;">${ticket.date}</span>
            <div class="card-actions">
                <button class="btn-edit" onclick="telechargerFichier(${ticket.id})">Télécharger</button>
                <button class="btn-delete" onclick="supprimerTicket(${ticket.id})">Supprimer</button>
            </div>
        `;
        liste.appendChild(li);
    });
}

function supprimerTicket(id) {
    if (!confirm('Supprimer ce ticket ?')) return;
    ticketsImportes = ticketsImportes.filter(t => t.id !== id);
    localStorage.setItem('ticketsImportes', JSON.stringify(ticketsImportes));
    afficherTicketsImportes();
}

// Afficher les tickets au chargement de la page
document.addEventListener('DOMContentLoaded', afficherTicketsImportes);