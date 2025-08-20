import React from 'react';
import { Stage, Layer, Rect, Circle, Text } from 'react-konva';
import type { GameState, Unit, Position } from '../types/game';
import { UnitType } from '../types/game';
import { TILE_SIZE, BOARD_WIDTH, BOARD_HEIGHT } from '../utils/gameLogic';

interface GameBoardProps {
  gameState: GameState;
  selectedUnit: Unit | null;
  validMoves: Position[];
  validAttacks: Unit[];
  onTileClick: (position: Position) => void;
  onUnitClick: (unit: Unit) => void;
}

const getUnitColor = (unitType: UnitType): string => {
  switch (unitType) {
    case UnitType.WARRIOR:
      return '#ff6b6b';
    case UnitType.ARCHER:
      return '#4ecdc4';
    case UnitType.MAGE:
      return '#ffe66d';
    default:
      return '#95a5a6';
  }
};

const getPlayerColor = (playerId: string, players: GameState['players']): string => {
  const player = players.find(p => p.id === playerId);
  return player?.color || '#95a5a6';
};

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  selectedUnit,
  validMoves,
  validAttacks,
  onTileClick,
  onUnitClick
}) => {
  const stageWidth = BOARD_WIDTH * TILE_SIZE;
  const stageHeight = BOARD_HEIGHT * TILE_SIZE;

  const renderTiles = () => {
    const tiles = [];
    
    for (let x = 0; x < BOARD_WIDTH; x++) {
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        const isValidMove = validMoves.some(move => move.x === x && move.y === y);
        const isValidAttack = validAttacks.some(unit => unit.position.x === x && unit.position.y === y);
        
        let fillColor = (x + y) % 2 === 0 ? '#f8f8f2' : '#44475a';
        
        if (isValidMove) {
          fillColor = '#50fa7b';
        } else if (isValidAttack) {
          fillColor = '#ff5555';
        }

        tiles.push(
          <Rect
            key={`tile-${x}-${y}`}
            x={x * TILE_SIZE}
            y={y * TILE_SIZE}
            width={TILE_SIZE}
            height={TILE_SIZE}
            fill={fillColor}
            stroke="#6272a4"
            strokeWidth={1}
            onClick={() => onTileClick({ x, y })}
          />
        );
      }
    }
    
    return tiles;
  };

  const renderUnits = () => {
    return gameState.units.map(unit => {
      const isSelected = selectedUnit?.id === unit.id;
      const playerColor = getPlayerColor(unit.playerId, gameState.players);
      const unitColor = getUnitColor(unit.type);
      
      return (
        <React.Fragment key={unit.id}>
          {/* Unit base (player color) */}
          <Circle
            x={unit.position.x * TILE_SIZE + TILE_SIZE / 2}
            y={unit.position.y * TILE_SIZE + TILE_SIZE / 2}
            radius={TILE_SIZE * 0.4}
            fill={playerColor}
            stroke={isSelected ? '#ffb86c' : '#282a36'}
            strokeWidth={isSelected ? 3 : 1}
            onClick={() => onUnitClick(unit)}
          />
          
          {/* Unit type indicator (smaller circle) */}
          <Circle
            x={unit.position.x * TILE_SIZE + TILE_SIZE / 2}
            y={unit.position.y * TILE_SIZE + TILE_SIZE / 2}
            radius={TILE_SIZE * 0.25}
            fill={unitColor}
            onClick={() => onUnitClick(unit)}
          />
          
          {/* Health bar */}
          <Rect
            x={unit.position.x * TILE_SIZE + 5}
            y={unit.position.y * TILE_SIZE + 5}
            width={TILE_SIZE - 10}
            height={4}
            fill="#50fa7b"
            scaleX={unit.health / unit.maxHealth}
          />
          
          {/* Unit type text */}
          <Text
            x={unit.position.x * TILE_SIZE}
            y={unit.position.y * TILE_SIZE + TILE_SIZE - 15}
            width={TILE_SIZE}
            height={12}
            text={unit.type.charAt(0).toUpperCase()}
            fontSize={10}
            fontFamily="Arial"
            fill="#f8f8f2"
            align="center"
            onClick={() => onUnitClick(unit)}
          />
        </React.Fragment>
      );
    });
  };

  return (
    <div className="game-board">
      <Stage width={stageWidth} height={stageHeight}>
        <Layer>
          {renderTiles()}
          {renderUnits()}
        </Layer>
      </Stage>
    </div>
  );
};