import React from 'react';
import type { GameState, Unit } from '../types/game';

interface GameInfoProps {
  gameState: GameState;
  selectedUnit: Unit | null;
  onEndTurn: () => void;
}

export const GameInfo: React.FC<GameInfoProps> = ({
  gameState,
  selectedUnit,
  onEndTurn
}) => {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  
  const getUnitStats = (unit: Unit) => ({
    canMove: !unit.hasMoved,
    canAct: !unit.hasActed,
    health: `${unit.health}/${unit.maxHealth}`
  });

  if (gameState.isGameOver) {
    const winner = gameState.players.find(p => p.id === gameState.winner);
    return (
      <div className="game-info game-over">
        <h2>🎉 Game Over!</h2>
        <p>Winner: <span style={{ color: winner?.color }}>{winner?.name}</span></p>
        <button onClick={() => window.location.reload()}>
          New Game
        </button>
      </div>
    );
  }

  return (
    <div className="game-info">
      <div className="turn-info">
        <h3>Turn {gameState.turnNumber}</h3>
        <p>
          Current Player: 
          <span style={{ color: currentPlayer.color, fontWeight: 'bold' }}>
            {' '}{currentPlayer.name}
          </span>
        </p>
        <button 
          onClick={onEndTurn}
          className="end-turn-btn"
        >
          End Turn
        </button>
      </div>

      {selectedUnit && (
        <div className="selected-unit-info">
          <h4>Selected Unit</h4>
          <div className="unit-details">
            <p><strong>Type:</strong> {selectedUnit.type}</p>
            <p><strong>Health:</strong> {getUnitStats(selectedUnit).health}</p>
            <p><strong>Can Move:</strong> {getUnitStats(selectedUnit).canMove ? '✅' : '❌'}</p>
            <p><strong>Can Act:</strong> {getUnitStats(selectedUnit).canAct ? '✅' : '❌'}</p>
            <p><strong>Position:</strong> ({selectedUnit.position.x}, {selectedUnit.position.y})</p>
          </div>
        </div>
      )}

      <div className="players-info">
        <h4>Players</h4>
        {gameState.players.map(player => {
          const unitCount = gameState.units.filter(u => u.playerId === player.id).length;
          return (
            <div key={player.id} className="player-info">
              <span 
                style={{ color: player.color, fontWeight: 'bold' }}
              >
                {player.name}
              </span>
              <span> - {unitCount} units</span>
            </div>
          );
        })}
      </div>

      <div className="game-instructions">
        <h4>How to Play</h4>
        <ul>
          <li>Click a unit to select it</li>
          <li>Green tiles = valid moves</li>
          <li>Red tiles = valid attacks</li>
          <li>Each unit can move and act once per turn</li>
          <li>Warriors: Strong melee (1 range)</li>
          <li>Archers: Ranged attacks (3 range)</li>
          <li>Mages: Balanced magic (1 range)</li>
        </ul>
      </div>
    </div>
  );
};