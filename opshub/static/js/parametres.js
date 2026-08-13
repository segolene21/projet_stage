const themeButtons = document.querySelectorAll('.theme-btn');

function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.body.classList.toggle('dark-mode', isDark);
    localStorage.setItem('theme', theme);

    themeButtons.forEach((button) => {
        const isActive = button.dataset.theme === theme;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });
}

if (themeButtons.length) {
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    themeButtons.forEach((button) => {
        button.addEventListener('click', () => {
            applyTheme(button.dataset.theme);
        });
    });
}