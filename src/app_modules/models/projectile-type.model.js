export class ProjectileType {
    damage;
    speed;
    texture;
    length;
    life = 120;
    slowdown = 0.96;

    constructor(data) {
        Object.assign(this, data);
    }
}
