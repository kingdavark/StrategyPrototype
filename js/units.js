// units.js - Mobile entities: Expedition, Pop (specialized workers), and Camp

const camp = {
    x: GameConfig.campX,
    y: GameConfig.campY,
    foodStock: GameConfig.startingFoodStock,
    unassignedPopulation: GameConfig.startingUnassignedPopulation,
    pops: [],
    expeditions: [],
    localGatherers: 0,   // total workers assigned to local gathering (sum of cell.assignedWorkers)
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
        this.speed = getExpeditionSpeed();
        this.state = 'travellingToArea';
        this.maxCapacity = workerCount * GameConfig.maxCapacityPerWorker;
        this.inventory = { provisions: 0, food: 0 };
        this.areaCenter = { x: areaX, y: areaY };
        this.areaRadius = areaRadius;
        this.campRef = campRef;
        this.cooldownRemaining = 0;
        this.lastCellEvaluation = 0;
        this.isForced = false;
        this.useAssignedArea = true;
        this.toBeDisbanded = false;
        this.tripStartGameTime = null;
    }

    cellScore(cx, cy) {
        const cell = getCell(cx, cy);
        if (!cell) return -Infinity;
        const density = cell.forageDensity;
        if (density <= 0) return -Infinity;
        const cellWorldX = cx * CELL_SIZE + CELL_SIZE / 2;
        const cellWorldY = cy * CELL_SIZE + CELL_SIZE / 2;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, cellWorldX, cellWorldY);
        return density * GameConfig.cellScoreDensityWeight - dist * GameConfig.cellScoreDistanceWeight;
    }

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
                    // Skip camp cell (prevent gathering at camp)
                    const campCell = worldToCell(this.campRef.x, this.campRef.y);
                    if (cx === campCell.cx && cy === campCell.cy) {
                        continue;
                    }
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
                    // Ensure the cell is within the circular area radius
                    const distFromAreaCenter = Phaser.Math.Distance.Between(this.areaCenter.x, this.areaCenter.y, cellWorldX, cellWorldY);
                    if (distFromAreaCenter > this.areaRadius) continue;
                    const dist = Phaser.Math.Distance.Between(fromX, fromY, cellWorldX, cellWorldY);
                    const score = density * GameConfig.cellScoreDensityWeight - dist * GameConfig.cellScoreDistanceWeight;
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
        // dynamic capacity and speed
        this.maxCapacity = this.workerCount * GameConfig.maxCapacityPerWorker;
        this.speed = getExpeditionSpeed();

        // --- RESTING ---
        if (this.state === 'resting') {
            this.cooldownRemaining -= delta;
            if (this.cooldownRemaining <= 0) {
                this.cooldownRemaining = 0;
                let targetDist = 0;
                let targetFound = false;

                if (this.useAssignedArea) {
                    const best = this.findBestCellInArea(this.campRef.x, this.campRef.y);
                    if (best.cx >= 0) {
                        const targetX = best.cx * CELL_SIZE + CELL_SIZE / 2;
                        const targetY = best.cy * CELL_SIZE + CELL_SIZE / 2;
                        targetDist = Phaser.Math.Distance.Between(this.campRef.x, this.campRef.y, targetX, targetY);
                        targetFound = true;
                        this.targetX = targetX;
                        this.targetY = targetY;
                    } else {
                        targetFound = false;
                    }
                } else {
                    const best = this.findBetterCell();
                    if (best.cx >= 0) {
                        const targetX = best.cx * CELL_SIZE + CELL_SIZE / 2;
                        const targetY = best.cy * CELL_SIZE + CELL_SIZE / 2;
                        targetDist = Phaser.Math.Distance.Between(this.campRef.x, this.campRef.y, targetX, targetY);
                        targetFound = true;
                        this.targetX = targetX;
                        this.targetY = targetY;
                    }
                }

                if (targetFound) {
                    const needed = getProvisionsNeeded(this.workerCount, targetDist);
                    const taken = Math.min(needed, this.campRef.foodStock, this.maxCapacity);
                    this.inventory.provisions = taken;
                    this.campRef.foodStock -= taken;
                    this.tripStartGameTime = gameTimeSec;
                    this.state = 'travellingToArea';
                } else {
                    this.cooldownRemaining = GameConfig.dayLengthSeconds * GameConfig.restMultiplier;
                }
            }
            return;
        }

        // --- TRAVELLING / MOVING / RETURNING ---
        if (this.state === 'travellingToArea' || this.state === 'movingToCell' || this.state === 'returningToCamp') {
            const consumed = this.workerCount * getTravelConsumptionPerSec() * delta;
            this.inventory.provisions -= consumed;
            if (this.inventory.provisions < 0) this.inventory.provisions = 0;

            if (this.state === 'returningToCamp') {
                const distToCamp = Phaser.Math.Distance.Between(this.x, this.y, this.campRef.x, this.campRef.y);
                if (distToCamp < 5) {
                    this.x = this.campRef.x;
                    this.y = this.campRef.y;
                    if (this.toBeDisbanded) {
                        this.campRef.foodStock += this.inventory.food;
                        this.inventory.food = 0;
                        this.inventory.provisions = 0;
                        const pop = this.campRef.pops.find(p => p.type === this.popType);
                        if (pop) pop.returnWorkers(this.workerCount);
                        const index = this.campRef.expeditions.indexOf(this);
                        if (index > -1) this.campRef.expeditions.splice(index, 1);
                        return;
                    }
                    this.campRef.foodStock += this.inventory.food;
                    this.inventory.food = 0;
                    this.inventory.provisions = 0;
                    const tripDuration = gameTimeSec - this.tripStartGameTime;
                    this.cooldownRemaining = getRestDuration(tripDuration);
                    this.state = 'resting';
                    return;
                }
            }
            // Return early if provisions exhausted and not forced (but only if not already returning)
            if (this.state !== 'returningToCamp' && !this.isForced && this.inventory.provisions <= 0) {
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
                    if (this.toBeDisbanded) {
                        this.campRef.foodStock += this.inventory.food;
                        this.inventory.food = 0;
                        this.inventory.provisions = 0;
                        const pop = this.campRef.pops.find(p => p.type === this.popType);
                        if (pop) pop.returnWorkers(this.workerCount);
                        const index = this.campRef.expeditions.indexOf(this);
                        if (index > -1) this.campRef.expeditions.splice(index, 1);
                        return;
                    }
                    this.campRef.foodStock += this.inventory.food;
                    this.inventory.food = 0;
                    this.inventory.provisions = 0;
                    const tripDuration = gameTimeSec - this.tripStartGameTime;
                    this.cooldownRemaining = getRestDuration(tripDuration);
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
            const consumed = this.workerCount * getGatheringConsumptionPerSec() * delta;
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

            this.lastCellEvaluation += delta;
            if (this.lastCellEvaluation >= GameConfig.cellEvaluationInterval) {
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

                if (best.cx >= 0 && best.score > currentScore * GameConfig.cellSwitchScoreThreshold && getCell(best.cx, best.cy).forageDensity >= GameConfig.cellAbandonThreshold) {
                    this.targetX = best.cx * CELL_SIZE + CELL_SIZE / 2;
                    this.targetY = best.cy * CELL_SIZE + CELL_SIZE / 2;
                    this.state = 'movingToCell';
                    return;
                }
            }

            const cell = worldToCell(this.x, this.y);
            const cellData = getCell(cell.cx, cell.cy);
            const density = cellData ? cellData.forageDensity : 0;
            if (density > 0) {
                const gatherRate = GameConfig.baseGatherRate * density * delta * this.workerCount;
                this.inventory.food += gatherRate;
                const densityReduction = gatherRate * GameConfig.densityReductionPerFood;
                modifyDensity(this.x, this.y, 'forageDensity', -densityReduction, CELL_SIZE * GameConfig.gatherImpactRadius);
            } else {
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