import { useState, useCallback } from 'react';
import type { GameState, Unit, Position, Player } from '../types/game';
import { 
  createInitialGameState, 
  getValidMoves, 
  getValidAttacks, 
  calculateDamage,
  isGameOver,
  getWinner
} from '../utils/gameLogic';

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState<string>('');

  const initializeGame = useCallback((players: Player[]) => {
    const newGameState = createInitialGameState(players);
    setGameState(newGameState);
    setLocalPlayerId(players[0].id); // Set local player as first player for now
  }, []);

  const selectUnit = useCallback((unit: Unit | null) => {
    if (!gameState) return;
    
    // Only allow selecting units belonging to the current player
    if (unit && unit.playerId === gameState.players[gameState.currentPlayerIndex].id) {
      setSelectedUnit(unit);
    } else {
      setSelectedUnit(null);
    }
  }, [gameState]);

  const moveUnit = useCallback((unitId: string, newPosition: Position) => {
    if (!gameState) return false;

    setGameState(prevState => {
      if (!prevState) return prevState;

      const unitIndex = prevState.units.findIndex(u => u.id === unitId);
      if (unitIndex === -1) return prevState;

      const unit = prevState.units[unitIndex];
      const validMoves = getValidMoves(unit, prevState);
      
      if (!validMoves.some(pos => pos.x === newPosition.x && pos.y === newPosition.y)) {
        return prevState; // Invalid move
      }

      const newUnits = [...prevState.units];
      newUnits[unitIndex] = {
        ...unit,
        position: newPosition,
        hasMoved: true
      };

      return {
        ...prevState,
        units: newUnits
      };
    });

    setSelectedUnit(null);
    return true;
  }, [gameState]);

  const attackWithUnit = useCallback((attackerId: string, targetId: string) => {
    if (!gameState) return false;

    setGameState(prevState => {
      if (!prevState) return prevState;

      const attackerIndex = prevState.units.findIndex(u => u.id === attackerId);
      const targetIndex = prevState.units.findIndex(u => u.id === targetId);
      
      if (attackerIndex === -1 || targetIndex === -1) return prevState;

      const attacker = prevState.units[attackerIndex];
      const target = prevState.units[targetIndex];
      
      const validTargets = getValidAttacks(attacker, prevState);
      if (!validTargets.some(t => t.id === targetId)) {
        return prevState; // Invalid attack
      }

      const damage = calculateDamage(attacker);
      const newHealth = Math.max(0, target.health - damage);

      const newUnits = [...prevState.units];
      
      // Update attacker
      newUnits[attackerIndex] = {
        ...attacker,
        hasActed: true
      };

      // Update target or remove if dead
      if (newHealth > 0) {
        newUnits[targetIndex] = {
          ...target,
          health: newHealth
        };
      } else {
        newUnits.splice(targetIndex, 1);
      }

      const updatedGameState = {
        ...prevState,
        units: newUnits
      };

      // Check for game over
      if (isGameOver(updatedGameState)) {
        const winner = getWinner(updatedGameState);
        return {
          ...updatedGameState,
          isGameOver: true,
          winner: winner?.id
        };
      }

      return updatedGameState;
    });

    setSelectedUnit(null);
    return true;
  }, [gameState]);

  const endTurn = useCallback(() => {
    if (!gameState) return;

    setGameState(prevState => {
      if (!prevState) return prevState;

      // Reset all units' action flags for the current player
      const currentPlayerId = prevState.players[prevState.currentPlayerIndex].id;
      const newUnits = prevState.units.map(unit => 
        unit.playerId === currentPlayerId 
          ? { ...unit, hasActed: false, hasMoved: false }
          : unit
      );

      // Move to next player
      const nextPlayerIndex = (prevState.currentPlayerIndex + 1) % prevState.players.length;
      const isNewTurn = nextPlayerIndex === 0;

      return {
        ...prevState,
        units: newUnits,
        currentPlayerIndex: nextPlayerIndex,
        turnNumber: isNewTurn ? prevState.turnNumber + 1 : prevState.turnNumber
      };
    });

    setSelectedUnit(null);
  }, [gameState]);

  const getValidMovesForSelected = useCallback(() => {
    if (!selectedUnit || !gameState) return [];
    return getValidMoves(selectedUnit, gameState);
  }, [selectedUnit, gameState]);

  const getValidAttacksForSelected = useCallback(() => {
    if (!selectedUnit || !gameState) return [];
    return getValidAttacks(selectedUnit, gameState);
  }, [selectedUnit, gameState]);

  return {
    gameState,
    selectedUnit,
    localPlayerId,
    initializeGame,
    selectUnit,
    moveUnit,
    attackWithUnit,
    endTurn,
    getValidMovesForSelected,
    getValidAttacksForSelected
  };
};