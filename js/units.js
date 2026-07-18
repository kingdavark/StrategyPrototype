// units.js - Mobile entities: Pop (group of people) and Herd (animals, future)

// ---- Pop class ----
// Represents a group of people that can move and perform tasks.

class Pop {
    /**
     * @param {number} x - starting world x position (pixels)
     * @param {number} y - starting world y position (pixels)
     * @param {number} population - number of individuals in this group
     */
    constructor(x, y, population = 10) {
        this.id = 'pop_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        this.type = 'pop';
        this.x = x;
        this.y = y;
        this.population = population;

        // Movement
        this.targetX = x;      // destination x (pixels)
        this.targetY = y;      // destination y (pixels)
        this.speed = 80;       // pixels per second at 1x speed
        this.state = 'idle';   // 'idle' | 'moving' | 'working'

        // Task and inventory (used in future batches)
        this.task = null;      // { type: string, location: {x, y} }
        this.inventory = { food: 0, wood: 0 };
        this.rations = 0;      // food carried for the journey (future)
    }

    /**
     * Set a new movement destination.
     * @param {number} worldX
     * @param {number} worldY
     */
    moveTo(worldX, worldY) {
        this.targetX = worldX;
        this.targetY = worldY;
        this.state = 'moving';
    }

    /**
     * Update the pop's position each frame.
     * @param {number} delta - time since last frame in seconds (game time)
     */
    update(delta) {
        if (this.state === 'moving') {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 2) {
                // Arrived at destination
                this.x = this.targetX;
                this.y = this.targetY;
                this.state = 'idle';
                // If there is a pending task, start it automatically
                if (this.task && this.task.type) {
                    this.state = 'working';
                    console.log(`Pop started ${this.task.type} at (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
                }
                return;
            }

            // Move towards target
            const step = this.speed * delta;
            const ratio = Math.min(step / dist, 1);
            this.x += dx * ratio;
            this.y += dy * ratio;
        } else if (this.state === 'working') {
            if (!this.task || !this.task.type) {
                this.state = 'idle';
                return;
            }

            // Execute task based on type
            if (this.task.type === 'forage') {
                // Check if inventory is full
                if (this.inventory.food >= 20) {
                    console.log('Inventory full, stop foraging.');
                    this.state = 'idle';
                    this.task = null;
                    return;
                }

                const cell = worldToCell(this.x, this.y);
                const cellData = getCell(cell.cx, cell.cy);
                const density = cellData.forageDensity;

                if (density <= 0) {
                    console.log('Cell exhausted, stop foraging.');
                    this.state = 'idle';
                    this.task = null;
                    return;
                }

                // Gather rate: density * 1.5 food per second
                const gatherRate = density * 1.5 * delta;
                this.inventory.food += gatherRate;

                // Reduce local density
                modifyDensity(this.x, this.y, 'forageDensity', -0.1 * delta, CELL_SIZE * 0.8);
            }
        }
    }

        /**
     * Start a task at the current location.
     * @param {string} taskType - type of task ('forage', 'gatherWood', etc.)
     */
    startTask(taskType) {
        this.task = {
            type: taskType,
            location: { x: this.x, y: this.y }
        };
        this.state = 'working';
        console.log(`Pop ${this.id} started task: ${taskType}`);
    }
}

// ---- Global list of pops (for prototype simplicity) ----
const pops = [];