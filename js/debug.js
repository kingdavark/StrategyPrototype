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

// Update local worker panel visibility and info
function updateLocalWorkerPanel() {
    const panel = document.getElementById('local-worker-panel');
    const info = document.getElementById('local-worker-info');
    if (panel && info) {
        if (selectedLocalCell && gameState === 'camp') {
            panel.style.display = 'block';
            const cell = getCell(selectedLocalCell.cx, selectedLocalCell.cy);
            info.textContent = `Cell (${selectedLocalCell.cx}, ${selectedLocalCell.cy}) - Assigned: ${cell.assignedWorkers}`;
        } else {
            panel.style.display = 'none';
        }
    }
}

// Add/remove workers buttons
document.getElementById('local-worker-add').addEventListener('click', function () {
    if (selectedLocalCell && gameState === 'camp') {
        const cell = getCell(selectedLocalCell.cx, selectedLocalCell.cy);
        if (camp.unassignedPopulation > 0) {
            // Ensure gatherer pop exists
            let pop = camp.pops.find(p => p.type === 'gatherer');
            if (!pop) {
                pop = new Pop('gatherer');
                camp.pops.push(pop);
            }
            cell.assignedWorkers++;
            camp.unassignedPopulation--;
            camp.localGatherers++;
            pop.totalWorkers++;
            pop.localWorkers++;
            updateInfoText();
            updateCampText();
            updateLocalWorkerPanel();
            updateCellWorkerLabels();
        }
    }
});

document.getElementById('local-worker-remove').addEventListener('click', function () {
    if (selectedLocalCell && gameState === 'camp') {
        const cell = getCell(selectedLocalCell.cx, selectedLocalCell.cy);
        if (cell.assignedWorkers > 0) {
            const pop = camp.pops.find(p => p.type === 'gatherer');
            if (pop && pop.localWorkers > 0) {
                cell.assignedWorkers--;
                camp.unassignedPopulation++;
                camp.localGatherers--;
                pop.totalWorkers--;
                pop.localWorkers--;
                updateInfoText();
                updateCampText();
                updateLocalWorkerPanel();
                updateCellWorkerLabels();
            }
        }
    }
});