import {ProjectileType} from '../app_modules/models/projectile-type.model';

module.exports = {
    dummy: new ProjectileType({
        damage: 1,
        speed: 1,
        speedRnd: 1,
        length: 10
    }),
    '9x19': new ProjectileType({
        damage: 6,
        speed: 50,
        speedRnd: 3,
        length: 20
    }),
    '5.56x45': new ProjectileType({
        damage: 5,
        speed: 60,
        speedRnd: 3,
        length: 40
    }),
    '7.62x39': new ProjectileType({
        damage: 7,
        speed: 63,
        speedRnd: 5,
        length: 47,
        slowdown: 0.98
    }),
    'g12': new ProjectileType({
        damage: 2,
        speed: 45,
        speedRnd: 3,
        length: 20,
        life: 40
    }),
    '308lapua': new ProjectileType({
        damage: 8,
        speed: 65,
        speedRnd: 0,
        length: 48
    })
};
