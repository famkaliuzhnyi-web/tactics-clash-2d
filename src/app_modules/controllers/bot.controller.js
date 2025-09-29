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
    
    // Performance and adaptive behavior
    killCount = 0;
    deathCount = 0;
    damageDealt = 0;
    accuracyHistory = [];
    
    // State transition cooldowns to prevent rapid state switching
    stateTransitionCooldown = 0;
    lastStateChange = 0;

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

        // Update last known position
        this.lastKnownTargetPosition = { x: this.target.x, y: this.target.y };

        // Face and shoot at target
        this.aimAtTarget(this.target);
        this.fireAtTarget(this.target);
        
        // Check if we need to reload
        if (this.actor.weapon.ammo <= 0 && !this.actor.weapon.isReloading) {
            this.actor.controller.isReloading = true;
            this.actor.controller.isFiring = false;
        }
        
        // Move tactically based on personality and health
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
        // Prevent rapid state switching with cooldown
        const now = Date.now();
        if (now - this.lastStateChange < this.stateTransitionCooldown) {
            return;
        }
        
        this.state = newState;
        this.searchTimer = 0;
        this.lastStateChange = now;
        
        // Set appropriate cooldown based on state transition
        switch (newState) {
            case 'engage':
                this.stateTransitionCooldown = 500; // 0.5s cooldown
                break;
            case 'search':
                this.stateTransitionCooldown = 1000; // 1s cooldown
                break;
            default:
                this.stateTransitionCooldown = 200; // 0.2s cooldown
                break;
        }
        
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
        const potentialTargets = [];

        for (const otherActor of allActors) {
            if (otherActor === this.actor || otherActor.isDead) {
                continue;
            }

            // Check if enemy team
            if (otherActor.team !== this.actor.team) {
                const distance = this.distanceTo(otherActor);
                
                // Basic line of sight check
                if (distance < 300 && this.canSeeTarget(otherActor)) {
                    const priority = this.shouldCoordinate() ? 
                        this.getTeamTargetPriority(otherActor) : 1;
                    
                    potentialTargets.push({
                        actor: otherActor,
                        distance: distance,
                        priority: priority,
                        score: priority / (distance / 100) // Higher priority and closer = higher score
                    });
                }
            }
        }

        // Sort by score (higher score = better target)
        potentialTargets.sort((a, b) => b.score - a.score);
        
        return potentialTargets.length > 0 ? potentialTargets[0].actor : null;
    }

    canSeeTarget(target) {
        if (!target || !this.actor || !this.actor.level) return false;
        
        const distance = this.distanceTo(target);
        if (distance > 300) return false; // Beyond visual range
        
        // Simple line of sight check - could be enhanced with raycasting through level geometry
        // For now, just check if target is within reasonable range and not dead
        return !target.isDead && distance < 300;
    }

    findCoverPosition() {
        if (!this.actor || !this.target) return null;
        
        // Simple cover finding - try to find a position that puts distance between bot and target
        const escapeDistance = 150;
        const coverPositions = [];
        
        // Generate potential cover positions in a circle around current position
        for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 4) {
            const coverX = this.actor.x + Math.cos(angle) * escapeDistance;
            const coverY = this.actor.y + Math.sin(angle) * escapeDistance;
            
            // Check if this position increases distance from target
            const currentDistance = this.distanceTo(this.target);
            const newDistance = Math.sqrt(
                (coverX - this.target.x) ** 2 + (coverY - this.target.y) ** 2
            );
            
            if (newDistance > currentDistance) {
                coverPositions.push({ x: coverX, y: coverY, distance: newDistance });
            }
        }
        
        // Return the position that maximizes distance from target
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
        
        // Add simple movement prediction for higher difficulty bots
        if (this.accuracy > 0.7) {
            // Estimate where target will be based on their movement
            const timeSinceLastUpdate = Date.now() - this.lastUpdate;
            const movementPredictionTime = 0.1; // Predict 100ms ahead
            
            // Simple velocity estimation (this could be enhanced with actual velocity tracking)
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
                
                // Apply prediction
                aimX += velocityX * movementPredictionTime;
                aimY += velocityY * movementPredictionTime;
            }
        }

        // Add inaccuracy based on accuracy setting and distance
        const distance = this.distanceTo(target);
        const baseInaccuracy = (1 - this.accuracy) * 40;
        const distanceInaccuracy = Math.max(0, (distance - 100) / 10); // More inaccuracy at longer ranges
        const totalInaccuracy = baseInaccuracy + distanceInaccuracy;
        
        const offsetX = (Math.random() - 0.5) * totalInaccuracy;
        const offsetY = (Math.random() - 0.5) * totalInaccuracy;

        this.actor.controller.facingX = aimX + offsetX;
        this.actor.controller.facingY = aimY + offsetY;
    }

    fireAtTarget(target) {
        if (!target) return;

        // Apply reaction time delay
        const timeSinceEngaged = Date.now() - this.engageStartTime;
        if (timeSinceEngaged < this.reactionTime * 1000) {
            return;
        }

        // Track firing for accuracy statistics
        const shotFired = !this.actor.controller.isFiring;
        this.actor.controller.isFiring = true;
        
        if (shotFired) {
            // Simple accuracy tracking - this could be enhanced with actual hit detection
            const distance = this.distanceTo(target);
            const expectedAccuracy = Math.max(0.1, this.accuracy - (distance / 1000));
            const hitProbability = Math.random() < expectedAccuracy ? 1 : 0;
            
            this.accuracyHistory.push(hitProbability);
            if (this.accuracyHistory.length > 20) {
                this.accuracyHistory.shift(); // Keep only last 20 shots
            }
        }
    }

    updateTacticalMovement() {
        if (!this.target) return;

        const distance = this.distanceTo(this.target);
        const healthPercentage = this.actor.health / this.actor.model.maxHealth;
        
        // If health is low, be more defensive
        const effectivePersonality = healthPercentage < 0.3 ? 'defensive' : this.personality;
        
        switch (effectivePersonality) {
            case 'aggressive':
                // Move towards enemy aggressively
                if (distance > 80) {
                    this.moveTowardsTarget(this.target);
                } else {
                    // Too close, strafe to maintain pressure
                    this.strafeAroundTarget();
                }
                break;
                
            case 'defensive':
                // Keep distance and find cover when possible
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
                // Maintain long range, avoid close combat
                if (distance < 250) {
                    this.moveAwayFromTarget(this.target);
                } else if (distance > 400) {
                    this.moveTowardsTarget(this.target);
                } else {
                    // Good range, minimal movement to maintain accuracy
                    this.clearMovementControls();
                }
                break;
                
            case 'tactical':
            default:
                // Balanced approach - maintain optimal range with some movement
                if (distance > 220) {
                    this.moveTowardsTarget(this.target);
                } else if (distance < 120) {
                    this.moveAwayFromTarget(this.target);
                } else {
                    // Optimal range - do some tactical movement
                    if (Math.random() < 0.3) { // 30% chance to strafe each update
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
            // Calculate the angle to target
            const targetAngle = Math.atan2(dy, dx);
            const currentRotation = this.actor.rotation;
            
            // Calculate angle difference
            let angleDiff = targetAngle - currentRotation;
            
            // Normalize angle difference to [-π, π]
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            // Choose movement direction based on angle difference
            this.clearMovementControls();
            
            if (Math.abs(angleDiff) < Math.PI / 4) {
                // Target is roughly forward
                this.actor.controller.isMovingForward = true;
            } else if (Math.abs(angleDiff) > 3 * Math.PI / 4) {
                // Target is roughly behind
                this.actor.controller.isMovingBackwards = true;
            } else if (angleDiff > 0) {
                // Target is to the right
                this.actor.controller.isMovingRight = true;
            } else {
                // Target is to the left
                this.actor.controller.isMovingLeft = true;
            }
            
            // Face towards the target while moving
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
            // Calculate the angle away from target
            const targetAngle = Math.atan2(dy, dx);
            const currentRotation = this.actor.rotation;
            
            // Calculate angle difference
            let angleDiff = targetAngle - currentRotation;
            
            // Normalize angle difference to [-π, π]
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            // Choose movement direction
            this.clearMovementControls();
            
            if (Math.abs(angleDiff) < Math.PI / 4) {
                // Away direction is roughly forward
                this.actor.controller.isMovingForward = true;
            } else if (Math.abs(angleDiff) > 3 * Math.PI / 4) {
                // Away direction is roughly behind
                this.actor.controller.isMovingBackwards = true;
            } else if (angleDiff > 0) {
                // Away direction is to the right
                this.actor.controller.isMovingRight = true;
            } else {
                // Away direction is to the left
                this.actor.controller.isMovingLeft = true;
            }
            
            // Keep facing the target while moving away
            this.actor.controller.facingX = target.x;
            this.actor.controller.facingY = target.y;
        }
    }

    strafeAroundTarget() {
        if (!this.target || !this.actor) return;
        
        // Simple strafing pattern - alternate between left and right
        const time = Date.now() / 1000;
        const strafeDirection = Math.sin(time * 2) > 0 ? 1 : -1;
        
        this.clearMovementControls();
        this.actor.controller.isMovingLeft = strafeDirection < 0;
        this.actor.controller.isMovingRight = strafeDirection > 0;
        
        // Keep facing the target while strafing
        this.actor.controller.facingX = this.target.x;
        this.actor.controller.facingY = this.target.y;
    }

    setMovementFromDirection(directionX, directionY) {
        // This method is no longer used with the improved movement system
        // but kept for compatibility
        this.clearMovementControls();

        // Simple fallback to forward movement
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

    // Team coordination methods
    findNearbyTeammates() {
        if (!this.actor || !this.actor.level) return [];
        
        const teammates = [];
        const allActors = this.actor.level.logic.actors;
        
        for (const otherActor of allActors) {
            if (otherActor !== this.actor && 
                otherActor.team === this.actor.team && 
                !otherActor.isDead) {
                
                const distance = this.distanceTo(otherActor);
                if (distance < 200) { // Within coordination range
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
        
        // Check if teammates are already engaging this target
        const teammates = this.findNearbyTeammates();
        let engagingCount = 0;
        
        for (const teammate of teammates) {
            // Simple check if teammate might be engaging same target
            const teammateDistance = Math.sqrt(
                (teammate.actor.x - target.x) ** 2 + 
                (teammate.actor.y - target.y) ** 2
            );
            if (teammateDistance < 250) {
                engagingCount++;
            }
        }
        
        // Prefer targets that fewer teammates are engaging
        return Math.max(1, 3 - engagingCount);
    }

    distanceToTarget(target) {
        if (!target || !this.actor) return Infinity;
        const dx = target.x - this.actor.x;
        const dy = target.y - this.actor.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Performance and statistics methods
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

    // Event handlers for performance tracking
    onKill() {
        this.killCount++;
    }

    onDeath() {
        this.deathCount++;
        // Reset to idle state on death
        this.setState('idle');
        this.target = null;
        this.lastKnownTargetPosition = null;
    }

    onDamageDealt(amount) {
        this.damageDealt += amount;
    }

    // Adaptive behavior based on performance
    adaptBehavior() {
        const stats = this.getPerformanceStats();
        
        // If accuracy is consistently low, reduce aggression slightly
        if (stats.currentAccuracy < 0.3 && this.aggression > 0.3) {
            this.aggression = Math.max(0.1, this.aggression - 0.1);
        }
        
        // If performing well, increase aggression slightly
        if (stats.currentAccuracy > 0.8 && this.aggression < 0.9) {
            this.aggression = Math.min(1.0, this.aggression + 0.05);
        }
    }
}