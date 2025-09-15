document.addEventListener('DOMContentLoaded', () => {
    const themeSelect = document.getElementById('theme-select');
    const precisionInput = document.getElementById('precision-input');
    const languageSelect = document.getElementById('language-select');

    // Load saved settings and apply them to the controls
    function loadSettings() {
        const currentTheme = localStorage.getItem('matrixmaster-theme') || 'theme-hologram';
        const currentPrecision = localStorage.getItem('matrixmaster-precision') || 4;
        const currentLanguage = localStorage.getItem('matrixmaster-language') || 'ja';

        themeSelect.value = currentTheme;
        precisionInput.value = currentPrecision;
        languageSelect.value = currentLanguage;
    }

    // --- Event Listeners to save settings ---

    themeSelect.addEventListener('change', () => {
        const selectedTheme = themeSelect.value;
        localStorage.setItem('matrixmaster-theme', selectedTheme);
        document.body.className = selectedTheme; // Apply theme instantly
    });

    precisionInput.addEventListener('change', () => {
        const selectedPrecision = parseInt(precisionInput.value, 10);
        if (!isNaN(selectedPrecision) && selectedPrecision >= 0 && selectedPrecision <= 14) {
            localStorage.setItem('matrixmaster-precision', selectedPrecision);
        }
    });

    languageSelect.addEventListener('change', () => {
        const selectedLanguage = languageSelect.value;
        localStorage.setItem('matrixmaster-language', selectedLanguage);
        applyLanguage(selectedLanguage); // Apply language instantly from global.js
    });

    loadSettings();
});
