// main.js - Entry point for the game prototype
// Creates the Phaser game instance and the initial scene.

const config = {
    type: Phaser.AUTO,       // Use WebGL if available, fallback to Canvas
    width: 1280,              // Game width in pixels
    height: 720,             // Game height in pixels
    backgroundColor: '#1a1a2e', // Dark blue-grey background for the game world
    parent: document.body,   // Attach the canvas to the body
    scene: {
        preload: preload,    // Function to load assets (images, sounds)
        create: create,      // Function to set up the initial game state
        update: update       // Function called every frame (game loop)
    }
};

// Create the Phaser game instance
const game = new Phaser.Game(config);

// Camp position (visual placeholder, functionality comes later)
const CAMP_X = GameConfig.campX;
const CAMP_Y = GameConfig.campY;

// Global references for the game scene (set in create)
let gameScene;
let popGraphics;
let gridGraphics;  // reference to grid graphics for dynamic updates
let campGraphics;
let dayAccumulator = 0;          // accumulator for game time in seconds
let gameDay = 1; // Day counter
let campSelected = false;      // whether camp is currently selected
let selectedExpedition = null; // currently selected expedition
let infoText;                  // UI text for selected expedition info
let speedText; // UI text for current simulation speed

// Helper: check if an HTML input is focused (to avoid game hotkeys while typing)
function isInputFocused() {
    const active = document.activeElement;
    return active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
}

// Enable click: left-click to select pop, right-click to move selected pop,
// Shift+left-click to inspect cell (debug).
function enableDebugClick(scene) {
    scene.input.mouse.disableContextMenu();

    // Left click handler
    scene.input.on('pointerdown', function (pointer) {
        if (pointer.rightButtonDown()) return;

                // Shift+click: inspect cell (debug)
        if (pointer.event.shiftKey) {
            const cell = worldToCell(pointer.x, pointer.y);
            const cx = cell.cx;
            const cy = cell.cy;
            if (cx >= 0 && cx < GRID_COLS && cy >= 0 && cy < GRID_ROWS) {
                const cellData = getCell(cx, cy);
                const density = cellData.forageDensity;
                console.log(`Cell (${cx}, ${cy}) - Forage Density: ${density.toFixed(4)}`);
                const infoText = scene.add.text(
                    pointer.x + 15,
                    pointer.y - 15,
                    `Cell: ${cx}, ${cy}\nForage: ${(density * 100).toFixed(1)}%`,
                    {
                        fontSize: '12px',
                        fill: '#ffffff',
                        backgroundColor: '#000000aa',
                        padding: { x: 4, y: 2 }
                    }
                ).setDepth(100);
                scene.time.delayedCall(2000, function () {
                    infoText.destroy();
                });
            }
            return;
        }

        // Check if clicked on an expedition
        let clickedExp = null;
        for (const exp of expeditions) {
            if (Phaser.Math.Distance.Between(pointer.x, pointer.y, exp.x, exp.y) < 10) {
                clickedExp = exp;
                break;
            }
        }

        if (clickedExp) {
            // Select expedition, deselect camp
            selectedExpedition = clickedExp;
            campSelected = false;
            updateInfoText();
            console.log(`Selected expedition ${clickedExp.id}`);
            return;
        }

        // Check if clicked on camp
        if (Phaser.Math.Distance.Between(pointer.x, pointer.y, camp.x, camp.y) < 20) {
            campSelected = true;
            selectedExpedition = null;
            updateInfoText();
            console.log('Camp selected');
            return;
        }

        // Clicked on empty ground: deselect everything
        campSelected = false;
        selectedExpedition = null;
        updateInfoText();
    });

    // Right click handler
    scene.input.on('pointerdown', function (pointer) {
        if (!pointer.rightButtonDown()) return;

        // If neither camp nor an expedition is selected, ignore
        if (!campSelected && !selectedExpedition) {
            console.log('Select camp or an expedition first.');
            return;
        }

        // If we clicked on the camp, create an automatic expedition (free roaming)
        if (Phaser.Math.Distance.Between(pointer.x, pointer.y, camp.x, camp.y) < 20) {
            // Only work if camp is selected
            if (!campSelected) return;

            let pop = camp.pops.find(p => p.type === 'gatherer');
            if (!pop) {
                pop = new Pop('gatherer');
                camp.pops.push(pop);
            }

            let workersToTake = 0;
            if (camp.unassignedPopulation > 0) {
                const moveCount = Math.min(GameConfig.startingExpeditionWorkers, camp.unassignedPopulation);
                camp.unassignedPopulation -= moveCount;
                pop.addWorkers(moveCount);
                workersToTake = moveCount;
            } else if (pop.availableWorkers > 0) {
                workersToTake = Math.min(GameConfig.startingExpeditionWorkers, pop.availableWorkers);
            } else {
                console.log('No available workers.');
                return;
            }

            const taken = pop.takeWorkers(workersToTake);
            if (taken === 0) return;

            const id = 'exp_' + Date.now();
            const areaRadius = GameConfig.areaRadius;
            // Create auto expedition starting from camp, target area = current camp position
            const exp = new Expedition(id, 'gatherer', taken, camp.x, camp.y, camp.x, camp.y, areaRadius, camp);
            exp.useAssignedArea = false; // auto mode
            exp.state = 'resting';
            exp.cooldownRemaining = 0;   // will calculate provisions on first departure

            expeditions.push(exp);
            updateInfoText();
            console.log(`Auto expedition ${id} created with ${taken} workers (will depart after provisioning).`);
            return;
        }

        // If an expedition is selected, update its area and restart cycle
        if (selectedExpedition) {
            selectedExpedition.areaCenter = { x: pointer.x, y: pointer.y };
            // Force expedition to go to new area: reset state to travellingToArea
            selectedExpedition.targetX = pointer.x;
            selectedExpedition.targetY = pointer.y;
            selectedExpedition.state = 'travellingToArea';
            console.log(`Expedition ${selectedExpedition.id} area updated.`);
            updateInfoText();
            return;
        }

        // Create a gathering expedition
        let pop = camp.pops.find(p => p.type === 'gatherer');
        if (!pop) {
            // Create gatherer pop if it doesn't exist
            pop = new Pop('gatherer');
            camp.pops.push(pop);
        }

        // Determine how many workers to take (priority: unassigned, then available gatherers)
        let workersToTake = 0;
        if (camp.unassignedPopulation > 0) {
            // Move unassigned to gatherers, then take them
            const moveCount = Math.min(GameConfig.startingExpeditionWorkers, camp.unassignedPopulation);
            camp.unassignedPopulation -= moveCount;
            pop.addWorkers(moveCount);
            workersToTake = moveCount;
        } else if (pop.availableWorkers > 0) {
            workersToTake = Math.min(GameConfig.startingExpeditionWorkers, pop.availableWorkers);
        } else {
            console.log('No available workers.');
            return;
        }

        // Take the workers (will deduct from available)
        const taken = pop.takeWorkers(workersToTake);
        if (taken === 0) return;

        // Determine if forced (Shift held during right-click)
        const forced = pointer.event.shiftKey;

        // Create expedition
        const id = 'exp_' + Date.now();
        const areaRadius = GameConfig.areaRadius;
        const exp = new Expedition(id, 'gatherer', taken, camp.x, camp.y, pointer.x, pointer.y, areaRadius, camp);
        exp.isForced = forced;

        // Give provisions from camp stock, respecting inventory capacity
        const dist = Phaser.Math.Distance.Between(camp.x, camp.y, pointer.x, pointer.y);
        const needed = getProvisionsNeeded(taken, dist);
        // Cannot exceed camp food, nor the expedition's max capacity
        const given = Math.min(needed, camp.foodStock, exp.maxCapacity);
        exp.inventory.provisions = given;
        camp.foodStock -= given;

        expeditions.push(exp);
        updateInfoText();
        console.log(`Expedition ${id} started with ${taken} workers, ${given.toFixed(1)} provisions.`);
    });

    // Keyboard 'R' to return selected expedition
    scene.input.keyboard.on('keydown-R', function () {
        if (isInputFocused()) return;
        if (selectedExpedition && selectedExpedition.state !== 'returningToCamp' && selectedExpedition.state !== 'resting') {
            selectedExpedition.targetX = camp.x;
            selectedExpedition.targetY = camp.y;
            selectedExpedition.state = 'returningToCamp';
            console.log(`Expedition ${selectedExpedition.id} manually recalled.`);
        }
    });

    // Keyboard 'F' to toggle forced mode on selected expedition
    scene.input.keyboard.on('keydown-F', function () {
        if (isInputFocused()) return;
        if (selectedExpedition) {
            selectedExpedition.isForced = !selectedExpedition.isForced;
            console.log(`Expedition ${selectedExpedition.id} forced mode: ${selectedExpedition.isForced}`);
            updateInfoText();
        }
    });

    // Keyboard 'A' to toggle automatic mode (free roaming vs assigned area)
    scene.input.keyboard.on('keydown-A', function () {
        if (isInputFocused()) return;
        if (selectedExpedition) {
            selectedExpedition.useAssignedArea = !selectedExpedition.useAssignedArea;
            console.log(`Expedition ${selectedExpedition.id} auto mode: ${!selectedExpedition.useAssignedArea}`);
            updateInfoText();
        }
    });

    // ---- Time controls (keyboard) ----
    scene.input.keyboard.on('keydown-SPACE', function () {
        if (isInputFocused()) return;
        TimeManager.togglePause();
        updateSpeedText();
    });

    scene.input.keyboard.on('keydown-ZERO', function () {
        if (isInputFocused()) return;
        TimeManager.setSpeedIndex(1); // 1x
        updateSpeedText();
    });

    scene.input.keyboard.on('keydown-ONE', function () {
        if (isInputFocused()) return;
        TimeManager.setSpeedIndex(2); // 1x
        updateSpeedText();
    });

    scene.input.keyboard.on('keydown-TWO', function () {
        if (isInputFocused()) return;
        TimeManager.setSpeedIndex(3); // 2x
        updateSpeedText();
    });

    scene.input.keyboard.on('keydown-THREE', function () {
        if (isInputFocused()) return;
        TimeManager.setSpeedIndex(4); // 2x
        updateSpeedText();
    });

    scene.input.keyboard.on('keydown-FOUR', function () {
        if (isInputFocused()) return;
        TimeManager.setSpeedIndex(5); // 2x
        updateSpeedText();
    });

    // Increase speed with '+' (same key without shift)
    scene.input.keyboard.on('keydown-NUMPAD_ADD', function (event) {
        if (isInputFocused()) return;
        event.preventDefault();
        TimeManager.increaseSpeed();
        updateSpeedText();
    });

    scene.input.keyboard.on('keydown-PLUS', function (event) {
        if (isInputFocused()) return;
        event.preventDefault();
        TimeManager.increaseSpeed();
        updateSpeedText();
    });

    // Decrease speed with '-' (both numpad and standard)
    scene.input.keyboard.on('keydown-NUMPAD_SUBTRACT', function (event) {
        if (isInputFocused()) return;
        event.preventDefault();
        TimeManager.decreaseSpeed();
        updateSpeedText();
    });
    scene.input.keyboard.on('keydown-MINUS', function (event) {
        if (isInputFocused()) return;
        event.preventDefault();
        TimeManager.decreaseSpeed();
        updateSpeedText();
    });

    // Keyboard 'C' to cancel selected expedition (forces return, then disbands)
    scene.input.keyboard.on('keydown-C', function () {
        if (isInputFocused()) return;
        if (selectedExpedition) {
            const exp = selectedExpedition;

            // If already at camp (resting or idle), disband immediately
            if (exp.state === 'resting' || exp.state === 'idle') {
                camp.foodStock += exp.inventory.food;
                const pop = camp.pops.find(p => p.type === exp.popType);
                if (pop) pop.returnWorkers(exp.workerCount);
                const index = expeditions.indexOf(exp);
                if (index > -1) expeditions.splice(index, 1);
                selectedExpedition = null;
                updateInfoText();
                updateCampText();
                console.log(`Expedition ${exp.id} disbanded at camp.`);
                return;
            }

            // Otherwise, force return to camp and mark for disbanding
            exp.toBeDisbanded = true;
            exp.targetX = camp.x;
            exp.targetY = camp.y;
            exp.state = 'returningToCamp';
            // Clear selection
            selectedExpedition = null;
            updateInfoText();
            console.log(`Expedition ${exp.id} will disband on arrival at camp.`);
        }
    });
}

// preload: load any external assets (images, spritesheets, etc.)
// For now, we have no assets, so this function is empty.
function preload() {
    // nothing to load yet
}

// create: called once after preload. We set up the initial scene.
function create() {
    // Initialize the spatial grid and forage density
    createGrid();
    initializeForageDensity();

    // Debug visualization: draw each cell as a colored rectangle
    const graphics = this.add.graphics();
    gridGraphics = graphics;  // store reference
    campGraphics = this.add.graphics();

    for (let cy = 0; cy < GRID_ROWS; cy++) {
        for (let cx = 0; cx < GRID_COLS; cx++) {
            const cell = getCell(cx, cy);
            const density = cell.forageDensity;

            // Choose color based on density (precise intervals)
            let color;
            if (density >= 0.90) {
                color = 0x1a4d0a;  // dark green (90-100%)
            } else if (density >= 0.75) {
                color = 0x2d6b14;  // medium green (75-89%)
            } else if (density >= 0.50) {
                color = 0x4a8c1f;  // light green (50-74%)
            } else if (density >= 0.25) {
                color = 0xc4a80b;  // yellow (25-49%)
            } else if (density >= 0.05) {
                color = 0xc46e0b;  // orange (5-24%)
            } else if (density > 0.00) {
                color = 0x8b1a0a;  // red (0-4%)
            } else {
                continue; // density = 0, skip (show background)
            }

            const x = cx * CELL_SIZE;
            const y = cy * CELL_SIZE;
            graphics.fillStyle(color, 1); // full opacity
            graphics.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        }
    }

    // Add debug text
    this.add.text(10, 10, 'Debug: Forage Density Grid (green = food)', {
        fontSize: '14px',
        fill: '#ffffff'
    });

    // Enable debug click on cells
    enableDebugClick(this);

        // Store reference to the scene for use in update
    gameScene = this;

    // Create info text (upper right)
    infoText = this.add.text(1280 - 200, 10, '', {
        fontSize: '12px',
        fill: '#ffffff',
        backgroundColor: '#00000088',
        padding: { x: 4, y: 2 },
        align: 'left'
    }).setDepth(200);

    // Camp info text (bottom left) – we can reuse campText from before, define it
    campText = this.add.text(10, 720 - 30, '', { fontSize: '14px', fill: '#ffffff' });
    updateCampText();

    // Speed indicator text
    speedText = this.add.text(10, 30, 'Speed: 1x', {
        fontSize: '14px',
        fill: '#ffffff',
        backgroundColor: '#00000088',
        padding: { x: 4, y: 2 }
    });

    // Graphics object for drawing pops (circles)
    popGraphics = this.add.graphics();

    // Draw the initial pop position and camp
    drawPops();
    drawCamp();
}

// Draw all pops as circles on the screen
function drawPops() {
    if (!popGraphics) return;
    popGraphics.clear();

    for (const exp of expeditions) {
        let color = 0xffffff; // default white
        if (exp.state === 'gathering') color = 0x00ff00;
        else if (exp.state === 'returningToCamp') color = 0xff8800; // orange
        else if (exp.state === 'resting') color = 0x888888;

        popGraphics.fillStyle(color, 1);
        popGraphics.fillCircle(exp.x, exp.y, 8);

        // Red border for forced expeditions
        if (exp.isForced) {
            popGraphics.lineStyle(2, 0xff0000, 1);
            popGraphics.strokeCircle(exp.x, exp.y, 10);
        }

        // Blue dashed border for auto mode
        if (!exp.useAssignedArea) {
            popGraphics.lineStyle(1, 0x0000ff, 0.6);
            popGraphics.strokeCircle(exp.x, exp.y, 12);
        }

        // Selected indicator
        if (exp === selectedExpedition) {
            popGraphics.lineStyle(2, 0xffff00, 0.8);
            popGraphics.strokeCircle(exp.x, exp.y, 10);

            if (!exp.useAssignedArea) {
                // Auto mode: draw path from camp to current position
                drawDashedLine(popGraphics, camp.x, camp.y, exp.x, exp.y, 10, 5);
                // Draw area radius around the expedition
                popGraphics.lineStyle(1, 0xffff00, 0.2);
                popGraphics.strokeCircle(exp.x, exp.y, exp.areaRadius);
            } else {
                // Manual mode: draw path from camp to area center
                drawDashedLine(popGraphics, camp.x, camp.y, exp.areaCenter.x, exp.areaCenter.y, 10, 5);
                // Draw area radius around area center
                popGraphics.lineStyle(1, 0xffff00, 0.2);
                popGraphics.strokeCircle(exp.areaCenter.x, exp.areaCenter.y, exp.areaRadius);
            }
        }

        // Line to target if moving
        if (exp.state === 'travellingToArea' || exp.state === 'returningToCamp') {
            popGraphics.lineStyle(1, 0xffffff, 0.3);
            popGraphics.beginPath();
            popGraphics.moveTo(exp.x, exp.y);
            popGraphics.lineTo(exp.targetX, exp.targetY);
            popGraphics.strokePath();
        }
    }
}

// Utility to draw a dashed line (simple implementation)
function drawDashedLine(graphics, x1, y1, x2, y2, dashLength, gapLength) {
    const dx = x2 - x1, dy = y2 - y1;
    const dist = Math.sqrt(dx*dx+dy*dy);
    const steps = Math.floor(dist / (dashLength + gapLength));
    const stepX = dx / steps, stepY = dy / steps;
    let drawing = true;
    let cx = x1, cy = y1;
    for (let i = 0; i < steps; i++) {
        if (drawing) {
            graphics.lineStyle(1, 0xffff00, 0.4);
            graphics.beginPath();
            graphics.moveTo(cx, cy);
            const nx = cx + stepX * dashLength / (dashLength+gapLength);
            const ny = cy + stepY * dashLength / (dashLength+gapLength);
            graphics.lineTo(nx, ny);
            graphics.strokePath();
        }
        cx += stepX;
        cy += stepY;
        drawing = !drawing;
    }
}

// Draw the camp as a visual placeholder
function drawCamp() {
    if (!campGraphics) return;
    campGraphics.clear();
    // Brown square
    campGraphics.fillStyle(0x8b5e3c, 1);
    campGraphics.fillRect(CAMP_X - 15, CAMP_Y - 15, 30, 30);
    // Border
    campGraphics.lineStyle(2, 0xc4a46c, 1);
    campGraphics.strokeRect(CAMP_X - 15, CAMP_Y - 15, 30, 30);
    // Selection highlight
    if (campSelected) {
        campGraphics.lineStyle(2, 0xffff00, 1);
        campGraphics.strokeRect(CAMP_X - 17, CAMP_Y - 17, 34, 34);
    }
    // Label
    gameScene.add.text(CAMP_X, CAMP_Y - 25, 'CAMP', {
        fontSize: '12px',
        fill: '#ffffff',
        backgroundColor: '#00000088',
        padding: { x: 3, y: 1 }
    }).setOrigin(0.5, 0.5);
}

// Redraw the grid colors based on current densities
function drawGrid() {
    // We need to keep a reference to the grid graphics
    if (!gameScene || !gridGraphics) return;
    gridGraphics.clear();
    for (let cy = 0; cy < GRID_ROWS; cy++) {
        for (let cx = 0; cx < GRID_COLS; cx++) {
            const cell = getCell(cx, cy);
            const density = cell.forageDensity;

            let color;
            if (density >= 0.90) {
                color = 0x1a4d0a;
            } else if (density >= 0.75) {
                color = 0x2d6b14;
            } else if (density >= 0.50) {
                color = 0x4a8c1f;
            } else if (density >= 0.25) {
                color = 0xc4a80b;
            } else if (density >= 0.05) {
                color = 0xc46e0b;
            } else if (density > 0.00) {
                color = 0x8b1a0a;
            } else {
                continue;
            }

            const x = cx * CELL_SIZE;
            const y = cy * CELL_SIZE;
            gridGraphics.fillStyle(color, 1);
            gridGraphics.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        }
    }
}

function updateCampText() {
    let totalPop = camp.unassignedPopulation;
    for (const pop of camp.pops) totalPop += pop.totalWorkers;
    campText.setText(
        `Food: ${camp.foodStock.toFixed(0)} | Pop: ${totalPop} | Unassigned: ${camp.unassignedPopulation}\n` +
        `Day: ${gameDay}`
    );
}

//Main UI info text
function updateSpeedText() {
    if (speedText) {
        speedText.setText('Speed: ' + TimeManager.getSpeedLabel());
    }
}

//Info text tha appears when clicking on the camp
function updateInfoText() {
    if (!infoText) return;
    let str = '';
    if (selectedExpedition) {
        const exp = selectedExpedition;
        const used = exp.inventory.food + exp.inventory.provisions;
        str = `Expedition ${exp.id}\nWorkers: ${exp.workerCount}\nState: ${exp.state}\nProvisions: ${exp.inventory.provisions.toFixed(1)}\nFood: ${exp.inventory.food.toFixed(1)}\nCapacity: ${used.toFixed(1)}/${exp.maxCapacity}`;
        if (exp.isForced) str += `\n[FORCED]`;
        if (!exp.useAssignedArea) str += '\n[AUTO]';
    } else if (campSelected) {
        str = `Camp\nFood: ${camp.foodStock.toFixed(0)}\nUnassigned: ${camp.unassignedPopulation}`;
        for (const pop of camp.pops) {
            str += `\n${pop.type}: ${pop.availableWorkers}/${pop.totalWorkers} avail, ${pop.assignedWorkers} out`;
        }
    } else {
        str = '';
    }
    infoText.setText(str);
}

// update: called every frame (about 60 times per second).
// time: the current time in milliseconds since the game started.
// delta: the time difference since the last frame in milliseconds.
function update(time, delta) {
    const realDeltaSec = delta / 1000;
    const deltaSec = TimeManager.getGameDelta(realDeltaSec);
    gameTimeSec += deltaSec;

    for (const exp of expeditions) exp.update(deltaSec);

    // Day cycle (uses GameConfig.dayLengthSeconds dynamically)
    dayAccumulator += deltaSec;
    if (dayAccumulator >= GameConfig.dayLengthSeconds) {
        // Advance day counter
        gameDay++;
        dayAccumulator -= GameConfig.dayLengthSeconds;
        let totalPop = camp.unassignedPopulation;
        for (const pop of camp.pops) totalPop += pop.totalWorkers;
        const consumed = totalPop * GameConfig.foodConsumptionPerPersonPerDay;
        camp.foodStock -= consumed;
        if (camp.foodStock < 0) camp.foodStock = 0;
    }

    updateInfoText(); // refresh selected info
    updateSpeedText();
    updateCampText(); // refresh camp counter every frame
    drawGrid();
    drawPops();
    drawCamp();
}