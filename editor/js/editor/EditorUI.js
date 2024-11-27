export class EditorUI {
    constructor() {
        this.selectedObject = null;
        this.isDragging = false;
        this.initializeUI();
    }

    initializeUI() {
        this.setupDragAndDrop();
        this.setupToolbarButtons();
        this.setupPropertiesPanel();
        this.setupAssetUpload();
    }

    setupDragAndDrop() {
        // Configurar objetos arrastáveis
        const objectItems = document.querySelectorAll('.object-item');
        const sceneEditor = document.querySelector('.scene-editor');

        objectItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                this.isDragging = true;
                item.classList.add('dragging');
                e.dataTransfer.setData('text/plain', item.getAttribute('data-type'));
            });

            item.addEventListener('dragend', () => {
                this.isDragging = false;
                item.classList.remove('dragging');
            });
        });

        sceneEditor.addEventListener('dragover', (e) => {
            e.preventDefault();
            sceneEditor.classList.add('drag-over');
        });

        sceneEditor.addEventListener('dragleave', () => {
            sceneEditor.classList.remove('drag-over');
        });

        sceneEditor.addEventListener('drop', (e) => {
            e.preventDefault();
            sceneEditor.classList.remove('drag-over');
            const objectType = e.dataTransfer.getData('text/plain');
            const rect = sceneEditor.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.createGameObject(objectType, x, y);
        });
    }

    setupToolbarButtons() {
        // Botão Nova Cena
        document.getElementById('newScene').addEventListener('click', () => {
            if (confirm('Criar nova cena? Alterações não salvas serão perdidas.')) {
                this.createNewScene();
            }
        });

        // Botão Salvar
        document.getElementById('saveProject').addEventListener('click', () => {
            this.saveProject();
        });

        // Botão Carregar
        document.getElementById('loadProject').addEventListener('click', () => {
            this.loadProject();
        });

        // Botão Testar
        document.getElementById('testGame').addEventListener('click', () => {
            this.testGame();
        });
    }

    setupPropertiesPanel() {
        this.propertiesPanel = document.getElementById('propertiesContent');
    }

    setupAssetUpload() {
        const uploadButton = document.getElementById('uploadAsset');
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*,audio/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        uploadButton.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleAssetUpload(file);
            }
        });
    }

    createGameObject(type, x, y) {
        const object = {
            type,
            x,
            y,
            width: 32,
            height: 32,
            properties: this.getDefaultProperties(type)
        };

        // Criar representação visual do objeto
        const element = document.createElement('div');
        element.className = 'game-object';
        element.style.position = 'absolute';
        element.style.left = x + 'px';
        element.style.top = y + 'px';
        element.style.width = object.width + 'px';
        element.style.height = object.height + 'px';
        element.style.backgroundColor = this.getObjectColor(type);

        document.querySelector('.scene-editor').appendChild(element);

        // Tornar o objeto selecionável
        element.addEventListener('click', () => {
            this.selectObject(object, element);
        });

        // Permitir arrastar o objeto na cena
        this.makeObjectDraggable(element, object);

        return object;
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

    getObjectColor(type) {
        const colors = {
            player: '#4a90e2',
            platform: '#2ecc71',
            enemy: '#e74c3c',
            coin: '#f1c40f'
        };

        return colors[type] || '#ffffff';
    }

    selectObject(object, element) {
        // Remover seleção anterior
        if (this.selectedObject) {
            this.selectedObject.element.style.border = 'none';
        }

        // Selecionar novo objeto
        this.selectedObject = { object, element };
        element.style.border = '2px solid #fff';

        // Atualizar painel de propriedades
        this.updatePropertiesPanel(object);
    }

    updatePropertiesPanel(object) {
        const properties = object.properties;
        let html = `
            <div class="property-group">
                <div class="property-label">Posição X</div>
                <input type="number" class="property-input" value="${object.x}" 
                       onchange="this.updateObjectProperty('x', this.value)">
            </div>
            <div class="property-group">
                <div class="property-label">Posição Y</div>
                <input type="number" class="property-input" value="${object.y}"
                       onchange="this.updateObjectProperty('y', this.value)">
            </div>
        `;

        // Adicionar propriedades específicas do tipo
        for (const [key, value] of Object.entries(properties)) {
            html += `
                <div class="property-group">
                    <div class="property-label">${this.formatPropertyName(key)}</div>
                    <input type="number" class="property-input" value="${value}"
                           onchange="this.updateObjectProperty('${key}', this.value)">
                </div>
            `;
        }

        this.propertiesPanel.innerHTML = html;
    }

    formatPropertyName(name) {
        return name.charAt(0).toUpperCase() + 
               name.slice(1).replace(/([A-Z])/g, ' $1');
    }

    updateObjectProperty(property, value) {
        if (this.selectedObject) {
            if (property === 'x' || property === 'y') {
                this.selectedObject.object[property] = Number(value);
                this.selectedObject.element.style[property === 'x' ? 'left' : 'top'] = value + 'px';
            } else {
                this.selectedObject.object.properties[property] = Number(value);
            }
        }
    }

    makeObjectDraggable(element, object) {
        let isDragging = false;
        let currentX;
        let currentY;

        element.addEventListener('mousedown', (e) => {
            isDragging = true;
            currentX = e.clientX - element.offsetLeft;
            currentY = e.clientY - element.offsetTop;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const x = e.clientX - currentX;
                const y = e.clientY - currentY;
                element.style.left = x + 'px';
                element.style.top = y + 'px';
                object.x = x;
                object.y = y;

                if (this.selectedObject && this.selectedObject.object === object) {
                    this.updatePropertiesPanel(object);
                }
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    async handleAssetUpload(file) {
        try {
            const asset = await this.createAssetPreview(file);
            this.addAssetToGallery(asset);
        } catch (error) {
            console.error('Erro ao carregar asset:', error);
            alert('Erro ao carregar o asset. Por favor, tente novamente.');
        }
    }

    createAssetPreview(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const asset = {
                    type: file.type.startsWith('image/') ? 'image' : 'audio',
                    name: file.name,
                    url: e.target.result
                };
                resolve(asset);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    addAssetToGallery(asset) {
        const gallery = document.querySelector('.asset-gallery');
        const assetElement = document.createElement('div');
        assetElement.className = 'asset-item';

        if (asset.type === 'image') {
            const img = document.createElement('img');
            img.src = asset.url;
            img.alt = asset.name;
            img.style.width = '100%';
            img.style.height = 'auto';
            assetElement.appendChild(img);
        } else {
            const audioIcon = document.createElement('div');
            audioIcon.innerHTML = '🔊';
            audioIcon.style.fontSize = '24px';
            audioIcon.style.textAlign = 'center';
            assetElement.appendChild(audioIcon);
        }

        const name = document.createElement('div');
        name.textContent = asset.name;
        name.style.fontSize = '12px';
        name.style.textAlign = 'center';
        name.style.overflow = 'hidden';
        name.style.textOverflow = 'ellipsis';
        name.style.whiteSpace = 'nowrap';
        assetElement.appendChild(name);

        gallery.appendChild(assetElement);

        // Tornar o asset arrastável
        assetElement.draggable = true;
        assetElement.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('application/json', JSON.stringify(asset));
        });
    }

    createNewScene() {
        // Limpar a cena atual
        const sceneEditor = document.querySelector('.scene-editor');
        while (sceneEditor.firstChild) {
            sceneEditor.removeChild(sceneEditor.firstChild);
        }

        // Resetar seleção
        this.selectedObject = null;
        this.propertiesPanel.innerHTML = '';
    }

    saveProject() {
        // Implementar lógica de salvamento
        alert('Projeto salvo com sucesso!');
    }

    loadProject() {
        // Implementar lógica de carregamento
        alert('Função de carregamento em desenvolvimento');
    }

    testGame() {
        // Implementar lógica de teste
        alert('Função de teste em desenvolvimento');
    }
}

// Inicializar o editor quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.editor = new EditorUI();
});
