import React, { useReducer, useEffect, useCallback, useRef } from 'react';
import { gameReducer, initialState, GameAction } from './gameReducer';
import { GameState } from './types';
import { getCpuAction } from './ai';
import { pushState, subscribeToRoom } from './lib/supabase';
import StartScreen from './components/StartScreen';
import OnlineLobby from './components/OnlineLobby';
import HorseDraftScreen from './components/HorseDraftScreen';
import RaceDistanceScreen from './components/RaceDistanceScreen';
import PartsDraftScreen from './components/PartsDraftScreen';
import EquipScreen from './components/EquipScreen';
import RaceScreen from './components/RaceScreen';
import GameOverScreen from './components/GameOverScreen';

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Online sync: subscribe when we have a room code ────────────────────────
  useEffect(() => {
    const code = state.onlineRoomCode;
    if (!code) return;
    const unsub = subscribeToRoom(code, (newState) => {
      // Only apply if version is newer (use gameLog length as proxy)
      if (newState.gameLog.length >= stateRef.current.gameLog.length) {
        dispatch({ type: 'SYNC_STATE', newState });
      }
    });
    return unsub;
  }, [state.onlineRoomCode]);

  // ── Dispatch wrapper: for online, push state after every action ───────────
  const syncedDispatch = useCallback(async (action: GameAction): Promise<void> => {
    dispatch(action);
    const code = stateRef.current.onlineRoomCode;
    if (!code) return;
    // Compute the new state locally so we can push it
    const newState = gameReducer(stateRef.current, action);
    await pushState(code, newState);
  }, []);

  // ── CPU auto-play ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (state.gameMode !== 'cpu') return;
    const action = getCpuAction(state);
    if (!action) return;
    const delay = state.phase === 'race' ? 600 : 300;
    const timer = setTimeout(() => {
      dispatch(action);
    }, delay);
    return () => clearTimeout(timer);
  }, [
    state.gameMode,
    state.phase,
    state.raceSubPhase,
    state.currentDraftPlayerIndex,
    state.currentEquipPlayerIndex,
    state.attackerPlayerIndex,
    state.defenderPlayerIndex,
    state.pendingInheritancePlayerIndex,
    state.pendingBondPlayerIndex,
    state.diceValues,
  ]);

  // ── Online: is it this device's turn? ─────────────────────────────────────
  function isMyTurn(): boolean {
    if (state.gameMode !== 'online') return true;
    const local = state.localPlayerIndex;
    switch (state.phase) {
      case 'honmei-draft':
      case 'taikou-draft':
      case 'parts-draft':
        return state.currentDraftPlayerIndex === local;
      case 'equip':
        return state.currentEquipPlayerIndex === local;
      case 'race': {
        const sub = state.raceSubPhase;
        if (sub === 'draw-initiative' || sub === 'action-declare' || sub === 'dice-roll' || sub === 'resolve')
          return state.attackerPlayerIndex === local;
        if (sub === 'target-declare') return state.defenderPlayerIndex === local;
        if (sub === 'inheritance') return state.pendingInheritancePlayerIndex === local;
        if (sub === 'bond-inheritance') return state.pendingBondPlayerIndex === local;
        return false;
      }
      default: return true;
    }
  }

  const myTurn = isMyTurn();
  const activeDispatch = state.gameMode === 'online' ? syncedDispatch : dispatch;

  switch (state.phase) {
    case 'start':
      return <StartScreen state={state} dispatch={dispatch} />;
    case 'online-lobby':
      return <OnlineLobby state={state} dispatch={dispatch} onSyncedDispatch={syncedDispatch} />;
    case 'honmei-draft':
    case 'taikou-draft':
      return <HorseDraftScreen state={state} dispatch={activeDispatch as React.Dispatch<GameAction>} myTurn={myTurn} />;
    case 'race-distance':
      return <RaceDistanceScreen state={state} dispatch={activeDispatch as React.Dispatch<GameAction>} myTurn={myTurn} />;
    case 'parts-draft':
      return <PartsDraftScreen state={state} dispatch={activeDispatch as React.Dispatch<GameAction>} myTurn={myTurn} />;
    case 'equip':
      return <EquipScreen state={state} dispatch={activeDispatch as React.Dispatch<GameAction>} myTurn={myTurn} />;
    case 'race':
      return <RaceScreen state={state} dispatch={activeDispatch as React.Dispatch<GameAction>} myTurn={myTurn} />;
    case 'game-over':
      return <GameOverScreen state={state} dispatch={dispatch} />;
    default:
      return <StartScreen state={state} dispatch={dispatch} />;
  }
}
