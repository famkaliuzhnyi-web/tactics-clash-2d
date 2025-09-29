import { BotController } from './bot.controller';
import { Actor } from '../models/actor.model';
import { Weapon } from '../models/weapon.model';

const actorTypes = require('../../instances/actor-type');
const weaponTypes = require('../../instances/weapon-type');

export class BotManager {
    bots = [];
    maxBots = 8;
    serverController = null;
    isEnabled = false;
    
    performanceStats = {
        totalUpdates: 0,
        updateTime: 0,
        averageUpdateTime: 0,
        lastResetTime: Date.now()
    };
    
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

        for (const bot of this.bots) {
            if (bot.controller && bot.actor && !bot.actor.isDead) {
                const shouldUpdate = bot.controller.state === 'engage' || 
                                   (gameTime - bot.controller.lastUpdate) >= bot.controller.updateInterval;
                
                if (shouldUpdate) {
                    bot.controller.update(gameTime);
                }
            }
        }

        const endTime = performance.now();
        const updateTime = endTime - startTime;
        this.performanceStats.updateTime += updateTime;
        this.performanceStats.totalUpdates++;
        this.performanceStats.averageUpdateTime = 
            this.performanceStats.updateTime / this.performanceStats.totalUpdates;

        if (gameTime - this.performanceStats.lastResetTime > 60000) {
            this.resetPerformanceStats();
        }
    }

    addBot(team, difficulty = 'intermediate', personality = null, weaponType = null) {
        if (this.bots.length >= this.maxBots) {
            console.warn('Maximum number of bots reached');
            return null;
        }

        const teamBots = this.bots.filter(bot => bot.team === team);
        if (teamBots.length >= 4) {
            console.warn(`Maximum bots for team ${team} reached`);
            return null;
        }

        if (!personality) {
            personality = this.personalityTypes[Math.floor(Math.random() * this.personalityTypes.length)];
        }

        if (!weaponType) {
            weaponType = this.selectWeaponForPersonality(personality);
        }

        const difficultyConfig = this.difficultyPresets[difficulty] || this.difficultyPresets.intermediate;

        const botConfig = {
            ...difficultyConfig,
            personality: personality,
            teamwork: 0.8
        };

        const botController = new BotController(botConfig);

        const botName = this.generateBotName(personality, this.bots.length + 1);

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
        
        if (bot.actor && this.serverController && this.serverController.levelRef) {
            this.serverController.levelRef.removeActor(bot.actor);
            
            if (this.serverController.levelRef.logic) {
                const actorIndex = this.serverController.levelRef.logic.actors.indexOf(bot.actor);
                if (actorIndex !== -1) {
                    this.serverController.levelRef.logic.actors.splice(actorIndex, 1);
                }
            }
        }

        this.bots.splice(botIndex, 1);
        
        console.log(`Removed bot "${bot.name}"`);
        return true;
    }

    removeAllBots() {
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
            const weapon = new Weapon(weaponTypes[bot.weaponType]);
            
            const actor = new Actor(actorTypes[bot.actorType], weapon);
            actor.characterName = bot.name;
            actor.team = bot.team;
            
            bot.controller.setActor(actor);
            bot.actor = actor;

            const spawnPos = this.getSpawnPositionForTeam(bot.team);
            
            this.serverController.levelRef.spawnActor(actor, spawnPos.x, spawnPos.y);
            
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
        const basePositions = {
            red: { x: 100, y: 100 },
            blue: { x: 700, y: 500 }
        };

        const basePos = basePositions[team] || basePositions.red;
        
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
        
        const validWeapons = weapons.filter(w => availableWeapons.includes(w));
        
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

    balanceTeams() {
        const redBots = this.bots.filter(bot => bot.team === 'red');
        const blueBots = this.bots.filter(bot => bot.team === 'blue');
        
        const difference = Math.abs(redBots.length - blueBots.length);
        
        if (difference > 1) {
            const largerTeam = redBots.length > blueBots.length ? 'red' : 'blue';
            const smallerTeam = largerTeam === 'red' ? 'blue' : 'red';
            
            const botsToMove = largerTeam === 'red' ? redBots : blueBots;
            if (botsToMove.length > 0) {
                const botToMove = botsToMove[Math.floor(Math.random() * botsToMove.length)];
                botToMove.team = smallerTeam;
                
                if (botToMove.actor) {
                    botToMove.actor.team = smallerTeam;
                    
                    this.removeBot(botToMove.id);
                    this.addBot(smallerTeam, botToMove.difficulty, botToMove.personality, botToMove.weaponType);
                }
                
                return true;
            }
        }
        
        return false;
    }

    adjustDifficultyBasedOnPerformance() {
        const adjustableBots = this.bots.filter(bot => 
            bot.difficulty !== 'elite' && Math.random() < 0.1
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