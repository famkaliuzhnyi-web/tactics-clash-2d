import type { GameState, Unit, Position, Player } from '../types/game';
import { UnitType } from '../types/game';
import { v4 as uuidv4 } from 'uuid';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 8;
export const TILE_SIZE = 50;

export const createInitialGameState = (players: Player[]): GameState => {
  const units: Unit[] = [];
  
  // Create units for each player
  players.forEach((player, playerIndex) => {
    const startY = playerIndex === 0 ? 0 : BOARD_HEIGHT - 2;
    
    // Create a simple army for each player
    for (let x = 1; x < BOARD_WIDTH - 1; x += 2) {
      units.push({
        id: uuidv4(),
        playerId: player.id,
        position: { x, y: startY },
        health: 100,
        maxHealth: 100,
        type: x % 4 === 1 ? UnitType.WARRIOR : x % 4 === 3 ? UnitType.ARCHER : UnitType.MAGE,
        hasActed: false,
        hasMoved: false
      });
    }
  });

  return {
    id: uuidv4(),
    players,
    units,
    currentPlayerIndex: 0,
    turnNumber: 1,
    boardSize: { width: BOARD_WIDTH, height: BOARD_HEIGHT },
    isGameOver: false
  };
};

export const getUnitAt = (position: Position, units: Unit[]): Unit | undefined => {
  return units.find(unit => unit.position.x === position.x && unit.position.y === position.y);
};

export const isValidPosition = (position: Position): boolean => {
  return position.x >= 0 && position.x < BOARD_WIDTH && 
         position.y >= 0 && position.y < BOARD_HEIGHT;
};

export const getDistance = (pos1: Position, pos2: Position): number => {
  return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
};

export const getValidMoves = (unit: Unit, gameState: GameState): Position[] => {
  if (unit.hasMoved) return [];
  
  const validMoves: Position[] = [];
  const moveRange = 2; // Units can move 2 tiles
  
  for (let dx = -moveRange; dx <= moveRange; dx++) {
    for (let dy = -moveRange; dy <= moveRange; dy++) {
      if (Math.abs(dx) + Math.abs(dy) <= moveRange) {
        const newPosition = { 
          x: unit.position.x + dx, 
          y: unit.position.y + dy 
        };
        
        if (isValidPosition(newPosition) && !getUnitAt(newPosition, gameState.units)) {
          validMoves.push(newPosition);
        }
      }
    }
  }
  
  return validMoves;
};

export const getValidAttacks = (unit: Unit, gameState: GameState): Unit[] => {
  if (unit.hasActed) return [];
  
  const attackRange = unit.type === UnitType.ARCHER ? 3 : 1;
  const validTargets: Unit[] = [];
  
  gameState.units.forEach(targetUnit => {
    if (targetUnit.playerId !== unit.playerId && 
        getDistance(unit.position, targetUnit.position) <= attackRange) {
      validTargets.push(targetUnit);
    }
  });
  
  return validTargets;
};

export const calculateDamage = (attacker: Unit): number => {
  const baseDamage = {
    [UnitType.WARRIOR]: 40,
    [UnitType.ARCHER]: 30,
    [UnitType.MAGE]: 35
  };
  
  return baseDamage[attacker.type];
};

export const isGameOver = (gameState: GameState): boolean => {
  const playersWithUnits = new Set(gameState.units.map(unit => unit.playerId));
  return playersWithUnits.size <= 1;
};

export const getWinner = (gameState: GameState): Player | undefined => {
  if (!isGameOver(gameState)) return undefined;
  
  const remainingPlayerIds = new Set(gameState.units.map(unit => unit.playerId));
  const remainingPlayerId = Array.from(remainingPlayerIds)[0];
  
  return gameState.players.find(player => player.id === remainingPlayerId);
};