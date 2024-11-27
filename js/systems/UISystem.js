export class UISystem {
    constructor() {
        this.uiLayer = document.getElementById('ui-layer');
        this.elements = new Map();
        this.styles = new Map();
        this.animations = new Map();
    }

    init() {
        // Enable pointer events for the UI layer
        this.uiLayer.style.pointerEvents = 'auto';
        
        // Create default styles
        this.createDefaultStyles();
    }

    createDefaultStyles() {
        // Button styles
        this.styles.set('button-default', {
            backgroundColor: '#4a90e2',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'all 0.3s ease'
        });

        // Panel styles
        this.styles.set('panel-default', {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '20px',
            borderRadius: '10px',
            color: 'white'
        });

        // Text styles
        this.styles.set('text-default', {
            color: 'white',
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif'
        });
    }

    createButton(id, text, options = {}) {
        const button = document.createElement('button');
        button.id = id;
        button.textContent = text;
        
        // Apply default button styles
        this.applyStyles(button, this.styles.get('button-default'));
        
        // Apply custom styles
        if (options.styles) {
            this.applyStyles(button, options.styles);
        }
        
        // Position the button
        button.style.position = 'absolute';
        button.style.left = options.x ? `${options.x}px` : '0';
        button.style.top = options.y ? `${options.y}px` : '0';
        
        // Add hover effect
        button.addEventListener('mouseover', () => {
            button.style.transform = 'scale(1.1)';
        });
        
        button.addEventListener('mouseout', () => {
            button.style.transform = 'scale(1)';
        });
        
        // Add click handler
        if (options.onClick) {
            button.addEventListener('click', options.onClick);
        }
        
        this.uiLayer.appendChild(button);
        this.elements.set(id, button);
        
        return button;
    }

    createPanel(id, options = {}) {
        const panel = document.createElement('div');
        panel.id = id;
        
        // Apply default panel styles
        this.applyStyles(panel, this.styles.get('panel-default'));
        
        // Apply custom styles
        if (options.styles) {
            this.applyStyles(panel, options.styles);
        }
        
        // Position the panel
        panel.style.position = 'absolute';
        panel.style.left = options.x ? `${options.x}px` : '0';
        panel.style.top = options.y ? `${options.y}px` : '0';
        panel.style.width = options.width ? `${options.width}px` : 'auto';
        panel.style.height = options.height ? `${options.height}px` : 'auto';
        
        this.uiLayer.appendChild(panel);
        this.elements.set(id, panel);
        
        return panel;
    }

    createText(id, text, options = {}) {
        const textElement = document.createElement('div');
        textElement.id = id;
        textElement.textContent = text;
        
        // Apply default text styles
        this.applyStyles(textElement, this.styles.get('text-default'));
        
        // Apply custom styles
        if (options.styles) {
            this.applyStyles(textElement, options.styles);
        }
        
        // Position the text
        textElement.style.position = 'absolute';
        textElement.style.left = options.x ? `${options.x}px` : '0';
        textElement.style.top = options.y ? `${options.y}px` : '0';
        
        this.uiLayer.appendChild(textElement);
        this.elements.set(id, textElement);
        
        return textElement;
    }

    createProgressBar(id, options = {}) {
        const container = document.createElement('div');
        container.id = id;
        
        // Create the progress bar container
        const progressBar = document.createElement('div');
        progressBar.style.width = options.width ? `${options.width}px` : '200px';
        progressBar.style.height = options.height ? `${options.height}px` : '20px';
        progressBar.style.backgroundColor = options.backgroundColor || '#333';
        progressBar.style.borderRadius = '5px';
        progressBar.style.overflow = 'hidden';
        
        // Create the progress fill
        const progressFill = document.createElement('div');
        progressFill.style.width = '0%';
        progressFill.style.height = '100%';
        progressFill.style.backgroundColor = options.fillColor || '#4a90e2';
        progressFill.style.transition = 'width 0.3s ease';
        
        progressBar.appendChild(progressFill);
        container.appendChild(progressBar);
        
        // Position the progress bar
        container.style.position = 'absolute';
        container.style.left = options.x ? `${options.x}px` : '0';
        container.style.top = options.y ? `${options.y}px` : '0';
        
        this.uiLayer.appendChild(container);
        this.elements.set(id, {
            container,
            progressBar,
            progressFill
        });
        
        return container;
    }

    updateProgressBar(id, progress) {
        const element = this.elements.get(id);
        if (element && element.progressFill) {
            const clampedProgress = Math.max(0, Math.min(100, progress));
            element.progressFill.style.width = `${clampedProgress}%`;
        }
    }

    removeElement(id) {
        const element = this.elements.get(id);
        if (element) {
            if (element.container) {
                this.uiLayer.removeChild(element.container);
            } else {
                this.uiLayer.removeChild(element);
            }
            this.elements.delete(id);
        }
    }

    hideElement(id) {
        const element = this.elements.get(id);
        if (element) {
            if (element.container) {
                element.container.style.display = 'none';
            } else {
                element.style.display = 'none';
            }
        }
    }

    showElement(id) {
        const element = this.elements.get(id);
        if (element) {
            if (element.container) {
                element.container.style.display = 'block';
            } else {
                element.style.display = 'block';
            }
        }
    }

    applyStyles(element, styles) {
        Object.assign(element.style, styles);
    }

    addAnimation(id, keyframes, options = {}) {
        const element = this.elements.get(id);
        if (element) {
            const animation = element.animate(keyframes, {
                duration: options.duration || 1000,
                iterations: options.iterations || 1,
                easing: options.easing || 'ease',
                fill: options.fill || 'forwards'
            });
            
            this.animations.set(id, animation);
            return animation;
        }
        return null;
    }

    stopAnimation(id) {
        const animation = this.animations.get(id);
        if (animation) {
            animation.cancel();
            this.animations.delete(id);
        }
    }

    update() {
        // Handle any periodic UI updates
    }

    render(ctx) {
        // Handle any canvas-based UI rendering
    }

    clearUI() {
        while (this.uiLayer.firstChild) {
            this.uiLayer.removeChild(this.uiLayer.firstChild);
        }
        this.elements.clear();
        this.animations.clear();
    }
}
