function afficherToast(message, type = 'info') {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;

    toast.textContent = message;
    toast.className = 'toast' + (type === 'erreur' ? ' toast-erreur' : type === 'succes' ? ' toast-succes' : '');
    toast.style.display = 'block';

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}
function confirmerAction(message, titre = 'Confirmation') {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        document.getElementById('confirm-modal-titre').textContent = titre;
        document.getElementById('confirm-modal-message').textContent = message;
        modal.style.display = 'flex';

        const btnValider = document.getElementById('confirm-modal-valider');
        const btnAnnuler = document.getElementById('confirm-modal-annuler');

        const nettoyer = () => {
            modal.style.display = 'none';
            btnValider.removeEventListener('click', onValider);
            btnAnnuler.removeEventListener('click', onAnnuler);
        };
        const onValider = () => { nettoyer(); resolve(true); };
        const onAnnuler = () => { nettoyer(); resolve(false); };

        btnValider.addEventListener('click', onValider);
        btnAnnuler.addEventListener('click', onAnnuler);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const message = sessionStorage.getItem('toast_message');
    if (message) {
        const type = sessionStorage.getItem('toast_type') || 'info';
        afficherToast(message, type);
        sessionStorage.removeItem('toast_message');
        sessionStorage.removeItem('toast_type');
    }
});