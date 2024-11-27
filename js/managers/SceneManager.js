export class SceneManager {
    constructor() {
        this.scenes = new Map();
        this.currentScene = null;
        this.nextScene = null;
        this.isTransitioning = false;
        this.transitionDuration = 0;
        this.transitionTimer = 0;
    }

    addScene(name, scene) {
        this.scenes.set(name, scene);
    }

    loadScene(name) {
        if (!this.scenes.has(name)) {
            console.error(`Scene '${name}' not found`);
            return;
        }

        const newScene = this.scenes.get(name);
        
        if (this.currentScene) {
            this.currentScene.onExit();
        }

        this.currentScene = newScene;
        this.currentScene.onEnter();
    }

    transitionTo(name, duration = 1.0) {
        if (!this.scenes.has(name)) {
            console.error(`Scene '${name}' not found`);
            return;
        }

        this.nextScene = this.scenes.get(name);
        this.isTransitioning = true;
        this.transitionDuration = duration;
        this.transitionTimer = 0;
    }

    update(deltaTime) {
        if (this.isTransitioning) {
            this.transitionTimer += deltaTime;
            
            if (this.transitionTimer >= this.transitionDuration) {
                this.completeTransition();
            }
        }

        if (this.currentScene) {
            this.currentScene.update(deltaTime);
        }
    }

    render(ctx) {
        if (this.currentScene) {
            this.currentScene.render(ctx);

            if (this.isTransitioning && this.nextScene) {
                const alpha = this.transitionTimer / this.transitionDuration;
                ctx.globalAlpha = alpha;
                this.nextScene.render(ctx);
                ctx.globalAlpha = 1;
            }
        }
    }

    completeTransition() {
        if (this.currentScene) {
            this.currentScene.onExit();
        }

        this.currentScene = this.nextScene;
        this.currentScene.onEnter();
        
        this.nextScene = null;
        this.isTransitioning = false;
        this.transitionTimer = 0;
    }

    getCurrentScene() {
        return this.currentScene;
    }
}
