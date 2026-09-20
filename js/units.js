// units.js - Mobile entities: Expedition, Pop (specialized workers), and Settlement

const settlement = {
    x: GameConfig.settlementX,
    y: GameConfig.settlementY,
    foodStock: GameConfig.startingFoodStock,
    unassignedPopulation: GameConfig.startingUnassignedPopulation,
    pops: [],
    expeditions: [],
    localGatherers: 0,   // total workers assigned to local gathering (sum of cell.assignedWorkers)
    foodGatheredToday: 0,      // food collected locally today
    foodConsumedToday: 0,       // food consumed by population last day
    gatheredDaily: 0,     // aggiunto
    consumedDaily: 0      // aggiunto
};

// Total settlement population: unassigned individuals + all pop workers (local and expeditions).
function getSettlementPopulation() {
    let total = settlement.unassignedPopulation;
    for (const pop of settlement.pops) total += pop.totalWorkers;
    return total;
}

// Effective local gathering radius in pixels: 1.5h walk starting from the settlement border.
function getEffectiveLocalGatherRadiusPx() {
    return getSettlementRadiusPx(getSettlementPopulation()) + getLocalGatherRadiusPx();
}

class Pop {
    constructor(type) {
        this.type = type;
        this.totalWorkers = 0;
        this.availableWorkers = 0;
        this.assignedWorkers = 0;
        this.localWorkers = 0;      // workers assigned to local cells
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
    constructor(id, popType, workerCount, startX, startY, areaX, areaY, areaRadius, settlementRef) {
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
        this.settlementRef = settlementRef;
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
        if (cell.urbanizedFraction >= 1) return -Infinity;
        const density = cell.forageDensity;
        if (density <= 0) return -Infinity;
        const center = cellToWorld(cx, cy);
        const dist = Phaser.Math.Distance.Between(this.x, this.y, center.x, center.y);
        return density * GameConfig.cellScoreDensityWeight - dist * GameConfig.cellScoreDistanceWeight;
    }

    findBetterCell() {
        const centerCell = worldToCell(this.x, this.y);
        const cellRadius = Math.ceil(this.areaRadius / HEX_VERTICAL_SPACING_PX);
        let bestScore = -Infinity;
        let bestCx = -1, bestCy = -1;

        for (let dy = -cellRadius; dy <= cellRadius; dy++) {
            for (let dx = -cellRadius; dx <= cellRadius; dx++) {
                const cx = centerCell.cx + dx;
                const cy = centerCell.cy + dy;
                if (cx >= 0 && cx < GRID_COLS && cy >= 0 && cy < GRID_ROWS) {
                    // Skip settlement cell (prevent gathering at settlement)
                    const settlementCell = worldToCell(this.settlementRef.x, this.settlementRef.y);
                    if (cx === settlementCell.cx && cy === settlementCell.cy) {
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
        const cellRadius = Math.ceil(this.areaRadius / HEX_VERTICAL_SPACING_PX);
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
                    if (cell.urbanizedFraction >= 1) continue;
                    const center = cellToWorld(cx, cy);
                    // Ensure the cell is within the circular area radius
                    const distFromAreaCenter = Phaser.Math.Distance.Between(this.areaCenter.x, this.areaCenter.y, center.x, center.y);
                    if (distFromAreaCenter > this.areaRadius) continue;
                    const dist = Phaser.Math.Distance.Between(fromX, fromY, center.x, center.y);
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
                    const best = this.findBestCellInArea(this.settlementRef.x, this.settlementRef.y);
                    if (best.cx >= 0) {
                        const target = cellToWorld(best.cx, best.cy);
                        const targetX = target.x;
                        const targetY = target.y;
                        targetDist = Phaser.Math.Distance.Between(this.settlementRef.x, this.settlementRef.y, targetX, targetY);
                        targetFound = true;
                        this.targetX = targetX;
                        this.targetY = targetY;
                    } else {
                        targetFound = false;
                    }
                } else {
                    const best = this.findBetterCell();
                    if (best.cx >= 0) {
                        const target = cellToWorld(best.cx, best.cy);
                        const targetX = target.x;
                        const targetY = target.y;
                        targetDist = Phaser.Math.Distance.Between(this.settlementRef.x, this.settlementRef.y, targetX, targetY);
                        targetFound = true;
                        this.targetX = targetX;
                        this.targetY = targetY;
                    }
                }

                if (targetFound) {
                    const needed = getProvisionsNeeded(this.workerCount, targetDist);
                    const taken = Math.min(needed, this.settlementRef.foodStock, this.maxCapacity);
                    this.inventory.provisions = taken;
                    this.settlementRef.foodStock -= taken;
                    this.tripStartGameTime = gameTimeSec;
                    this.state = 'travellingToArea';
                } else {
                    this.cooldownRemaining = GameConfig.dayLengthSeconds * GameConfig.restMultiplier;
                }
            }
            return;
        }

        // --- TRAVELLING / MOVING / RETURNING ---
        if (this.state === 'travellingToArea' || this.state === 'movingToCell' || this.state === 'returningToSettlement') {
            const consumed = this.workerCount * getTravelConsumptionPerSec() * delta;
            this.inventory.provisions -= consumed;
            if (this.inventory.provisions < 0) this.inventory.provisions = 0;

            if (this.state === 'returningToSettlement') {
                const distToSettlement = Phaser.Math.Distance.Between(this.x, this.y, this.settlementRef.x, this.settlementRef.y);
                if (distToSettlement < 5) {
                    this.x = this.settlementRef.x;
                    this.y = this.settlementRef.y;
                    if (this.toBeDisbanded) {
                        this.settlementRef.foodStock += this.inventory.food;
                        this.inventory.food = 0;
                        this.inventory.provisions = 0;
                        const pop = this.settlementRef.pops.find(p => p.type === this.popType);
                        if (pop) pop.returnWorkers(this.workerCount);
                        const index = this.settlementRef.expeditions.indexOf(this);
                        if (index > -1) this.settlementRef.expeditions.splice(index, 1);
                        return;
                    }
                    this.settlementRef.foodStock += this.inventory.food;
                    this.inventory.food = 0;
                    this.inventory.provisions = 0;
                    const tripDuration = gameTimeSec - this.tripStartGameTime;
                    this.cooldownRemaining = getRestDuration(tripDuration);
                    this.state = 'resting';
                    return;
                }
            }
            // Return early if provisions exhausted and not forced (but only if not already returning)
            if (this.state !== 'returningToSettlement' && !this.isForced && this.inventory.provisions <= 0) {
                this.inventory.provisions = 0;
                this.targetX = this.settlementRef.x;
                this.targetY = this.settlementRef.y;
                this.state = 'returningToSettlement';
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
                } else if (this.state === 'returningToSettlement') {
                    if (this.toBeDisbanded) {
                        this.settlementRef.foodStock += this.inventory.food;
                        this.inventory.food = 0;
                        this.inventory.provisions = 0;
                        const pop = this.settlementRef.pops.find(p => p.type === this.popType);
                        if (pop) pop.returnWorkers(this.workerCount);
                        const index = this.settlementRef.expeditions.indexOf(this);
                        if (index > -1) this.settlementRef.expeditions.splice(index, 1);
                        return;
                    }
                    this.settlementRef.foodStock += this.inventory.food;
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
                this.targetX = this.settlementRef.x;
                this.targetY = this.settlementRef.y;
                this.state = 'returningToSettlement';
                return;
            }

            if (this.inventory.food + this.inventory.provisions >= this.maxCapacity) {
                this.targetX = this.settlementRef.x;
                this.targetY = this.settlementRef.y;
                this.state = 'returningToSettlement';
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
                    const target = cellToWorld(best.cx, best.cy);
                    this.targetX = target.x;
                    this.targetY = target.y;
                    this.state = 'movingToCell';
                    return;
                }
            }

            const cell = worldToCell(this.x, this.y);
            const cellData = getCell(cell.cx, cell.cy);
            const density = cellData ? cellData.forageDensity : 0;
            const urbanized = cellData ? (cellData.urbanizedFraction || 0) : 0;
            if (density > 0 && urbanized < 1) {
                const gatherRate = GameConfig.baseGatherRate * density * delta * this.workerCount;
                this.inventory.food += gatherRate;
                const densityReduction = gatherRate * GameConfig.densityReductionPerFood / (1 - urbanized);
                reduceCellDensity(cellData, densityReduction);
            } else {
                let best;
                if (this.useAssignedArea) {
                    best = this.findBestCellInArea(this.x, this.y);
                } else {
                    best = this.findBetterCell();
                }
                if (best.cx >= 0 && getCell(best.cx, best.cy).forageDensity > 0) {
                    const target = cellToWorld(best.cx, best.cy);
                    this.targetX = target.x;
                    this.targetY = target.y;
                    this.state = 'movingToCell';
                } else {
                    this.targetX = this.settlementRef.x;
                    this.targetY = this.settlementRef.y;
                    this.state = 'returningToSettlement';
                }
            }
        }
    }
}

const expeditions = settlement.expeditions;