export class Time {
    constructor() {
        this.deltaTime = 0;
        this.lastTime = 0;
        this.fixedTimeStep = 1/60; // 60 FPS
        this.timeScale = 1;
        this.frameCount = 0;
        this.elapsedTime = 0;
    }

    update(timestamp) {
        if (!this.lastTime) {
            this.lastTime = timestamp;
        }

        // Calculate delta time in seconds
        this.deltaTime = (timestamp - this.lastTime) / 1000;
        
        // Apply time scale
        this.deltaTime *= this.timeScale;

        // Clamp delta time to prevent huge jumps
        this.deltaTime = Math.min(this.deltaTime, 0.1);

        this.lastTime = timestamp;
        this.elapsedTime += this.deltaTime;
        this.frameCount++;
    }

    getElapsedTime() {
        return this.elapsedTime;
    }

    getFPS() {
        return Math.round(1 / this.deltaTime);
    }

    setTimeScale(scale) {
        this.timeScale = Math.max(0, scale);
    }

    getTimeScale() {
        return this.timeScale;
    }
}
