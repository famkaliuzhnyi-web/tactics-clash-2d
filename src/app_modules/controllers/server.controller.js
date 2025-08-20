import Vue from 'vue';

import { Level } from '../models/level.model';
import { Actor } from '../models/actor.model';
import { Weapon } from '../models/weapon.model';
import { GameController } from './game.controller';
import { GameSessionController } from './game-session.controller';
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

    constructor() {
        this.server            = server;
        this.server.controller = this;
        this.publicKey         = server.peer.id;
        this.game              = new GameController();
    }

    destroy() {
        if ( this.levelRef ) {
            this.levelRef.logic.stop();
            this.levelRef.logic.doOnTick = [];
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
        Object.keys(this.server.connections).forEach(id => {
            let connRef = this.server.connections[id];
            if ( connRef.actor ) {
                actors[id] = connRef.actor.getSerializable();
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
}
