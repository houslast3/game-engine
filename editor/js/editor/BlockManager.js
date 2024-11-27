import Blockly from 'blockly';

export class BlockManager {
    constructor() {
        this.workspace = null;
        this.customBlocks = {};
        this.initializeBlockly();
        this.defineCustomBlocks();
    }

    initializeBlockly() {
        // Configurar área do Blockly
        this.workspace = Blockly.inject('blocklyDiv', {
            toolbox: this.createToolbox(),
            grid: {
                spacing: 20,
                length: 3,
                colour: '#ccc',
                snap: true
            },
            zoom: {
                controls: true,
                wheel: true,
                startScale: 1.0,
                maxScale: 3,
                minScale: 0.3,
                scaleSpeed: 1.2
            },
            trashcan: true
        });

        // Adicionar listener para mudanças
        this.workspace.addChangeListener(() => {
            this.onWorkspaceChange();
        });
    }

    createToolbox() {
        return {
            kind: 'categoryToolbox',
            contents: [
                {
                    kind: 'category',
                    name: 'Movimento',
                    colour: '#4a90e2',
                    contents: [
                        {
                            kind: 'block',
                            type: 'move_to'
                        },
                        {
                            kind: 'block',
                            type: 'move_by'
                        },
                        {
                            kind: 'block',
                            type: 'rotate_to'
                        },
                        {
                            kind: 'block',
                            type: 'set_velocity'
                        }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Controle',
                    colour: '#2ecc71',
                    contents: [
                        {
                            kind: 'block',
                            type: 'on_start'
                        },
                        {
                            kind: 'block',
                            type: 'on_update'
                        },
                        {
                            kind: 'block',
                            type: 'if_condition'
                        },
                        {
                            kind: 'block',
                            type: 'repeat_times'
                        }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Colisão',
                    colour: '#e74c3c',
                    contents: [
                        {
                            kind: 'block',
                            type: 'on_collision'
                        },
                        {
                            kind: 'block',
                            type: 'check_collision'
                        },
                        {
                            kind: 'block',
                            type: 'set_collision_box'
                        }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Variáveis',
                    colour: '#f1c40f',
                    custom: 'VARIABLE'
                },
                {
                    kind: 'category',
                    name: 'Som',
                    colour: '#9b59b6',
                    contents: [
                        {
                            kind: 'block',
                            type: 'play_sound'
                        },
                        {
                            kind: 'block',
                            type: 'stop_sound'
                        },
                        {
                            kind: 'block',
                            type: 'set_volume'
                        }
                    ]
                }
            ]
        };
    }

    defineCustomBlocks() {
        // Bloco de Movimento
        Blockly.Blocks['move_to'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('Mover para');
                this.appendValueInput('X')
                    .setCheck('Number')
                    .appendField('X');
                this.appendValueInput('Y')
                    .setCheck('Number')
                    .appendField('Y');
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour('#4a90e2');
                this.setTooltip('Move o objeto para uma posição específica');
            }
        };

        // Bloco de Rotação
        Blockly.Blocks['rotate_to'] = {
            init: function() {
                this.appendValueInput('ANGLE')
                    .setCheck('Number')
                    .appendField('Rotacionar para');
                this.appendDummyInput()
                    .appendField('graus');
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour('#4a90e2');
                this.setTooltip('Rotaciona o objeto para um ângulo específico');
            }
        };

        // Bloco de Colisão
        Blockly.Blocks['on_collision'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('Quando colidir com')
                    .appendField(new Blockly.FieldDropdown([
                        ['Jogador', 'PLAYER'],
                        ['Inimigo', 'ENEMY'],
                        ['Plataforma', 'PLATFORM'],
                        ['Moeda', 'COIN']
                    ]), 'TYPE');
                this.appendStatementInput('DO')
                    .setCheck(null);
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour('#e74c3c');
                this.setTooltip('Executa ações quando ocorre uma colisão');
            }
        };

        // Bloco de Som
        Blockly.Blocks['play_sound'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField('Tocar som')
                    .appendField(new Blockly.FieldDropdown([
                        ['Pulo', 'JUMP'],
                        ['Moeda', 'COIN'],
                        ['Dano', 'DAMAGE'],
                        ['Vitória', 'WIN']
                    ]), 'SOUND');
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour('#9b59b6');
                this.setTooltip('Toca um som específico');
            }
        };

        // Adicionar geradores JavaScript para os blocos
        this.defineJavaScriptGenerators();
    }

    defineJavaScriptGenerators() {
        Blockly.JavaScript['move_to'] = function(block) {
            const x = Blockly.JavaScript.valueToCode(block, 'X', Blockly.JavaScript.ORDER_ATOMIC);
            const y = Blockly.JavaScript.valueToCode(block, 'Y', Blockly.JavaScript.ORDER_ATOMIC);
            return `this.moveTo(${x}, ${y});\n`;
        };

        Blockly.JavaScript['rotate_to'] = function(block) {
            const angle = Blockly.JavaScript.valueToCode(block, 'ANGLE', Blockly.JavaScript.ORDER_ATOMIC);
            return `this.rotateTo(${angle});\n`;
        };

        Blockly.JavaScript['on_collision'] = function(block) {
            const type = block.getFieldValue('TYPE');
            const statements = Blockly.JavaScript.statementToCode(block, 'DO');
            return `this.onCollision('${type}', function() {\n${statements}});\n`;
        };

        Blockly.JavaScript['play_sound'] = function(block) {
            const sound = block.getFieldValue('SOUND');
            return `this.playSound('${sound}');\n`;
        };
    }

    onWorkspaceChange() {
        try {
            const code = Blockly.JavaScript.workspaceToCode(this.workspace);
            this.updatePreview(code);
        } catch (e) {
            console.error('Erro ao gerar código:', e);
        }
    }

    updatePreview(code) {
        // Atualizar preview do código gerado
        const previewElement = document.getElementById('codePreview');
        if (previewElement) {
            previewElement.textContent = code;
        }
    }

    getGeneratedCode() {
        return Blockly.JavaScript.workspaceToCode(this.workspace);
    }

    loadBlocks(xmlText) {
        try {
            const xml = Blockly.Xml.textToDom(xmlText);
            this.workspace.clear();
            Blockly.Xml.domToWorkspace(xml, this.workspace);
        } catch (e) {
            console.error('Erro ao carregar blocos:', e);
            throw e;
        }
    }

    saveBlocks() {
        const xml = Blockly.Xml.workspaceToDom(this.workspace);
        return Blockly.Xml.domToText(xml);
    }

    clearWorkspace() {
        this.workspace.clear();
    }

    // Método para adicionar um novo bloco personalizado
    addCustomBlock(blockName, config) {
        if (this.customBlocks[blockName]) {
            console.warn(`Bloco ${blockName} já existe e será sobrescrito`);
        }

        // Registrar o bloco
        Blockly.Blocks[blockName] = {
            init: function() {
                this.jsonInit(config);
            }
        };

        // Armazenar configuração
        this.customBlocks[blockName] = config;
    }

    // Método para remover um bloco personalizado
    removeCustomBlock(blockName) {
        if (this.customBlocks[blockName]) {
            delete Blockly.Blocks[blockName];
            delete this.customBlocks[blockName];
        }
    }

    // Método para atualizar a toolbox
    updateToolbox(toolboxConfig) {
        this.workspace.updateToolbox(toolboxConfig);
    }

    // Método para adicionar uma nova categoria de blocos
    addCategory(name, colour, blocks) {
        const toolbox = this.workspace.getToolbox();
        const currentToolboxConfig = toolbox.getConfig();

        currentToolboxConfig.contents.push({
            kind: 'category',
            name: name,
            colour: colour,
            contents: blocks
        });

        this.updateToolbox(currentToolboxConfig);
    }
}

// Exportar uma instância única do BlockManager
export const blockManager = new BlockManager();
