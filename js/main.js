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

// Settlement position (visual placeholder, functionality comes later)
const SETTLEMENT_X = GameConfig.settlementX;
const SETTLEMENT_Y = GameConfig.settlementY;

// Global references for the game scene (set in create)
let gameScene;
let popGraphics;
let gridGraphics;  // reference to grid graphics for dynamic updates
let settlementGraphics;
let dayAccumulator = 0;          // accumulator for game time in seconds
let gameDay = 1; // Day counter
let settlementSelected = false;      // whether settlement is currently selected
let selectedExpedition = null; // currently selected expedition
let infoText;                  // UI text for selected expedition info
let speedText; // UI text for current simulation speed
let selectedLocalCell = null;   // grid cell selected for local worker assignment
let gameState = 'map';        // 'map' or 'settlement'
let cellWorkerTexts = {};       // map "cx,cy" -> Phaser.Text for worker count overlay
let warningCells = [];
let warningGraphics;
let lastSettlementPopulation = -1;   // cached population, to recompute urbanized fractions only on change

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
            gameState = 'map';
            selectedExpedition = clickedExp;
            settlementSelected = false;
            selectedLocalCell = null;
            updateInfoText();
            console.log(`Selected expedition ${clickedExp.id}`);
            return;
        }

        // Check if clicked on settlement: toggle between map and settlement state
        if (Phaser.Math.Distance.Between(pointer.x, pointer.y, settlement.x, settlement.y) < 20) {
            if (gameState === 'settlement') {
                gameState = 'map';
                settlementSelected = false;
                selectedLocalCell = null;
            } else {
                gameState = 'settlement';
                settlementSelected = true;
                selectedExpedition = null;
                selectedLocalCell = null;
            }
            updateInfoText();
            return;
        }

        // If in settlement state, handle cell selection within local radius
        if (gameState === 'settlement') {
            const localRadius = getEffectiveLocalGatherRadiusPx();
            const clickedCell = worldToCell(pointer.x, pointer.y);
            if (clickedCell.cx >= 0 && clickedCell.cx < GRID_COLS && clickedCell.cy >= 0 && clickedCell.cy < GRID_ROWS) {
                const center = cellToWorld(clickedCell.cx, clickedCell.cy);
                const dist = Phaser.Math.Distance.Between(settlement.x, settlement.y, center.x, center.y);
                if (dist <= localRadius) {
                    // Clicking the already-selected cell deselects it and shows the settlement info again
                    if (selectedLocalCell && selectedLocalCell.cx === clickedCell.cx && selectedLocalCell.cy === clickedCell.cy) {
                        selectedLocalCell = null;
                        updateInfoText();
                        return;
                    }
                    selectedLocalCell = clickedCell;
                    updateInfoText();
                    console.log(`Selected local cell (${clickedCell.cx}, ${clickedCell.cy}) - Assigned: ${getCell(clickedCell.cx, clickedCell.cy).assignedWorkers}`);
                    return;
                }
            }
            // Clicked outside radius: exit settlement state, deselect everything
            gameState = 'map';
            settlementSelected = false;
            selectedExpedition = null;
            selectedLocalCell = null;
            updateInfoText();
            return;
        }

        // In map state, empty ground click deselects everything
        gameState = 'map';
        settlementSelected = false;
        selectedExpedition = null;
        selectedLocalCell = null;
        updateInfoText();
    });

    // Right click handler
    scene.input.on('pointerdown', function (pointer) {
        if (!pointer.rightButtonDown()) return;

        // If neither settlement nor an expedition is selected, ignore
        if (!settlementSelected && !selectedExpedition) {
            console.log('Select settlement or an expedition first.');
            return;
        }

        // Ignore right-clicks inside the settlement's local gathering radius:
        // that area is reserved for local gathering, not expeditions
        const localRadius = getEffectiveLocalGatherRadiusPx();
        if (Phaser.Math.Distance.Between(pointer.x, pointer.y, settlement.x, settlement.y) <= localRadius) {
            console.log('Right-click inside local gathering area ignored.');
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
        let pop = settlement.pops.find(p => p.type === 'gatherer');
        if (!pop) {
            // Create gatherer pop if it doesn't exist
            pop = new Pop('gatherer');
            settlement.pops.push(pop);
        }

        // Determine how many workers to take (priority: unassigned, then available gatherers)
        let workersToTake = 0;
        if (settlement.unassignedPopulation > 0) {
            // Move unassigned to gatherers, then take them
            const moveCount = Math.min(GameConfig.startingExpeditionWorkers, settlement.unassignedPopulation);
            settlement.unassignedPopulation -= moveCount;
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
        const exp = new Expedition(id, 'gatherer', taken, settlement.x, settlement.y, pointer.x, pointer.y, areaRadius, settlement);
        exp.isForced = forced;

        // Give provisions from settlement stock, respecting inventory capacity
        const dist = Phaser.Math.Distance.Between(settlement.x, settlement.y, pointer.x, pointer.y);
        const needed = getProvisionsNeeded(taken, dist);
        // Cannot exceed settlement food, nor the expedition's max capacity
        const given = Math.min(needed, settlement.foodStock, exp.maxCapacity);
        exp.inventory.provisions = given;
        settlement.foodStock -= given;

        expeditions.push(exp);
        updateInfoText();
        console.log(`Expedition ${id} started with ${taken} workers, ${given.toFixed(1)} provisions.`);
    });

    // Keyboard 'R' to return selected expedition
    scene.input.keyboard.on('keydown-R', function () {
        if (isInputFocused()) return;
        if (selectedExpedition && selectedExpedition.state !== 'returningToSettlement' && selectedExpedition.state !== 'resting') {
            selectedExpedition.targetX = settlement.x;
            selectedExpedition.targetY = settlement.y;
            selectedExpedition.state = 'returningToSettlement';
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

            // If already at settlement (resting or idle), disband immediately
            if (exp.state === 'resting' || exp.state === 'idle') {
                settlement.foodStock += exp.inventory.food;
                const pop = settlement.pops.find(p => p.type === exp.popType);
                if (pop) pop.returnWorkers(exp.workerCount);
                const index = expeditions.indexOf(exp);
                if (index > -1) expeditions.splice(index, 1);
                selectedExpedition = null;
                updateInfoText();
                updateSettlementText();
                console.log(`Expedition ${exp.id} disbanded at settlement.`);
                return;
            }

            // Otherwise, force return to settlement and mark for disbanding
            exp.toBeDisbanded = true;
            exp.targetX = settlement.x;
            exp.targetY = settlement.y;
            exp.state = 'returningToSettlement';
            // Clear selection
            selectedExpedition = null;
            updateInfoText();
            console.log(`Expedition ${exp.id} will disband on arrival at settlement.`);
        }
    });
}

// preload: load any external assets and plugins
function preload() {
    // Load the rexBoard plugin (hexagon board) from CDN
    this.load.scenePlugin('rexboardplugin', 'https://cdn.jsdelivr.net/npm/phaser3-rex-plugins@1.60.0/dist/rexboardplugin.min.js', 'rexBoard', 'rexBoard');
}

// create: called once after preload. We set up the initial scene.
function create() {
    // Initialize the hex grid and forage density
    createGrid(this);
    initializeForageDensity();
    lastSettlementPopulation = getSettlementPopulation();
    updateUrbanizedFractions(lastSettlementPopulation);

    // Graphics object for the grid
    const graphics = this.add.graphics();
    gridGraphics = graphics;  // store reference
    settlementGraphics = this.add.graphics();

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
    infoText = this.add.text(1280 - 260, 10, '', {
        fontSize: '12px',
        fill: '#ffffff',
        backgroundColor: '#00000088',
        padding: { x: 4, y: 2 },
        align: 'left',
        wordWrap: { width: 250 }
    }).setDepth(200);

    // Settlement info text (bottom left) – we can reuse settlementText from before, define it
    settlementText = this.add.text(10, 720 - 30, '', { fontSize: '14px', fill: '#ffffff' });
    updateSettlementText();

    // Speed indicator text
    speedText = this.add.text(10, 30, 'Speed: 1x', {
        fontSize: '14px',
        fill: '#ffffff',
        backgroundColor: '#00000088',
        padding: { x: 4, y: 2 }
    });

    // Graphics object for drawing pops (circles)
    popGraphics = this.add.graphics();
    warningGraphics = this.add.graphics().setDepth(300);

    // Draw the initial grid, pop position and settlement
    drawGrid();
    drawPops();
    drawSettlement();
}

// Draw all pops as circles on the screen
function drawPops() {
    if (!popGraphics) return;
    popGraphics.clear();

    for (const exp of expeditions) {
        let color = 0xffffff; // default white
        if (exp.state === 'gathering') color = 0x00ff00;
        else if (exp.state === 'returningToSettlement') color = 0xff8800; // orange
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
                // Auto mode: draw path from settlement to current position
                drawDashedLine(popGraphics, settlement.x, settlement.y, exp.x, exp.y, 10, 5);
                // Draw area radius around the expedition
                popGraphics.lineStyle(1, 0xffff00, 0.2);
                popGraphics.strokeCircle(exp.x, exp.y, exp.areaRadius);
            } else {
                // Manual mode: draw path from settlement to area center
                drawDashedLine(popGraphics, settlement.x, settlement.y, exp.areaCenter.x, exp.areaCenter.y, 10, 5);
                // Draw area radius around area center
                popGraphics.lineStyle(1, 0xffff00, 0.2);
                popGraphics.strokeCircle(exp.areaCenter.x, exp.areaCenter.y, exp.areaRadius);
            }
        }

        // Line to target if moving
        if (exp.state === 'travellingToArea' || exp.state === 'returningToSettlement') {
            popGraphics.lineStyle(1, 0xffffff, 0.3);
            popGraphics.beginPath();
            popGraphics.moveTo(exp.x, exp.y);
            popGraphics.lineTo(exp.targetX, exp.targetY);
            popGraphics.strokePath();
        }
    }

    updateWarningIndicators();
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

// Draw the settlement as a visual placeholder and (if selected) its local gathering radius
function drawSettlement() {
    if (!settlementGraphics) return;
    settlementGraphics.clear();

    // Settlement radius: real radius for logic, with a minimum for visibility
    const settlementRadiusPx = Math.max(
        getSettlementRadiusPx(getSettlementPopulation()),
        GameConfig.settlementMinVisualRadiusPx
    );

    // Brown filled circle
    settlementGraphics.fillStyle(0x8b5e3c, 1);
    settlementGraphics.fillCircle(SETTLEMENT_X, SETTLEMENT_Y, settlementRadiusPx);
    // Border
    settlementGraphics.lineStyle(2, 0xc4a46c, 1);
    settlementGraphics.strokeCircle(SETTLEMENT_X, SETTLEMENT_Y, settlementRadiusPx);
    // Selection highlight
    if (settlementSelected) {
        settlementGraphics.lineStyle(2, 0xffff00, 1);
        settlementGraphics.strokeCircle(SETTLEMENT_X, SETTLEMENT_Y, settlementRadiusPx);

        // Local gathering radius (1.5h walk from the settlement border)
        const effectiveRadius = getEffectiveLocalGatherRadiusPx();
        settlementGraphics.lineStyle(1, 0xffff00, 0.3);
        settlementGraphics.strokeCircle(SETTLEMENT_X, SETTLEMENT_Y, effectiveRadius);
    }
    // Label
    gameScene.add.text(SETTLEMENT_X, SETTLEMENT_Y - 25, 'SETTLEMENT', {
        fontSize: '12px',
        fill: '#ffffff',
        backgroundColor: '#00000088',
        padding: { x: 3, y: 1 }
    }).setOrigin(0.5, 0.5);
}

function drawLocalRadius() {
    if (!popGraphics || gameState !== 'settlement') return;
    popGraphics.lineStyle(1, 0xffff00, 0.4);
    popGraphics.strokeCircle(settlement.x, settlement.y, getEffectiveLocalGatherRadiusPx());
}

// Redraw the grid colors based on current densities
function drawGrid() {
    if (!gameScene || !gridGraphics || !hexBoard) return;
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

            // Culling: skip cells whose center is outside the visible window
            const center = cellToWorld(cx, cy);
            if (center.x < -HEX_WIDTH_PX || center.x > GameConfig.worldWidth + HEX_WIDTH_PX ||
                center.y < -HEX_HEIGHT_PX || center.y > GameConfig.worldHeight + HEX_HEIGHT_PX) {
                continue;
            }

            // Draw the hexagon with its 6 vertices
            const points = hexBoard.getGridPoints(cx, cy);
            gridGraphics.fillStyle(color, 1);
            gridGraphics.fillPoints(points, true);
        }
    }
}

// Draw a highlight border around the currently selected local cell
function drawSelectedCell() {
    if (!gridGraphics || !selectedLocalCell || !hexBoard) return;
    const cx = selectedLocalCell.cx;
    const cy = selectedLocalCell.cy;
    const points = hexBoard.getGridPoints(cx, cy);
    gridGraphics.lineStyle(2, 0xffff00, 0.8);
    gridGraphics.strokePoints(points, true);
}

// Create/update/destroy text labels showing assigned workers on cells.
// Called only when a worker assignment changes, not every frame.
function updateCellWorkerLabels() {
    if (!gameScene) return;

    // Iterate over all cells with assignedWorkers > 0
    for (let cy = 0; cy < GRID_ROWS; cy++) {
        for (let cx = 0; cx < GRID_COLS; cx++) {
            const cell = getCell(cx, cy);
            const key = `${cx},${cy}`;
            if (cell.assignedWorkers > 0) {
                const center = cellToWorld(cx, cy);
                const x = center.x;
                const y = center.y;
                if (cellWorkerTexts[key]) {
                    // Update existing text
                    cellWorkerTexts[key].setText(cell.assignedWorkers.toString());
                } else {
                    // Create new text
                    const txt = gameScene.add.text(x, y - 5, cell.assignedWorkers.toString(), {
                        fontSize: '12px',
                        fill: '#ffffff',
                        backgroundColor: '#00000088',
                        padding: { x: 2, y: 1 }
                    }).setOrigin(0.5, 0.5).setDepth(150);
                    cellWorkerTexts[key] = txt;
                }
            } else {
                // If no workers, destroy text if exists
                if (cellWorkerTexts[key]) {
                    cellWorkerTexts[key].destroy();
                    delete cellWorkerTexts[key];
                }
            }
        }
    }
}

function updateLocalGathering(deltaSec) {
    const localRadius = getEffectiveLocalGatherRadiusPx();
    for (let cy = 0; cy < GRID_ROWS; cy++) {
        for (let cx = 0; cx < GRID_COLS; cx++) {
            const cell = getCell(cx, cy);
            if (cell.assignedWorkers > 0) {
                const center = cellToWorld(cx, cy);
                const dist = Phaser.Math.Distance.Between(settlement.x, settlement.y, center.x, center.y);
                if (dist <= localRadius) {
                    const urbanized = cell.urbanizedFraction || 0;
                    // Fully urbanized cell: no gathering. Worker freeing (full logic) comes later; log for now.
                    if (urbanized >= 1) {
                        if (!cell.urbanizationWarningShown) {
                            cell.urbanizationWarningShown = true;
                            console.warn(`Cell (${cx},${cy}) fully urbanized; local workers would be freed.`);
                        }
                        continue;
                    }
                    if (cell.urbanizationWarningShown) cell.urbanizationWarningShown = false;

                    const density = cell.forageDensity;
                    if (density > 0) {
                        const gathered = cell.assignedWorkers * GameConfig.baseGatherRate * density * deltaSec;
                        settlement.foodStock += gathered;
                        settlement.foodGatheredToday += gathered;
                        cell.foodGatheredToday += gathered;
                        const reduction = gathered * GameConfig.densityReductionPerFood / (1 - urbanized);
                        reduceCellDensity(cell, reduction);
                    }
                    // Check warning threshold
                    if (cell.forageDensity < GameConfig.cellWarningThreshold) {
                        if (!cell.warningShown) {
                            cell.warningShown = true;
                            console.warn(`Cell (${cx},${cy}) below warning threshold`);
                        }
                        if (!warningCells.includes(`${cx},${cy}`)) {
                            warningCells.push(`${cx},${cy}`);
                        }
                    } else {
                        if (cell.warningShown) {
                            cell.warningShown = false;
                        }
                        const index = warningCells.indexOf(`${cx},${cy}`);
                        if (index > -1) warningCells.splice(index, 1);
                    }
                }
            }
        }
    }
}

function updateWarningIndicators() {
    if (!warningGraphics) return;
    warningGraphics.clear();
    if (gameState === 'settlement') {
        for (const key of warningCells) {
            const [cx, cy] = key.split(',').map(Number);
            const center = cellToWorld(cx, cy);
            const x = center.x;
            const y = center.y - 10;
            warningGraphics.fillStyle(0xff0000, 1);
            warningGraphics.fillTriangle(x, y, x - 5, y - 10, x + 5, y - 10);
        }
    } else {
        if (warningCells.length > 0) {
            warningGraphics.fillStyle(0xff0000, 1);
            warningGraphics.fillTriangle(SETTLEMENT_X, SETTLEMENT_Y - 20, SETTLEMENT_X - 5, SETTLEMENT_Y - 30, SETTLEMENT_X + 5, SETTLEMENT_Y - 30);
        }
    }
}

function updateSettlementText() {
    let totalPop = settlement.unassignedPopulation;
    for (const pop of settlement.pops) totalPop += pop.totalWorkers;
    settlementText.setText(
        `Food: ${settlement.foodStock.toFixed(0)} | Pop: ${totalPop} | Unassigned: ${settlement.unassignedPopulation}\n` +
        `Day: ${gameDay}`
    );
}

//Main UI info text
function updateSpeedText() {
    if (speedText) {
        speedText.setText('Speed: ' + TimeManager.getSpeedLabel());
    }
}

//Info text tha appears when clicking on the settlement
function updateInfoText() {
    if (!infoText) return;
    let str = '';

    if (selectedExpedition) {
        const exp = selectedExpedition;
        const used = exp.inventory.food + exp.inventory.provisions;
        str = `Expedition ${exp.id}\nWorkers: ${exp.workerCount}\nState: ${exp.state}\nProvisions: ${exp.inventory.provisions.toFixed(1)}\nFood: ${exp.inventory.food.toFixed(1)}\nCapacity: ${used.toFixed(1)}/${exp.maxCapacity}`;
        if (exp.isForced) str += `\n[FORCED]`;
        if (!exp.useAssignedArea) str += '\n[AUTO]';
    } else if (selectedLocalCell && gameState === 'settlement') {
        const cell = getCell(selectedLocalCell.cx, selectedLocalCell.cy);
        const density = cell.forageDensity;
        const workers = cell.assignedWorkers;
        const baseRate = GameConfig.baseGatherRate;
        const reductionPerFood = GameConfig.densityReductionPerFood;

        // Food remaining until thresholds
        const foodTo25 = Math.max(0, (density - GameConfig.cellWarningThreshold) / reductionPerFood);
        const foodTo0 = density / reductionPerFood;

        // Rate of density reduction per second with current workers
        const k = workers * baseRate * reductionPerFood;
        // Days to threshold 0.25 and 0 (using exponential decay approximation)
        let daysTo25 = 0;
        let daysTo0 = 0;
        if (workers > 0 && density > 0) {
            if (density > GameConfig.cellWarningThreshold) {
                daysTo25 = (-Math.log(GameConfig.cellWarningThreshold / density) / k) / GameConfig.dayLengthSeconds;
            }
            daysTo0 = (-Math.log(0.001 / density) / k) / GameConfig.dayLengthSeconds;
        }

        // With one extra worker
        const k2 = (workers + 1) * baseRate * reductionPerFood;
        let daysTo25_extra = 0;
        let daysTo0_extra = 0;
        if (workers + 1 > 0 && density > 0) {
            if (density > GameConfig.cellWarningThreshold) {
                daysTo25_extra = (-Math.log(GameConfig.cellWarningThreshold / density) / k2) / GameConfig.dayLengthSeconds;
            }
            daysTo0_extra = (-Math.log(0.001 / density) / k2) / GameConfig.dayLengthSeconds;
        }
        const reducedDays25 = Math.max(0, daysTo25 - daysTo25_extra);
        const reducedDays0 = Math.max(0, daysTo0 - daysTo0_extra);

        // Daily increase if adding one worker
        const increasePerDay = baseRate * density * GameConfig.dayLengthSeconds;

        str = `Cell (${selectedLocalCell.cx}, ${selectedLocalCell.cy})\n` +
              `Density: ${(density * 100).toFixed(1)}%\n` +
              `Workers: ${workers}\n` +
              `Food gathered daily: ${cell.gatheredDaily.toFixed(1)}\n` +  // uso daily
              `Food remaining to 25%: ${foodTo25.toFixed(1)}\n` +
              `Food remaining to 0%: ${foodTo0.toFixed(1)}\n` +
              `Days to 25%: ${workers > 0 ? daysTo25.toFixed(1) : '∞'}\n` +
              `Days to 0%: ${workers > 0 ? daysTo0.toFixed(1) : '∞'}\n` +
              `+1 worker food/day: ${increasePerDay.toFixed(1)}\n` +
              `Days reduced to 25% if +1 worker: ${workers > 0 ? reducedDays25.toFixed(1) : '--'}\n` +
              `Days reduced to 0% if +1 worker: ${workers > 0 ? reducedDays0.toFixed(1) : '--'}`;
    } else if (settlementSelected && gameState === 'settlement') {
        // Settlement summary
        // Settlement summary
        const localRadius = getEffectiveLocalGatherRadiusPx();
        let foodTo25Total = 0;
        let foodTo0Total = 0;
        for (let cy = 0; cy < GRID_ROWS; cy++) {
            for (let cx = 0; cx < GRID_COLS; cx++) {
                const cell = getCell(cx, cy);
                const center = cellToWorld(cx, cy);
                const dist = Phaser.Math.Distance.Between(settlement.x, settlement.y, center.x, center.y);
                if (dist <= localRadius) {
                    const d = cell.forageDensity;
                    foodTo25Total += Math.max(0, (d - GameConfig.cellWarningThreshold) / GameConfig.densityReductionPerFood);
                    foodTo0Total += d / GameConfig.densityReductionPerFood;
                }
            }
        }

        // Gatherer pop stats
        let gathererPop = settlement.pops.find(p => p.type === 'gatherer');
        let localGatherers = gathererPop ? gathererPop.localWorkers : 0;
        let expeditionGatherers = gathererPop ? gathererPop.assignedWorkers : 0;
        let availableGatherers = gathererPop ? gathererPop.availableWorkers : 0;

        str = `Settlement\n` +
              `Food: ${settlement.foodStock.toFixed(0)}\n` +
              `Unassigned: ${settlement.unassignedPopulation}\n` +
              `Gathered daily: ${settlement.gatheredDaily.toFixed(1)}\n` +
              `Consumed daily: ${settlement.consumedDaily.toFixed(1)}\n` +
              `Food remaining (to 25%): ${foodTo25Total.toFixed(1)}\n` +
              `Food remaining (to 0%): ${foodTo0Total.toFixed(1)}\n` +
              `Gatherers:\n` +
              `  Local: ${localGatherers}\n` +
              `  Expeditions: ${expeditionGatherers}\n` +
              `  Available: ${availableGatherers}`;
    } else {
        str = '';
    }
    infoText.setText(str);
    updateLocalWorkerPanel();
}

// update: called every frame (about 60 times per second).
// time: the current time in milliseconds since the game started.
// delta: the time difference since the last frame in milliseconds.
function update(time, delta) {
    const realDeltaSec = delta / 1000;
    const deltaSec = TimeManager.getGameDelta(realDeltaSec);
    gameTimeSec += deltaSec;

    // Recompute urbanized fractions only when the settlement population changes
    const population = getSettlementPopulation();
    if (population !== lastSettlementPopulation) {
        lastSettlementPopulation = population;
        updateUrbanizedFractions(population);
    }

    for (const exp of expeditions) exp.update(deltaSec);
    updateLocalGathering(deltaSec);    

    // Day cycle (uses GameConfig.dayLengthSeconds dynamically)
    dayAccumulator += deltaSec;
    if (dayAccumulator >= GameConfig.dayLengthSeconds) {
        // Advance day counter
                gameDay++;
        dayAccumulator -= GameConfig.dayLengthSeconds;
        let totalPop = settlement.unassignedPopulation;
        for (const pop of settlement.pops) totalPop += pop.totalWorkers;
        const consumed = totalPop * GameConfig.foodConsumptionPerPersonPerDay;
        settlement.foodStock -= consumed;
        if (settlement.foodStock < 0) settlement.foodStock = 0;

        // Save daily totals and reset current day counters
        settlement.gatheredDaily = settlement.foodGatheredToday;
        settlement.consumedDaily = consumed;
        settlement.foodGatheredToday = 0;

        for (let cy = 0; cy < GRID_ROWS; cy++) {
            for (let cx = 0; cx < GRID_COLS; cx++) {
                const cell = getCell(cx, cy);
                cell.gatheredDaily = cell.foodGatheredToday;
                cell.foodGatheredToday = 0;
            }
        }
    }

    updateInfoText(); // refresh selected info
    updateSpeedText();
    updateSettlementText(); // refresh settlement counter every frame
    updateLocalWorkerPanel(); // refresh local worker panel visibility and numbers
    drawGrid();
    drawSelectedCell(); // highlight selected local cell
    drawPops();
    drawSettlement();
    updateWarningIndicators();
}