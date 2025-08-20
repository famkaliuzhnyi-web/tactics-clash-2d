export class WeaponType {
    isAutomatic = false;
    title;
    shootCooldown;
    reloadCooldown;
    maxAmmo;
    spreadStand;
    spreadWalk;
    spreadRun;
    spreadSprint;
    projectile;
    blockType;
    projectiles;
    lengthMultiplier = 1;

    constructor(data) {
        Object.assign(this, data);
    }
}
