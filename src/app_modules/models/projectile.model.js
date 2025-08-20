import { Level } from '../models/level.model';

const speedStep      = 16;
const bulletMinSpeed = 10;

export class Projectile {
    model;
    x;
    y;
    rotation;
    lifeCooldown;
    level;
    actor;
    damage;

    constructor(model) {
        this.lifeCooldown = model.life;
        this.speed        = model.speed + Math.random() * model.speedRnd;
        this.model        = model;
        this.damage       = this.model.damage;
        this.length       = this.model.length;
        //if ( this.speed <= speedStep ) {
        //    this.move = this.moveSimple;
        //} else {
        //    this.move = this.moveComplicated;
        //}
        this.move = this.moveComplicated;
    }

    getSerializable() {
        return {
            x        : this.x,
            y        : this.y,
            rotation : this.rotation,
            length   : this.length
        }
    }

    moveSimple(collisions, distance) {
        if ( this.lifeCooldown > 0 ) {
            collisions = collisions || {};
            distance   = distance || this.speed;

            let rotation = this.rotation;

            let coords = this.level.filterProjectilePositionCollision(
                this,
                collisions,
                this.x - distance * Math.cos(rotation),
                this.y - distance * Math.sin(rotation)
            );

            this.x = coords[0];
            this.y = coords[1];

            if ( coords[4] ) { // Hit player
                this.level.hitActorWithProjectile(coords[4], this);
                this.level.removeProjectile(this);
                return true;
            }

            if ( coords[2] ) { // Hit block
                this.level.hitWithProjectile(coords[2], coords[3], this);
                this.level.removeProjectile(this);
                return true;
            }

            this.lifeCooldown -= 1;
            return false;
        }

        this.level.removeProjectile(this);
        return false;
    }

    moveComplicated(collisions) {
        let speed = this.speed;
        for (; speed > speedStep; speed -= speedStep) {
            if ( this.moveSimple(collisions, speedStep) ) {
                return;
            }
        }
        this.moveSimple(collisions, speed);
        this.speed *= this.model.slowdown;
        this.length *= this.model.slowdown;
        if ( this.speed <= bulletMinSpeed ) {
            this.level.removeProjectile(this);
        }
    }
}
