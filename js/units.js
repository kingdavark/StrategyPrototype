// units.js - Mobile entities: Expedition, Pop (specialized workers), and Camp

const camp = {
    x: 100,
    y: 100,
    foodStock: 50,
    unassignedPopulation: 20,
    pops: [],
    expeditions: []
};

class Pop {
    constructor(type) {
        this.type = type;
        this.totalWorkers = 0;
        this.availableWorkers = 0;
        this.assignedWorkers = 0;
    }

    addWorkers(count) {
        this.totalWorkers += count;
        this.availableWorkers += count;
    }

    takeWorkers(count) {
        const taken = Math.min(count, this.availableWorkers);
        this.availableWorkers -= taken;
        this.assignedWorkers += taken;
        return taken;
    }

    returnWorkers(count) {
        this.assignedWorkers -= count;
        this.availableWorkers += count;
    }
}

class Expedition {
    constructor(id, popType, workerCount, startX, startY, areaX, areaY, areaRadius, campRef) {
        this.id = id;
        this.popType = popType;
        this.workerCount = workerCount;
        this.x = startX;
        this.y = startY;
        this.targetX = areaX;
        this.targetY = areaY;
        this.speed = 60;
        this.state = 'travellingToArea';
        this.maxCapacity = workerCount * 2;
        this.inventory = { provisions: 0, food: 0 };
        this.areaCenter = { x: areaX, y: areaY };
        this.areaRadius = areaRadius;
        this.campRef = campRef;
        this.cooldownRemaining = 0;
        this.lastCellEvaluation = 0;
        this.isForced = false; // if true, expedition ignores provision limits
        this.useAssignedArea = true; // if true, gathering is restricted to the area around areaCenter
    }

    // Calculate score for a cell from the expedition's current position
    cellScore(cx, cy) {
        const cell = getCell(cx, cy);
        if (!cell) return -Infinity;
        const density = cell.forageDensity;
        if (density <= 0) return -Infinity;
        const cellWorldX = cx * CELL_SIZE + CELL_SIZE / 2;
        const cellWorldY = cy * CELL_SIZE + CELL_SIZE / 2;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, cellWorldX, cellWorldY);
        return density * 100 - dist * 0.2;
    }

    // Find the best cell around the expedition's current position (auto mode)
    findBetterCell() {
        const centerCell = worldToCell(this.x, this.y);
        const cellRadius = Math.ceil(this.areaRadius / CELL_SIZE);
        let bestScore = -Infinity;
        let bestCx = -1, bestCy = -1;

        for (let dy = -cellRadius; dy <= cellRadius; dy++) {
            for (let dx = -cellRadius; dx <= cellRadius; dx++) {
                const cx = centerCell.cx + dx;
                const cy = centerCell.cy + dy;
                if (cx >= 0 && cx < GRID_COLS && cy >= 0 && cy < GRID_ROWS) {
                    const score = this.cellScore(cx, cy);
                    if (score > bestScore) {
                        bestScore = score;
                        bestCx = cx;
                        bestCy = cy;
                    }
                }
            }
        }
        return { cx: bestCx, cy: bestCy, score: bestScore };
    }

    // Find the best cell within the assigned area (centered on areaCenter),
    // calculating distances from the given origin point.
    findBestCellInArea(fromX, fromY) {
        const centerCell = worldToCell(this.areaCenter.x, this.areaCenter.y);
        const cellRadius = Math.ceil(this.areaRadius / CELL_SIZE);
        let bestScore = -Infinity;
        let bestCx = -1, bestCy = -1;

        for (let dy = -cellRadius; dy <= cellRadius; dy++) {
            for (let dx = -cellRadius; dx <= cellRadius; dx++) {
                const cx = centerCell.cx + dx;
                const cy = centerCell.cy + dy;
                if (cx >= 0 && cx < GRID_COLS && cy >= 0 && cy < GRID_ROWS) {
                    const cell = getCell(cx, cy);
                    const density = cell.forageDensity;
                    if (density <= 0) continue;
                    const cellWorldX = cx * CELL_SIZE + CELL_SIZE / 2;
                    const cellWorldY = cy * CELL_SIZE + CELL_SIZE / 2;
                    const dist = Phaser.Math.Distance.Between(fromX, fromY, cellWorldX, cellWorldY);
                    const score = density * 100 - dist * 0.2;
                    if (score > bestScore) {
                        bestScore = score;
                        bestCx = cx;
                        bestCy = cy;
                    }
                }
            }
        }
        return { cx: bestCx, cy: bestCy, score: bestScore };
    }

    update(delta) {
        // --- RESTING ---
        if (this.state === 'resting') {
            this.cooldownRemaining -= delta;
            if (this.cooldownRemaining <= 0) {
                this.cooldownRemaining = 0;
                // Determine target and distance to calculate provisions
                let targetDist = 0;
                let targetFound = false;

                if (this.useAssignedArea) {
                    // Assigned area: target is areaCenter
                    targetDist = Phaser.Math.Distance.Between(this.campRef.x, this.campRef.y, this.areaCenter.x, this.areaCenter.y);
                    targetFound = true;
                } else {
                    // Auto mode: find the best cell around camp
                    const best = this.findBetterCell();
                    if (best.cx >= 0) {
                        const targetX = best.cx * CELL_SIZE + CELL_SIZE / 2;
                        const targetY = best.cy * CELL_SIZE + CELL_SIZE / 2;
                        targetDist = Phaser.Math.Distance.Between(this.campRef.x, this.campRef.y, targetX, targetY);
                        targetFound = true;
                        // Save target for later use (avoid recomputing)
                        this.targetX = targetX;
                        this.targetY = targetY;
                    }
                }

                if (targetFound) {
                    // Calculate provisions based on target distance
                    const needed = this.workerCount * (targetDist / 100) * 0.5;
                    const taken = Math.min(needed, this.campRef.foodStock, this.maxCapacity);
                    this.inventory.provisions = taken;
                    this.campRef.foodStock -= taken;
                } else {
                    // No target found: don't take provisions, stay resting
                    this.cooldownRemaining = 5;
                    return;
                }

                if (targetFound) {
                    this.state = 'travellingToArea';
                } else {
                    // No cells available: return provisions and stay resting
                    this.campRef.foodStock += this.inventory.provisions;
                    this.inventory.provisions = 0;
                    this.cooldownRemaining = 5; // check again in 5 seconds
                }
            }
            return;
        }

        // --- TRAVELLING / MOVING / RETURNING ---
        if (this.state === 'travellingToArea' || this.state === 'movingToCell' || this.state === 'returningToCamp') {
            // Consume provisions while moving
            const consumed = this.workerCount * 0.01 * delta;
            this.inventory.provisions -= consumed;
            if (this.inventory.provisions < 0) this.inventory.provisions = 0;

            // If returning and already at camp, go directly to resting
            if (this.state === 'returningToCamp') {
                const distToCamp = Phaser.Math.Distance.Between(this.x, this.y, this.campRef.x, this.campRef.y);
                if (distToCamp < 5) {
                    // Deposit food and rest
                    this.campRef.foodStock += this.inventory.food;
                    this.inventory.food = 0;
                    this.inventory.provisions = 0;
                    this.cooldownRemaining = 3;
                    this.state = 'resting';
                    return;
                }
            }

            // Return early if provisions exhausted and not forced (but don't override resting)
            if (!this.isForced && this.inventory.provisions <= 0) {
                this.inventory.provisions = 0;
                this.targetX = this.campRef.x;
                this.targetY = this.campRef.y;
                this.state = 'returningToCamp';
                return;
            }

            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 2) {
                this.x = this.targetX;
                this.y = this.targetY;
                if (this.state === 'travellingToArea' || this.state === 'movingToCell') {
                    this.state = 'gathering';
                } else if (this.state === 'returningToCamp') {
                    this.campRef.foodStock += this.inventory.food;
                    this.inventory.food = 0;
                    this.inventory.provisions = 0;
                    this.cooldownRemaining = 3;
                    this.state = 'resting';
                }
                return;
            }
            const step = this.speed * delta;
            const ratio = Math.min(step / dist, 1);
            this.x += dx * ratio;
            this.y += dy * ratio;
            return;
        }

        // --- GATHERING ---
        if (this.state === 'gathering') {
            const consumed = this.workerCount * 0.02 * delta;
            this.inventory.provisions -= consumed;
            if (!this.isForced && this.inventory.provisions <= 0) {
                this.inventory.provisions = 0;
                this.targetX = this.campRef.x;
                this.targetY = this.campRef.y;
                this.state = 'returningToCamp';
                return;
            }

            if (this.inventory.food + this.inventory.provisions >= this.maxCapacity) {
                this.targetX = this.campRef.x;
                this.targetY = this.campRef.y;
                this.state = 'returningToCamp';
                return;
            }

            // Evaluate cell switching periodically
            this.lastCellEvaluation += delta;
            if (this.lastCellEvaluation >= 1.0) {
                this.lastCellEvaluation = 0;
                const current = worldToCell(this.x, this.y);
                const currentDensity = getCell(current.cx, current.cy) ? getCell(current.cx, current.cy).forageDensity : 0;
                const currentScore = this.cellScore(current.cx, current.cy);

                let best;
                if (this.useAssignedArea) {
                    best = this.findBestCellInArea(this.x, this.y);
                } else {
                    best = this.findBetterCell();
                }

                if (best.cx >= 0 && best.score > currentScore * 1.1 && getCell(best.cx, best.cy).forageDensity >= 0.2) {
                    this.targetX = best.cx * CELL_SIZE + CELL_SIZE / 2;
                    this.targetY = best.cy * CELL_SIZE + CELL_SIZE / 2;
                    this.state = 'movingToCell';
                    return;
                }
            }

            // Gather from current cell
            const cell = worldToCell(this.x, this.y);
            const cellData = getCell(cell.cx, cell.cy);
            const density = cellData ? cellData.forageDensity : 0;
            if (density > 0) {
                const gatherRate = 0.5 * density * delta * this.workerCount;
                this.inventory.food += gatherRate;
                const densityReduction = gatherRate * 0.005;
                modifyDensity(this.x, this.y, 'forageDensity', -densityReduction, CELL_SIZE * 0.6);
            } else {
                // Cell exhausted, find another or return
                let best;
                if (this.useAssignedArea) {
                    best = this.findBestCellInArea(this.x, this.y);
                } else {
                    best = this.findBetterCell();
                }
                if (best.cx >= 0 && getCell(best.cx, best.cy).forageDensity > 0) {
                    this.targetX = best.cx * CELL_SIZE + CELL_SIZE / 2;
                    this.targetY = best.cy * CELL_SIZE + CELL_SIZE / 2;
                    this.state = 'movingToCell';
                } else {
                    this.targetX = this.campRef.x;
                    this.targetY = this.campRef.y;
                    this.state = 'returningToCamp';
                }
            }
        }
    }
}

const expeditions = camp.expeditions;