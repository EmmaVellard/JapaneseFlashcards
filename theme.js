(function setupTheme() {
  const root = document.documentElement;
  const preference = window.matchMedia('(prefers-color-scheme: dark)');
  let savedTheme = null;

  try {
    const saved = localStorage.getItem('jlpt-flashcards-theme');
    if (saved === 'light' || saved === 'dark') savedTheme = saved;
  } catch (_) {
    // System preference still works when browser storage is unavailable.
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    document.querySelectorAll('.theme-toggle').forEach((button) => {
      const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;
      button.setAttribute('aria-label', label);
      button.title = label;
    });
  }

  applyTheme(savedTheme || (preference.matches ? 'dark' : 'light'));
  preference.addEventListener('change', (event) => {
    if (!savedTheme) applyTheme(event.matches ? 'dark' : 'light');
  });

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(root.dataset.theme);
    document.querySelectorAll('.theme-toggle').forEach((button) => {
      button.addEventListener('click', () => {
        savedTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
        try {
          localStorage.setItem('jlpt-flashcards-theme', savedTheme);
        } catch (_) {
          // Keep the selection for this page when storage is blocked.
        }
        applyTheme(savedTheme);
      });
    });
  });
})();
