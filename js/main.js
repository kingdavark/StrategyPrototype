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

// Helper to show cell info on click (debug only)
function enableDebugClick(scene) {
    scene.input.on('pointerdown', function (pointer) {
        // Convert pixel position to grid coordinates
        const cell = worldToCell(pointer.x, pointer.y);
        const cx = cell.cx;
        const cy = cell.cy;

        // Check if cell exists
        if (cx >= 0 && cx < GRID_COLS && cy >= 0 && cy < GRID_ROWS) {
            const cellData = getCell(cx, cy);
            const density = cellData.forageDensity;

            // Show info in a temporary text or console
            console.log(
                `Cell (${cx}, ${cy}) - Forage Density: ${density.toFixed(4)}`
            );

            // Also show a temporary text on screen
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
            ).setDepth(100); // always on top

            // Remove the text after 2 seconds
            scene.time.delayedCall(2000, function () {
                infoText.destroy();
            });
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
}

// update: called every frame (about 60 times per second).
// time: the current time in milliseconds since the game started.
// delta: the time difference since the last frame in milliseconds.
function update(time, delta) {
    // empty for now
}