

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("dashboard-root");
  const apiUrl = root.dataset.apiUrl;

  function charger(periode) {
    fetch(`${apiUrl}?periode=${periode}`)
      .then((res) => res.json())
      .then((data) => afficher(data))
      .catch((err) => {
        console.error("Erreur chargement dashboard:", err);
        root.insertAdjacentHTML(
          "afterbegin",
          `<p style="color:red">Erreur de chargement : ${err}</p>`
        );
      });
  }

  function afficher(data) {
    document.getElementById("kpis-container").innerHTML = `
      <ul>
        <li>Tickets ouverts : ${data.kpis.tickets_ouverts}</li>
        <li>Incidents actifs : ${data.kpis.incidents_actifs}</li>
        <li>RCA en attente : ${data.kpis.rca_en_attente}</li>
        <li>Durée moyenne résolution : ${formatDuree(data.kpis.duree_moyenne_resolution_secondes)}</li>
        <li>Outils sans owner : ${data.kpis.outils_sans_owner}</li>
        <li>Services non couverts : ${data.kpis.services_non_couverts}</li>
        <li>Feedbacks récents : ${data.kpis.feedbacks_recents}</li>
      </ul>
    `;

    document.getElementById("tickets-container").innerHTML = `
      <h3>Tickets</h3>
      <p>Sans feedback : ${data.tickets.sans_feedback}</p>
      <p>Anciens (+7j) : ${data.tickets.anciens_plus_7j}</p>
      <ul>
        ${data.tickets.par_agent
          .map((t) => `<li>${t.assigned_to || "(non assigné)"} : ${t.total}</li>`)
          .join("")}
      </ul>
    `;

    document.getElementById("incidents-container").innerHTML = `
      <h3>Incidents</h3>
      <p>Par sévérité :</p>
      <ul>
        ${data.incidents.par_severite
          .map((i) => `<li>${i.severite || "(non renseigné)"} : ${i.total}</li>`)
          .join("")}
      </ul>
      <p>RCA en attente (les plus anciens) :</p>
      <ul>
        ${data.incidents.rca_en_attente
          .map((i) => `<li>${i.incident_id} — ${i.severite} — ${i.team}</li>`)
          .join("")}
      </ul>
    `;

    document.getElementById("catalogue-container").innerHTML = `
      <h3>Catalogue</h3>
      <p>Total outils : ${data.catalogue.total_outils}</p>
      <p>Total services : ${data.catalogue.total_services}</p>
      <p>Sans owner : ${data.catalogue.outils_sans_owner}</p>
      <p>Services non couverts : ${data.catalogue.services_non_couverts}</p>
    `;

    document.getElementById("experiences-container").innerHTML = `
      <h3>Expériences membres</h3>
      <p>Feedbacks : ${data.experiences.feedbacks}</p>
      <p>Plaintes : ${data.experiences.plaintes} (anonymes : ${data.experiences.plaintes_anonymes})</p>
      <p>Recommandations : ${data.experiences.recommandations}</p>
      <p>Sujets récurrents :</p>
      <ul>
        ${data.experiences.sujets_recurrents
          .map((s) => `<li>${s.mot} (${s.occurrences} fois)</li>`)
          .join("")}
      </ul>
    `;
  }

  function formatDuree(secondes) {
    if (!secondes) return "—";
    const heures = Math.floor(secondes / 3600);
    const minutes = Math.round((secondes % 3600) / 60);
    return `${heures}h${minutes.toString().padStart(2, "0")}`;
  }

  charger("mois");
});