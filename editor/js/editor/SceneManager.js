import * as PIXI from 'pixi.js';

export class SceneManager {
    constructor() {
        this.app = null;
        this.currentScene = null;
        this.objects = new Map();
        this.selectedObject = null;
        this.gridSize = 32;
        this.showGrid = true;
        this.initializePixiApp();
        this.setupGrid();
    }

    initializePixiApp() {
        // Configurar aplicação PIXI.js
        this.app = new PIXI.Application({
            width: 800,
            height: 600,
            backgroundColor: 0x1a1a2e,
            antialias: true,
            resolution: window.devicePixelRatio || 1
        });

        // Adicionar canvas ao elemento da cena
        const sceneEditor = document.querySelector('.scene-editor');
        if (sceneEditor) {
            sceneEditor.appendChild(this.app.view);
        }

        // Configurar interatividade
        this.app.stage.interactive = true;
        this.app.stage.sortableChildren = true;

        // Adicionar handlers de eventos
        this.setupEventHandlers();
    }

    setupGrid() {
        this.gridContainer = new PIXI.Container();
        this.app.stage.addChild(this.gridContainer);
        this.drawGrid();
    }

    drawGrid() {
        this.gridContainer.removeChildren();

        if (!this.showGrid) return;

        const graphics = new PIXI.Graphics();
        graphics.lineStyle(1, 0x333333, 0.5);

        // Desenhar linhas verticais
        for (let x = 0; x <= this.app.screen.width; x += this.gridSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, this.app.screen.height);
        }

        // Desenhar linhas horizontais
        for (let y = 0; y <= this.app.screen.height; y += this.gridSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(this.app.screen.width, y);
        }

        this.gridContainer.addChild(graphics);
        this.gridContainer.zIndex = -1;
    }

    setupEventHandlers() {
        this.app.stage.on('pointerdown', this.onStageClick.bind(this));
        this.app.stage.on('pointermove', this.onStageMove.bind(this));
        this.app.stage.on('pointerup', this.onStageUp.bind(this));
    }

    onStageClick(event) {
        const position = event.data.getLocalPosition(this.app.stage);
        
        // Verificar se clicou em algum objeto
        const clickedObject = this.findObjectAtPosition(position);
        
        if (clickedObject) {
            this.selectObject(clickedObject);
        } else {
            this.deselectObject();
        }
    }

    onStageMove(event) {
        if (this.selectedObject && this.selectedObject.dragging) {
            const newPosition = event.data.getLocalPosition(this.app.stage);
            
            // Ajustar à grade se necessário
            if (this.showGrid) {
                newPosition.x = Math.round(newPosition.x / this.gridSize) * this.gridSize;
                newPosition.y = Math.round(newPosition.y / this.gridSize) * this.gridSize;
            }

            this.selectedObject.sprite.x = newPosition.x;
            this.selectedObject.sprite.y = newPosition.y;
            
            // Atualizar propriedades do objeto
            this.selectedObject.x = newPosition.x;
            this.selectedObject.y = newPosition.y;
            
            // Emitir evento de atualização
            this.emitObjectUpdate(this.selectedObject);
        }
    }

    onStageUp() {
        if (this.selectedObject) {
            this.selectedObject.dragging = false;
        }
    }

    findObjectAtPosition(position) {
        let result = null;
        let minDistance = Infinity;

        this.objects.forEach(object => {
            const bounds = object.sprite.getBounds();
            if (bounds.contains(position.x, position.y)) {
                const distance = Math.pow(position.x - object.sprite.x, 2) + 
                               Math.pow(position.y - object.sprite.y, 2);
                if (distance < minDistance) {
                    minDistance = distance;
                    result = object;
                }
            }
        });

        return result;
    }

    selectObject(object) {
        // Deselecionar objeto anterior
        this.deselectObject();

        // Selecionar novo objeto
        this.selectedObject = object;
        this.selectedObject.dragging = true;
        
        // Adicionar highlight visual
        const bounds = object.sprite.getBounds();
        const highlight = new PIXI.Graphics();
        highlight.lineStyle(2, 0xFFFFFF);
        highlight.drawRect(bounds.x, bounds.y, bounds.width, bounds.height);
        this.selectedObject.highlight = highlight;
        this.app.stage.addChild(highlight);

        // Emitir evento de seleção
        this.emitObjectSelection(object);
    }

    deselectObject() {
        if (this.selectedObject) {
            // Remover highlight visual
            if (this.selectedObject.highlight) {
                this.app.stage.removeChild(this.selectedObject.highlight);
                this.selectedObject.highlight = null;
            }
            
            this.selectedObject.dragging = false;
            this.selectedObject = null;

            // Emitir evento de deseleção
            this.emitObjectSelection(null);
        }
    }

    createObject(type, x, y, properties = {}) {
        // Criar sprite baseado no tipo
        const sprite = this.createSprite(type);
        sprite.x = x;
        sprite.y = y;

        // Configurar interatividade
        sprite.interactive = true;
        sprite.buttonMode = true;

        // Criar objeto com todas as propriedades
        const object = {
            id: this.generateId(),
            type,
            sprite,
            x,
            y,
            properties: { ...this.getDefaultProperties(type), ...properties }
        };

        // Adicionar à cena e ao mapa de objetos
        this.app.stage.addChild(sprite);
        this.objects.set(object.id, object);

        return object;
    }

    createSprite(type) {
        // Criar gráfico temporário baseado no tipo
        const graphics = new PIXI.Graphics();
        
        switch (type) {
            case 'player':
                graphics.beginFill(0x4a90e2);
                graphics.drawRect(0, 0, 32, 32);
                break;
            case 'platform':
                graphics.beginFill(0x2ecc71);
                graphics.drawRect(0, 0, 64, 16);
                break;
            case 'enemy':
                graphics.beginFill(0xe74c3c);
                graphics.drawCircle(16, 16, 16);
                break;
            case 'coin':
                graphics.beginFill(0xf1c40f);
                graphics.drawCircle(8, 8, 8);
                break;
            default:
                graphics.beginFill(0xFFFFFF);
                graphics.drawRect(0, 0, 32, 32);
        }
        
        graphics.endFill();

        return new PIXI.Sprite(this.app.renderer.generateTexture(graphics));
    }

    getDefaultProperties(type) {
        const defaults = {
            player: {
                speed: 200,
                jumpForce: 400,
                lives: 3
            },
            platform: {
                solid: true,
                movable: false
            },
            enemy: {
                speed: 100,
                damage: 1,
                patrol: true
            },
            coin: {
                value: 10,
                collectible: true
            }
        };

        return defaults[type] || {};
    }

    generateId() {
        return 'obj_' + Math.random().toString(36).substr(2, 9);
    }

    removeObject(id) {
        const object = this.objects.get(id);
        if (object) {
            // Remover sprite da cena
            this.app.stage.removeChild(object.sprite);
            
            // Remover do mapa de objetos
            this.objects.delete(id);

            // Se o objeto removido era o selecionado, limpar seleção
            if (this.selectedObject && this.selectedObject.id === id) {
                this.deselectObject();
            }
        }
    }

    clearScene() {
        // Remover todos os objetos
        this.objects.forEach((object, id) => {
            this.removeObject(id);
        });

        // Limpar seleção
        this.deselectObject();
    }

    toggleGrid() {
        this.showGrid = !this.showGrid;
        this.drawGrid();
    }

    setGridSize(size) {
        this.gridSize = size;
        this.drawGrid();
    }

    // Métodos de serialização
    saveScene() {
        const sceneData = {
            objects: Array.from(this.objects.values()).map(obj => ({
                id: obj.id,
                type: obj.type,
                x: obj.x,
                y: obj.y,
                properties: obj.properties
            }))
        };

        return JSON.stringify(sceneData);
    }

    loadScene(sceneData) {
        try {
            const data = typeof sceneData === 'string' ? JSON.parse(sceneData) : sceneData;
            
            // Limpar cena atual
            this.clearScene();

            // Recriar objetos
            data.objects.forEach(obj => {
                this.createObject(obj.type, obj.x, obj.y, obj.properties);
            });
        } catch (error) {
            console.error('Erro ao carregar cena:', error);
            throw error;
        }
    }

    // Eventos
    emitObjectSelection(object) {
        const event = new CustomEvent('objectselection', {
            detail: { object }
        });
        window.dispatchEvent(event);
    }

    emitObjectUpdate(object) {
        const event = new CustomEvent('objectupdate', {
            detail: { object }
        });
        window.dispatchEvent(event);
    }

    // Redimensionamento
    resize(width, height) {
        this.app.renderer.resize(width, height);
        this.drawGrid();
    }
}

// Exportar uma instância única do SceneManager
export const sceneManager = new SceneManager();
