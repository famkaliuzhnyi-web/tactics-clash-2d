import { BlockType } from '../app_modules/models/block-type.model';

const blockGroup = require('./block-group');

module.exports = {

    // Marker
    marker_team_start_red  : new BlockType({
        id: 'marker_team_start_red',
        blockGroup : blockGroup.marker,
        texture    : 'team_start_red'
    }),
    marker_team_start_blue : new BlockType({
        id: 'marker_team_start_blue',
        blockGroup : blockGroup.marker,
        texture    : 'team_start_blue'
    }),

    // Floor
    floor_water   : new BlockType({
        id: 'floor_water',
        blockGroup : blockGroup.water,
        texture    : 'water'
    }),
    floor_water_2 : new BlockType({
        id: 'floor_water_2',
        blockGroup : blockGroup.water,
        texture    : 'water_2'
    }),
    floor_dirt    : new BlockType({
        id: 'floor_dirt',
        blockGroup : blockGroup.floor,
        texture    : 'dirt'
    }),
    floor_sand    : new BlockType({
        id: 'floor_sand',
        blockGroup : blockGroup.floor,
        texture    : 'sand'
    }),
    floor_grass   : new BlockType({
        id: 'floor_grass',
        blockGroup : blockGroup.floor,
        texture    : 'grass'
    }),
    floor_stone   : new BlockType({
        id: 'floor_stone',
        blockGroup : blockGroup.floor,
        texture    : 'stone'
    }),
    floor_wood    : new BlockType({
        id: 'floor_wood',
        blockGroup : blockGroup.floor,
        texture    : 'wood'
    }),
    floor_wood_2    : new BlockType({
        id: 'floor_wood_2',
        blockGroup : blockGroup.floor,
        texture    : 'wood_2'
    }),
    floor_wood_3    : new BlockType({
        id: 'floor_wood_3',
        blockGroup : blockGroup.floor,
        texture    : 'wood_3'
    }),

    // Wall
    wall_wood  : new BlockType({
        id: 'wall_wood',
        blockGroup : blockGroup.wall,
        maxHealth  : 100,
        texture    : 'wall_wood',
    }),
    wall_wood_2  : new BlockType({
        id: 'wall_wood_2',
        blockGroup : blockGroup.wall,
        maxHealth  : 150,
        texture    : 'wall_wood_2',
    }),
    wall_stone : new BlockType({
        id: 'wall_stone',
        blockGroup : blockGroup.wall,
        maxHealth  : 500,
        texture    : 'wall_stone',
    }),
    wall_brick : new BlockType({
        id: 'wall_brick',
        blockGroup : blockGroup.wall,
        maxHealth  : 500,
        texture    : 'wall_brick',
    }),
    wall_glass : new BlockType({
        id: 'wall_glass',
        blockGroup : blockGroup.wall,
        maxHealth  : 10,
        texture    : 'wall_glass',
    }),

    // Roof
    roof_metal : new BlockType({
        id: 'roof_metal',
        blockGroup : blockGroup.roof,
        texture    : 'roof_metal',
    }),

    // Actor
    actor_solider_pistol : new BlockType({
        id: 'actor_solider_pistol',
        blockGroup : blockGroup.actor,
        maxHealth  : 1,
        texture    : 'actor_solider_pistol'
    }),
    actor_solider_rifle  : new BlockType({
        id: 'actor_solider_rifle',
        blockGroup : blockGroup.actor,
        maxHealth  : 1,
        texture    : 'actor_solider_rifle'
    }),
    actor_solider_sniper : new BlockType({
        id: 'actor_solider_sniper',
        blockGroup : blockGroup.actor,
        maxHealth  : 1,
        texture    : 'actor_solider_sniper'
    }),

    // Door
    door_wood : new BlockType({
        id: 'door_wood',
        blockGroup : blockGroup.door,
        maxHealth  : 20,
        texture    : 'door_wood'
    }),

    //Asset
    asset_barrel     : new BlockType({
        id: 'asset_barrel',
        blockGroup : blockGroup.asset,
        maxHealth  : 50,
        texture    : 'barrel'
    }),
    asset_logs     : new BlockType({
        id: 'asset_logs',
        blockGroup : blockGroup.asset,
        maxHealth  : 75,
        texture    : 'logs'
    }),
    asset_bin_closed : new BlockType({
        id: 'asset_bin_closed',
        blockGroup : blockGroup.asset,
        maxHealth  : 15,
        texture    : 'bin_closed'
    }),
    asset_bin_opened : new BlockType({
        id: 'asset_bin_opened',
        blockGroup : blockGroup.asset,
        maxHealth  : 15,
        texture    : 'bin_opened'
    }),
    asset_box_wood   : new BlockType({
        id: 'asset_box_wood',
        blockGroup : blockGroup.asset,
        maxHealth  : 50,
        texture    : 'box_wood'
    }),
    asset_box_wood_2 : new BlockType({
        id: 'asset_box_wood_2',
        blockGroup : blockGroup.asset,
        maxHealth  : 75,
        texture    : 'box_wood_2'
    }),
    asset_stone_1    : new BlockType({
        id: 'asset_stone_1',
        blockGroup : blockGroup.asset,
        maxHealth  : 100,
        texture    : 'asset_stone_1'
    }),

    //Decor
    decor_grave   : new BlockType({
        id: 'decor_grave',
        blockGroup : blockGroup.decor,
        texture    : 'grave_1'
    }),
    decor_carpet_1   : new BlockType({
        id: 'decor_carpet_1',
        blockGroup : blockGroup.decor,
        texture    : 'carpet_1'
    }),
    decor_grass_1 : new BlockType({
        id: 'decor_grass_1',
        blockGroup : blockGroup.decor,
        texture    : 'grass_1'
    }),
    decor_grass_2 : new BlockType({
        id: 'decor_grass_2',
        blockGroup : blockGroup.decor,
        texture    : 'grass_2'
    }),
    decor_grass_3 : new BlockType({
        id: 'decor_grass_3',
        blockGroup : blockGroup.decor,
        texture    : 'grass_3'
    }),
    decor_grass_4 : new BlockType({
        id: 'decor_grass_4',
        blockGroup : blockGroup.decor,
        texture    : 'grass_4'
    }),
    decor_grass_5 : new BlockType({
        id: 'decor_grass_5',
        blockGroup : blockGroup.decor,
        texture    : 'grass_5'
    }),
    decor_grass_6 : new BlockType({
        id: 'decor_grass_6',
        blockGroup : blockGroup.decor,
        texture    : 'grass_6'
    }),
    decor_stone_1 : new BlockType({
        id: 'decor_stone_1',
        blockGroup : blockGroup.decor,
        texture    : 'stone_1'
    }),
    decor_stone_2 : new BlockType({
        id: 'decor_stone_2',
        blockGroup : blockGroup.decor,
        texture    : 'stone_2'
    }),
    decor_log_1   : new BlockType({
        id: 'decor_log_1',
        blockGroup : blockGroup.decor,
        texture    : 'log_1'
    }),
};
