import { MapObject } from './map-object';

export class Block extends MapObject {
    model       = {};
    isDestroyed = false;
    health      = 0;

    constructor(blockType) {
        super();
        this.model  = blockType;
        this.health = this.model.maxHealth;
    }

    getSerializable() {
        return {
            texture   : this.model.texture,
            maxHealth : this.model.maxHealth,
            health    : this.health,
            level     : this.model.blockGroup.level
        }
    }
}
