// time.js - Time Manager for controlling simulation speed

const TimeManager = {
    speeds: [0, 0.5, 1, 2, 4, 8],  // available speed multipliers
    speedIndex: 2,                   // index of current speed in the array (default 1x)
    lastNonZeroIndex: 2,             // remember last non-zero speed for resume (default 1x)

    get speed() {
        return this.speeds[this.speedIndex];
    },

    // Set speed by index in the speeds array. Updates lastNonZeroIndex if not pausing.
    setSpeedIndex(newIndex) {
        if (newIndex >= 0 && newIndex < this.speeds.length) {
            this.speedIndex = newIndex;
            if (newIndex !== 0) {
                this.lastNonZeroIndex = newIndex;
            }
            console.log(`Speed set to ${this.getSpeedLabel()}`);
        }
    },

    // Increase speed (cycle forward)
    increaseSpeed() {
        const newIndex = (this.speedIndex + 1) % this.speeds.length;
        this.setSpeedIndex(newIndex);
    },

    // Decrease speed (cycle backward)
    decreaseSpeed() {
        const newIndex = (this.speedIndex - 1 + this.speeds.length) % this.speeds.length;
        this.setSpeedIndex(newIndex);
    },

    // Toggle between pause and the last non-zero speed
    togglePause() {
        if (this.speedIndex === 0) {
            // Resume to last non-zero speed
            this.setSpeedIndex(this.lastNonZeroIndex);
        } else {
            // Pause
            this.setSpeedIndex(0);
        }
    },

    // Return the actual delta time considering the current speed
    getGameDelta(deltaSec) {
        return deltaSec * this.speed;
    },

    // Return a human-readable label for the current speed
    getSpeedLabel() {
        const s = this.speed;
        if (s === 0) return 'Paused';
        if (s === 0.5) return '0.5x';
        if (s === 1) return '1x';
        if (s === 2) return '2x';
        if (s === 4) return '4x';
        if (s === 8) return '8x';
        return `${s}x`;
    }
};