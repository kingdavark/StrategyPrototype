// debug.js - Debug panel UI logic

// Store default values for reset
const defaultConfig = { ...GameConfig };

function populateDebugPanel() {
    for (const key in GameConfig) {
        if (GameConfig.hasOwnProperty(key)) {
            const input = document.getElementById('cfg-' + key);
            if (input) {
                input.value = GameConfig[key];
                // Update GameConfig on input change
                input.addEventListener('input', function () {
                    const val = parseFloat(this.value);
                    if (!isNaN(val)) {
                        GameConfig[key] = val;
                        console.log(`GameConfig.${key} set to ${val}`);
                    }
                });
            }
        }
    }
}

// Reset to defaults
document.getElementById('debug-reset').addEventListener('click', function () {
    for (const key in defaultConfig) {
        if (defaultConfig.hasOwnProperty(key)) {
            GameConfig[key] = defaultConfig[key];
            const input = document.getElementById('cfg-' + key);
            if (input) input.value = defaultConfig[key];
        }
    }
    alert('Config reset to defaults. Reload the page to apply cell size/world size changes.');
});

// Reload page to apply changes that require restart (cell size, world size)
document.getElementById('debug-apply').addEventListener('click', function () {
    location.reload();
});

// Toggle panel visibility
document.getElementById('debug-toggle').addEventListener('click', function () {
    const panel = document.getElementById('debug-panel');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        populateDebugPanel();
    } else {
        panel.style.display = 'none';
    }
});