import { ActorController } from '../models/actor-controller.model';

export class BotController {
    actor = null;
    state = 'idle';
    target = null;
    lastUpdate = 0;
    updateInterval = 100; // 10Hz as specified in task
    reactionTime = 0.2; // seconds
    accuracy = 0.75;
    aggression = 0.6;
    teamwork = 0.8;
    personality = 'tactical';
    
    // Bot-specific state tracking
    patrolTarget = null;
    engageStartTime = 0;
    lastKnownTargetPosition = null;
    searchTimer = 0;

    constructor(config = {}) {
        // Apply configuration
        Object.assign(this, config);
    }

    setActor(actor) {
        this.actor = actor;
    }

    update(gameTime) {
        if (!this.actor || this.actor.isDead) {
            return;
        }

        // Throttle updates to specified frequency
        if (gameTime - this.lastUpdate < this.updateInterval) {
            return;
        }
        
        this.lastUpdate = gameTime;

        // State machine
        switch (this.state) {
            case 'idle':
                this.updateIdle();
                break;
            case 'patrol':
                this.updatePatrol();
                break;
            case 'engage':
                this.updateEngage();
                break;
            case 'search':
                this.updateSearch();
                break;
        }
    }

    updateIdle() {
        // Look for enemies
        const enemy = this.findNearestEnemy();
        if (enemy) {
            this.engageTarget(enemy);
            return;
        }

        // Start patrolling if no enemies found
        this.setState('patrol');
    }

    updatePatrol() {
        // Look for enemies first
        const enemy = this.findNearestEnemy();
        if (enemy) {
            this.engageTarget(enemy);
            return;
        }

        // Continue patrol behavior
        if (!this.patrolTarget) {
            this.setRandomPatrolTarget();
        }

        this.moveTowardsTarget(this.patrolTarget);
        
        // Check if reached patrol target
        if (this.distanceToTarget(this.patrolTarget) < 20) {
            this.setRandomPatrolTarget();
        }
    }

    updateEngage() {
        if (!this.target || !this.canSeeTarget(this.target)) {
            // Lost target, switch to search
            this.setState('search');
            return;
        }

        // Face and shoot at target
        this.aimAtTarget(this.target);
        this.fireAtTarget(this.target);
        
        // Move tactically based on personality
        this.updateTacticalMovement();
    }

    updateSearch() {
        this.searchTimer += this.updateInterval;
        
        // Look for enemies
        const enemy = this.findNearestEnemy();
        if (enemy) {
            this.engageTarget(enemy);
            return;
        }

        // Move towards last known position if we have one
        if (this.lastKnownTargetPosition) {
            this.moveTowardsTarget(this.lastKnownTargetPosition);
            
            // If reached last known position, give up search
            if (this.distanceToTarget(this.lastKnownTargetPosition) < 30) {
                this.lastKnownTargetPosition = null;
            }
        }

        // Give up search after some time
        if (this.searchTimer > 5000) { // 5 seconds
            this.setState('patrol');
        }
    }

    setState(newState) {
        this.state = newState;
        this.searchTimer = 0;
        
        // Clear movement controls when changing states
        this.clearMovementControls();
    }

    engageTarget(target) {
        this.target = target;
        this.lastKnownTargetPosition = { x: target.x, y: target.y };
        this.engageStartTime = Date.now();
        this.setState('engage');
    }

    findNearestEnemy() {
        if (!this.actor || !this.actor.level) {
            return null;
        }

        // Get all actors from the level
        const allActors = this.actor.level.logic.actors;
        let nearestEnemy = null;
        let nearestDistance = Infinity;

        for (const otherActor of allActors) {
            if (otherActor === this.actor || otherActor.isDead) {
                continue;
            }

            // Check if enemy team
            if (otherActor.team !== this.actor.team) {
                const distance = this.distanceTo(otherActor);
                
                // Basic line of sight check
                if (distance < 300 && this.canSeeTarget(otherActor) && distance < nearestDistance) {
                    nearestEnemy = otherActor;
                    nearestDistance = distance;
                }
            }
        }

        return nearestEnemy;
    }

    canSeeTarget(target) {
        // Simplified line of sight - could be enhanced with raycasting
        const distance = this.distanceTo(target);
        return distance < 300; // Basic visibility range
    }

    aimAtTarget(target) {
        if (!target) return;

        // Add some inaccuracy based on accuracy setting
        const inaccuracy = (1 - this.accuracy) * 50; // Max 50 pixel inaccuracy
        const offsetX = (Math.random() - 0.5) * inaccuracy;
        const offsetY = (Math.random() - 0.5) * inaccuracy;

        this.actor.controller.facingX = target.x + offsetX;
        this.actor.controller.facingY = target.y + offsetY;
    }

    fireAtTarget(target) {
        if (!target) return;

        // Apply reaction time delay
        const timeSinceEngaged = Date.now() - this.engageStartTime;
        if (timeSinceEngaged < this.reactionTime * 1000) {
            return;
        }

        this.actor.controller.isFiring = true;
    }

    updateTacticalMovement() {
        if (!this.target) return;

        const distance = this.distanceTo(this.target);
        
        switch (this.personality) {
            case 'aggressive':
                // Move towards enemy
                if (distance > 100) {
                    this.moveTowardsTarget(this.target);
                }
                break;
                
            case 'defensive':
                // Keep distance and strafe
                if (distance < 150) {
                    this.moveAwayFromTarget(this.target);
                } else {
                    this.strafeAroundTarget();
                }
                break;
                
            case 'tactical':
            default:
                // Balanced approach - maintain optimal range
                if (distance > 200) {
                    this.moveTowardsTarget(this.target);
                } else if (distance < 100) {
                    this.moveAwayFromTarget(this.target);
                } else {
                    this.strafeAroundTarget();
                }
                break;
        }
    }

    moveTowardsTarget(target) {
        if (!target) return;

        const dx = target.x - this.actor.x;
        const dy = target.y - this.actor.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            // Normalize direction and apply to movement
            const directionX = dx / distance;
            const directionY = dy / distance;

            // Convert to movement controls
            this.setMovementFromDirection(directionX, directionY);
        }
    }

    moveAwayFromTarget(target) {
        if (!target) return;

        const dx = this.actor.x - target.x;
        const dy = this.actor.y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const directionX = dx / distance;
            const directionY = dy / distance;
            this.setMovementFromDirection(directionX, directionY);
        }
    }

    strafeAroundTarget() {
        // Simple strafing pattern
        const time = Date.now() / 1000;
        const strafeDirection = Math.sin(time * 2) > 0 ? 1 : -1;
        
        this.actor.controller.isMovingLeft = strafeDirection < 0;
        this.actor.controller.isMovingRight = strafeDirection > 0;
    }

    setMovementFromDirection(directionX, directionY) {
        this.clearMovementControls();

        // Convert direction to discrete movement controls
        if (Math.abs(directionX) > Math.abs(directionY)) {
            if (directionX > 0) {
                this.actor.controller.isMovingForward = true;
            } else {
                this.actor.controller.isMovingBackwards = true;
            }
        } else {
            if (directionY > 0) {
                this.actor.controller.isMovingRight = true;
            } else {
                this.actor.controller.isMovingLeft = true;
            }
        }
    }

    clearMovementControls() {
        if (!this.actor || !this.actor.controller) return;
        
        this.actor.controller.isMovingForward = false;
        this.actor.controller.isMovingLeft = false;
        this.actor.controller.isMovingRight = false;
        this.actor.controller.isMovingBackwards = false;
        this.actor.controller.isFiring = false;
    }

    setRandomPatrolTarget() {
        // Set a random nearby position as patrol target
        const range = 200;
        this.patrolTarget = {
            x: this.actor.x + (Math.random() - 0.5) * range,
            y: this.actor.y + (Math.random() - 0.5) * range
        };
    }

    distanceTo(target) {
        if (!target || !this.actor) return Infinity;
        return this.distanceToTarget(target);
    }

    distanceToTarget(target) {
        if (!target || !this.actor) return Infinity;
        const dx = target.x - this.actor.x;
        const dy = target.y - this.actor.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}