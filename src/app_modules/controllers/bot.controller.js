import { ActorController } from '../models/actor-controller.model';

export class BotController {
    actor = null;
    state = 'idle';
    target = null;
    lastUpdate = 0;
    updateInterval = 100;
    reactionTime = 0.2;
    accuracy = 0.75;
    aggression = 0.6;
    teamwork = 0.8;
    personality = 'tactical';
    
    patrolTarget = null;
    engageStartTime = 0;
    lastKnownTargetPosition = null;
    searchTimer = 0;
    
    killCount = 0;
    deathCount = 0;
    damageDealt = 0;
    accuracyHistory = [];
    
    stateTransitionCooldown = 0;
    lastStateChange = 0;

    constructor(config = {}) {
        Object.assign(this, config);
    }

    setActor(actor) {
        this.actor = actor;
    }

    update(gameTime) {
        if (!this.actor || this.actor.isDead) {
            return;
        }

        if (gameTime - this.lastUpdate < this.updateInterval) {
            return;
        }
        
        this.lastUpdate = gameTime;

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
        const enemy = this.findNearestEnemy();
        if (enemy) {
            this.engageTarget(enemy);
            return;
        }

        this.setState('patrol');
    }

    updatePatrol() {
        const enemy = this.findNearestEnemy();
        if (enemy) {
            this.engageTarget(enemy);
            return;
        }

        if (!this.patrolTarget) {
            this.setRandomPatrolTarget();
        }

        this.moveTowardsTarget(this.patrolTarget);
        
        if (this.distanceToTarget(this.patrolTarget) < 20) {
            this.setRandomPatrolTarget();
        }
    }

    updateEngage() {
        if (!this.target || !this.canSeeTarget(this.target)) {
            this.setState('search');
            return;
        }

        this.lastKnownTargetPosition = { x: this.target.x, y: this.target.y };

        this.aimAtTarget(this.target);
        this.fireAtTarget(this.target);
        
        if (this.actor.weapon.ammo <= 0 && !this.actor.weapon.isReloading) {
            this.actor.controller.isReloading = true;
            this.actor.controller.isFiring = false;
        }
        
        this.updateTacticalMovement();
    }

    updateSearch() {
        this.searchTimer += this.updateInterval;
        
        const enemy = this.findNearestEnemy();
        if (enemy) {
            this.engageTarget(enemy);
            return;
        }

        if (this.lastKnownTargetPosition) {
            this.moveTowardsTarget(this.lastKnownTargetPosition);
            
            if (this.distanceToTarget(this.lastKnownTargetPosition) < 30) {
                this.lastKnownTargetPosition = null;
            }
        }

        if (this.searchTimer > 5000) {
            this.setState('patrol');
        }
    }

    setState(newState) {
        const now = Date.now();
        if (now - this.lastStateChange < this.stateTransitionCooldown) {
            return;
        }
        
        this.state = newState;
        this.searchTimer = 0;
        this.lastStateChange = now;
        
        switch (newState) {
            case 'engage':
                this.stateTransitionCooldown = 500;
                break;
            case 'search':
                this.stateTransitionCooldown = 1000;
                break;
            default:
                this.stateTransitionCooldown = 200;
                break;
        }
        
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

        const allActors = this.actor.level.logic.actors;
        const potentialTargets = [];

        for (const otherActor of allActors) {
            if (otherActor === this.actor || otherActor.isDead) {
                continue;
            }

            if (otherActor.team !== this.actor.team) {
                const distance = this.distanceTo(otherActor);
                
                if (distance < 300 && this.canSeeTarget(otherActor)) {
                    const priority = this.shouldCoordinate() ? 
                        this.getTeamTargetPriority(otherActor) : 1;
                    
                    potentialTargets.push({
                        actor: otherActor,
                        distance: distance,
                        priority: priority,
                        score: priority / (distance / 100)
                    });
                }
            }
        }

        potentialTargets.sort((a, b) => b.score - a.score);
        
        return potentialTargets.length > 0 ? potentialTargets[0].actor : null;
    }

    canSeeTarget(target) {
        if (!target || !this.actor || !this.actor.level) return false;
        
        const distance = this.distanceTo(target);
        if (distance > 300) return false;
        
        return !target.isDead && distance < 300;
    }

    findCoverPosition() {
        if (!this.actor || !this.target) return null;
        
        const escapeDistance = 150;
        const coverPositions = [];
        
        for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 4) {
            const coverX = this.actor.x + Math.cos(angle) * escapeDistance;
            const coverY = this.actor.y + Math.sin(angle) * escapeDistance;
            
            const currentDistance = this.distanceTo(this.target);
            const newDistance = Math.sqrt(
                (coverX - this.target.x) ** 2 + (coverY - this.target.y) ** 2
            );
            
            if (newDistance > currentDistance) {
                coverPositions.push({ x: coverX, y: coverY, distance: newDistance });
            }
        }
        
        if (coverPositions.length > 0) {
            coverPositions.sort((a, b) => b.distance - a.distance);
            return coverPositions[0];
        }
        
        return null;
    }

    aimAtTarget(target) {
        if (!target) return;

        let aimX = target.x;
        let aimY = target.y;
        
        if (this.accuracy > 0.7) {
            const timeSinceLastUpdate = Date.now() - this.lastUpdate;
            const movementPredictionTime = 0.1;
            
            if (target.controller && target.controller.isMoving) {
                const speed = target.model.walkSpeed || 2;
                let velocityX = 0, velocityY = 0;
                
                if (target.controller.isMovingForward) {
                    velocityX += Math.cos(target.rotation) * speed;
                    velocityY += Math.sin(target.rotation) * speed;
                }
                if (target.controller.isMovingBackwards) {
                    velocityX -= Math.cos(target.rotation) * speed;
                    velocityY -= Math.sin(target.rotation) * speed;
                }
                if (target.controller.isMovingLeft) {
                    velocityX += Math.cos(target.rotation - Math.PI/2) * speed;
                    velocityY += Math.sin(target.rotation - Math.PI/2) * speed;
                }
                if (target.controller.isMovingRight) {
                    velocityX += Math.cos(target.rotation + Math.PI/2) * speed;
                    velocityY += Math.sin(target.rotation + Math.PI/2) * speed;
                }
                
                aimX += velocityX * movementPredictionTime;
                aimY += velocityY * movementPredictionTime;
            }
        }

        const distance = this.distanceTo(target);
        const baseInaccuracy = (1 - this.accuracy) * 40;
        const distanceInaccuracy = Math.max(0, (distance - 100) / 10);
        const totalInaccuracy = baseInaccuracy + distanceInaccuracy;
        
        const offsetX = (Math.random() - 0.5) * totalInaccuracy;
        const offsetY = (Math.random() - 0.5) * totalInaccuracy;

        this.actor.controller.facingX = aimX + offsetX;
        this.actor.controller.facingY = aimY + offsetY;
    }

    fireAtTarget(target) {
        if (!target) return;

        const timeSinceEngaged = Date.now() - this.engageStartTime;
        if (timeSinceEngaged < this.reactionTime * 1000) {
            return;
        }

        const shotFired = !this.actor.controller.isFiring;
        this.actor.controller.isFiring = true;
        
        if (shotFired) {
            const distance = this.distanceTo(target);
            const expectedAccuracy = Math.max(0.1, this.accuracy - (distance / 1000));
            const hitProbability = Math.random() < expectedAccuracy ? 1 : 0;
            
            this.accuracyHistory.push(hitProbability);
            if (this.accuracyHistory.length > 20) {
                this.accuracyHistory.shift();
            }
        }
    }

    updateTacticalMovement() {
        if (!this.target) return;

        const distance = this.distanceTo(this.target);
        const healthPercentage = this.actor.health / this.actor.model.maxHealth;
        
        const effectivePersonality = healthPercentage < 0.3 ? 'defensive' : this.personality;
        
        switch (effectivePersonality) {
            case 'aggressive':
                if (distance > 80) {
                    this.moveTowardsTarget(this.target);
                } else {
                    this.strafeAroundTarget();
                }
                break;
                
            case 'defensive':
                if (distance < 200) {
                    const coverPos = this.findCoverPosition();
                    if (coverPos) {
                        this.moveTowardsTarget(coverPos);
                    } else {
                        this.moveAwayFromTarget(this.target);
                    }
                } else {
                    this.strafeAroundTarget();
                }
                break;
                
            case 'sniper':
                if (distance < 250) {
                    this.moveAwayFromTarget(this.target);
                } else if (distance > 400) {
                    this.moveTowardsTarget(this.target);
                } else {
                    this.clearMovementControls();
                }
                break;
                
            case 'tactical':
            default:
                if (distance > 220) {
                    this.moveTowardsTarget(this.target);
                } else if (distance < 120) {
                    this.moveAwayFromTarget(this.target);
                } else {
                    if (Math.random() < 0.3) {
                        this.strafeAroundTarget();
                    }
                }
                break;
        }
    }

    moveTowardsTarget(target) {
        if (!target || !this.actor) return;

        const dx = target.x - this.actor.x;
        const dy = target.y - this.actor.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            const targetAngle = Math.atan2(dy, dx);
            const currentRotation = this.actor.rotation;
            
            let angleDiff = targetAngle - currentRotation;
            
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            this.clearMovementControls();
            
            if (Math.abs(angleDiff) < Math.PI / 4) {
                this.actor.controller.isMovingForward = true;
            } else if (Math.abs(angleDiff) > 3 * Math.PI / 4) {
                this.actor.controller.isMovingBackwards = true;
            } else if (angleDiff > 0) {
                this.actor.controller.isMovingRight = true;
            } else {
                this.actor.controller.isMovingLeft = true;
            }
            
            this.actor.controller.facingX = target.x;
            this.actor.controller.facingY = target.y;
        }
    }

    moveAwayFromTarget(target) {
        if (!target || !this.actor) return;

        const dx = this.actor.x - target.x;
        const dy = this.actor.y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const targetAngle = Math.atan2(dy, dx);
            const currentRotation = this.actor.rotation;
            
            let angleDiff = targetAngle - currentRotation;
            
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            this.clearMovementControls();
            
            if (Math.abs(angleDiff) < Math.PI / 4) {
                this.actor.controller.isMovingForward = true;
            } else if (Math.abs(angleDiff) > 3 * Math.PI / 4) {
                this.actor.controller.isMovingBackwards = true;
            } else if (angleDiff > 0) {
                this.actor.controller.isMovingRight = true;
            } else {
                this.actor.controller.isMovingLeft = true;
            }
            
            this.actor.controller.facingX = target.x;
            this.actor.controller.facingY = target.y;
        }
    }

    strafeAroundTarget() {
        if (!this.target || !this.actor) return;
        
        const time = Date.now() / 1000;
        const strafeDirection = Math.sin(time * 2) > 0 ? 1 : -1;
        
        this.clearMovementControls();
        this.actor.controller.isMovingLeft = strafeDirection < 0;
        this.actor.controller.isMovingRight = strafeDirection > 0;
        
        this.actor.controller.facingX = this.target.x;
        this.actor.controller.facingY = this.target.y;
    }

    setMovementFromDirection(directionX, directionY) {
        this.clearMovementControls();
        this.actor.controller.isMovingForward = true;
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

    findNearbyTeammates() {
        if (!this.actor || !this.actor.level) return [];
        
        const teammates = [];
        const allActors = this.actor.level.logic.actors;
        
        for (const otherActor of allActors) {
            if (otherActor !== this.actor && 
                otherActor.team === this.actor.team && 
                !otherActor.isDead) {
                
                const distance = this.distanceTo(otherActor);
                if (distance < 200) {
                    teammates.push({ actor: otherActor, distance });
                }
            }
        }
        
        return teammates.sort((a, b) => a.distance - b.distance);
    }

    shouldCoordinate() {
        return this.teamwork > 0.5 && Math.random() < this.teamwork;
    }

    getTeamTargetPriority(target) {
        if (!target) return 0;
        
        const teammates = this.findNearbyTeammates();
        let engagingCount = 0;
        
        for (const teammate of teammates) {
            const teammateDistance = Math.sqrt(
                (teammate.actor.x - target.x) ** 2 + 
                (teammate.actor.y - target.y) ** 2
            );
            if (teammateDistance < 250) {
                engagingCount++;
            }
        }
        
        return Math.max(1, 3 - engagingCount);
    }

    distanceToTarget(target) {
        if (!target || !this.actor) return Infinity;
        const dx = target.x - this.actor.x;
        const dy = target.y - this.actor.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getPerformanceStats() {
        const currentAccuracy = this.accuracyHistory.length > 0 
            ? this.accuracyHistory.reduce((a, b) => a + b, 0) / this.accuracyHistory.length 
            : 0;
            
        return {
            killCount: this.killCount,
            deathCount: this.deathCount,
            damageDealt: this.damageDealt,
            currentAccuracy: currentAccuracy,
            state: this.state,
            personality: this.personality,
            difficulty: this.getDifficultyLevel()
        };
    }

    getDifficultyLevel() {
        if (this.accuracy >= 0.9) return 'elite';
        if (this.accuracy >= 0.75) return 'expert';
        if (this.accuracy >= 0.5) return 'intermediate';
        return 'novice';
    }

    onKill() {
        this.killCount++;
    }

    onDeath() {
        this.deathCount++;
        this.setState('idle');
        this.target = null;
        this.lastKnownTargetPosition = null;
    }

    onDamageDealt(amount) {
        this.damageDealt += amount;
    }

    adaptBehavior() {
        const stats = this.getPerformanceStats();
        
        if (stats.currentAccuracy < 0.3 && this.aggression > 0.3) {
            this.aggression = Math.max(0.1, this.aggression - 0.1);
        }
        
        if (stats.currentAccuracy > 0.8 && this.aggression < 0.9) {
            this.aggression = Math.min(1.0, this.aggression + 0.05);
        }
    }
}