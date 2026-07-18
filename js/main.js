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
const CAMP_X = 100;
const CAMP_Y = 100;

// Global references for the game scene (set in create)
let gameScene;
let popGraphics;
let myPop;
let selectedPop = null;   // currently selected pop (left-click to select)

// Enable click: left-click to select pop, right-click to move selected pop,
// Shift+left-click to inspect cell (debug).
function enableDebugClick(scene) {
    // Prevent the browser's right-click context menu on the canvas
    scene.input.mouse.disableContextMenu();

    // Left mouse button (button 0) or touch
    scene.input.on('pointerdown', function (pointer) {
        // Ignore right-click here, it's handled separately
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

        // Normal left-click: attempt to select a pop under cursor
        let clickedPop = null;
        for (const pop of pops) {
            const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, pop.x, pop.y);
            if (dist < 10) {
                clickedPop = pop;
                break;
            }
        }

        if (clickedPop) {
            selectedPop = clickedPop;
            console.log(`Pop selected. Position: (${selectedPop.x.toFixed(0)}, ${selectedPop.y.toFixed(0)}), State: ${selectedPop.state}`);
        } else {
            // Clicked on empty ground: optionally deselect? We'll leave selection unchanged.
        }
    });

    // Right mouse button: move the selected pop to target
    scene.input.on('pointerdown', function (pointer) {
        if (!pointer.rightButtonDown()) return;

        if (!selectedPop) {
            console.log('No pop selected. Left-click a pop first.');
            return;
        }

        selectedPop.moveTo(pointer.x, pointer.y);
        console.log(`Moving pop to (${pointer.x.toFixed(0)}, ${pointer.y.toFixed(0)})`);

        // Destination marker
        const marker = scene.add.circle(pointer.x, pointer.y, 5, 0xffffff, 0.5).setDepth(50);
        scene.time.delayedCall(1000, function () {
            marker.destroy();
        });
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

    // Create a Pop at the camp position
    myPop = new Pop(CAMP_X, CAMP_Y, 10);
    pops.push(myPop);
    // Auto-select the only pop at start
    selectedPop = myPop;

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
    for (const pop of pops) {
        // White circle for the pop
        popGraphics.fillStyle(0xffffff, 1);
        popGraphics.fillCircle(pop.x, pop.y, 8);

        // Yellow ring around selected pop
        if (pop === selectedPop) {
            popGraphics.lineStyle(2, 0xffff00, 0.8);
            popGraphics.strokeCircle(pop.x, pop.y, 10);
        }

        // Thin line to target if moving
        if (pop.state === 'moving') {
            popGraphics.lineStyle(1, 0xffffff, 0.3);
            popGraphics.beginPath();
            popGraphics.moveTo(pop.x, pop.y);
            popGraphics.lineTo(pop.targetX, pop.targetY);
            popGraphics.strokePath();
        }
    }
}

// Draw the camp as a visual placeholder
function drawCamp() {
    if (!gameScene) return;
    const campGraphics = gameScene.add.graphics();
    // Brown square for the camp
    campGraphics.fillStyle(0x8b5e3c, 1);
    campGraphics.fillRect(CAMP_X - 15, CAMP_Y - 15, 30, 30);
    // Border
    campGraphics.lineStyle(2, 0xc4a46c, 1);
    campGraphics.strokeRect(CAMP_X - 15, CAMP_Y - 15, 30, 30);

    // Label
    gameScene.add.text(CAMP_X, CAMP_Y - 25, 'CAMP', {
        fontSize: '12px',
        fill: '#ffffff',
        backgroundColor: '#00000088',
        padding: { x: 3, y: 1 }
    }).setOrigin(0.5, 0.5);
}

// update: called every frame (about 60 times per second).
// time: the current time in milliseconds since the game started.
// delta: the time difference since the last frame in milliseconds.
function update(time, delta) {
    // Convert delta from ms to seconds for consistent movement speed
    const deltaSec = delta / 1000;

    // Update all pops
    for (const pop of pops) {
        pop.update(deltaSec);
    }

    // Redraw pops at new positions
    drawPops();
}