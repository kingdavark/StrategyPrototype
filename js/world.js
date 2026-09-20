// world.js - Spatial grid and density layers for natural resources
// Uses a point-top hexagonal grid (via the rexBoard plugin) to store density values.

// ---- Hexagon geometry (derived from GameConfig) ----
// hexCenterDistanceKm defines the world size of a cell (km between adjacent centers).
// pixelsPerKm defines the visual size (pixels per km).
const HEX_RADIUS_PX = getHexRadiusPx();                                          // vertex-to-center, ~11.55 px
const HEX_WIDTH_PX = GameConfig.hexCenterDistanceKm * GameConfig.pixelsPerKm;    // side-to-side (= 1 km)
const HEX_HEIGHT_PX = 2 * HEX_RADIUS_PX;                                         // vertex-to-vertex (= 2/sqrt(3) km)
const HEX_VERTICAL_SPACING_PX = HEX_HEIGHT_PX * 0.75;                            // row spacing for point-top (= 1.5 * R)

// Grid size in hex tiles, sized to cover the world window.
const GRID_COLS = Math.ceil(GameConfig.worldWidth / HEX_WIDTH_PX) + 1;
const GRID_ROWS = Math.ceil(GameConfig.worldHeight / HEX_VERTICAL_SPACING_PX) + 1;

// ---- rexBoard references (created by initHexBoard) ----
let hexGrid = null;
let hexBoard = null;

// ---- Grid data structure ----
// A 2D array of cell objects, indexed by tile coordinates [cy][cx],
// where cx = q (column) and cy = r (row) in axial hex coordinates.
const grid = [];

// ---- Functions ----

// Create the rexBoard hexagon grid and board. Must be called once, in create().
function initHexBoard(scene) {
    hexGrid = scene.rexBoard.add.hexagonGrid({
        x: 0,
        y: 0,
        size: HEX_RADIUS_PX,   // vertex-to-center distance; rexBoard derives cellWidth/cellHeight
        staggeraxis: 'x',      // pointy-top orientation
        staggerindex: 'odd'
    });
    hexBoard = scene.rexBoard.add.board({
        grid: hexGrid,
        width: GRID_COLS,
        height: GRID_ROWS
    });
}

// Convert world pixel coordinates to hex tile coordinates (q, r).
function worldToCell(worldX, worldY) {
    const tile = hexBoard.worldXYToTileXY(worldX, worldY);
    return { cx: tile.x, cy: tile.y };
}

// Convert hex tile coordinates (q, r) to the world pixel center of the cell.
function cellToWorld(cx, cy) {
    const world = hexBoard.tileXYToWorldXY(cx, cy);
    return { x: world.x, y: world.y };
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
            assignedWorkers: 0,
            foodGatheredToday: 0,   // food gathered by local workers today
            gatheredDaily: 0, 
            warningShown: false,    // whether depletion warning was shown
            urbanizedFraction: 0,   // fraction of the cell covered by a settlement (0..1)
            urbanizationWarningShown: false // whether fully-urbanized warning was logged
        };
    }
    return grid[cy][cx];
}

// Initialize the hex grid and populate all cells within the visible area.
function createGrid(scene) {
    initHexBoard(scene);
    for (let cy = 0; cy < GRID_ROWS; cy++) {
        for (let cx = 0; cx < GRID_COLS; cx++) {
            getCell(cx, cy); // ensures the cell exists
        }
    }
}

// Set initial forage density values to create visible "food zones".
// This is a simple procedural generation: a few patches of high density.
function initializeForageDensity() {
    // Helper to set density for a circular patch (distance measured in pixels between hex centers)
    function setPatch(centerCX, centerCY, radiusCells, peakDensity) {
        const center = cellToWorld(centerCX, centerCY);
        const radiusPx = radiusCells * HEX_WIDTH_PX;
        for (let cy = 0; cy < GRID_ROWS; cy++) {
            for (let cx = 0; cx < GRID_COLS; cx++) {
                const cellWorld = cellToWorld(cx, cy);
                const dist = Math.sqrt((cellWorld.x - center.x) ** 2 + (cellWorld.y - center.y) ** 2);
                if (dist <= radiusPx) {
                    const cell = getCell(cx, cy);
                    // Linear falloff from peak at center to 0 at edge
                    const density = peakDensity * (1 - dist / radiusPx);
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

// TO USE FOR AREA EFFECTS
/*function modifyDensity(worldX, worldY, layer, amount, impactRadius) {
    const center = worldToCell(worldX, worldY);
    const cellRadius = Math.ceil(impactRadius / HEX_WIDTH_PX);

    for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        for (let dx = -cellRadius; dx <= cellRadius; dx++) {
            const cx = center.cx + dx;
            const cy = center.cy + dy;
            if (cx >= 0 && cx < GRID_COLS && cy >= 0 && cy < GRID_ROWS) {
                const cell = getCell(cx, cy);
                const dist = Math.sqrt(dx * dx + dy * dy) * HEX_WIDTH_PX;
                if (dist <= impactRadius) {
                    // Linear falloff
                    const factor = 1 - dist / impactRadius;
                    cell[layer] = Math.max(0, Math.min(1, cell[layer] + amount * factor));
                }
            }
        }
    }
}*/

// Reduce density of a single cell (no radial falloff). Used for resource gathering.
// cell: cell object from getCell()
// amount: positive value to subtract from cell's forageDensity
function reduceCellDensity(cell, amount) {
    if (!cell) return;
    cell.forageDensity = Math.max(0, Math.min(1, cell.forageDensity - amount));
}

// Area of overlap between two circles with radii r1, r2 and center distance d.
function circleCircleOverlapArea(r1, r2, d) {
    if (d >= r1 + r2) return 0;
    if (d <= Math.abs(r1 - r2)) return Math.PI * Math.min(r1, r2) * Math.min(r1, r2);
    const r1sq = r1 * r1;
    const r2sq = r2 * r2;
    const arg1 = (d * d + r1sq - r2sq) / (2 * d * r1);
    const arg2 = (d * d + r2sq - r1sq) / (2 * d * r2);
    const term1 = r1sq * Math.acos(Math.max(-1, Math.min(1, arg1)));
    const term2 = r2sq * Math.acos(Math.max(-1, Math.min(1, arg2)));
    const term3 = 0.5 * Math.sqrt(Math.max(0, (-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2)));
    return term1 + term2 - term3;
}

// Fraction of a hexagon (treated as an equivalent circle of radius rHex) covered by the settlement circle (radius rSettlement).
function circleIntersectionFraction(rSettlement, rHex, d) {
    if (d + rHex <= rSettlement) return 1;                    // hex fully inside settlement
    if (d >= rSettlement + rHex) return 0;                    // no overlap
    if (rSettlement + d <= rHex) {                            // settlement fully inside hex
        return (rSettlement * rSettlement) / (rHex * rHex);   // area_settlement / area_hex
    }
    const hexArea = Math.PI * rHex * rHex;
    return Math.min(1, circleCircleOverlapArea(rSettlement, rHex, d) / hexArea);
}

// Recompute the urbanized fraction for every grid cell based on the settlement circle.
// population: current total settlement population (used to derive the settlement radius).
function updateUrbanizedFractions(population) {
    const settlementRadiusKm = getSettlementRadiusKm(population);
    const hexEqRadiusKm = (HEX_RADIUS_PX / GameConfig.pixelsPerKm) * 1.05;
    for (let cy = 0; cy < GRID_ROWS; cy++) {
        for (let cx = 0; cx < GRID_COLS; cx++) {
            const cell = getCell(cx, cy);
            const center = cellToWorld(cx, cy);
            const distPx = Phaser.Math.Distance.Between(settlement.x, settlement.y, center.x, center.y);
            const dKm = distPx / GameConfig.pixelsPerKm;
            cell.urbanizedFraction = circleIntersectionFraction(settlementRadiusKm, hexEqRadiusKm, dKm);
        }
    }
}