class GameSceneService {
    unitsPerBlock = 32;

    blockToUnit(val) {
        return val * this.unitsPerBlock;
    }

    unitToBlock(val) {
        return val / this.unitsPerBlock;
    }
}

export default new GameSceneService();
