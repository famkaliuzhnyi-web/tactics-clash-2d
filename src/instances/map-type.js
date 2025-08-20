import { MapType } from '../app_modules/models/map-type.model';
const blockType = require('./block-type');

module.exports = {
    dirt  : new MapType({
        title            : 'Dirt dusk',
        width            : 56,
        height           : 24,
        defaultBlockType : blockType.floor_dirt,
        ambient          : '#35312a'
    }),
    swamp : new MapType({
        title            : 'Swamp dusk',
        width            : 28,
        height           : 24,
        defaultBlockType : blockType.floor_water_2,
        ambient          : '#55634c'
    })
};
