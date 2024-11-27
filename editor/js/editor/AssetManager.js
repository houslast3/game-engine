export class AssetManager {
    constructor() {
        this.assets = new Map();
        this.categories = {
            images: new Set(),
            audio: new Set(),
            sprites: new Set(),
            tilemaps: new Set()
        };
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Configurar drag and drop para a galeria de assets
        const assetGallery = document.querySelector('.asset-gallery');
        if (assetGallery) {
            assetGallery.addEventListener('dragover', this.handleDragOver.bind(this));
            assetGallery.addEventListener('drop', this.handleDrop.bind(this));
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    }

    async handleDrop(event) {
        event.preventDefault();
        
        const files = Array.from(event.dataTransfer.files);
        for (const file of files) {
            await this.addAsset(file);
        }
    }

    async addAsset(file) {
        try {
            const asset = await this.createAsset(file);
            this.assets.set(asset.id, asset);
            this.addToCategory(asset);
            this.createAssetPreview(asset);
            return asset;
        } catch (error) {
            console.error('Erro ao adicionar asset:', error);
            throw error;
        }
    }

    async createAsset(file) {
        const asset = {
            id: this.generateId(),
            name: file.name,
            type: this.getAssetType(file),
            size: file.size,
            url: await this.createFileUrl(file),
            metadata: await this.extractMetadata(file)
        };

        return asset;
    }

    getAssetType(file) {
        const type = file.type.split('/')[0];
        switch (type) {
            case 'image':
                return file.name.toLowerCase().includes('tilemap') ? 'tilemaps' : 'images';
            case 'audio':
                return 'audio';
            default:
                return 'other';
        }
    }

    async createFileUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async extractMetadata(file) {
        const metadata = {
            lastModified: new Date(file.lastModified),
            size: file.size
        };

        if (file.type.startsWith('image/')) {
            const dimensions = await this.getImageDimensions(file);
            metadata.width = dimensions.width;
            metadata.height = dimensions.height;
        } else if (file.type.startsWith('audio/')) {
            const duration = await this.getAudioDuration(file);
            metadata.duration = duration;
        }

        return metadata;
    }

    getImageDimensions(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height
                });
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    getAudioDuration(file) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.onloadedmetadata = () => {
                resolve(audio.duration);
            };
            audio.onerror = reject;
            audio.src = URL.createObjectURL(file);
        });
    }

    generateId() {
        return 'asset_' + Math.random().toString(36).substr(2, 9);
    }

    addToCategory(asset) {
        const category = this.categories[asset.type];
        if (category) {
            category.add(asset.id);
        }
    }

    createAssetPreview(asset) {
        const gallery = document.querySelector('.asset-gallery');
        if (!gallery) return;

        const assetElement = document.createElement('div');
        assetElement.className = 'asset-item';
        assetElement.setAttribute('data-asset-id', asset.id);
        assetElement.draggable = true;

        // Adicionar preview baseado no tipo
        if (asset.type === 'images' || asset.type === 'tilemaps') {
            const img = document.createElement('img');
            img.src = asset.url;
            img.alt = asset.name;
            assetElement.appendChild(img);
        } else if (asset.type === 'audio') {
            const icon = document.createElement('div');
            icon.className = 'audio-icon';
            icon.innerHTML = '🔊';
            assetElement.appendChild(icon);
        }

        // Adicionar nome do asset
        const name = document.createElement('div');
        name.className = 'asset-name';
        name.textContent = asset.name;
        assetElement.appendChild(name);

        // Adicionar menu de contexto
        this.addContextMenu(assetElement, asset);

        // Adicionar eventos de drag
        this.addDragEvents(assetElement, asset);

        gallery.appendChild(assetElement);
    }

    addContextMenu(element, asset) {
        element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e, asset);
        });
    }

    addDragEvents(element, asset) {
        element.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('application/json', JSON.stringify({
                type: 'asset',
                id: asset.id,
                assetType: asset.type
            }));
        });
    }

    showContextMenu(event, asset) {
        // Remover menu anterior se existir
        const oldMenu = document.querySelector('.asset-context-menu');
        if (oldMenu) {
            oldMenu.remove();
        }

        // Criar novo menu
        const menu = document.createElement('div');
        menu.className = 'asset-context-menu';
        menu.style.position = 'fixed';
        menu.style.left = event.clientX + 'px';
        menu.style.top = event.clientY + 'px';

        // Adicionar opções do menu
        const options = [
            {
                label: 'Renomear',
                action: () => this.renameAsset(asset)
            },
            {
                label: 'Deletar',
                action: () => this.deleteAsset(asset.id)
            },
            {
                label: 'Propriedades',
                action: () => this.showAssetProperties(asset)
            }
        ];

        options.forEach(option => {
            const item = document.createElement('div');
            item.className = 'menu-item';
            item.textContent = option.label;
            item.onclick = () => {
                option.action();
                menu.remove();
            };
            menu.appendChild(item);
        });

        // Adicionar menu ao documento
        document.body.appendChild(menu);

        // Remover menu ao clicar fora
        setTimeout(() => {
            const closeMenu = (e) => {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 0);
    }

    async renameAsset(asset) {
        const newName = prompt('Digite o novo nome:', asset.name);
        if (newName && newName !== asset.name) {
            asset.name = newName;
            
            // Atualizar visualização
            const element = document.querySelector(`[data-asset-id="${asset.id}"] .asset-name`);
            if (element) {
                element.textContent = newName;
            }

            // Emitir evento de atualização
            this.emitAssetUpdate(asset);
        }
    }

    deleteAsset(id) {
        const asset = this.assets.get(id);
        if (asset && confirm(`Deletar asset "${asset.name}"?`)) {
            // Remover do mapa de assets
            this.assets.delete(id);

            // Remover da categoria
            const category = this.categories[asset.type];
            if (category) {
                category.delete(id);
            }

            // Remover elemento visual
            const element = document.querySelector(`[data-asset-id="${id}"]`);
            if (element) {
                element.remove();
            }

            // Emitir evento de deleção
            this.emitAssetDelete(id);
        }
    }

    showAssetProperties(asset) {
        // Criar modal de propriedades
        const modal = document.createElement('div');
        modal.className = 'asset-properties-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Propriedades do Asset</h2>
                <div class="property-row">
                    <label>Nome:</label>
                    <span>${asset.name}</span>
                </div>
                <div class="property-row">
                    <label>Tipo:</label>
                    <span>${asset.type}</span>
                </div>
                <div class="property-row">
                    <label>Tamanho:</label>
                    <span>${this.formatFileSize(asset.size)}</span>
                </div>
                ${this.getAdditionalProperties(asset)}
                <button onclick="this.parentElement.parentElement.remove()">Fechar</button>
            </div>
        `;

        document.body.appendChild(modal);
    }

    getAdditionalProperties(asset) {
        if (asset.type === 'images' || asset.type === 'tilemaps') {
            return `
                <div class="property-row">
                    <label>Dimensões:</label>
                    <span>${asset.metadata.width}x${asset.metadata.height}</span>
                </div>
            `;
        } else if (asset.type === 'audio') {
            return `
                <div class="property-row">
                    <label>Duração:</label>
                    <span>${this.formatDuration(asset.metadata.duration)}</span>
                </div>
            `;
        }
        return '';
    }

    formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Eventos
    emitAssetUpdate(asset) {
        const event = new CustomEvent('assetupdate', {
            detail: { asset }
        });
        window.dispatchEvent(event);
    }

    emitAssetDelete(assetId) {
        const event = new CustomEvent('assetdelete', {
            detail: { assetId }
        });
        window.dispatchEvent(event);
    }

    // Métodos de busca e filtragem
    getAssetById(id) {
        return this.assets.get(id);
    }

    getAssetsByType(type) {
        return Array.from(this.categories[type] || [])
            .map(id => this.assets.get(id))
            .filter(Boolean);
    }

    searchAssets(query) {
        const normalizedQuery = query.toLowerCase();
        return Array.from(this.assets.values())
            .filter(asset => 
                asset.name.toLowerCase().includes(normalizedQuery) ||
                asset.type.toLowerCase().includes(normalizedQuery)
            );
    }
}

// Exportar uma instância única do AssetManager
export const assetManager = new AssetManager();
