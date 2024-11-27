# Game Engine 2D

Uma engine de jogos 2D completa e modular para desenvolvimento de jogos no navegador, inspirada no Construct 2.

## Características Principais

- Renderização via Canvas 2D/WebGL
- Sistema de física e colisões
- Gerenciamento de cenas
- Sistema de entrada (teclado, mouse e touch)
- Sistema de áudio avançado
- Sistema de UI flexível
- Gerenciamento de recursos
- Suporte para sprites e animações
- Sistema de componentes modular

## Requisitos

- Navegador moderno com suporte a:
  - HTML5 Canvas
  - Web Audio API
  - ES6 Modules
  - Promises/Async-Await

## Estrutura do Projeto

```
game-engine/
├── css/
│   └── style.css
├── js/
│   ├── core/
│   │   └── Engine.js
│   ├── managers/
│   │   ├── AssetManager.js
│   │   ├── InputManager.js
│   │   └── SceneManager.js
│   ├── systems/
│   │   ├── PhysicsSystem.js
│   │   ├── SoundSystem.js
│   │   └── UISystem.js
│   ├── utils/
│   │   └── Time.js
│   └── main.js
└── index.html
```

## Como Usar

1. Clone o repositório
2. Abra o arquivo index.html em um servidor web local
3. O exemplo básico mostrará um quadrado azul que pode ser movido com as setas do teclado ou WASD

### Exemplo Básico

```javascript
import { Engine } from './core/Engine.js';

// Criar instância do jogo
const game = new Engine();

// Inicializar
game.init();

// Criar uma cena
const mainScene = {
    onEnter() {
        // Configuração inicial da cena
    },
    
    update(deltaTime) {
        // Atualizar lógica do jogo
    },
    
    render(ctx) {
        // Renderizar elementos do jogo
    },
    
    onExit() {
        // Limpeza ao sair da cena
    }
};

// Adicionar e carregar a cena
game.sceneManager.addScene('main', mainScene);
game.sceneManager.loadScene('main');
```

## Sistemas Principais

### SceneManager
Gerencia diferentes cenas do jogo (menus, níveis, etc.)

```javascript
game.sceneManager.addScene('level1', level1Scene);
game.sceneManager.loadScene('level1');
```

### InputManager
Gerencia entradas do usuário (teclado, mouse, touch)

```javascript
game.inputManager.mapAction('jump', [
    { type: 'key', code: 'Space' },
    { type: 'mouseButton', button: 0 }
]);

if (game.inputManager.isActionActive('jump')) {
    player.jump();
}
```

### PhysicsSystem
Sistema de física e colisões

```javascript
game.physicsSystem.addPhysicsObject(player);
game.physicsSystem.setGravity(0, 9.81);
```

### SoundSystem
Sistema de áudio para efeitos sonoros e música

```javascript
await game.soundSystem.loadSound('jump', 'sounds/jump.mp3');
game.soundSystem.playSound('jump');
```

### UISystem
Sistema de interface do usuário

```javascript
game.uiSystem.createButton('startButton', 'Start Game', {
    x: 100,
    y: 100,
    onClick: () => startGame()
});
```

### AssetManager
Gerenciamento de recursos (imagens, sons, etc.)

```javascript
await game.assetManager.loadAssets([
    { type: 'image', name: 'player', url: 'images/player.png' },
    { type: 'sound', name: 'bgm', url: 'sounds/background.mp3' }
]);
```

## Recursos Avançados

### Sistema de Componentes
A engine utiliza um sistema de componentes para adicionar funcionalidades aos objetos do jogo:

```javascript
const player = {
    components: {
        physics: {
            velocity: { x: 0, y: 0 },
            acceleration: { x: 0, y: 0 }
        },
        sprite: {
            image: 'player',
            width: 32,
            height: 32
        }
    }
};
```

### Animações
Suporte para animações de sprites:

```javascript
await game.assetManager.loadSprite('player', 'player.png', {
    frameWidth: 32,
    frameHeight: 32,
    animations: {
        walk: {
            frames: [0, 1, 2, 3],
            frameTime: 100
        }
    }
});
```

### Colisões
Sistema de colisões com QuadTree para otimização:

```javascript
if (game.physicsSystem.checkCollision(player, enemy)) {
    handleCollision(player, enemy);
}
```

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
