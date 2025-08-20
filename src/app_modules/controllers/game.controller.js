const TICKMS = 15; // 15

export class GameController {
    _tickInterval;
    _level;
    isRunning        = false;
    isProcessingTick = false;
    tickTimePeriod   = TICKMS;
    actors           = [];
    projectiles      = [];
    doOnTick         = [];

    constructor() {

    }

    start() {
        this.stop();
        this._tickInterval = setInterval(this.tickMaybe.bind(this), this.tickTimePeriod);
    }

    stop() {
        clearInterval(this._tickInterval);
    }

    setLevel(level) {
        this._level = level;
    }

    tickMaybe() {
        if ( !this.isProcessingTick ) {
            this.tick();
        }
    }

    tick() {
        this.isProcessingTick = true;
        // logic
        this.projectiles.forEach(this.tickProjectile.bind(this));
        this.actors.forEach(this.tickActor.bind(this));

        this.doOnTick.forEach(todo => todo());

        this.isProcessingTick = false;
    }

    tickProjectile(projectile) {
        projectile.move(this._level.hitCollisions);
    }

    tickActor(actor) {
        if ( !actor.isDead ) {
            actor.tickCooldowns();
            if ( actor.controller.isMovingForward ) {
                actor.stepForward(this._level.collisions);
            }
            if ( actor.controller.isMovingRight ) {
                actor.stepRight(this._level.collisions);
            }
            if ( actor.controller.isMovingLeft ) {
                actor.stepLeft(this._level.collisions);
            }
            if ( actor.controller.isMovingBackwards ) {
                actor.stepBackwards(this._level.collisions);
            }
            actor.faceFromPotential();

            if ( actor.controller.isReloading ) {
                actor.actionReload();
            } else if ( actor.controller.isFiring ) {
                actor.actionFire();
            }
        }
    }
}
