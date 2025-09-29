import Vue from 'vue';

import { Level } from '../models/level.model';
import { Actor } from '../models/actor.model';
import { Weapon } from '../models/weapon.model';
import { GameController } from './game.controller';
import { GameSessionController } from './game-session.controller';
import { BotManager } from './bot-manager.controller';
const server      = require('../services/server.connection.service');
const maps        = require('../../instances/map');
const actorTypes  = require('../../instances/actor-type');
const weaponTypes = require('../../instances/weapon-type');

const STAGES = ['configure', 'serve'];

export const finishTimer = 5000000;

export class ServerController {
    publicKey;
    server;
    stages           = STAGES;
    stage            = STAGES[0];
    selectedMap      = '';
    mapRef;
    levelRef;
    availableWeapons = (() => {
        let result = {};
        Object.keys(weaponTypes).forEach(k => result[k] = true);
        return result;
    })();
    levelParams;
    gameSession;
    teamMembers      = {
        red  : [],
        blue : []
    };
    botManager;

    constructor() {
        this.server            = server;
        this.server.controller = this;
        this.publicKey         = server.peer.id;
        this.game              = new GameController();
        this.botManager        = new BotManager(this);
    }

    destroy() {
        if ( this.levelRef ) {
            this.levelRef.logic.stop();
            this.levelRef.logic.doOnTick = [];
        }
        if ( this.botManager ) {
            this.botManager.disable();
        }
    }

    checkConfiguration(params) {
        this.levelParams = params;

        if ( this.selectedMap && maps[this.selectedMap] &&
            params.maxPlayers && params.maxPlayers > 0 &&
            params.redTeamName &&
            params.blueTeamName &&
            Object.keys(this.availableWeapons).reduce((acc, k) => acc + (this.availableWeapons[k] && 1 || 0), 0) ) {
            this.createLobby();
        }
    }

    createLobby() {
        if ( this.gameSession ) { this.gameSession.stop(); }
        this.gameSession               = new GameSessionController();
        this.gameSession.onstateChange = state => {
            this.server.send({
                action : 'gameSessionState',
                data   : state
            });
        };
        this.gameSession.onfinish      = () => {
            this.server.send({
                action : 'sessionScore',
                data   : {
                    winTeam : this.gameSession.latestWinTeam,
                    scores  : this.gameSession.playerScores
                }
            });
            setTimeout(() => {
                this.resetLevel();
                this.resetActors();
                this.gameSession.resetAlive();
                this.gameSession.start();
            }, finishTimer);
        };
        this.gameSession.start();
        this.initLevel();
    }

    initLevel() {
        this.mapRef = maps[this.selectedMap];
        this.mapRef.setSave(this.selectedMap);
        this.mapRef.init();

        this.levelRef = new Level(this.mapRef);
        this.levelRef.logic.doOnTick.push(this.handleTick.bind(this));
        this.levelRef.onKill = (target, killer) => {
            this.gameSession.handleKill(target, killer);
        };
        this.levelRef.start();

        // Enable and spawn bots after level is ready
        this.botManager.enable();
        
        // Add some test bots for demonstration
        this.addTestBots();
        
        this.botManager.spawnAllBots();

        this.stage = this.stages[1];
    }

    resetLevel() {
        this.levelRef.stop();
        this.levelRef._createSchema();
        this.levelRef.start();
        this.server.send({
            action : 'levelState',
            data   : this.formatGameState(this.server)
        });
    }

    resetActors() {
        Object.keys(this.server.connections).forEach(pid => {
            let connRef = this.server.connections[pid];

            if ( connRef.actor && connRef.team ) {
                this.levelRef.spawnTeamActor(connRef.actor, connRef.team);
            }
        });
        
        // Respawn bots after reset
        this.botManager.spawnAllBots();
    }

    spawnActor(connRef) {
        let weaponKey = connRef.chosenWeapon;
        let actorKey  = 'solider';

        let weapon = new Weapon(weaponTypes[weaponKey]);
        Vue.set(connRef, 'actor', new Actor(actorTypes[actorKey], weapon));
        connRef.actor.keys         = {weaponKey, actorKey};
        connRef.actor.team         = connRef.team;
        connRef.actor.connectionId = connRef.id;

        this.gameSession.registerPlayer(connRef);

        this.levelRef.spawnTeamActor(connRef.actor, connRef.team);

        this.server.send({
            action : 'spawnActor',
            data   : {
                id   : connRef.id,
                team : connRef.team,
                x    : connRef.actor.x,
                y    : connRef.actor.y,
                weaponKey, actorKey
            }
        });
    }

    _formatGameState(state) {
        let actors = {};
        
        // Add human players
        Object.keys(this.server.connections).forEach(id => {
            let connRef = this.server.connections[id];
            if ( connRef.actor ) {
                actors[id] = connRef.actor.getSerializable();
            }
        });
        
        // Add bots
        this.botManager.bots.forEach(bot => {
            if (bot.actor) {
                actors[bot.id] = bot.actor.getSerializable();
            }
        });

        return {...state, actors};
    }

    formatGameState(connRef) {
        Object.keys(this.server.connections).forEach(uid => {
            let pConnRef = this.server.connections[uid];
            if ( pConnRef.name ) {
                connRef.send({
                    action : 'playerConnected',
                    data   : {
                        id   : pConnRef.id,
                        name : pConnRef.name
                    }
                });
                if ( pConnRef.actor ) {
                    connRef.send({
                        action : 'spawnActor',
                        data   : {
                            id        : uid,
                            x         : pConnRef.actor.x,
                            y         : pConnRef.actor.y,
                            team      : pConnRef.team,
                            weaponKey : pConnRef.actor.keys.weaponKey,
                            actorKey  : pConnRef.actor.keys.actorKey
                        }
                    });
                }
            }
        });
        
        // Send bot information to clients
        this.botManager.bots.forEach(bot => {
            connRef.send({
                action : 'playerConnected',
                data   : {
                    id   : bot.id,
                    name : bot.name,
                    isBot: true
                }
            });
            if ( bot.actor ) {
                connRef.send({
                    action : 'spawnActor',
                    data   : {
                        id        : bot.id,
                        x         : bot.actor.x,
                        y         : bot.actor.y,
                        team      : bot.team,
                        weaponKey : bot.weaponType,
                        actorKey  : bot.actorType,
                        isBot     : true
                    }
                });
            }
        });

        return {
            levelParams      : this.levelParams,
            availableWeapons : this.availableWeapons,
            ...this._formatGameState(this.levelRef.getState())
        };
    }

    formatGameUpdate() {
        return this._formatGameState(this.levelRef.getUpdate());
    }

    handleTick() {
        // Update bots
        if (this.botManager) {
            this.botManager.update(Date.now());
        }
        
        this.server.send({
            action : 'tickUpdate',
            data   : this.formatGameUpdate()
        });
    }


    messageHandlers = {
        'getLevelState'         : connRef => {
            connRef.send({
                action : 'levelState',
                data   : this.formatGameState(connRef)
            });
        },
        'registerPlayer'        : (connRef, data, req) => {
            if ( data.name && data.weapon && this.availableWeapons[data.weapon] &&
                data.team && this.teamMembers[data.team] ) {

                Vue.set(connRef, 'chosenWeapon', data.weapon);
                Vue.set(connRef, 'team', data.team);
                Vue.set(connRef, 'name', data.name);
                Vue.set(connRef, 'registeredAt', Date.now());

                connRef.send({
                    action : 'registerSuccess',
                    data   : {
                        id : connRef.id
                    }
                });

                this.server.send({
                    action : 'playerConnected',
                    data   : {
                        id   : connRef.id,
                        name : connRef.name
                    }
                });

                this.spawnActor(connRef);
            }

        },
        'updateActorController' : (connRef, data) => {
            connRef.updateControls(data);
        },
        'addBot' : (connRef, data) => {
            const { team, difficulty, personality, weaponType } = data;
            const bot = this.addBot(team, difficulty, personality, weaponType);
            connRef.send({
                action : 'botAdded',
                data   : bot ? { success: true, botId: bot.id } : { success: false }
            });
        },
        'removeBot' : (connRef, data) => {
            const { botId } = data;
            const success = this.removeBot(botId);
            connRef.send({
                action : 'botRemoved',
                data   : { success, botId }
            });
        },
        'getBotStats' : (connRef, data) => {
            connRef.send({
                action : 'botStats',
                data   : this.getBotStats()
            });
        },
        'toggleBots' : (connRef, data) => {
            const enabled = this.toggleBots(data.enabled);
            connRef.send({
                action : 'botsToggled',
                data   : { enabled }
            });
        }
    };

    handleClientMessage(connRef, req) {
        if ( this.messageHandlers[req.action] ) {
            this.messageHandlers[req.action](connRef, req.data, req)
        }
    }

    deletePlayer(id) {
        let connRef = this.server.connections[id];
        if ( connRef.actor ) {
            this.gameSession.removePlayer(connRef);
        }
        this.server.send({
            action : 'playerDisconnected',
            data   : {
                id
            }
        });

        Vue.delete(this.server.connections, id);
    }

    // Bot management methods
    addTestBots() {
        // Add a couple of test bots to each team for demonstration
        this.botManager.addBot('red', 'intermediate', 'tactical');
        this.botManager.addBot('red', 'novice', 'aggressive');
        this.botManager.addBot('blue', 'intermediate', 'defensive');
        this.botManager.addBot('blue', 'expert', 'sniper');
    }

    addBot(team, difficulty = 'intermediate', personality = null, weaponType = null) {
        const bot = this.botManager.addBot(team, difficulty, personality, weaponType);
        
        // Notify all clients about the new bot
        if (bot && bot.actor) {
            this.server.send({
                action : 'playerConnected',
                data   : {
                    id   : bot.id,
                    name : bot.name,
                    isBot: true
                }
            });
            
            this.server.send({
                action : 'spawnActor',
                data   : {
                    id        : bot.id,
                    x         : bot.actor.x,
                    y         : bot.actor.y,
                    team      : bot.team,
                    weaponKey : bot.weaponType,
                    actorKey  : bot.actorType,
                    isBot     : true
                }
            });
        }
        
        return bot;
    }

    removeBot(botId) {
        const success = this.botManager.removeBot(botId);
        
        // Notify all clients about bot removal
        if (success) {
            this.server.send({
                action : 'playerDisconnected',
                data   : {
                    id: botId
                }
            });
        }
        
        return success;
    }

    getBotStats() {
        return this.botManager.getBotStats();
    }

    // Configuration methods for bot settings
    setBotDifficulty(botId, difficulty) {
        const bot = this.botManager.bots.find(b => b.id === botId);
        if (bot && bot.controller) {
            const difficultyConfig = this.botManager.difficultyPresets[difficulty];
            if (difficultyConfig) {
                Object.assign(bot.controller, difficultyConfig);
                bot.difficulty = difficulty;
                return true;
            }
        }
        return false;
    }

    toggleBots(enabled = null) {
        if (enabled === null) {
            enabled = !this.botManager.isEnabled;
        }
        
        if (enabled) {
            this.botManager.enable();
        } else {
            this.botManager.disable();
        }
        
        return this.botManager.isEnabled;
    }
}
