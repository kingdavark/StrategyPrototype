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
    }

    cellScore(cx, cy) {
        const cell = getCell(cx, cy);
        if (!cell) return -Infinity;
        const density = cell.forageDensity;
        if (density <= 0) return -Infinity;
        const cellWorldX = cx * CELL_SIZE + CELL_SIZE / 2;
        const cellWorldY = cy * CELL_SIZE + CELL_SIZE / 2;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, cellWorldX, cellWorldY);
        return density * 100 - dist * 0.2;   // adjusted weight for distance
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

    update(delta) {
        if (this.state === 'resting') {
            this.cooldownRemaining -= delta;
            if (this.cooldownRemaining <= 0) {
                this.cooldownRemaining = 0;
                const distToArea = Phaser.Math.Distance.Between(this.campRef.x, this.campRef.y, this.areaCenter.x, this.areaCenter.y);
                const needed = this.workerCount * (distToArea / 100) * 0.5;
                const taken = Math.min(needed, this.campRef.foodStock, this.maxCapacity);
                this.inventory.provisions = taken;
                this.campRef.foodStock -= taken;
                this.targetX = this.areaCenter.x;
                this.targetY = this.areaCenter.y;
                this.state = 'travellingToArea';
            }
            return;
        }

        if (this.state === 'travellingToArea' || this.state === 'movingToCell' || this.state === 'returningToCamp') {
            const consumed = this.workerCount * 0.01 * delta;
            this.inventory.provisions -= consumed;
            if (this.inventory.provisions < 0) this.inventory.provisions = 0;

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

        if (this.state === 'gathering') {
            const consumed = this.workerCount * 0.02 * delta;
            this.inventory.provisions -= consumed;
            if (this.inventory.provisions <= 0) {
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
            if (this.lastCellEvaluation >= 1.0) {
                this.lastCellEvaluation = 0;
                const current = worldToCell(this.x, this.y);
                const currentDensity = getCell(current.cx, current.cy) ? getCell(current.cx, current.cy).forageDensity : 0;
                const currentScore = this.cellScore(current.cx, current.cy);
                const best = this.findBetterCell();

                if (best.cx >= 0 && best.score > currentScore * 1.1 && getCell(best.cx, best.cy).forageDensity >= 0.2) {
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
                const gatherRate = 0.5 * density * delta * this.workerCount;
                this.inventory.food += gatherRate;
                // Much slower density reduction: 0.005 per food gathered
                const densityReduction = gatherRate * 0.005;
                modifyDensity(this.x, this.y, 'forageDensity', -densityReduction, CELL_SIZE * 0.6);
            } else {
                const best = this.findBetterCell();
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