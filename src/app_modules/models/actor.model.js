import { ActorController } from './actor-controller.model';

import { Level } from '../models/level.model';

export class Actor {
    health;
    model;
    controller;
    weapon;
    level;
    isDead   = false;
    x        = 0;
    y        = 0;
    rotation = 0;
    characterName;
    team;

    constructor(model, weapon) {
        this.weapon       = weapon;
        this.weapon.actor = this;
        this.model        = model;
        this.health       = model.maxHealth;
        this.controller   = new ActorController();
    }

    getSerializable() {
        return {
            x         : this.x,
            y         : this.y,
            rotation  : this.rotation,
            isDead    : this.isDead,
            health    : this.health,
            maxHealth : this.model.maxHealth,
            ammo      : this.weapon.ammo,
            maxAmmo   : this.weapon.model.maxAmmo,
            texture   : this.weapon.model.blockType.texture,
            team      : this.team
        }
    }

    facePotentialPosition(x, y) {
        this.controller.facingX = x;
        this.controller.facingY = y;
    }

    facePosition(x, y) {
        this.rotation = Math.atan2(this.y - y, this.x - x);
    }

    faceFromPotential() {
        this.rotation = Math.atan2(this.y - this.controller.facingY, this.x - this.controller.facingX);
    }

    stepForward(c) {
        this._stepAny(c, 0, this.controller.isSprinting && this.model.sprintSpeed || this.model.runSpeed);
    }

    stepRight(c) {
        this._stepAny(c, Math.PI / 2);
    }

    stepLeft(c) {
        this._stepAny(c, -Math.PI / 2);
    }

    stepBackwards(c) {
        this._stepAny(c, Math.PI);
    }

    _stepAny(collisions, angle, speed) {
        speed      = speed || this.model.walkSpeed;
        collisions = collisions || {};

        let rotation = this.rotation + angle;
        let distance = speed;

        let coords = this.level.filterPositionCollision(
            collisions,
            this.x - distance * Math.cos(rotation),
            this.y - distance * Math.sin(rotation),
            rotation
        );

        this.x = coords[0];
        this.y = coords[1];
    }

    tickCooldowns() {
        this.weapon.tickCooldown();
    }

    actionFire() {
        this.weapon.actionFire();
    }

    actionReload() {
        this.controller.isReloading = false;
        this.weapon.actionReload();
    }
}
