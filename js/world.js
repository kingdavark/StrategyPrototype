// world.js - Spatial grid and density layers for natural resources
// Uses a hidden square grid to optimize spatial queries and store density values.

// ---- Constants ----
const CELL_SIZE = GameConfig.cellSize;
const GRID_COLS = Math.ceil(GameConfig.worldWidth / CELL_SIZE);
const GRID_ROWS = Math.ceil(GameConfig.worldHeight / CELL_SIZE);

// ---- Grid data structure ----
// A 2D array of cell objects. Each cell has:
//   x, y   - grid coordinates (integer)
//   entities - array of mobile entities currently in this cell (empty for now)
//   forageDensity - float 0..1 (vegetation / small game / fish combined for MVP1)
const grid = [];

// ---- Functions ----

// Convert world pixel coordinates to grid cell coordinates.
function worldToCell(worldX, worldY) {
    const cx = Math.floor(worldX / CELL_SIZE);
    const cy = Math.floor(worldY / CELL_SIZE);
    return { cx, cy };
}

// Get the cell at given grid coordinates. Creates it if it doesn't exist.
function getCell(cx, cy) {
    if (!grid[cy]) {
        grid[cy] = [];
    }
    if (!grid[cy][cx]) {
        grid[cy][cx] = {
            cx: cx,
            cy: cy,
            entities: [],
            forageDensity: 0.0,
            assignedWorkers: 0
        };
    }
    return grid[cy][cx];
}

// Initialize the grid for all cells within the visible area.
function createGrid() {
    for (let cy = 0; cy < GRID_ROWS; cy++) {
        for (let cx = 0; cx < GRID_COLS; cx++) {
            getCell(cx, cy); // ensures the cell exists
        }
    }
}

// Set initial forage density values to create visible "food zones".
// This is a simple procedural generation: a few patches of high density.
function initializeForageDensity() {
    // Helper to set density for a circular patch
    function setPatch(centerCX, centerCY, radius, peakDensity) {
        for (let cy = 0; cy < GRID_ROWS; cy++) {
            for (let cx = 0; cx < GRID_COLS; cx++) {
                const dist = Math.sqrt((cx - centerCX) ** 2 + (cy - centerCY) ** 2);
                if (dist <= radius) {
                    const cell = getCell(cx, cy);
                    // Linear falloff from peak at center to 0 at edge
                    const density = peakDensity * (1 - dist / radius);
                    cell.forageDensity = Math.max(cell.forageDensity, density);
                }
            }
        }
    }

    // Define some food patches (centerX, centerY, radius, peakDensity)
    setPatch(5, 3, 4, 0.9);    // Large rich patch
    setPatch(14, 7, 3, 0.7);   // Medium patch
    setPatch(3, 9, 2, 0.5);    // Small patch
    setPatch(10, 2, 2, 0.4);   // Sparse patch
    setPatch(17, 4, 3, 0.8);   // Another rich patch
}

// Query entities within a radius of a world position.
// For now, just returns an empty array (no entities yet).
function getEntitiesInRadius(worldX, worldY, radius) {
    // Future implementation: query grid cells and filter by distance.
    return [];
}

// Modify density of a specific layer around a world position.
// layer: string name of the density property (e.g., 'forageDensity').
// amount: negative to reduce, positive to add.
// impactRadius: world pixels radius of the modification area.
function modifyDensity(worldX, worldY, layer, amount, impactRadius) {
    const center = worldToCell(worldX, worldY);
    const cellRadius = Math.ceil(impactRadius / CELL_SIZE);

    for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        for (let dx = -cellRadius; dx <= cellRadius; dx++) {
            const cx = center.cx + dx;
            const cy = center.cy + dy;
            if (cx >= 0 && cx < GRID_COLS && cy >= 0 && cy < GRID_ROWS) {
                const cell = getCell(cx, cy);
                const dist = Math.sqrt(dx * dx + dy * dy) * CELL_SIZE;
                if (dist <= impactRadius) {
                    // Linear falloff
                    const factor = 1 - dist / impactRadius;
                    cell[layer] = Math.max(0, Math.min(1, cell[layer] + amount * factor));
                }
            }
        }
    }
}