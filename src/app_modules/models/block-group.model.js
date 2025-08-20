export class BlockGroup {
    isWalkable     = true;
    isCollide      = false;
    isDestructible = false;
    level          = 0;

    constructor(data) {
        Object.assign(this, data);
    }
}
