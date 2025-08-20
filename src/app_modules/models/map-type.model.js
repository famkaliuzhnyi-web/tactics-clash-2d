import {Block} from './block.model';

class WrongMapSize {}

export class MapType {
    width    = 0;
    height   = 0;
    ambient = '#000';
    title;
    defaultBlockType;

    constructor(data) {
        Object.assign(this, data);
    }
}
