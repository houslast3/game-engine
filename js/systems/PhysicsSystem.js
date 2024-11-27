export class PhysicsSystem {
    constructor() {
        this.gravity = { x: 0, y: 9.81 }; // m/s²
        this.physicsObjects = new Set();
        this.collisionLayers = new Map();
        this.quadTree = null;
        this.worldBounds = {
            x: 0,
            y: 0,
            width: 1000,
            height: 1000
        };
        this.subSteps = 3; // Number of physics sub-steps per frame
    }

    init() {
        this.resetQuadTree();
    }

    resetQuadTree() {
        this.quadTree = new QuadTree(0, this.worldBounds);
    }

    addPhysicsObject(object) {
        this.physicsObjects.add(object);
        if (object.collisionLayer) {
            this.addToCollisionLayer(object, object.collisionLayer);
        }
    }

    removePhysicsObject(object) {
        this.physicsObjects.delete(object);
        if (object.collisionLayer) {
            this.removeFromCollisionLayer(object, object.collisionLayer);
        }
    }

    addToCollisionLayer(object, layer) {
        if (!this.collisionLayers.has(layer)) {
            this.collisionLayers.set(layer, new Set());
        }
        this.collisionLayers.get(layer).add(object);
    }

    removeFromCollisionLayer(object, layer) {
        if (this.collisionLayers.has(layer)) {
            this.collisionLayers.get(layer).delete(object);
        }
    }

    update(deltaTime) {
        const dt = deltaTime / this.subSteps;

        for (let step = 0; step < this.subSteps; step++) {
            this.resetQuadTree();
            this.updatePhysics(dt);
            this.checkCollisions();
        }
    }

    updatePhysics(deltaTime) {
        for (const obj of this.physicsObjects) {
            if (!obj.isStatic) {
                // Apply gravity
                obj.velocity.x += this.gravity.x * deltaTime;
                obj.velocity.y += this.gravity.y * deltaTime;

                // Apply velocity
                obj.position.x += obj.velocity.x * deltaTime;
                obj.position.y += obj.velocity.y * deltaTime;

                // Apply drag
                obj.velocity.x *= (1 - obj.drag * deltaTime);
                obj.velocity.y *= (1 - obj.drag * deltaTime);

                // Update quadtree
                this.quadTree.insert(obj);
            }
        }
    }

    checkCollisions() {
        for (const obj of this.physicsObjects) {
            if (obj.isStatic) continue;

            const nearbyObjects = this.quadTree.retrieve(obj);
            
            for (const other of nearbyObjects) {
                if (obj === other) continue;
                
                if (this.checkCollision(obj, other)) {
                    this.resolveCollision(obj, other);
                }
            }
        }
    }

    checkCollision(objA, objB) {
        // AABB Collision check
        return !(
            objA.position.x + objA.width < objB.position.x ||
            objA.position.x > objB.position.x + objB.width ||
            objA.position.y + objA.height < objB.position.y ||
            objA.position.y > objB.position.y + objB.height
        );
    }

    resolveCollision(objA, objB) {
        // Calculate collision normal
        const dx = (objB.position.x + objB.width/2) - (objA.position.x + objA.width/2);
        const dy = (objB.position.y + objB.height/2) - (objA.position.y + objA.height/2);
        
        const angle = Math.atan2(dy, dx);
        const speed = Math.sqrt(objA.velocity.x * objA.velocity.x + objA.velocity.y * objA.velocity.y);
        
        if (!objB.isStatic) {
            // Elastic collision
            const massSum = objA.mass + objB.mass;
            const massDiff = objA.mass - objB.mass;
            
            // Update velocities
            const vx1 = ((massDiff * objA.velocity.x + 2 * objB.mass * objB.velocity.x) / massSum);
            const vy1 = ((massDiff * objA.velocity.y + 2 * objB.mass * objB.velocity.y) / massSum);
            
            objA.velocity.x = vx1 * objA.restitution;
            objA.velocity.y = vy1 * objA.restitution;
            
            objB.velocity.x = speed * Math.cos(angle) * objB.restitution;
            objB.velocity.y = speed * Math.sin(angle) * objB.restitution;
        } else {
            // Collision with static object
            objA.velocity.x = -speed * Math.cos(angle) * objA.restitution;
            objA.velocity.y = -speed * Math.sin(angle) * objA.restitution;
        }

        // Trigger collision events
        if (objA.onCollision) objA.onCollision(objB);
        if (objB.onCollision) objB.onCollision(objA);
    }

    setGravity(x, y) {
        this.gravity.x = x;
        this.gravity.y = y;
    }

    setWorldBounds(x, y, width, height) {
        this.worldBounds = { x, y, width, height };
        this.resetQuadTree();
    }
}

class QuadTree {
    constructor(level, bounds) {
        this.maxObjects = 10;
        this.maxLevels = 5;
        
        this.level = level;
        this.bounds = bounds;
        this.objects = [];
        this.nodes = [];
    }

    clear() {
        this.objects = [];
        
        for (let i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i]) {
                this.nodes[i].clear();
                this.nodes[i] = null;
            }
        }
        
        this.nodes = [];
    }

    split() {
        const subWidth = this.bounds.width / 2;
        const subHeight = this.bounds.height / 2;
        const x = this.bounds.x;
        const y = this.bounds.y;
        
        this.nodes[0] = new QuadTree(this.level + 1, {
            x: x + subWidth,
            y: y,
            width: subWidth,
            height: subHeight
        });
        
        this.nodes[1] = new QuadTree(this.level + 1, {
            x: x,
            y: y,
            width: subWidth,
            height: subHeight
        });
        
        this.nodes[2] = new QuadTree(this.level + 1, {
            x: x,
            y: y + subHeight,
            width: subWidth,
            height: subHeight
        });
        
        this.nodes[3] = new QuadTree(this.level + 1, {
            x: x + subWidth,
            y: y + subHeight,
            width: subWidth,
            height: subHeight
        });
    }

    getIndex(rect) {
        let index = -1;
        const verticalMidpoint = this.bounds.x + (this.bounds.width / 2);
        const horizontalMidpoint = this.bounds.y + (this.bounds.height / 2);
        
        const topQuadrant = (rect.position.y < horizontalMidpoint && 
                            rect.position.y + rect.height < horizontalMidpoint);
        const bottomQuadrant = (rect.position.y > horizontalMidpoint);
        
        if (rect.position.x < verticalMidpoint && 
            rect.position.x + rect.width < verticalMidpoint) {
            if (topQuadrant) {
                index = 1;
            } else if (bottomQuadrant) {
                index = 2;
            }
        } else if (rect.position.x > verticalMidpoint) {
            if (topQuadrant) {
                index = 0;
            } else if (bottomQuadrant) {
                index = 3;
            }
        }
        
        return index;
    }

    insert(rect) {
        if (this.nodes.length) {
            const index = this.getIndex(rect);
            
            if (index !== -1) {
                this.nodes[index].insert(rect);
                return;
            }
        }
        
        this.objects.push(rect);
        
        if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
            if (!this.nodes.length) {
                this.split();
            }
            
            let i = 0;
            while (i < this.objects.length) {
                const index = this.getIndex(this.objects[i]);
                if (index !== -1) {
                    this.nodes[index].insert(this.objects.splice(i, 1)[0]);
                } else {
                    i++;
                }
            }
        }
    }

    retrieve(rect) {
        const index = this.getIndex(rect);
        let returnObjects = this.objects;
        
        if (this.nodes.length) {
            if (index !== -1) {
                returnObjects = returnObjects.concat(this.nodes[index].retrieve(rect));
            } else {
                for (let i = 0; i < this.nodes.length; i++) {
                    returnObjects = returnObjects.concat(this.nodes[i].retrieve(rect));
                }
            }
        }
        
        return returnObjects;
    }
}
