import components from './app_modules/components';
import db from './app_modules/services/db.service';

import {Map} from './app_modules/models/map.model';
import {Level} from './app_modules/models/level.model';
import {Actor} from './app_modules/models/actor.model';
import {Weapon} from './app_modules/models/weapon.model';

const actorTypes = require('./instances/actor-type.js');
const weaponTypes = require('./instances/weapon-type.js');

const MODES = ['demo', 'client', 'server', 'editor'];


export default {
    name: 'app',
    components,
    data() {
        return {
            modes: MODES,
            mapRef: null,
            levelRef: null,
            appMode: MODES[1]
        };
    },
    created: function () {
        this.mapRef = new Map(db.mapTypes.dirt);
        this.mapRef.setSave('default');
        this.mapRef.init();

        this.levelRef = new Level(this.mapRef);

        let weapon = new Weapon(weaponTypes.m4);
        let actor = new Actor(actorTypes.solider, weapon);

        let weapon2 = new Weapon(weaponTypes.sig226);
        let actor2 = new Actor(actorTypes.solider, weapon2);
        console.log(actor);

        this.levelRef.spawnActor(actor, 300, 300);
        this.levelRef.spawnActor(actor2, 400, 300);
        this.levelRef.start();

    },
};
