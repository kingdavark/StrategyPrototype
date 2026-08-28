// config.js - Centralized game parameters and derived helpers

const GameConfig = {
    // --- Day cycle ---
    dayLengthSeconds: 10,                    // real seconds per game day
    foodConsumptionPerPersonPerDay: 0.01,   // base food per person per day

    // --- Gathering ---
    baseGatherRate: 0.2,                    // food per second per worker at density 1.0
    densityReductionPerFood: 0.001,         // density removed per food gathered
    gatherImpactRadius: 0.6,                // multiplier for CELL_SIZE

    // --- Movement (base parameters) ---
    cellSize: 10,                           // pixels per cell
    cellSizeInKm: 10,                        // real kilometers represented by one cell
    walkingSpeedKmh: 4,                     // walking speed in km/h

    // --- Expedition consumption multipliers ---
    travelConsumptionMultiplier: 2.0,       // vs base daily rate while moving
    gatheringConsumptionMultiplier: 2.5,    // vs base daily rate while gathering

    // --- Provisions & rest ---
    safetyMultiplier: 1.25,                  // safety margin for provisions
    restMultiplier: 0.5,                    // rest time as proportion of trip duration

    // --- Capacity ---
    maxCapacityPerWorker: 1,                // inventory slots per worker (food + provisions)

    // --- Area & cell switching ---
    areaRadius: 150,                        // default gathering area radius in pixels
    cellAbandonThreshold: 0.2,
    cellSwitchScoreThreshold: 1.1,
    cellScoreDensityWeight: 100,
    cellScoreDistanceWeight: 0.2,
    cellEvaluationInterval: 1.0,

    // --- Starting values ---
    startingFoodStock: 10,
    startingUnassignedPopulation: 10,
    startingExpeditionWorkers: 5,
    campX: 100,
    campY: 100,

    // --- World ---
    worldWidth: 1280,          // game world width in pixels
    worldHeight: 720,          // game world height in pixels

    //Info management
    cellWarningThreshold: 0.25,              // threshold for warning when cell is getting depleted
};

// ---- Derived parameter helpers ----

// Game seconds per game hour
function getSecondsPerGameHour() {
    return GameConfig.dayLengthSeconds / 24;
}

// Base food consumption per person per real second
function getBaseConsumptionPerSec() {
    return GameConfig.foodConsumptionPerPersonPerDay / GameConfig.dayLengthSeconds;
}

// Pixels per real kilometer
function getPixelsPerKm() {
    return GameConfig.cellSize / GameConfig.cellSizeInKm;
}

// Current expedition speed in pixels per real second
function getExpeditionSpeed() {
    const secondsPerGameHour = getSecondsPerGameHour(); // real seconds per game hour
    const speedPxPerHour = GameConfig.walkingSpeedKmh * getPixelsPerKm(); // pixels per game hour
    return speedPxPerHour / secondsPerGameHour; // pixels per real second
}

// Provision consumption per worker per real second while traveling
function getTravelConsumptionPerSec() {
    return getBaseConsumptionPerSec() * GameConfig.travelConsumptionMultiplier;
}

// Provision consumption per worker per real second while gathering
function getGatheringConsumptionPerSec() {
    return getBaseConsumptionPerSec() * GameConfig.gatheringConsumptionMultiplier;
}

// Needed provisions for a given worker count and one-way distance (pixels)
function getProvisionsNeeded(workerCount, distance) {
    const travelTime = (distance / getExpeditionSpeed()) * 2; // round trip
    return workerCount * getTravelConsumptionPerSec() * travelTime * GameConfig.safetyMultiplier;
}

// Rest duration after a trip of given duration in real seconds
function getRestDuration(tripDurationSec) {
    return tripDurationSec * GameConfig.restMultiplier;
}

// Local gathering radius in pixels (one day of travel)
function getLocalGatherRadiusPx() {
    return getExpeditionSpeed() * GameConfig.dayLengthSeconds;
}

let gameTimeSec = 0;          // cumulative simulated time in seconds