let donneesTicket = null;
let ticketsImportes = [];

const TICKETS_API_URL = '/api/tickets/';
const TICKET_IMPORT_URL = '/api/tickets/import/';
const TICKET_EXPORT_URL = '/api/tickets/export/';





function echapperHTML(valeur) {
    if (valeur === null || valeur === undefined) return '';

    return String(valeur)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


function obtenirCSRFToken() {
    if (typeof csrftoken !== 'undefined' && csrftoken) {
        return csrftoken;
    }

    const cookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='));

    return cookie ? decodeURIComponent(cookie.split('=')[1]) : '';
}


async function lireJSON(response) {
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
        throw new Error(`Réponse serveur inattendue (${response.status})`);
    }

    return await response.json();
}






async function chargerTicketsImportes() {
    const liste = document.getElementById('liste-tickets-importes');

    if (!liste) return;

    try {
        const response = await fetch(TICKETS_API_URL);

        if (!response.ok) {
            throw new Error('Impossible de charger les tickets');
        }

        const data = await lireJSON(response);

        if (!Array.isArray(data)) {
            throw new Error('Réponse inattendue du serveur');
        }

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
        console.error('Erreur chargement tickets :', error);

        liste.innerHTML = `
            <p class="empty-state">
                Erreur de chargement des tickets
            </p>
        `;
    }
}







function ouvrirModaleImport() {
    const modale = document.getElementById('modale-import');

    if (modale) {
        modale.style.display = 'flex';
    }
}







function fermerModaleImport() {
    const modale = document.getElementById('modale-import');
    const apercu = document.getElementById('apercu-ticket');
    const zoneTelechargement = document.getElementById('zone-telechargement');
    const boutonConfirmer = document.getElementById('btn-confirmer');
    const fichier = document.getElementById('fichier-ticket');
    const appreciation = document.getElementById('appreciation-client');
    const tableau = document.getElementById('tableau-ticket');

    if (modale) modale.style.display = 'none';
    if (apercu) apercu.style.display = 'none';
    if (zoneTelechargement) zoneTelechargement.style.display = 'none';
    if (boutonConfirmer) boutonConfirmer.style.display = 'inline-block';

    if (fichier) fichier.value = '';
    if (appreciation) appreciation.value = '';
    if (tableau) tableau.innerHTML = '';

    donneesTicket = null;
}




function fermerApresTelechargement() {
    fermerModaleImport();
}







function previsualiserTicket(input) {
    const fichier = input?.files?.[0];

    if (!fichier) return;

    const tableau = document.getElementById('tableau-ticket');
    const apercu = document.getElementById('apercu-ticket');

    if (!tableau || !apercu) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);

            const workbook = XLSX.read(data, {
                type: 'array'
            });

            if (!workbook.SheetNames.length) {
                throw new Error('Le fichier Excel ne contient aucune feuille.');
            }

            const sheet = workbook.Sheets[workbook.SheetNames[0]];

            donneesTicket = XLSX.utils.sheet_to_json(sheet, {
                header: 1
            });

            if (!donneesTicket || donneesTicket.length === 0) {
                throw new Error('Le fichier Excel est vide.');
            }

            let html = `
                <table style="width:100%; border-collapse:collapse; font-size:12px;">
            `;

            donneesTicket.forEach((row, i) => {
                html += '<tr>';

                row.forEach(cell => {
                    const valeur = echapperHTML(cell);

                    if (i === 0) {
                        html += `
                            <th style="
                                background:#1a1a1a;
                                color:#FFCC00;
                                padding:8px;
                                text-align:left;
                                white-space:nowrap;
                            ">
                                ${valeur}
                            </th>
                        `;
                    } else {
                        html += `
                            <td style="
                                padding:8px;
                                border-bottom:1px solid #eee;
                                white-space:nowrap;
                            ">
                                ${valeur}
                            </td>
                        `;
                    }
                });

                html += '</tr>';
            });

            html += '</table>';

            tableau.innerHTML = html;
            apercu.style.display = 'block';

        } catch (error) {
            console.error('Erreur lecture Excel :', error);

            donneesTicket = null;

            alert(
                error.message ||
                'Impossible de lire le fichier Excel.'
            );
        }
    };

    reader.onerror = function () {
        donneesTicket = null;
        alert('Impossible de lire le fichier.');
    };

    reader.readAsArrayBuffer(fichier);
}







async function confirmerImport() {
    if (!donneesTicket) {
        alert('Veuillez choisir un fichier Excel.');
        return;
    }

    const appreciationElement =
        document.getElementById('appreciation-client');

    const appreciation =
        appreciationElement?.value.trim() || '';

    if (!appreciation) {
        alert('Veuillez saisir l\'appréciation du client.');
        return;
    }

    const inputFichier =
        document.getElementById('fichier-ticket');

    const fichier =
        inputFichier?.files?.[0];

    if (!fichier) {
        alert('Veuillez choisir un fichier Excel.');
        return;
    }

    const formData = new FormData();
    formData.append('fichier', fichier);

    try {
        const response = await fetch(TICKET_IMPORT_URL, {
            method: 'POST',
            headers: {
                'X-CSRFToken': obtenirCSRFToken()
            },
            body: formData
        });

        const result = await lireJSON(response);

        if (!response.ok || result.succes === false) {
            throw new Error(
                result.erreur ||
                'Erreur lors de l\'import'
            );
        }

        
        let ticketId = result.ticket_id;

        if (!ticketId) {
            const premiereRangee =
                donneesTicket[1] || [];

            ticketId = premiereRangee[0];
        }

        // Enregistrement de l'appréciation
        if (ticketId) {
            try {
                const feedbackResponse = await fetch(
                    `/api/tickets/${encodeURIComponent(ticketId)}/feedback/`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': obtenirCSRFToken()
                        },
                        body: JSON.stringify({
                            feedback: appreciation
                        })
                    }
                );

                if (!feedbackResponse.ok) {
                    console.warn(
                        'Feedback non enregistré :',
                        feedbackResponse.status
                    );
                }

            } catch (error) {
                console.warn(
                    'Feedback non envoyé :',
                    error
                );
            }
        }

        const boutonConfirmer =
            document.getElementById('btn-confirmer');

        const zoneTelechargement =
            document.getElementById('zone-telechargement');

        if (boutonConfirmer) {
            boutonConfirmer.style.display = 'none';
        }

        if (zoneTelechargement) {
            zoneTelechargement.style.display = 'block';
        }

        await chargerTicketsImportes();

    } catch (error) {
        console.error('Erreur import ticket :', error);

        alert(
            error.message ||
            'Erreur lors de l\'import du ticket.'
        );
    }
}





function telechargerFichier(ticketId) {
    if (ticketId) {
        window.location.href =
            `${TICKET_EXPORT_URL}?ticket_id=${encodeURIComponent(ticketId)}`;

        return;
    }

    if (!donneesTicket) {
        alert(
            'Aucun ticket sélectionné pour le téléchargement.'
        );
        return;
    }

    const appreciationElement =
        document.getElementById('appreciation-client');

    const appreciation =
        appreciationElement?.value.trim() || '';

    const maintenant =
        new Date().toLocaleString('fr-FR');

    const ticket = {
        donnees: donneesTicket,
        appreciation: appreciation,
        date: maintenant
    };

    const donneesCopie =
        ticket.donnees.map((row, i) => {
            const ligne = Array.isArray(row)
                ? [...row]
                : [];

            if (i === 0) {
                return [
                    ...ligne,
                    'Appréciation client',
                    'Date d\'importation'
                ];
            }

            if (i === 1) {
                return [
                    ...ligne,
                    ticket.appreciation,
                    ticket.date
                ];
            }

            return [
                ...ligne,
                '',
                ''
            ];
        });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(donneesCopie);

    const colWidths = [];

    donneesCopie.forEach(row => {
        row.forEach((cell, j) => {
            const longueur =
                cell !== null &&
                cell !== undefined &&
                String(cell).length
                    ? String(cell).length
                    : 10;

            if (!colWidths[j] || colWidths[j] < longueur) {
                colWidths[j] = longueur;
            }
        });
    });

    ws['!cols'] = colWidths.map(
        width => ({
            wch: Math.min(width + 2, 60)
        })
    );

    XLSX.utils.book_append_sheet(
        wb,
        ws,
        'Ticket'
    );

    XLSX.writeFile(
        wb,
        'ticket_preview.xlsx'
    );
}



// AFFICHAGE DES TICKETS


function afficherTicketsImportes() {
    const liste =
        document.getElementById(
            'liste-tickets-importes'
        );

    if (!liste) return;

    if (
        !ticketsImportes ||
        ticketsImportes.length === 0
    ) {
        liste.innerHTML = `
            <p class="empty-state">
                Aucun ticket importé
            </p>
        `;

        return;
    }

    liste.innerHTML = '';

    ticketsImportes.forEach(ticket => {
        const ticketId = ticket.ticket_id || ticket.id;
        const li = document.createElement('li');
        li.id = `ticket-${ticketId}`;

        const informations = document.createElement('div');
        informations.className = 'ticket-info-wrapper';

        const nom = document.createElement('div');
        nom.className = 'ticket-nom';

        const ticketTitle = ticket.ticket_id || ticket.nom || `Ticket #${ticketId}`;
        const stateBadge = ticket.state ? ` <span class="badge bg-warning text-dark style-badge" style="font-size:11px; margin-left:8px; padding:3px 8px; border-radius:12px; font-weight:600;">${echapperHTML(ticket.state)}</span>` : '';
        nom.innerHTML = `<strong>${echapperHTML(ticketTitle)}</strong>${stateBadge}`;

        const details = document.createElement('div');
        details.className = 'ticket-date';

        const elements = [];
        if (ticket.requester) {
            elements.push(`<span><i class="bi bi-person"></i> ${echapperHTML(ticket.requester)}</span>`);
        }
        if (ticket.date || ticket.cree_le) {
            elements.push(`<span><i class="bi bi-calendar3"></i> ${echapperHTML(ticket.date || ticket.cree_le)}</span>`);
        }
        if (ticket.appreciation || ticket.feedback) {
            elements.push(`<span><i class="bi bi-chat-left-text"></i> ${echapperHTML(ticket.appreciation || ticket.feedback)}</span>`);
        }

        details.innerHTML = elements.join('<span style="margin: 0 4px; color:#cbd5e1;">•</span>');

        informations.appendChild(nom);
        informations.appendChild(details);

        const wrapper = document.createElement('div');
        wrapper.className = 'action-buttons-inline';

        const boutonTelecharger = document.createElement('button');
        boutonTelecharger.type = 'button';
        boutonTelecharger.className = 'btn-action-icon btn-action-download';
        boutonTelecharger.title = 'Télécharger le ticket';
        boutonTelecharger.setAttribute('aria-label', 'Télécharger');
        boutonTelecharger.innerHTML = '<i class="bi bi-download"></i>';

        boutonTelecharger.addEventListener('click', function (event) {
            event.stopPropagation();
            telechargerFichier(ticketId);
        });

        wrapper.appendChild(boutonTelecharger);

        if (window.canDeleteTicket) {
            const boutonSupprimer = document.createElement('button');
            boutonSupprimer.type = 'button';
            boutonSupprimer.className = 'btn-action-icon btn-action-delete';
            boutonSupprimer.title = 'Supprimer le ticket';
            boutonSupprimer.setAttribute('aria-label', 'Supprimer');
            boutonSupprimer.innerHTML = '<i class="bi bi-trash"></i>';

            boutonSupprimer.addEventListener('click', function (event) {
                event.stopPropagation();
                supprimerTicket(ticketId);
            });

            wrapper.appendChild(boutonSupprimer);
        }

        li.appendChild(informations);
        li.appendChild(wrapper);
        liste.appendChild(li);
    });
}




async function supprimerTicket(id) {
    if (!id) {
        alert('ID du ticket introuvable');
        return;
    }

    if (!confirm('Supprimer ce ticket ?')) {
        return;
    }

    try {
        const response = await fetch(
            `/api/tickets/${encodeURIComponent(id)}/`,
            {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': obtenirCSRFToken()
                }
            }
        );

        const contentType =
            response.headers.get('content-type') || '';

        let errorData = null;

        if (contentType.includes('application/json')) {
            errorData = await response.json();
        }

        if (!response.ok) {
            throw new Error(
                errorData?.erreur ||
                'Erreur lors de la suppression'
            );
        }

        await chargerTicketsImportes();

    } catch (error) {
        console.error(
            'Erreur suppression ticket :',
            error
        );

        alert(
            error.message ||
            'Erreur réseau lors de la suppression'
        );
    }
}



function toggleMenu(btn) {
    const wrapper =
        btn.closest('.action-menu-wrapper');

    const menu =
        wrapper?.querySelector(
            '.action-dropdown'
        );

    if (!menu) return;

    const doitOuvrir =
        !menu.classList.contains('open');

    document
        .querySelectorAll(
            '.action-dropdown.open'
        )
        .forEach(dropdown => {
            dropdown.classList.remove('open');
        });

    if (doitOuvrir) {
        menu.classList.add('open');
    }
}

window.toggleMenu = toggleMenu;



document.addEventListener(
    'click',
    function (e) {
        const wrapper =
            e.target.closest(
                '.action-menu-wrapper'
            );

        if (!wrapper) {
            document
                .querySelectorAll(
                    '.action-dropdown.open'
                )
                .forEach(menu => {
                    menu.classList.remove('open');
                });

            return;
        }

        if (
            !e.target.closest('.btn-three-dots') &&
            !e.target.closest('.action-dropdown')
        ) {
            document
                .querySelectorAll(
                    '.action-dropdown.open'
                )
                .forEach(menu => {
                    menu.classList.remove('open');
                });
        }
    }
);



document.addEventListener(
    'DOMContentLoaded',
    function () {
        chargerTicketsImportes();

        const inputFiltre = document.getElementById('filtre_tickets');
        if (inputFiltre) {
            inputFiltre.addEventListener('input', function () {
                const query = this.value.toLowerCase().trim();
                document.querySelectorAll('#liste-tickets-importes li').forEach(li => {
                    const text = li.textContent.toLowerCase();
                    li.style.display = text.includes(query) ? '' : 'none';
                });
            });
        }
    }
);
