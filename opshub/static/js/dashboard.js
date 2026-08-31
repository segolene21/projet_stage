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
            alert('Erreur lors du chargement du dashboard');
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
    // --- Tickets par statut ---
    detruireGraphique('tickets-state');
    graphiques['tickets-state'] = new Chart(document.getElementById('chart-tickets-state'), {
        type: 'doughnut',
        data: {
            labels: data.tickets.repartition_state.map(r => r.state),
            datasets: [{
                data: data.tickets.repartition_state.map(r => r.total),
                backgroundColor: ['#FFCC00', '#1a1a1a', '#666', '#ccc', '#999'],
            }],
        },
        options: { plugins: { legend: { position: 'bottom' } } },
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
        options: { indexAxis: 'y', plugins: { legend: { display: false } } },
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
        options: { plugins: { legend: { position: 'bottom' } } },
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
        options: { plugins: { legend: { display: false } } },
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
        options: { plugins: { legend: { display: false } } },
    });

    // --- Plaintes anonymes vs nominatives ---
    detruireGraphique('plaintes-anonymat');
    graphiques['plaintes-anonymat'] = new Chart(document.getElementById('chart-plaintes-anonymat'), {
        type: 'doughnut',
        data: {
            labels: ['Anonymes', 'Nominatives'],
            datasets: [{
                data: [data.experiences.plaintes_anonymes, data.experiences.plaintes_nominatives],
                backgroundColor: ['#999', '#FFCC00'],
            }],
        },
        options: { plugins: { legend: { position: 'bottom' } } },
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
        liste.innerHTML = '<li>Aucun point d\'attention pour l\'instant</li>';
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