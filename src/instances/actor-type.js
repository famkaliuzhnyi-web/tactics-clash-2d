import { ActorType } from '../app_modules/models/actor-type.model';

const blockType = require('./block-type');

module.exports = {
    solider: new ActorType({
        maxHealth: 14,
        walkSpeed: 1.5,
        runSpeed: 2.5,
        sprintSpeed: 4
    }),
    sniper: new ActorType({
        maxHealth: 10,
        walkSpeed: 1.0,
        runSpeed: 2.0,
        sprintSpeed: 3.5
    })
};
