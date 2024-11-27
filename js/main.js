import { Engine } from './core/Engine.js';

// Create game instance
const game = new Engine();

// Initialize game
window.addEventListener('load', () => {
    // Initialize the game engine
    game.init();

    // Create a simple game scene
    const mainScene = {
        player: {
            x: 100,
            y: 100,
            width: 50,
            height: 50,
            speed: 200,
            color: '#4a90e2'
        },

        onEnter() {
            console.log('Main scene entered');
            
            // Create UI elements
            game.uiSystem.createText('score', 'Score: 0', {
                x: 20,
                y: 20,
                styles: {
                    fontSize: '24px',
                    fontWeight: 'bold'
                }
            });

            // Map keyboard controls
            game.inputManager.mapAction('moveRight', [
                { type: 'key', code: 'ArrowRight' },
                { type: 'key', code: 'KeyD' }
            ]);
            game.inputManager.mapAction('moveLeft', [
                { type: 'key', code: 'ArrowLeft' },
                { type: 'key', code: 'KeyA' }
            ]);
            game.inputManager.mapAction('moveUp', [
                { type: 'key', code: 'ArrowUp' },
                { type: 'key', code: 'KeyW' }
            ]);
            game.inputManager.mapAction('moveDown', [
                { type: 'key', code: 'ArrowDown' },
                { type: 'key', code: 'KeyS' }
            ]);
        },

        update(deltaTime) {
            // Handle player movement
            if (game.inputManager.isActionActive('moveRight')) {
                this.player.x += this.player.speed * deltaTime;
            }
            if (game.inputManager.isActionActive('moveLeft')) {
                this.player.x -= this.player.speed * deltaTime;
            }
            if (game.inputManager.isActionActive('moveUp')) {
                this.player.y -= this.player.speed * deltaTime;
            }
            if (game.inputManager.isActionActive('moveDown')) {
                this.player.y += this.player.speed * deltaTime;
            }

            // Keep player within canvas bounds
            const canvas = game.canvas;
            this.player.x = Math.max(0, Math.min(canvas.width - this.player.width, this.player.x));
            this.player.y = Math.max(0, Math.min(canvas.height - this.player.height, this.player.y));
        },

        render(ctx) {
            // Clear canvas
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            // Draw player
            ctx.fillStyle = this.player.color;
            ctx.fillRect(
                this.player.x,
                this.player.y,
                this.player.width,
                this.player.height
            );
        },

        onExit() {
            console.log('Main scene exited');
        }
    };

    // Add scene to the game
    game.sceneManager.addScene('main', mainScene);

    // Load the main scene
    game.sceneManager.loadScene('main');

    // Add a pause button
    game.uiSystem.createButton('pauseButton', 'Pause', {
        x: game.canvas.width - 100,
        y: 20,
        styles: {
            padding: '8px 16px',
            backgroundColor: '#e74c3c',
            cursor: 'pointer'
        },
        onClick: () => {
            if (game.isRunning) {
                game.pause();
            } else {
                game.resume();
            }
        }
    });
});
