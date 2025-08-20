const Vue = require('vue');
import {Projectile} from './projectile.model';
const projectileTypes = require('../../instances/projectile-type');

const projectileBufferSize = 100;
const dummyProjectile = new Projectile(projectileTypes.dummy);

export class ClientLevel {
    shouldRenderProjectiles = true;
    schema;
    actors;
    projectiles;
    projectilesFetched = 0;
    ambient = '#000';
    width;
    height;

    constructor() {
        this.schema      = {};
        this.actors      = [];
        this.projectiles = new Array(projectileBufferSize).fill().map(() => dummyProjectile.getSerializable());
    }

    setState(data) {
        this.schema      = data.schema;
        this.width       = data.mapWidth;
        this.height      = data.mapHeight;
        this.fetchProjectiles(data.projectiles);
    }

    fetchProjectiles(projectiles) {
        let i = 0;
        for ( let limit = Math.min(projectiles.length, projectileBufferSize); i < limit; i++) {
            Object.assign(this.projectiles[i], projectiles[i]);
        }
        for ( let j = i; j < this.projectilesFetched; j++) {
            this.projectiles[j].length = 0;
        }
        this.projectilesFetched = i;
    }

    updateState(data) {
        this.fetchProjectiles(data.projectiles);

        Object.keys(data.blockUpdates).forEach(y => {
            Object.keys(data.blockUpdates[y]).forEach(x => {
                Object.keys(data.blockUpdates[y][x]).forEach(level => {
                    let hp = data.blockUpdates[y][x][level];

                    if ( hp ) {
                        this.schema[y][x][level].health = hp;
                    } else {
                        Vue.delete(this.schema[y][x], level);
                    }
                });
            });
        });
    }

    spawnActor(actor, x, y) {
        actor.x     = x;
        actor.y     = y;
        actor.level = this;
        this.actors.push(actor);
    }

    removeActor(actor) {
        let ind = this.actors.indexOf(actor);
        if ( ind >= 0 ) {
            this.actors.splice(ind, 1);
        }
    }
}
