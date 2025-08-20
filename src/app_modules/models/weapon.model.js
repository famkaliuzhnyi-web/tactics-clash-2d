import { Projectile } from './projectile.model';

export class Weapon {
    ammo;
    model;
    isReadyToFire  = true;
    isReloaded     = true;
    cooldown       = 0;
    reloadCooldown = 0;
    actor;

    constructor(model) {
        this.model = model;
        this.ammo  = model.maxAmmo;
    }

    getProjectileRotation() {
        let spread = this.actor.controller.isRunning && (this.actor.controller.isSprinting && this.model.spreadSprint || this.model.spreadRun) ||
            this.actor.controller.isMoving && this.model.spreadWalk || this.model.spreadStand;

        return this.actor.rotation - (spread / 2) + (Math.random() * spread);
    }

    actionFire() {
        //console.log(this.ammo);
        if ( !this.ammo || !this.isReloaded ) {
            return;
        }

        if ( this.isReadyToFire ) {
            this.isReadyToFire = false;
            this.cooldown      = this.model.shootCooldown;
            this.ammo -= 1;

            for (let i = 0; i < this.model.projectiles; i++) {
                this.spawnProjectile();
            }

        }
    }

    actionReload() {
        if ( this.isReloaded ) {
            this.isReloaded     = false;
            this.reloadCooldown = this.model.reloadCooldown;
        }
    }

    spawnProjectile() {
        let projectile      = new Projectile(this.model.projectile);
        projectile.x        = this.actor.x + 16;
        projectile.y        = this.actor.y + 16;
        projectile.rotation = this.getProjectileRotation();
        projectile.damage *= this.model.lengthMultiplier;
        projectile.speed *= this.model.lengthMultiplier;
        projectile.length *= this.model.lengthMultiplier;

        this.actor.level.spawnProjectile(projectile, this.actor);
    }

    tickCooldown() {
        if ( this.cooldown ) {
            this.cooldown -= 1;
        } else {
            this.isReadyToFire = true;
        }
        if ( this.reloadCooldown === 1 ) {
            this.ammo = this.model.maxAmmo;
            this.reloadCooldown -= 1;
        } else if ( this.reloadCooldown ) {
            this.reloadCooldown -= 1;
        } else {
            this.isReloaded = true;
        }
    }
}
