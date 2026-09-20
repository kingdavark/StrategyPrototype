// config.js - Centralized game parameters and derived helpers

const GameConfig = {
    // --- Day cycle ---
    dayLengthSeconds: 10,                    // real seconds per game day
    foodConsumptionPerPersonPerDay: 0.01,   // base food per person per day

    // --- Gathering ---
    baseGatherRate: 0.2,                    // food per second per worker at density 1.0
    densityReductionPerFood: 0.001,         // density removed per food gathered
    gatherImpactRadius: 0.6,                // legacy: unused (reserved for future area effects)

    // --- Grid geometry (hexagon) ---
    hexCenterDistanceKm: 1,                 // km between centers of adjacent hexagons (world cell size)
    pixelsPerKm: 30,                        // pixels per km (visual scale)

    // --- Movement (base parameters) ---
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
    settlementX: 100,
    settlementY: 100,

    // --- Settlement growth ---
    settlementGrowthPerPerson: 0.001,   // km² of settlement area per person
    settlementMinAreaKm2: 0.01,         // minimum settlement area in km²
    settlementMinVisualRadiusPx: 8,     // minimum visual radius in pixels (rendering only)
    hoursWalkingRadius: 1.5,            // hours of walking for the local gathering radius

    // --- World ---
    worldWidth: 1280,          // game world width in pixels
    worldHeight: 720,          // game world height in pixels

    //Info management
    cellWarningThreshold: 0.25,              // threshold for warning when cell is getting depleted
};

// ---- Config persistence (saved by "Apply & Reload" in debug.js) ----
const GAME_CONFIG_STORAGE_KEY = 'dinastiaGameConfig';

// Snapshot of the true defaults, before applying any persisted values.
const GameConfigDefaults = { ...GameConfig };

// Apply persisted values (from localStorage) on startup, before the grid is built.
(function loadPersistedConfig() {
    try {
        const saved = localStorage.getItem(GAME_CONFIG_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            for (const key in parsed) {
                if (key in GameConfig && typeof parsed[key] === 'number') {
                    GameConfig[key] = parsed[key];
                }
            }
        }
    } catch (e) {
        console.warn('Could not load persisted game config:', e);
    }
})();

// ---- Derived parameter helpers ----

// Game seconds per game hour
function getSecondsPerGameHour() {
    return GameConfig.dayLengthSeconds / 24;
}

// Base food consumption per person per real second
function getBaseConsumptionPerSec() {
    return GameConfig.foodConsumptionPerPersonPerDay / GameConfig.dayLengthSeconds;
}

// Pixels per kilometer (visual scale)
function getPixelsPerKm() {
    return GameConfig.pixelsPerKm;
}

// Hexagon radius (vertex to center) in pixels
function getHexRadiusPx() {
    return (GameConfig.hexCenterDistanceKm / Math.sqrt(3)) * GameConfig.pixelsPerKm;
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

// Local gathering radius in pixels (1.5 hours of walking from the settlement border)
function getLocalGatherRadiusPx() {
    return GameConfig.walkingSpeedKmh * GameConfig.hoursWalkingRadius * getPixelsPerKm();
}

// Settlement area in km² for a given population
function getSettlementAreaKm2(population) {
    return Math.max(GameConfig.settlementMinAreaKm2, population * GameConfig.settlementGrowthPerPerson);
}

// Settlement radius in km for a given population
function getSettlementRadiusKm(population) {
    return Math.sqrt(getSettlementAreaKm2(population) / Math.PI);
}

// Settlement radius in pixels for a given population
function getSettlementRadiusPx(population) {
    return getSettlementRadiusKm(population) * getPixelsPerKm();
}

let gameTimeSec = 0;          // cumulative simulated time in seconds