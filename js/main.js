// main.js - Entry point for the game prototype
// Creates the Phaser game instance and the initial scene.

const config = {
    type: Phaser.AUTO,       // Use WebGL if available, fallback to Canvas
    width: 800,              // Game width in pixels
    height: 600,             // Game height in pixels
    backgroundColor: '#1a1a2e', // Dark blue-grey background for the game world
    parent: document.body,   // Attach the canvas to the body
    scene: {
        preload: preload,    // Function to load assets (images, sounds)
        create: create,      // Function to set up the initial game state
        update: update       // Function called every frame (game loop)
    }
};

// Create the Phaser game instance
const game = new Phaser.Game(config);

// preload: load any external assets (images, spritesheets, etc.)
// For now, we have no assets, so this function is empty.
function preload() {
    // nothing to load yet
}

// create: called once after preload. We set up the initial scene.
function create() {
    // Add a simple text to confirm the game is running
    this.add.text(400, 300, 'Dinastia - Prototype Running', {
        fontSize: '24px',
        fill: '#ffffff'
    }).setOrigin(0.5, 0.5); // center the text
}

// update: called every frame (about 60 times per second).
// time: the current time in milliseconds since the game started.
// delta: the time difference since the last frame in milliseconds.
function update(time, delta) {
    // empty for now
}