import { Engine } from '../../js/core/Engine.js';

// Criar instância do jogo
const game = new Engine();

// Configurações do jogo
const config = {
    player: {
        width: 32,
        height: 48,
        speed: 300,
        jumpForce: 600,
        color: '#ff0000' // Cor do Mario
    },
    // Configuração dos blocos/plataformas
    blocks: [
        // Chão
        { x: 0, y: 550, width: 800, height: 50, type: 'ground', color: '#8b4513' },
        // Plataformas
        { x: 300, y: 400, width: 100, height: 30, type: 'platform', color: '#8b4513' },
        { x: 500, y: 300, width: 100, height: 30, type: 'platform', color: '#8b4513' }
    ],
    // Configuração dos inimigos
    enemies: [
        { x: 400, y: 500, width: 32, height: 32, speed: 100, direction: 1, color: '#663399' }
    ],
    // Configuração das moedas
    coins: [
        { x: 320, y: 350, width: 20, height: 20, color: '#ffd700' },
        { x: 520, y: 250, width: 20, height: 20, color: '#ffd700' }
    ]
};

// Criar cena do jogo
const gameScene = {
    player: {
        x: 50,
        y: 300,
        width: config.player.width,
        height: config.player.height,
        velocity: { x: 0, y: 0 },
        isJumping: false,
        score: 0,
        lives: 3
    },

    blocks: [...config.blocks],
    enemies: [...config.enemies],
    coins: [...config.coins],

    onEnter() {
        // Inicializar física do jogador
        game.physicsSystem.addPhysicsObject({
            position: { x: this.player.x, y: this.player.y },
            velocity: this.player.velocity,
            width: this.player.width,
            height: this.player.height,
            isStatic: false,
            mass: 1,
            restitution: 0.1,
            friction: 0.1
        });

        // Adicionar blocos estáticos
        this.blocks.forEach(block => {
            game.physicsSystem.addPhysicsObject({
                position: { x: block.x, y: block.y },
                width: block.width,
                height: block.height,
                isStatic: true,
                type: block.type
            });
        });

        // Configurar controles
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
            { type: 'key', code: 'ArrowUp' }
        ]);

        // Criar UI
        this.updateUI();
    },

    updateUI() {
        // Atualizar placar e vidas
        game.uiSystem.createText('score', `Pontos: ${this.player.score}`, {
            x: 20,
            y: 20,
            styles: {
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#ffffff'
            }
        });

        game.uiSystem.createText('lives', `Vidas: ${this.player.lives}`, {
            x: 20,
            y: 50,
            styles: {
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#ffffff'
            }
        });
    },

    update(deltaTime) {
        // Movimento do jogador
        if (game.inputManager.isActionActive('moveRight')) {
            this.player.velocity.x = config.player.speed;
        } else if (game.inputManager.isActionActive('moveLeft')) {
            this.player.velocity.x = -config.player.speed;
        } else {
            this.player.velocity.x *= 0.8; // Atrito
        }

        // Pulo
        if (game.inputManager.isActionActive('jump') && !this.player.isJumping) {
            this.player.velocity.y = -config.player.jumpForce;
            this.player.isJumping = true;
            game.soundSystem.playSound('jump');
        }

        // Aplicar gravidade
        this.player.velocity.y += 980 * deltaTime;

        // Atualizar posição
        this.player.x += this.player.velocity.x * deltaTime;
        this.player.y += this.player.velocity.y * deltaTime;

        // Verificar colisões com blocos
        this.blocks.forEach(block => {
            if (this.checkCollision(this.player, block)) {
                if (this.player.velocity.y > 0) {
                    this.player.y = block.y - this.player.height;
                    this.player.velocity.y = 0;
                    this.player.isJumping = false;
                } else if (this.player.velocity.y < 0) {
                    this.player.y = block.y + block.height;
                    this.player.velocity.y = 0;
                }
            }
        });

        // Atualizar inimigos
        this.enemies.forEach(enemy => {
            // Movimento simples de vai e vem
            enemy.x += enemy.speed * enemy.direction * deltaTime;

            // Inverter direção nas bordas da tela
            if (enemy.x <= 0 || enemy.x + enemy.width >= game.canvas.width) {
                enemy.direction *= -1;
            }

            // Verificar colisão com o jogador
            if (this.checkCollision(this.player, enemy)) {
                if (this.player.velocity.y > 0) {
                    // Jogador pulou em cima do inimigo
                    this.enemies = this.enemies.filter(e => e !== enemy);
                    this.player.velocity.y = -400; // Pequeno pulo após derrotar inimigo
                    this.player.score += 100;
                    this.updateUI();
                } else {
                    // Jogador foi atingido pelo inimigo
                    this.player.lives--;
                    this.updateUI();
                    if (this.player.lives <= 0) {
                        // Game Over
                        alert('Game Over!');
                        game.sceneManager.loadScene('game'); // Reiniciar jogo
                    } else {
                        // Resetar posição do jogador
                        this.player.x = 50;
                        this.player.y = 300;
                        this.player.velocity.x = 0;
                        this.player.velocity.y = 0;
                    }
                }
            }
        });

        // Verificar coleta de moedas
        this.coins = this.coins.filter(coin => {
            if (this.checkCollision(this.player, coin)) {
                this.player.score += 10;
                this.updateUI();
                game.soundSystem.playSound('coin');
                return false;
            }
            return true;
        });

        // Manter jogador dentro dos limites da tela
        this.player.x = Math.max(0, Math.min(game.canvas.width - this.player.width, this.player.x));
        if (this.player.y > game.canvas.height) {
            this.player.lives--;
            this.updateUI();
            if (this.player.lives <= 0) {
                alert('Game Over!');
                game.sceneManager.loadScene('game');
            } else {
                this.player.x = 50;
                this.player.y = 300;
                this.player.velocity.x = 0;
                this.player.velocity.y = 0;
            }
        }
    },

    render(ctx) {
        // Limpar tela
        ctx.fillStyle = '#87CEEB'; // Cor do céu
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Desenhar blocos
        this.blocks.forEach(block => {
            ctx.fillStyle = block.color;
            ctx.fillRect(block.x, block.y, block.width, block.height);
        });

        // Desenhar moedas
        this.coins.forEach(coin => {
            ctx.fillStyle = coin.color;
            ctx.beginPath();
            ctx.arc(
                coin.x + coin.width/2,
                coin.y + coin.height/2,
                coin.width/2,
                0,
                Math.PI * 2
            );
            ctx.fill();
        });

        // Desenhar inimigos
        this.enemies.forEach(enemy => {
            ctx.fillStyle = enemy.color;
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        });

        // Desenhar jogador
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
        game.uiSystem.clearUI();
    }
};

// Inicializar jogo quando a janela carregar
window.addEventListener('load', async () => {
    // Inicializar engine
    game.init();

    // Carregar sons
    await game.soundSystem.loadSound('jump', 'sounds/jump.mp3');
    await game.soundSystem.loadSound('coin', 'sounds/coin.mp3');

    // Adicionar e carregar a cena do jogo
    game.sceneManager.addScene('game', gameScene);
    game.sceneManager.loadScene('game');
});
