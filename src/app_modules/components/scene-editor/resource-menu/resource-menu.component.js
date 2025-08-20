import BlockBrush from './block-brush';

const blockTypes  = require('../../../../instances/block-type.js');
const blockGroups = require('../../../../instances/block-group.js');

const filterBlockType = function (initialList, type) {
    return initialList.filter(blockType => blockType.blockGroup === blockGroups[type]);
};

export default {
    name       : 'resource-menu',
    components : {
        blockBrush : BlockBrush
    },
    data() {

        let initialList = Object.keys(blockTypes).map(k => blockTypes[k]);

        return {
            tab              : 0,
            blockTypes_floor : filterBlockType(initialList, 'floor').concat(filterBlockType(initialList, 'water')),
            blockTypes_wall  : filterBlockType(initialList, 'wall'),
            blockTypes_roof  : filterBlockType(initialList, 'roof'),
            blockTypes_asset : filterBlockType(initialList, 'asset').concat(filterBlockType(initialList, 'door')),
            blockTypes_decor : filterBlockType(initialList, 'decor'),
            blockTypes_other : initialList
        };
    },
};
