export class AssetManager {
    constructor() {
        // Asset collections
        this.images = new Map();
        this.sprites = new Map();
        this.sounds = new Map();
        this.fonts = new Map();
        this.json = new Map();
        
        // Loading state
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.isLoading = false;
        
        // Callbacks
        this.onProgress = null;
        this.onComplete = null;
        this.onError = null;
    }

    init() {
        // Initialize any required setup
    }

    async loadImage(name, url) {
        try {
            const image = new Image();
            const loadPromise = new Promise((resolve, reject) => {
                image.onload = () => resolve(image);
                image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
            });
            
            image.src = url;
            const loadedImage = await loadPromise;
            this.images.set(name, loadedImage);
            return loadedImage;
        } catch (error) {
            console.error(`Error loading image ${name}:`, error);
            if (this.onError) this.onError(error);
            return null;
        }
    }

    async loadSprite(name, url, frameWidth, frameHeight, frameCount) {
        try {
            const image = await this.loadImage(`${name}_sprite`, url);
            if (!image) return null;

            const sprite = {
                image,
                frameWidth,
                frameHeight,
                frameCount,
                currentFrame: 0,
                frames: []
            };

            // Create individual frame data
            for (let i = 0; i < frameCount; i++) {
                sprite.frames.push({
                    x: (i * frameWidth) % image.width,
                    y: Math.floor((i * frameWidth) / image.width) * frameHeight,
                    width: frameWidth,
                    height: frameHeight
                });
            }

            this.sprites.set(name, sprite);
            return sprite;
        } catch (error) {
            console.error(`Error loading sprite ${name}:`, error);
            if (this.onError) this.onError(error);
            return null;
        }
    }

    async loadSpriteSheet(name, url, data) {
        try {
            const image = await this.loadImage(`${name}_spritesheet`, url);
            if (!image) return null;

            const spriteSheet = {
                image,
                animations: new Map()
            };

            // Process animation data
            for (const [animName, animData] of Object.entries(data.animations)) {
                spriteSheet.animations.set(animName, {
                    frames: animData.frames,
                    frameTime: animData.frameTime || 100,
                    loop: animData.loop !== undefined ? animData.loop : true
                });
            }

            this.sprites.set(name, spriteSheet);
            return spriteSheet;
        } catch (error) {
            console.error(`Error loading spritesheet ${name}:`, error);
            if (this.onError) this.onError(error);
            return null;
        }
    }

    async loadFont(name, url) {
        try {
            const fontFace = new FontFace(name, `url(${url})`);
            const loadedFont = await fontFace.load();
            document.fonts.add(loadedFont);
            this.fonts.set(name, loadedFont);
            return loadedFont;
        } catch (error) {
            console.error(`Error loading font ${name}:`, error);
            if (this.onError) this.onError(error);
            return null;
        }
    }

    async loadJSON(name, url) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            this.json.set(name, data);
            return data;
        } catch (error) {
            console.error(`Error loading JSON ${name}:`, error);
            if (this.onError) this.onError(error);
            return null;
        }
    }

    async loadAssets(assets) {
        this.isLoading = true;
        this.totalAssets = assets.length;
        this.loadedAssets = 0;

        const loadPromises = assets.map(async (asset) => {
            try {
                let result;
                switch (asset.type) {
                    case 'image':
                        result = await this.loadImage(asset.name, asset.url);
                        break;
                    case 'sprite':
                        result = await this.loadSprite(
                            asset.name, 
                            asset.url, 
                            asset.frameWidth, 
                            asset.frameHeight, 
                            asset.frameCount
                        );
                        break;
                    case 'spritesheet':
                        result = await this.loadSpriteSheet(asset.name, asset.url, asset.data);
                        break;
                    case 'font':
                        result = await this.loadFont(asset.name, asset.url);
                        break;
                    case 'json':
                        result = await this.loadJSON(asset.name, asset.url);
                        break;
                    default:
                        console.warn(`Unknown asset type: ${asset.type}`);
                        return;
                }

                this.loadedAssets++;
                if (this.onProgress) {
                    this.onProgress(this.loadedAssets / this.totalAssets);
                }

                return result;
            } catch (error) {
                console.error(`Error loading asset ${asset.name}:`, error);
                if (this.onError) this.onError(error);
            }
        });

        try {
            await Promise.all(loadPromises);
        } finally {
            this.isLoading = false;
            if (this.onComplete) this.onComplete();
        }
    }

    getImage(name) {
        return this.images.get(name);
    }

    getSprite(name) {
        return this.sprites.get(name);
    }

    getJSON(name) {
        return this.json.get(name);
    }

    getFont(name) {
        return this.fonts.get(name);
    }

    unloadAsset(type, name) {
        switch (type) {
            case 'image':
                this.images.delete(name);
                break;
            case 'sprite':
                this.sprites.delete(name);
                break;
            case 'font':
                this.fonts.delete(name);
                break;
            case 'json':
                this.json.delete(name);
                break;
        }
    }

    clear() {
        this.images.clear();
        this.sprites.clear();
        this.fonts.clear();
        this.json.clear();
        this.totalAssets = 0;
        this.loadedAssets = 0;
    }

    setCallbacks(callbacks) {
        if (callbacks.onProgress) this.onProgress = callbacks.onProgress;
        if (callbacks.onComplete) this.onComplete = callbacks.onComplete;
        if (callbacks.onError) this.onError = callbacks.onError;
    }
}
