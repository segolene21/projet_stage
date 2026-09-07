// Gere l'ouverture et la fermeture des sections d'aide.
function toggleAccordeon(bouton) {
    const contenu = bouton.nextElementSibling;
    const estOuvert = contenu.style.display === 'block';

    document.querySelectorAll('.aide-contenu').forEach(c => c.style.display = 'none');
    document.querySelectorAll('.aide-titre').forEach(b => b.classList.remove('actif'));

    if (!estOuvert) {
        contenu.style.display = 'block';
        bouton.classList.add('actif');
    }
}

// Filtre les rubriques d'aide selon le texte saisi.
function filtrerAide() {
    const recherche = document.getElementById('recherche-aide').value.toLowerCase();
    document.querySelectorAll('.aide-section').forEach(section => {
        const texte = section.textContent.toLowerCase();
        section.style.display = texte.includes(recherche) ? '' : 'none';
    });
}