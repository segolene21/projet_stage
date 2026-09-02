let graphiques = {};

async function chargerDashboard() {
    const debut = document.getElementById('filtre-debut').value;
    const fin = document.getElementById('filtre-fin').value;

    const params = new URLSearchParams();
    if (debut) params.set('debut', debut);
    if (fin) params.set('fin', fin);

    try {
        const res = await fetch(`/api/dashboard/?${params.toString()}`, { cache: 'no-store' });
        if (!res.ok) {
            afficherToast('Erreur lors du chargement du dashboard', 'erreur');
            return;
        }
        const data = await res.json();
        afficherKpis(data.kpis);
        construireGraphiques(data);
        afficherAlertes(data);
    } catch (erreur) {
        console.error('Erreur dashboard :', erreur);
    }
}

function reinitialiserFiltresDashboard() {
    document.getElementById('filtre-debut').value = '';
    document.getElementById('filtre-fin').value = '';
    chargerDashboard();
}

function animerCompteur(elementId, valeurFinale) {
    const element = document.getElementById(elementId);
    const duree = 800;
    const debut = performance.now();
    const valeurInitiale = 0;

    function etape(maintenant) {
        const progres = Math.min((maintenant - debut) / duree, 1);
        const valeurActuelle = Math.round(valeurInitiale + (valeurFinale - valeurInitiale) * progres);
        element.textContent = valeurActuelle;
        if (progres < 1) requestAnimationFrame(etape);
    }
    requestAnimationFrame(etape);
}

function afficherKpis(kpis) {
    animerCompteur('kpi-tickets', kpis.total_tickets);
    animerCompteur('kpi-incidents', kpis.total_incidents);
    animerCompteur('kpi-outils', kpis.total_outils);
    animerCompteur('kpi-services', kpis.total_services);
    animerCompteur('kpi-contributions', kpis.total_contributions);
}

function detruireGraphique(id) {
    if (graphiques[id]) {
        graphiques[id].destroy();
        delete graphiques[id];
    }
}

function construireGraphiques(data) {
    // --- Évolution des tickets sans feedback ---
    detruireGraphique('tickets-state');
    graphiques['tickets-state'] = new Chart(document.getElementById('chart-tickets-state'), {
        type: 'line',
        data: {
            labels: data.tickets.evolution_sans_feedback.map(t => t.mois),
            datasets: [{
                label: 'Tickets sans feedback',
                data: data.tickets.evolution_sans_feedback.map(t => t.total),
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                fill: true,
                tension: 0.3,
            }],
        },
        options: {
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
        },
    });

    // --- Top assignés tickets ---
    detruireGraphique('tickets-assignes');
    graphiques['tickets-assignes'] = new Chart(document.getElementById('chart-tickets-assignes'), {
        type: 'bar',
        data: {
            labels: data.tickets.top_assignes.map(r => r.assigned_to),
            datasets: [{
                label: 'Tickets assignés',
                data: data.tickets.top_assignes.map(r => r.total),
                backgroundColor: '#FFCC00',
            }],
        },
        options: {
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: { legend: { display: false } },
        },
    });

    // --- Incidents par sévérité ---
    detruireGraphique('incidents-severite');
    graphiques['incidents-severite'] = new Chart(document.getElementById('chart-incidents-severite'), {
        type: 'pie',
        data: {
            labels: data.incidents.repartition_severite.map(r => r.severite),
            datasets: [{
                data: data.incidents.repartition_severite.map(r => r.total),
                backgroundColor: ['#e74c3c', '#f39c12', '#f1c40f', '#2ecc71', '#3498db'],
            }],
        },
        options: {
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
        },
    });

    // --- Incidents par team ---
    detruireGraphique('incidents-team');
    graphiques['incidents-team'] = new Chart(document.getElementById('chart-incidents-team'), {
        type: 'bar',
        data: {
            labels: data.incidents.repartition_team.map(r => r.team),
            datasets: [{
                label: 'Incidents',
                data: data.incidents.repartition_team.map(r => r.total),
                backgroundColor: '#1a1a1a',
            }],
        },
        options: {
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
        },
    });

    // --- Tendance expériences membres ---
    detruireGraphique('experiences-tendance');
    graphiques['experiences-tendance'] = new Chart(document.getElementById('chart-experiences-tendance'), {
        type: 'line',
        data: {
            labels: data.experiences.tendance_mensuelle.map(t => t.mois),
            datasets: [
                {
                    label: 'Feedback',
                    data: data.experiences.tendance_mensuelle.map(t => t.feedback),
                    borderColor: '#FFCC00',
                    tension: 0.3,
                },
                {
                    label: 'Plaintes',
                    data: data.experiences.tendance_mensuelle.map(t => t.plainte),
                    borderColor: '#e74c3c',
                    tension: 0.3,
                },
                {
                    label: 'Recommandations',
                    data: data.experiences.tendance_mensuelle.map(t => t.recommandation),
                    borderColor: '#2ecc71',
                    tension: 0.3,
                },
            ],
        },
        options: {
            maintainAspectRatio: false,
        },
    });

    // --- Outils par équipe ---
    detruireGraphique('outils-equipe');
    graphiques['outils-equipe'] = new Chart(document.getElementById('chart-outils-equipe'), {
        type: 'bar',
        data: {
            labels: data.catalogue.repartition_outils_par_equipe.map(r => r.outil_team__nom),
            datasets: [{
                label: 'Outils',
                data: data.catalogue.repartition_outils_par_equipe.map(r => r.total),
                backgroundColor: '#FFCC00',
            }],
        },
        options: {
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
        },
    });

    // --- RCA fourni vs en attente ---
    detruireGraphique('rca-statut');
    graphiques['rca-statut'] = new Chart(document.getElementById('chart-rca-statut'), {
        type: 'doughnut',
        data: {
            labels: ['RCA fourni', 'RCA en attente'],
            datasets: [{
                data: [data.incidents.rca_fourni, data.incidents.rca_manquant],
                backgroundColor: ['#2ecc71', '#e74c3c'],
            }],
        },
        options: {
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
        },
    });
}

function afficherAlertes(data) {
    const liste = document.getElementById('liste-alertes');
    liste.innerHTML = '';

    const alertes = [];

    if (data.tickets.sans_feedback > 0) {
        alertes.push(`${data.tickets.sans_feedback} ticket(s) sans feedback renseigné`);
    }
    if (data.incidents.sans_rca > 0) {
        alertes.push(`${data.incidents.sans_rca} incident(s) sans RCA fourni`);
    }
    if (data.incidents.en_attente > 0) {
        alertes.push(`${data.incidents.en_attente} incident(s) en attente`);
    }
    if (data.catalogue.services_sans_outil > 0) {
        alertes.push(`${data.catalogue.services_sans_outil} service(s) non couvert(s) par un outil de monitoring`);
    }
    if (data.catalogue.outils_inactifs > 0) {
        alertes.push(`${data.catalogue.outils_inactifs} outil(s) inactif(s)`);
    }

    if (alertes.length === 0) {
        liste.innerHTML = '<li style="background:#dcfce7; color:#15803d;">Aucun point d\'attention pour l\'instant</li>';
        return;
    }

    alertes.forEach(texte => {
        const li = document.createElement('li');
        li.textContent = texte;
        liste.appendChild(li);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    chargerDashboard();
});