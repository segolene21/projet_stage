const toggleTheme = document.getElementById('toggle-theme');
const themeButtons = document.querySelectorAll('.theme-btn');

function applyTheme(theme, sauvegarder = true) {
    const isDark = theme === 'dark';
    document.body.classList.toggle('dark-mode', isDark);

    if (toggleTheme) {
        toggleTheme.checked = isDark;
    }

    themeButtons.forEach((button) => {
        const isActive = button.dataset.theme === theme;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });

    if (sauvegarder) {
        fetch('/api/parametres/theme/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({ theme_sombre: isDark })
        }).catch(err => console.error('Erreur sauvegarde thème :', err));
    }
}

if (toggleTheme || themeButtons.length) {
    const dejaSombre = document.body.classList.contains('dark-mode');
    applyTheme(dejaSombre ? 'dark' : 'light', false);

    if (toggleTheme) {
        toggleTheme.addEventListener('change', () => {
            applyTheme(toggleTheme.checked ? 'dark' : 'light');
        });
    }

    themeButtons.forEach((button) => {
        button.addEventListener('click', () => {
            applyTheme(button.dataset.theme);
        });
    });
}