import React, { useEffect } from 'react';
import { GameBoard } from './GameBoard';
import { GameInfo } from './GameInfo';
import { useGameState } from '../hooks/useGameState';
import type { Position, Unit, Player } from '../types/game';
import { getUnitAt } from '../utils/gameLogic';

export const Game: React.FC = () => {
  const {
    gameState,
    selectedUnit,
    initializeGame,
    selectUnit,
    moveUnit,
    attackWithUnit,
    endTurn,
    getValidMovesForSelected,
    getValidAttacksForSelected
  } = useGameState();

  // Initialize the game when component mounts
  useEffect(() => {
    const players: Player[] = [
      {
        id: 'player1',
        name: 'Player 1',
        color: '#8be9fd',
        isActive: true
      },
      {
        id: 'player2',
        name: 'Player 2',
        color: '#ff79c6',
        isActive: false
      }
    ];
    
    initializeGame(players);
  }, [initializeGame]);

  const handleTileClick = (position: Position) => {
    if (!gameState) return;

    const unitAtPosition = getUnitAt(position, gameState.units);
    
    if (selectedUnit) {
      const validMoves = getValidMovesForSelected();
      const validAttacks = getValidAttacksForSelected();
      
      // Check if clicking on a valid move position
      const isValidMove = validMoves.some(move => 
        move.x === position.x && move.y === position.y
      );
      
      // Check if clicking on a valid attack target
      const isValidAttack = validAttacks.some(target => 
        target.position.x === position.x && target.position.y === position.y
      );
      
      if (isValidMove) {
        moveUnit(selectedUnit.id, position);
      } else if (isValidAttack && unitAtPosition) {
        attackWithUnit(selectedUnit.id, unitAtPosition.id);
      } else {
        // If clicking elsewhere, deselect or select new unit
        if (unitAtPosition) {
          handleUnitClick(unitAtPosition);
        } else {
          selectUnit(null);
        }
      }
    } else if (unitAtPosition) {
      // No unit selected, try to select the clicked unit
      handleUnitClick(unitAtPosition);
    }
  };

  const handleUnitClick = (unit: Unit) => {
    if (!gameState) return;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // Only allow selecting units that belong to the current player
    if (unit.playerId === currentPlayer.id) {
      selectUnit(unit);
    }
  };

  if (!gameState) {
    return (
      <div className="game-loading">
        <h2>Loading Game...</h2>
      </div>
    );
  }

  return (
    <div className="game-container">
      <h1>🎯 Tactics Clash 2D</h1>
      <div className="game-content">
        <GameBoard
          gameState={gameState}
          selectedUnit={selectedUnit}
          validMoves={getValidMovesForSelected()}
          validAttacks={getValidAttacksForSelected()}
          onTileClick={handleTileClick}
          onUnitClick={handleUnitClick}
        />
        <GameInfo
          gameState={gameState}
          selectedUnit={selectedUnit}
          onEndTurn={endTurn}
        />
      </div>
    </div>
  );
};