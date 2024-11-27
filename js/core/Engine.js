import { SceneManager } from '../managers/SceneManager.js';
import { InputManager } from '../managers/InputManager.js';
import { AssetManager } from '../managers/AssetManager.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { SoundSystem } from '../systems/SoundSystem.js';
import { UISystem } from '../systems/UISystem.js';
import { Time } from '../utils/Time.js';

export class Engine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isRunning = false;
        
        // Core systems
        this.sceneManager = new SceneManager();
        this.inputManager = new InputManager();
        this.assetManager = new AssetManager();
        this.physicsSystem = new PhysicsSystem();
        this.soundSystem = new SoundSystem();
        this.uiSystem = new UISystem();
        this.time = new Time();

        // Initialize canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    init() {
        // Initialize all systems
        this.inputManager.init();
        this.assetManager.init();
        this.physicsSystem.init();
        this.soundSystem.init();
        this.uiSystem.init();
        
        // Start the game loop
        this.isRunning = true;
        this.gameLoop();
    }

    resizeCanvas() {
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight;
        
        // Set display size (css pixels)
        this.canvas.style.width = `${containerWidth}px`;
        this.canvas.style.height = `${containerHeight}px`;
        
        // Set actual size in memory (scaled for retina displays)
        const scale = window.devicePixelRatio;
        this.canvas.width = Math.floor(containerWidth * scale);
        this.canvas.height = Math.floor(containerHeight * scale);
        
        // Normalize coordinate system to use css pixels
        this.ctx.scale(scale, scale);
    }

    gameLoop(timestamp) {
        if (!this.isRunning) return;

        // Update time
        this.time.update(timestamp);

        // Update all systems
        this.update();
        
        // Render the game
        this.render();

        // Schedule next frame
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    update() {
        // Update all game systems
        this.inputManager.update();
        this.physicsSystem.update(this.time.deltaTime);
        this.sceneManager.update(this.time.deltaTime);
        this.soundSystem.update();
        this.uiSystem.update();
    }

    render() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render current scene
        this.sceneManager.render(this.ctx);
        
        // Render UI on top
        this.uiSystem.render(this.ctx);
    }

    pause() {
        this.isRunning = false;
    }

    resume() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.gameLoop();
        }
    }
}
