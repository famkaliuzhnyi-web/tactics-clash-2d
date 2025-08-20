import { Map } from '../app_modules/models/map.model';
const mapType = require('./map-type');

module.exports = {
    default : new Map(mapType.dirt).setSave('default').init(),
    dirt   : new Map(mapType.dirt).setSave('dirt').init(),
    swamp   : new Map(mapType.swamp).setSave('swamp').init()
};
