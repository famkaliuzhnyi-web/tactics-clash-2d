export interface Position {
  x: number;
  y: number;
}

export interface Unit {
  id: string;
  playerId: string;
  position: Position;
  health: number;
  maxHealth: number;
  type: UnitType;
  hasActed: boolean;
  hasMoved: boolean;
}

export const UnitType = {
  WARRIOR: 'warrior',
  ARCHER: 'archer',
  MAGE: 'mage'
} as const;

export type UnitType = typeof UnitType[keyof typeof UnitType];

export interface Player {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
}

export interface GameState {
  id: string;
  players: Player[];
  units: Unit[];
  currentPlayerIndex: number;
  turnNumber: number;
  boardSize: { width: number; height: number };
  isGameOver: boolean;
  winner?: string;
}

export interface GameAction {
  type: 'move' | 'attack' | 'end_turn';
  unitId?: string;
  position?: Position;
  targetId?: string;
  playerId: string;
}

export interface TileInfo {
  position: Position;
  unit?: Unit;
  isValidMove?: boolean;
  isValidAttack?: boolean;
}