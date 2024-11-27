export class InputManager {
    constructor() {
        // Keyboard state
        this.keys = new Map();
        this.previousKeys = new Map();
        
        // Mouse state
        this.mousePosition = { x: 0, y: 0 };
        this.mouseButtons = new Map();
        this.previousMouseButtons = new Map();
        
        // Touch state
        this.touches = new Map();
        this.previousTouches = new Map();
        
        // Gesture state
        this.gestureData = {
            startPosition: { x: 0, y: 0 },
            currentPosition: { x: 0, y: 0 },
            distance: 0,
            direction: { x: 0, y: 0 }
        };
        
        // Input mappings
        this.actionMappings = new Map();
    }

    init() {
        // Keyboard events
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Mouse events
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        
        // Touch events
        window.addEventListener('touchstart', (e) => this.onTouchStart(e));
        window.addEventListener('touchmove', (e) => this.onTouchMove(e));
        window.addEventListener('touchend', (e) => this.onTouchEnd(e));
        
        // Prevent context menu on right click
        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    update() {
        // Update previous states
        this.previousKeys = new Map(this.keys);
        this.previousMouseButtons = new Map(this.mouseButtons);
        this.previousTouches = new Map(this.touches);
    }

    // Keyboard methods
    onKeyDown(event) {
        this.keys.set(event.code, true);
    }

    onKeyUp(event) {
        this.keys.set(event.code, false);
    }

    isKeyPressed(keyCode) {
        return this.keys.get(keyCode) && !this.previousKeys.get(keyCode);
    }

    isKeyDown(keyCode) {
        return this.keys.get(keyCode);
    }

    isKeyReleased(keyCode) {
        return !this.keys.get(keyCode) && this.previousKeys.get(keyCode);
    }

    // Mouse methods
    onMouseMove(event) {
        const rect = event.target.getBoundingClientRect();
        this.mousePosition.x = event.clientX - rect.left;
        this.mousePosition.y = event.clientY - rect.top;
    }

    onMouseDown(event) {
        this.mouseButtons.set(event.button, true);
    }

    onMouseUp(event) {
        this.mouseButtons.set(event.button, false);
    }

    isMouseButtonPressed(button) {
        return this.mouseButtons.get(button) && !this.previousMouseButtons.get(button);
    }

    isMouseButtonDown(button) {
        return this.mouseButtons.get(button);
    }

    isMouseButtonReleased(button) {
        return !this.mouseButtons.get(button) && this.previousMouseButtons.get(button);
    }

    getMousePosition() {
        return { ...this.mousePosition };
    }

    // Touch methods
    onTouchStart(event) {
        event.preventDefault();
        Array.from(event.touches).forEach(touch => {
            this.touches.set(touch.identifier, {
                x: touch.clientX,
                y: touch.clientY
            });
        });

        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.gestureData.startPosition = {
                x: touch.clientX,
                y: touch.clientY
            };
            this.gestureData.currentPosition = { ...this.gestureData.startPosition };
        }
    }

    onTouchMove(event) {
        event.preventDefault();
        Array.from(event.touches).forEach(touch => {
            this.touches.set(touch.identifier, {
                x: touch.clientX,
                y: touch.clientY
            });
        });

        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.gestureData.currentPosition = {
                x: touch.clientX,
                y: touch.clientY
            };
            this.updateGestureData();
        }
    }

    onTouchEnd(event) {
        event.preventDefault();
        Array.from(event.changedTouches).forEach(touch => {
            this.touches.delete(touch.identifier);
        });

        if (this.touches.size === 0) {
            this.resetGestureData();
        }
    }

    updateGestureData() {
        const dx = this.gestureData.currentPosition.x - this.gestureData.startPosition.x;
        const dy = this.gestureData.currentPosition.y - this.gestureData.startPosition.y;
        
        this.gestureData.distance = Math.sqrt(dx * dx + dy * dy);
        
        if (this.gestureData.distance > 0) {
            this.gestureData.direction = {
                x: dx / this.gestureData.distance,
                y: dy / this.gestureData.distance
            };
        }
    }

    resetGestureData() {
        this.gestureData = {
            startPosition: { x: 0, y: 0 },
            currentPosition: { x: 0, y: 0 },
            distance: 0,
            direction: { x: 0, y: 0 }
        };
    }

    // Action mapping methods
    mapAction(actionName, inputs) {
        this.actionMappings.set(actionName, inputs);
    }

    isActionActive(actionName) {
        const inputs = this.actionMappings.get(actionName);
        if (!inputs) return false;

        return inputs.some(input => {
            if (input.type === 'key') {
                return this.isKeyDown(input.code);
            } else if (input.type === 'mouseButton') {
                return this.isMouseButtonDown(input.button);
            }
            return false;
        });
    }

    clearAllInputs() {
        this.keys.clear();
        this.previousKeys.clear();
        this.mouseButtons.clear();
        this.previousMouseButtons.clear();
        this.touches.clear();
        this.previousTouches.clear();
        this.resetGestureData();
    }
}
