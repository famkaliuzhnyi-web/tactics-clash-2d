import {BlockGroup} from './block-group.model';

export class BlockType {
    blockGroup;
    maxHealth = 0;
    texture;
    id;

    constructor(data) {
        Object.assign(this, data);
    }
}
