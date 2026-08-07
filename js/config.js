// config.js - Centralized game parameters for balancing and debugging
//
// HOW TO USE THIS FILE:
// - Change any value while the game is running via the browser console:
//   GameConfig.dayLengthSeconds = 3;
// - Or use the Debug Panel (button in top-right corner).
// - Some parameters (cellSize, worldWidth, worldHeight) require a page reload to take effect.
//
// RELATIONSHIPS BETWEEN VARIABLES:
//
// 1. DAY CYCLE
//    - Every dayLengthSeconds real seconds, one game day passes.
//    - On each new day, total population * foodConsumptionPerPersonPerDay is subtracted from camp food.
//
// 2. EXPEDITION PROVISIONS & MOVEMENT
//    - When an expedition departs, it receives provisions from the camp.
//    - Provisions consumed while moving = workerCount * provisionConsumptionTravelling per second.
//    - Provisions consumed while gathering = workerCount * provisionConsumptionGathering per second.
//    - If provisions reach 0 and the expedition is not FORCED, it returns to camp immediately.
//    - Expedition speed (expeditionSpeed) is in pixels per second.
//    - After returning, the expedition rests for cooldownSeconds before restarting.
//
// 3. GATHERING & DENSITY
//    - Gathering rate per second = baseGatherRate * cellDensity * workerCount.
//      Example: density=1.0, 5 workers, baseGatherRate=0.5 → 2.5 food/second.
//    - Density reduction per food gathered = densityReductionPerFood.
//      Example: gathering 2.5 food → density reduces by 2.5 * 0.005 = 0.0125.
//    - Impact radius for density reduction = gatherImpactRadius * cellSize.
//
// 4. INVENTORY & CAPACITY
//    - Each worker can carry maxCapacityPerWorker units total (food + provisions).
//      Example: 5 workers * 2 = 10 capacity.
//    - If food + provisions >= maxCapacity, the expedition returns to camp.
//
// 5. CELL SWITCHING
//    - Every cellEvaluationInterval seconds, the expedition evaluates whether to move.
//    - A cell's score = density * cellScoreDensityWeight - distance * cellScoreDistanceWeight.
//    - If the best cell's score > current cell score * cellSwitchScoreThreshold, and
//      the best cell's density >= cellAbandonThreshold, the expedition moves there.
//
// 6. AREA & RADIUS
//    - areaRadius (pixels) defines the gathering/search radius around the area center.
//    - In auto mode, the expedition searches around its current position using this radius.
//

const GameConfig = {
    // --- Day cycle ---
    dayLengthSeconds: 5,                    // real seconds per game day
    foodConsumptionPerPersonPerDay: 0.01,   // food consumed per person each day

    // --- Gathering ---
    baseGatherRate: 0.2,                    // food per second per worker at density 1.0
    densityReductionPerFood: 0.001,         // how much density is removed per food gathered
    gatherImpactRadius: 0.6,                // multiplier for CELL_SIZE (0.6 * 64 = ~38px)

    // --- Expedition movement ---
    expeditionSpeed: 60,                    // pixels per second
    maxCapacityPerWorker: 2,                // inventory slots per worker (food + provisions)
    provisionConsumptionTravelling: 0.02,   // provisions per worker per second while moving
    provisionConsumptionGathering: 0.04,    // provisions per worker per second while gathering
    cooldownSeconds: 3,                     // rest time after returning to camp
    provisionsBaseMultiplier: 0.5,          // multiplier for distance-based provision calculation
    provisionsAutoBase: 2,                  // base provisions per worker for auto expeditions

    // --- Area & cell switching ---
    areaRadius: 150,                        // default gathering area radius in pixels
    cellAbandonThreshold: 0.2,              // density below which we look for a better cell
    cellSwitchScoreThreshold: 1.1,          // minimum score ratio to switch (e.g., 1.1 = 10% better)
    cellScoreDensityWeight: 100,            // weight of density in cell score
    cellScoreDistanceWeight: 0.2,           // weight of distance in cell score
    cellEvaluationInterval: 1.0,            // seconds between cell switch evaluations

    // --- World ---
    cellSize: 50,                           // pixels per cell
    worldWidth: 1280,                       // game world width in pixels
    worldHeight: 720,                       // game world height in pixels

    // --- Starting values ---
    startingFoodStock: 10,
    startingUnassignedPopulation: 10,
    startingExpeditionWorkers: 5,           // default workers for a new expedition
    campX: 100,
    campY: 100
};