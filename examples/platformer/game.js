import { Engine } from '../../js/core/Engine.js';

// Create game instance
const game = new Engine();

// Game configuration
const config = {
    player: {
        width: 32,
        height: 32,
        speed: 200,
        jumpForce: 400,
        color: '#4a90e2'
    },
    platforms: [
        { x: 100, y: 500, width: 200, height: 20, color: '#2ecc71' },
        { x: 400, y: 400, width: 200, height: 20, color: '#2ecc71' },
        { x: 700, y: 300, width: 200, height: 20, color: '#2ecc71' }
    ],
    collectibles: [
        { x: 150, y: 450, width: 20, height: 20, color: '#f1c40f' },
        { x: 450, y: 350, width: 20, height: 20, color: '#f1c40f' },
        { x: 750, y: 250, width: 20, height: 20, color: '#f1c40f' }
    ]
};

// Create game scene
const gameScene = {
    player: {
        x: 100,
        y: 100,
        width: config.player.width,
        height: config.player.height,
        velocity: { x: 0, y: 0 },
        isJumping: false,
        score: 0
    },

    platforms: [...config.platforms],
    collectibles: [...config.collectibles],

    onEnter() {
        // Initialize player physics
        game.physicsSystem.addPhysicsObject({
            position: { x: this.player.x, y: this.player.y },
            velocity: this.player.velocity,
            width: this.player.width,
            height: this.player.height,
            isStatic: false,
            mass: 1,
            restitution: 0.1,
            drag: 0.1
        });

        // Add static platforms
        this.platforms.forEach(platform => {
            game.physicsSystem.addPhysicsObject({
                position: { x: platform.x, y: platform.y },
                width: platform.width,
                height: platform.height,
                isStatic: true
            });
        });

        // Setup input mappings
        game.inputManager.mapAction('moveRight', [
            { type: 'key', code: 'ArrowRight' },
            { type: 'key', code: 'KeyD' }
        ]);
        game.inputManager.mapAction('moveLeft', [
            { type: 'key', code: 'ArrowLeft' },
            { type: 'key', code: 'KeyA' }
        ]);
        game.inputManager.mapAction('jump', [
            { type: 'key', code: 'Space' },
            { type: 'key', code: 'ArrowUp' },
            { type: 'key', code: 'KeyW' }
        ]);

        // Create UI elements
        game.uiSystem.createText('score', 'Score: 0', {
            x: 20,
            y: 20,
            styles: {
                fontSize: '24px',
                fontWeight: 'bold'
            }
        });
    },

    update(deltaTime) {
        // Handle player movement
        if (game.inputManager.isActionActive('moveRight')) {
            this.player.velocity.x = config.player.speed;
        } else if (game.inputManager.isActionActive('moveLeft')) {
            this.player.velocity.x = -config.player.speed;
        } else {
            this.player.velocity.x *= 0.8; // Apply friction
        }

        // Handle jumping
        if (game.inputManager.isActionActive('jump') && !this.player.isJumping) {
            this.player.velocity.y = -config.player.jumpForce;
            this.player.isJumping = true;
            game.soundSystem.playSound('jump');
        }

        // Apply gravity
        this.player.velocity.y += 980 * deltaTime; // 9.8 m/s²

        // Update position
        this.player.x += this.player.velocity.x * deltaTime;
        this.player.y += this.player.velocity.y * deltaTime;

        // Check platform collisions
        this.platforms.forEach(platform => {
            if (this.checkCollision(this.player, platform)) {
                if (this.player.velocity.y > 0) {
                    this.player.y = platform.y - this.player.height;
                    this.player.velocity.y = 0;
                    this.player.isJumping = false;
                } else if (this.player.velocity.y < 0) {
                    this.player.y = platform.y + platform.height;
                    this.player.velocity.y = 0;
                }
            }
        });

        // Check collectible collisions
        this.collectibles = this.collectibles.filter(collectible => {
            if (this.checkCollision(this.player, collectible)) {
                this.player.score += 10;
                game.uiSystem.createText('score', `Score: ${this.player.score}`, {
                    x: 20,
                    y: 20,
                    styles: {
                        fontSize: '24px',
                        fontWeight: 'bold'
                    }
                });
                game.soundSystem.playSound('collect');
                return false;
            }
            return true;
        });

        // Keep player in bounds
        this.player.x = Math.max(0, Math.min(game.canvas.width - this.player.width, this.player.x));
        if (this.player.y > game.canvas.height) {
            this.player.y = 0;
            this.player.velocity.y = 0;
        }
    },

    render(ctx) {
        // Clear canvas
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Draw platforms
        this.platforms.forEach(platform => {
            ctx.fillStyle = platform.color;
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        });

        // Draw collectibles
        this.collectibles.forEach(collectible => {
            ctx.fillStyle = collectible.color;
            ctx.fillRect(collectible.x, collectible.y, collectible.width, collectible.height);
        });

        // Draw player
        ctx.fillStyle = config.player.color;
        ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    },

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    },

    onExit() {
        // Cleanup
        game.uiSystem.clearUI();
    }
};

// Initialize game when window loads
window.addEventListener('load', async () => {
    // Initialize the game engine
    game.init();

    // Load game assets
    await game.soundSystem.loadSound('jump', 'sounds/jump.mp3');
    await game.soundSystem.loadSound('collect', 'sounds/collect.mp3');

    // Add and load the game scene
    game.sceneManager.addScene('game', gameScene);
    game.sceneManager.loadScene('game');
});
