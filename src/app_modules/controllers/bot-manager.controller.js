import { BotController } from './bot.controller';
import { Actor } from '../models/actor.model';
import { Weapon } from '../models/weapon.model';

const actorTypes = require('../../instances/actor-type');
const weaponTypes = require('../../instances/weapon-type');

export class BotManager {
    bots = [];
    maxBots = 8; // 4 per team max
    serverController = null;
    isEnabled = false;
    
    // Performance monitoring
    performanceStats = {
        totalUpdates: 0,
        updateTime: 0,
        averageUpdateTime: 0,
        lastResetTime: Date.now()
    };
    
    // Bot configuration presets
    difficultyPresets = {
        novice: {
            reactionTime: 0.8,
            accuracy: 0.3,
            aggression: 0.3,
            updateInterval: 150
        },
        intermediate: {
            reactionTime: 0.5,
            accuracy: 0.6,
            aggression: 0.5,
            updateInterval: 120
        },
        expert: {
            reactionTime: 0.3,
            accuracy: 0.8,
            aggression: 0.7,
            updateInterval: 100
        },
        elite: {
            reactionTime: 0.15,
            accuracy: 0.95,
            aggression: 0.8,
            updateInterval: 80
        }
    };

    personalityTypes = ['aggressive', 'defensive', 'tactical', 'sniper'];

    constructor(serverController) {
        this.serverController = serverController;
    }

    enable() {
        this.isEnabled = true;
    }

    disable() {
        this.isEnabled = false;
        this.removeAllBots();
    }

    update(gameTime) {
        if (!this.isEnabled) return;

        const startTime = performance.now();

        // Update all bot controllers with LOD (Level of Detail) optimization
        for (const bot of this.bots) {
            if (bot.controller && bot.actor && !bot.actor.isDead) {
                // Simple LOD: Update bots less frequently if they're not actively engaging
                const shouldUpdate = bot.controller.state === 'engage' || 
                                   (gameTime - bot.controller.lastUpdate) >= bot.controller.updateInterval;
                
                if (shouldUpdate) {
                    bot.controller.update(gameTime);
                }
            }
        }

        // Update performance stats
        const endTime = performance.now();
        const updateTime = endTime - startTime;
        this.performanceStats.updateTime += updateTime;
        this.performanceStats.totalUpdates++;
        this.performanceStats.averageUpdateTime = 
            this.performanceStats.updateTime / this.performanceStats.totalUpdates;

        // Reset stats every 60 seconds to prevent overflow
        if (gameTime - this.performanceStats.lastResetTime > 60000) {
            this.resetPerformanceStats();
        }
    }

    addBot(team, difficulty = 'intermediate', personality = null, weaponType = null) {
        if (this.bots.length >= this.maxBots) {
            console.warn('Maximum number of bots reached');
            return null;
        }

        // Count bots per team
        const teamBots = this.bots.filter(bot => bot.team === team);
        if (teamBots.length >= 4) {
            console.warn(`Maximum bots for team ${team} reached`);
            return null;
        }

        // Select random personality if not specified
        if (!personality) {
            personality = this.personalityTypes[Math.floor(Math.random() * this.personalityTypes.length)];
        }

        // Select weapon based on personality if not specified
        if (!weaponType) {
            weaponType = this.selectWeaponForPersonality(personality);
        }

        // Get difficulty configuration
        const difficultyConfig = this.difficultyPresets[difficulty] || this.difficultyPresets.intermediate;

        // Create bot configuration
        const botConfig = {
            ...difficultyConfig,
            personality: personality,
            teamwork: 0.8
        };

        // Create bot controller
        const botController = new BotController(botConfig);

        // Generate bot name
        const botName = this.generateBotName(personality, this.bots.length + 1);

        // Create bot data structure
        const bot = {
            id: `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: botName,
            team: team,
            controller: botController,
            actor: null,
            weaponType: weaponType,
            actorType: this.selectActorTypeForPersonality(personality),
            difficulty: difficulty,
            personality: personality
        };

        this.bots.push(bot);
        
        // Spawn the bot if server is ready
        if (this.serverController && this.serverController.levelRef) {
            this.spawnBot(bot);
        }

        console.log(`Added ${difficulty} ${personality} bot "${botName}" to team ${team}`);
        return bot;
    }

    removeBot(botId) {
        const botIndex = this.bots.findIndex(bot => bot.id === botId);
        if (botIndex === -1) return false;

        const bot = this.bots[botIndex];
        
        // Remove actor from game
        if (bot.actor && this.serverController && this.serverController.levelRef) {
            this.serverController.levelRef.removeActor(bot.actor);
            
            // Remove from game controller actors list
            if (this.serverController.levelRef.logic) {
                const actorIndex = this.serverController.levelRef.logic.actors.indexOf(bot.actor);
                if (actorIndex !== -1) {
                    this.serverController.levelRef.logic.actors.splice(actorIndex, 1);
                }
            }
        }

        // Remove from bots array
        this.bots.splice(botIndex, 1);
        
        console.log(`Removed bot "${bot.name}"`);
        return true;
    }

    removeAllBots() {
        // Remove all bots
        while (this.bots.length > 0) {
            this.removeBot(this.bots[0].id);
        }
    }

    spawnBot(bot) {
        if (!this.serverController || !this.serverController.levelRef) {
            console.warn('Cannot spawn bot: server or level not ready');
            return false;
        }

        try {
            // Create weapon
            const weapon = new Weapon(weaponTypes[bot.weaponType]);
            
            // Create actor
            const actor = new Actor(actorTypes[bot.actorType], weapon);
            actor.characterName = bot.name;
            actor.team = bot.team;
            
            // Set bot controller to control the actor
            bot.controller.setActor(actor);
            bot.actor = actor;

            // Get spawn position for team
            const spawnPos = this.getSpawnPositionForTeam(bot.team);
            
            // Spawn actor in level
            this.serverController.levelRef.spawnActor(actor, spawnPos.x, spawnPos.y);
            
            // Add to game controller's actors list
            if (this.serverController.levelRef.logic) {
                this.serverController.levelRef.logic.actors.push(actor);
            }

            console.log(`Spawned bot "${bot.name}" at position (${spawnPos.x}, ${spawnPos.y})`);
            return true;
        } catch (error) {
            console.error('Error spawning bot:', error);
            return false;
        }
    }

    spawnAllBots() {
        for (const bot of this.bots) {
            if (!bot.actor) {
                this.spawnBot(bot);
            }
        }
    }

    getSpawnPositionForTeam(team) {
        // Get team spawn positions (simplified - could use actual spawn points from map)
        const basePositions = {
            red: { x: 100, y: 100 },
            blue: { x: 700, y: 500 }
        };

        const basePos = basePositions[team] || basePositions.red;
        
        // Add some randomization to avoid spawning on top of each other
        return {
            x: basePos.x + (Math.random() - 0.5) * 100,
            y: basePos.y + (Math.random() - 0.5) * 100
        };
    }

    selectWeaponForPersonality(personality) {
        const weaponPreferences = {
            aggressive: ['uzi', 'shotgun', 'mp5'],
            defensive: ['m4', 'ak47', 'mp5'],
            tactical: ['m4', 'ak47', 'mp5'],
            sniper: ['sniper', 'm4']
        };

        const weapons = weaponPreferences[personality] || ['m4'];
        const availableWeapons = Object.keys(weaponTypes);
        
        // Filter to only available weapons
        const validWeapons = weapons.filter(w => availableWeapons.includes(w));
        
        // Return random valid weapon or fallback
        return validWeapons.length > 0 
            ? validWeapons[Math.floor(Math.random() * validWeapons.length)]
            : availableWeapons[0];
    }

    selectActorTypeForPersonality(personality) {
        const actorPreferences = {
            sniper: 'sniper',
            aggressive: 'solider',
            defensive: 'solider',
            tactical: 'solider'
        };

        return actorPreferences[personality] || 'solider';
    }

    generateBotName(personality, index) {
        const nameTemplates = {
            aggressive: ['Rambo', 'Striker', 'Blitz', 'Fury', 'Berserker'],
            defensive: ['Guardian', 'Shield', 'Fortress', 'Bastion', 'Sentinel'],
            tactical: ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'],
            sniper: ['Eagle', 'Hawk', 'Phantom', 'Ghost', 'Shadow']
        };

        const names = nameTemplates[personality] || nameTemplates.tactical;
        const baseName = names[index % names.length];
        
        return `${baseName}${index > names.length ? index - names.length + 1 : ''}`;
    }

    getBotStats() {
        return {
            total: this.bots.length,
            byTeam: {
                red: this.bots.filter(bot => bot.team === 'red').length,
                blue: this.bots.filter(bot => bot.team === 'blue').length
            },
            byDifficulty: this.bots.reduce((acc, bot) => {
                acc[bot.difficulty] = (acc[bot.difficulty] || 0) + 1;
                return acc;
            }, {}),
            byPersonality: this.bots.reduce((acc, bot) => {
                acc[bot.personality] = (acc[bot.personality] || 0) + 1;
                return acc;
            }, {})
        };
    }

    // Get bot data for network synchronization
    getSerializableBotsData() {
        return this.bots.map(bot => ({
            id: bot.id,
            name: bot.name,
            team: bot.team,
            difficulty: bot.difficulty,
            personality: bot.personality,
            weaponType: bot.weaponType,
            actorType: bot.actorType,
            isBot: true
        }));
    }

    // Performance monitoring methods
    resetPerformanceStats() {
        this.performanceStats = {
            totalUpdates: 0,
            updateTime: 0,
            averageUpdateTime: 0,
            lastResetTime: Date.now()
        };
    }

    getPerformanceStats() {
        return {
            ...this.performanceStats,
            activeBots: this.bots.filter(bot => bot.actor && !bot.actor.isDead).length,
            totalBots: this.bots.length,
            isEnabled: this.isEnabled
        };
    }

    // Advanced bot management
    balanceTeams() {
        const redBots = this.bots.filter(bot => bot.team === 'red');
        const blueBots = this.bots.filter(bot => bot.team === 'blue');
        
        const difference = Math.abs(redBots.length - blueBots.length);
        
        if (difference > 1) {
            const largerTeam = redBots.length > blueBots.length ? 'red' : 'blue';
            const smallerTeam = largerTeam === 'red' ? 'blue' : 'red';
            
            // Move one bot from larger team to smaller team
            const botsToMove = largerTeam === 'red' ? redBots : blueBots;
            if (botsToMove.length > 0) {
                const botToMove = botsToMove[Math.floor(Math.random() * botsToMove.length)];
                botToMove.team = smallerTeam;
                
                if (botToMove.actor) {
                    botToMove.actor.team = smallerTeam;
                    
                    // Respawn bot on new team
                    this.removeBot(botToMove.id);
                    this.addBot(smallerTeam, botToMove.difficulty, botToMove.personality, botToMove.weaponType);
                }
                
                return true;
            }
        }
        
        return false;
    }

    // Difficulty scaling based on performance
    adjustDifficultyBasedOnPerformance() {
        // This could be enhanced with actual win/loss tracking
        // For now, just randomly adjust some bot difficulties slightly
        
        const adjustableBots = this.bots.filter(bot => 
            bot.difficulty !== 'elite' && Math.random() < 0.1 // 10% chance
        );
        
        for (const bot of adjustableBots) {
            const currentDifficulties = ['novice', 'intermediate', 'expert', 'elite'];
            const currentIndex = currentDifficulties.indexOf(bot.difficulty);
            
            if (currentIndex !== -1 && currentIndex < currentDifficulties.length - 1) {
                const newDifficulty = currentDifficulties[currentIndex + 1];
                const difficultyConfig = this.difficultyPresets[newDifficulty];
                
                if (difficultyConfig) {
                    Object.assign(bot.controller, difficultyConfig);
                    bot.difficulty = newDifficulty;
                    console.log(`Upgraded ${bot.name} to ${newDifficulty} difficulty`);
                }
            }
        }
    }
}