const toggleTheme = document.getElementById('toggle-theme');
const themeButtons = document.querySelectorAll('.theme-btn');

function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.body.classList.toggle('dark-mode', isDark);
    localStorage.setItem('theme', theme);

    if (toggleTheme) {
        toggleTheme.checked = isDark;
    }

    themeButtons.forEach((button) => {
        const isActive = button.dataset.theme === theme;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });
}

if (toggleTheme || themeButtons.length) {
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

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