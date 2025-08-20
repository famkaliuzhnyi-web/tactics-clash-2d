import Cell from './cell';
import ResourceMenu from './resource-menu';
import Modal from '../modal';

const mapRefs = require('../../../instances/map');

export default {
    name       : 'scene-editor',
    components : {
        cell         : Cell,
        resourceMenu : ResourceMenu,
        modal        : Modal
    },
    data() {
        return {
            maps         : mapRefs,
            mapRef       : null,
            currentBrush : null
        };
    },
    methods    : {
        selectMap(mapRef) {
            this.mapRef = mapRef;
        },
        handleClick(ev, x, y) {
            if ( this.currentBrush ) {
                if ( ev.button === 2 ) {
                    this.mapRef.clearBlock(x, y, this.currentBrush.blockGroup.level);
                } else {
                    this.mapRef.createBlock(this.currentBrush, x, y);
                }
            } else if ( ev.button === 2 ) {
                this.mapRef.clearBlock(x, y);
            }
        },
        handleBrush(brush) {
            this.currentBrush = brush;
        }
    }
};
