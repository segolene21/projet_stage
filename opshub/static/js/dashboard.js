document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("dashboard-root");
  const apiUrl = root.dataset.apiUrl;
  const selectPeriode = document.getElementById("periode-select");

  let chartAgents = null;
  let chartSeverite = null;
  let chartTendance = null;

  const PALETTE = ["#111827", "#facc15", "#dc2626", "#16a34a", "#9ca3af", "#f59e0b"];

  function detruireGraph(chart) {
    if (chart) chart.destroy();
  }

  function charger(periode) {
    fetch(`${apiUrl}?periode=${periode}`)
      .then((res) => res.json())
      .then((data) => afficher(data))
      .catch((err) => {
        console.error("Erreur chargement dashboard:", err);
        root.insertAdjacentHTML(
          "afterbegin",
          `<p style="color:#dc2626">Erreur de chargement : ${err}</p>`
        );
      });
  }

  function afficher(data) {
    afficherAlerte(data);
    afficherKpis(data.kpis);
    afficherTickets(data.tickets);
    afficherIncidents(data.incidents);
    afficherCatalogue(data.catalogue);
    afficherExperiences(data.experiences);
  }

  function afficherAlerte(data) {
    const zone = document.getElementById("alerte-container");
    const nb = data.kpis.rca_en_attente;
    if (!nb) {
      zone.innerHTML = "";
      return;
    }
    zone.innerHTML = `
      <div class="dashboard-alerte">
        ⚠️ ${nb} incident${nb > 1 ? "s" : ""} en attente de RCA
      </div>
    `;
  }

  function carteKpi(valeur, label, accent = "") {
    return `
      <div class="dashboard-kpi-card ${accent}">
        <div class="dashboard-kpi-valeur">${valeur}</div>
        <div class="dashboard-kpi-label">${label}</div>
      </div>
    `;
  }

  function afficherKpis(kpis) {
    document.getElementById("kpis-container").innerHTML = `
      ${carteKpi(kpis.tickets_sans_feedback, "Tickets sans feedback")}
      ${carteKpi(kpis.incidents_actifs, "Incidents actifs")}
      ${carteKpi(kpis.rca_en_attente, "RCA en attente", kpis.rca_en_attente > 0 ? "dashboard-kpi-alerte" : "")}
      ${carteKpi(formatDuree(kpis.duree_moyenne_resolution_secondes), "Durée moy. résolution")}
      ${carteKpi(kpis.outils_sans_owner, "Outils sans owner")}
      ${carteKpi(kpis.services_non_couverts, "Services non couverts")}
      ${carteKpi(kpis.feedbacks_recents, "Retours-membres récents")}
    `;
  }

  function afficherTickets(t) {
  document.getElementById("tickets-container").innerHTML = `
    <h2 class="dashboard-section-title">Tickets</h2>
    <div class="detail-row">
      <span class="detail-label">Sans feedback</span>
      <span>${t.sans_feedback}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Anciens (+7j)</span>
      <span>${t.anciens_plus_7j}</span>
    </div>
    <h3 class="detail-subtitle">Répartition par agent</h3>
    <canvas id="chart-agents" height="70"></canvas>
    <ul class="dashboard-liste-classement">
      ${t.par_agent
        .map(
          (a) => `
        <li>
          <span>${a.assigned_to || "(non assigné)"}</span>
          <span class="badge badge-yes">${a.total}</span>
        </li>`
        )
        .join("")}
    </ul>
  `;

  detruireGraph(chartAgents);
  const ctx = document.getElementById("chart-agents");
  chartAgents = new Chart(ctx, {
    type: "bar",
    data: {
      labels: t.par_agent.map((a) => a.assigned_to || "(non assigné)"),
      datasets: [{
        label: "Tickets",
        data: t.par_agent.map((a) => a.total),
        backgroundColor: "#facc15",
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 0,
            minRotation: 0,
            autoSkip: false,
            font: { size: 9 },
            callback: function(value) {
              const label = this.getLabelForValue(value);
              return label.split(" ")[0];
            },
          },
        },
        y: { display: false, beginAtZero: true },
      },
    },
  });
}

  function afficherIncidents(i) {
  document.getElementById("incidents-container").innerHTML = `
    <h2 class="dashboard-section-title">Incidents</h2>
    <h3 class="detail-subtitle">Par sévérité</h3>
    <canvas id="chart-severite" height="90"></canvas>
    <h3 class="detail-subtitle">Évolution mensuelle</h3>
    <canvas id="chart-tendance" height="90"></canvas>
    <h3 class="detail-subtitle">RCA en attente (les plus anciens)</h3>
    <ul class="dashboard-liste-simple">
      ${i.rca_en_attente
        .map((r) => `<li>${r.incident_id} — ${r.severite} — ${r.team || "—"}</li>`)
        .join("") || "<li>Aucun</li>"}
    </ul>
  `;

  detruireGraph(chartSeverite);
  const severite = i.par_severite || [];

  if (severite.length === 0) {
    document.getElementById("chart-severite").outerHTML =
      '<p style="color:#999;font-size:13px;padding:8px 0;">Aucun incident classé par sévérité pour l\'instant.</p>';
  } else {
    const ctxSev = document.getElementById("chart-severite");
    chartSeverite = new Chart(ctxSev, {
      type: "doughnut",
      data: {
        labels: severite.map((s) => s.severite || "(non renseigné)"),
        datasets: [{
          data: severite.map((s) => s.total),
          backgroundColor: PALETTE,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } } },
      },
    });
  }

  detruireGraph(chartTendance);
  const ctxTend = document.getElementById("chart-tendance");
  const tendance = i.tendance_mensuelle || [];
  chartTendance = new Chart(ctxTend, {
    type: "line",
    data: {
      labels: tendance.map((m) => m.mois),
      datasets: [{
        label: "Incidents",
        data: tendance.map((m) => m.total),
        borderColor: "#111827",
        backgroundColor: "rgba(250, 204, 21, 0.25)",
        fill: true,
        tension: 0.3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0, font: { size: 9 } } },
        x: { ticks: { font: { size: 9 } } },
      },
    },
  });
}
  function afficherCatalogue(c) {
    document.getElementById("catalogue-container").innerHTML = `
      <h2 class="dashboard-section-title">Catalogue</h2>
      <div class="detail-row">
        <span class="detail-label">Total outils</span>
        <span>${c.total_outils}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Total services</span>
        <span>${c.total_services}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Sans owner</span>
        <span>${c.outils_sans_owner}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Services non couverts</span>
        <span>${c.services_non_couverts}</span>
      </div>
    `;
  }

  function afficherExperiences(e) {
    document.getElementById("experiences-container").innerHTML = `
      <h2 class="dashboard-section-title">Expériences membres</h2>
      <div class="detail-row">
        <span class="detail-label">Feedbacks</span>
        <span>${e.feedbacks}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Plaintes</span>
        <span>${e.plaintes} (anonymes : ${e.plaintes_anonymes})</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Recommandations</span>
        <span>${e.recommandations}</span>
      </div>
      <h3 class="detail-subtitle">Sujets récurrents</h3>
      <ul class="dashboard-liste-simple">
        ${(e.sujets_recurrents || [])
          .map((s) => `<li>${s.mot} (${s.occurrences} fois)</li>`)
          .join("") || "<li>Aucun</li>"}
      </ul>
    `;
  }

  function formatDuree(secondes) {
    if (!secondes) return "—";
    const heures = Math.floor(secondes / 3600);
    const minutes = Math.round((secondes % 3600) / 60);
    return `${heures}h${minutes.toString().padStart(2, "0")}`;
  }

  selectPeriode.addEventListener("change", () => charger(selectPeriode.value));
  charger("mois");
});