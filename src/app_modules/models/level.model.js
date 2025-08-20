import { GameController } from '../controllers/game.controller';
import gameSceneService from '../services/game-scene.service';
import { Block } from "./block.model";

const blockTypes          = require('../../instances/block-type');
const redTeamMarkerBlock  = blockTypes.marker_team_start_red;
const blueTeamMarkerBlock = blockTypes.marker_team_start_blue;

const Vue = require('vue');

const blockSize         = gameSceneService.unitsPerBlock;
const actorSize         = gameSceneService.unitsPerBlock - 10;
const actorSizeDetailed = {
    offsetFrom : Math.floor((blockSize - actorSize) / 2),
    offsetTo   : Math.floor((blockSize - actorSize) / 2) + actorSize,
};

export class Level {
    map;
    actors;
    projectiles;
    logic;
    schema;
    blockUpdates = {};
    startingPoints;
    boundaries;
    onKill       = () => {};

    constructor(map) {
        this.map         = map;
        this.actors      = [];
        this.projectiles = [];
        this.logic       = new GameController();
        this.logic.setLevel(this);

        this._createSchema();
        this.recalculateBoundaries();
    }

    getState() {
        let schema = [];
        this.schema.forEach((row, y) => {
            schema[y] = [];
            this.schema[y].forEach((levelMap, x) => {
                schema[y][x] = {};
                Object.keys(levelMap).forEach(level => {
                    schema[y][x][level] = this.schema[y][x][level].getSerializable();
                });
            });
        });

        let projectiles = this.projectiles.map(p => p.getSerializable());

        return {schema, projectiles, mapWidth : this.map.model.width, mapHeight : this.map.model.height};
    }

    getUpdate() {
        let data          = {
            blockUpdates : this.blockUpdates,
            projectiles  : this.projectiles.map(p => p.getSerializable())
        };
        this.blockUpdates = {};

        return data;
    }


    // Initialization
    _createSchema() {
        this.schema         = [];
        this.startingPoints = {
            red  : [],
            blue : []
        };

        this.map.schema.forEach((row, y) => {
            this.schema[y] = [];
            this.map.schema[y].forEach((levelMap, x) => {
                this.schema[y][x] = {};
                Object.keys(levelMap).forEach(level => {
                    this.schema[y][x][level] = new Block(levelMap[level].model);

                    if ( levelMap[level].model.id === redTeamMarkerBlock.id ) {
                        this.startingPoints.red.push([x, y]);
                    }
                    if ( levelMap[level].model.id === blueTeamMarkerBlock.id ) {
                        this.startingPoints.blue.push([x, y]);
                    }
                });
            });
        });
    }

    start() {
        this.recalculateCollisions();
        this.recalculateHitCollisions();
        this.logic.start();
    }

    stop() {
        this.logic.stop();
    }


    // Registering entities
    spawnTeamActor(actor, team) {
        let startingPoint = this.startingPoints[team][Math.floor(Math.random() * this.startingPoints[team].length)];
        this.spawnActor(actor, gameSceneService.blockToUnit(startingPoint[0]), gameSceneService.blockToUnit(startingPoint[1]));
    }

    spawnActor(actor, x, y) {
        actor.x     = x;
        actor.y     = y;
        actor.level = this;
        if ( this.logic.actors.indexOf(actor) === -1 ) {
            this.logic.actors.push(actor);
        }
        if ( this.actors.indexOf(actor) === -1 ) {
            this.actors.push(actor);
        }
    }

    spawnProjectile(projectile, actor) {
        projectile.level = this;
        projectile.actor = actor;
        this.logic.projectiles.push(projectile);
        this.projectiles.push(projectile);
    }

    removeProjectile(projectile) {
        this.logic.projectiles.splice(this.logic.projectiles.indexOf(projectile), 1);
        this.projectiles.splice(this.projectiles.indexOf(projectile), 1);
    }


    // Hit logic
    hitWithProjectile(x, y, projectile) {
        let levelMap = this.schema[y][x];
        Object.keys(levelMap).forEach(level => {
            let block = levelMap[level];
            if ( block.model.blockGroup.isDestructible ) {
                block.health -= projectile.damage;

                this.blockUpdates[y]    = this.blockUpdates[y] || {};
                this.blockUpdates[y][x] = this.blockUpdates[y][x] || {};

                if ( block.health <= 0 ) {
                    Vue.delete(this.schema[y][x], level);
                    this.recalculateCollisions();
                    this.recalculateHitCollisions();
                    this.blockUpdates[y][x][level] = 0;
                } else {
                    this.blockUpdates[y][x][level] = block.health;
                }
            }
        });
    }

    hitActorWithProjectile(actor, projectile) {
        let newHealth = actor.health - projectile.damage;
        if ( newHealth <= 0 ) {
            actor.health = 0;
            actor.isDead = true;
            this.onKill(actor, projectile.actor);
        } else {
            actor.health = newHealth;
        }
    }


    // Collission detection
    /**
     * ----------------------------- !!! R E A D !!! -----------------------------
     * @param collisions
     * @param x
     * @param y
     * @param angle
     * @returns {*[]}
     *
     * before you start optimisations note 2 things:
     * 1. This is shitty-to-read algorithm of checking boxes collissions
     * 2. This shitty-to-read algorithm has O(1) complexity, so if you thinking to rewrite it JUST FUCK OFF!
     */
    filterPositionCollision(collisions, x, y, angle) {
        x = Math.min(this.boundaries.maxX, Math.max(0, x));
        y = Math.min(this.boundaries.maxY, Math.max(0, y));

        let blockX  = gameSceneService.unitToBlock(x);
        let blockY  = gameSceneService.unitToBlock(y);
        let blockNX = Math.floor(blockX);
        let blockNY = Math.floor(blockY);
        let blockCX = Math.ceil(blockX);
        let blockCY = Math.ceil(blockY);

        if ( collisions[blockNY] && collisions[blockNY][blockNX] ) {
            //console.log('collission top-left!');
            let diffX = blockCX - blockX;
            let diffY = blockCY - blockY;

            if ( diffX < diffY ) {
                if ( !collisions[blockNY][blockCX] ) {
                    x = gameSceneService.blockToUnit(blockCX);
                } else if ( !collisions[blockCY][blockNX] ) {
                    y = gameSceneService.blockToUnit(blockCY);
                } else {
                    x = gameSceneService.blockToUnit(blockCX);
                    y = gameSceneService.blockToUnit(blockCY);
                }
            } else {
                if ( !collisions[blockCY][blockNX] ) {
                    y = gameSceneService.blockToUnit(blockCY);
                } else if ( !collisions[blockNY][blockCX] ) {
                    x = gameSceneService.blockToUnit(blockCX);
                } else {
                    y = gameSceneService.blockToUnit(blockCY);
                    x = gameSceneService.blockToUnit(blockCX);
                }
            }

        }
        if ( collisions[blockNY] && collisions[blockNY][blockCX] ) {
            //console.log('collission top-right!');
            let diffX = blockX - blockNX;
            let diffY = blockCY - blockY;

            if ( diffX < diffY ) {
                if ( !collisions[blockNY][blockNX] ) {
                    x = gameSceneService.blockToUnit(blockNX);
                } else if ( !collisions[blockCY][blockCX] ) {
                    y = gameSceneService.blockToUnit(blockCY);
                } else {
                    x = gameSceneService.blockToUnit(blockNX);
                    y = gameSceneService.blockToUnit(blockCY);
                }
            } else {
                if ( !collisions[blockCY][blockCX] ) {
                    y = gameSceneService.blockToUnit(blockCY);
                } else if ( !collisions[blockNY][blockCX] ) {
                    x = gameSceneService.blockToUnit(blockNX);
                } else {
                    y = gameSceneService.blockToUnit(blockCY);
                    x = gameSceneService.blockToUnit(blockNX);
                }
            }

        }
        if ( collisions[blockCY] && collisions[blockCY][blockNX] ) {
            //console.log('collission bottom left!');
            let diffX = blockCX - blockX;
            let diffY = blockY - blockNY;

            if ( diffX < diffY ) {
                if ( !collisions[blockCY][blockCX] ) {
                    x = gameSceneService.blockToUnit(blockCX);
                } else if ( !collisions[blockNY][blockNX] ) {
                    y = gameSceneService.blockToUnit(blockNY);
                } else {
                    x = gameSceneService.blockToUnit(blockCX);
                    y = gameSceneService.blockToUnit(blockNY);
                }
            } else {
                if ( !collisions[blockNY][blockNX] ) {
                    y = gameSceneService.blockToUnit(blockNY);
                } else if ( !collisions[blockCY][blockCX] ) {
                    x = gameSceneService.blockToUnit(blockCX);
                } else {
                    y = gameSceneService.blockToUnit(blockNY);
                    x = gameSceneService.blockToUnit(blockCX);
                }
            }

        }
        if ( collisions[blockCY] && collisions[blockCY][blockCX] ) {
            //console.log('collission bottom right!');
            let diffX = blockX - blockNX;
            let diffY = blockY - blockNY;

            if ( diffX < diffY ) {
                if ( !collisions[blockCY][blockNX] ) {
                    x = gameSceneService.blockToUnit(blockNX);
                } else if ( !collisions[blockNY][blockCX] ) {
                    y = gameSceneService.blockToUnit(blockNY);
                } else {
                    x = gameSceneService.blockToUnit(blockNX);
                    y = gameSceneService.blockToUnit(blockNY);
                }
            } else {
                if ( !collisions[blockNY][blockCX] ) {
                    y = gameSceneService.blockToUnit(blockNY);
                } else if ( !collisions[blockCY][blockNX] ) {
                    x = gameSceneService.blockToUnit(blockNX);
                } else {
                    y = gameSceneService.blockToUnit(blockNY);
                    x = gameSceneService.blockToUnit(blockNX);
                }
            }

        }

        //console.log(
        //    blockX,
        //    blockY,
        //    blockNX,
        //    blockNY
        //);
        return [x, y];
    }

    filterProjectilePositionCollision(projectile, collisions, x, y) {
        let blockX  = gameSceneService.unitToBlock(x);
        let blockY  = gameSceneService.unitToBlock(y);
        let blockNX = Math.floor(blockX);
        let blockNY = Math.floor(blockY);

        // Check actor hit
        for (let i = 0; i < this.actors.length; i++) {
            let actor = this.actors[i];
            if ( !actor.isDead &&
                actor !== projectile.actor &&
                x > actor.x + actorSizeDetailed.offsetFrom && x < actor.x + actorSizeDetailed.offsetTo &&
                y > actor.y + actorSizeDetailed.offsetFrom && y < actor.y + actorSizeDetailed.offsetTo ) {
                return [x, y, null, null, actor];
            }
        }

        if ( collisions[blockNY] && collisions[blockNY][blockNX] ) {
            return [x, y, blockNX, blockNY];
        }

        return [x, y];
    }

    _recalculateCollisions(condition, key) {
        let newCollisions = {};
        for (let y = 0; y < this.map.model.height; y++) {
            newCollisions[y] = newCollisions[y] || {};
            for (let x = 0; x < this.map.model.width; x++) {

                let indexes = Object.keys(this.schema[y][x]);
                for (let i = 0; i < indexes.length; i++) {
                    let ind   = indexes[i];
                    let block = this.schema[y][x][ind];

                    if ( condition(block.model.blockGroup) ) {
                        newCollisions[y][x] = true;
                        break;
                    }
                }

            }
        }
        this[key] = newCollisions;
    }

    recalculateBoundaries() {
        this.boundaries = {
            maxX : gameSceneService.blockToUnit(this.map.model.width) - gameSceneService.unitsPerBlock,
            maxY : gameSceneService.blockToUnit(this.map.model.height) - gameSceneService.unitsPerBlock
        };
    }

    recalculateCollisions() {
        this._recalculateCollisions(grp => !grp.isWalkable || grp.isCollide, 'collisions');
    }

    recalculateHitCollisions() {
        this._recalculateCollisions(grp => grp.isDestructible, 'hitCollisions');
    }

}
