const Vue = require('vue');

import { Block } from './block.model';
import clientStorage from '../services/client-storage.service';

const blockTypes = require('../../instances/block-type');

class WrongMapSize {}

const storagePrefix = 'map-savepoint-';

export class Map {
    isInited = false;
    model;
    schema;
    blocks;
    autosave;

    constructor(mapType) {
        this.schema = [];
        this.blocks = [];
        this.model  = mapType;
    }

    init() {
        this.recalculateSchema();
        this.isInited = true;
        return this;
    }

    static _recalculateSchema_fetchList(ref, index, isObj) {
        ref[index] = ref[index] || (isObj && {} || []);
    }

    save() {
        if ( this.autosave ) {
            let saveBlocks = [];

            this.blocks.forEach(block => saveBlocks.push({
                x: block.x,
                y: block.y,
                id: block.model.id
            }));

            clientStorage.setData(storagePrefix + this.autosave, saveBlocks);
        }
    }

    load() {
        if ( this.autosave ) {
            let savedBlocks = clientStorage.getData(storagePrefix + this.autosave) || [];
            let newBlocks = [];

            savedBlocks.forEach(blockData => {
                let block = new Block(blockTypes[blockData.id]);
                block.x = blockData.x;
                block.y = blockData.y;
                newBlocks.push(block);
            });

            this.blocks = newBlocks;
            return true;
        }
        return false;
    }

    setSave(key) {
        this.autosave = key;
        this.load();
        this.recalculateSchemaMaybe();
        return this;
    }

    recalculateSchemaMaybe() {
        if ( this.isInited ) {
            this.recalculateSchema();
            //console.log(this);
        }
    }

    recalculateSchema() {
        if ( this.width < 0 || this.height < 0 ) {
            throw new WrongMapSize();
        }
        let newSchema = [];

        this.blocks.forEach(block => {
            Map._recalculateSchema_fetchList(newSchema, block.y);
            Map._recalculateSchema_fetchList(newSchema[block.y], block.x, true);
            newSchema[block.y][block.x][block.model.blockGroup.level] = block;

        });

        for (let y = 0; y < this.model.height; y++) {
            Map._recalculateSchema_fetchList(newSchema, y);
            for (let x = 0; x < this.model.width; x++) {
                Map._recalculateSchema_fetchList(newSchema[y], x, true);

                if ( !newSchema[y][x][this.model.defaultBlockType.blockGroup.level] ) {
                    newSchema[y][x][this.model.defaultBlockType.blockGroup.level] = new Block(this.model.defaultBlockType);
                }
            }
        }
        Vue.set(this, 'schema', newSchema);
        this.save();
    }

    deleteBlock(x, y, level) {
        try {
            let existingOne = this.schema[y][x][level];
            if ( existingOne ) {
                let ind = this.blocks.indexOf(existingOne);
                if ( ind >= 0 ) { this.blocks.splice(ind, 1); }
                delete this.schema[y][x][level];
            }
        } catch (err) {}
    }

    createBlock(blockType, x, y) {
        this.deleteBlock(x, y, blockType.blockGroup.level);
        let newBlock = new Block(blockType);
        newBlock.x   = x || 0;
        newBlock.y   = y || 0;
        this.blocks.push(newBlock);
        this.recalculateSchemaMaybe();
        return newBlock;
    }

    clearBlock(x, y, level) {
        if ( level ) {
            this.deleteBlock(x, y, level);
            return this.recalculateSchemaMaybe();
        }
        Object.keys(this.schema[y][x]).forEach(level => {
            this.deleteBlock(x, y, level);
        });
        return this.recalculateSchemaMaybe();
    }
}
