import React, { useReducer, useEffect, useCallback, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { gameReducer, initialState, GameAction } from './gameReducer';
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

// ── Error boundary ─────────────────────────────────────────────────────────────
class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Render error:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-red-900 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full">
            <p className="font-bold text-red-700 text-lg mb-2">エラーが発生しました</p>
            <p className="text-sm text-gray-700 break-all">{this.state.error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg"
            >
              リロード
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Online sync ────────────────────────────────────────────────────────────
  useEffect(() => {
    const code = state.onlineRoomCode;
    if (!code) return;
    let unsub: (() => void) | undefined;
    try {
      unsub = subscribeToRoom(code, (newState) => {
        try {
          if (Array.isArray(newState.gameLog) &&
              newState.gameLog.length >= stateRef.current.gameLog.length) {
            dispatch({ type: 'SYNC_STATE', newState });
          }
        } catch (e) {
          console.error('SYNC_STATE error:', e);
        }
      });
    } catch (e) {
      console.error('subscribeToRoom error:', e);
    }
    return () => { try { unsub?.(); } catch (e) { console.error(e); } };
  }, [state.onlineRoomCode]);

  // ── Synced dispatch ────────────────────────────────────────────────────────
  const syncedDispatch = useCallback(async (action: GameAction): Promise<void> => {
    dispatch(action);
    const code = stateRef.current.onlineRoomCode;
    if (!code) return;
    try {
      const newState = gameReducer(stateRef.current, action);
      await pushState(code, newState);
    } catch (e) {
      console.error('syncedDispatch error:', e);
    }
  }, []);

  // ── CPU auto-play ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Local CPU battle: always auto-play.
    // Online battle: only host (player index 0) auto-plays CPU slots to avoid duplicate actions.
    const shouldHandleCpu = state.gameMode === 'cpu' || (state.gameMode === 'online' && state.localPlayerIndex === 0);
    if (!shouldHandleCpu) return;

    const action = getCpuAction(state);
    if (!action) return;

    const baseDelay = state.phase === 'race' ? 1800 : 700;
    const jitter = Math.floor(Math.random() * 250);
    const timer = setTimeout(() => {
      if (state.gameMode === 'online') {
        void syncedDispatch(action);
      } else {
        dispatch(action);
      }
    }, baseDelay + jitter);

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
    state.localPlayerIndex,
    state.onlineRoomCode,
    syncedDispatch,
  ]);

  // ── isMyTurn ───────────────────────────────────────────────────────────────
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
  const activeDispatch = state.gameMode === 'online'
    ? (syncedDispatch as unknown as React.Dispatch<GameAction>)
    : dispatch;

  const screen = (() => {
    switch (state.phase) {
      case 'start':
        return <StartScreen state={state} dispatch={dispatch} />;
      case 'online-lobby':
        return <OnlineLobby state={state} dispatch={dispatch} onSyncedDispatch={syncedDispatch} />;
      case 'honmei-draft':
      case 'taikou-draft':
        return <HorseDraftScreen state={state} dispatch={activeDispatch} myTurn={myTurn} />;
      case 'race-distance':
        return <RaceDistanceScreen state={state} dispatch={activeDispatch} myTurn={myTurn} />;
      case 'parts-draft':
        return <PartsDraftScreen state={state} dispatch={activeDispatch} myTurn={myTurn} />;
      case 'equip':
        return <EquipScreen state={state} dispatch={activeDispatch} myTurn={myTurn} />;
      case 'race':
        return <RaceScreen state={state} dispatch={activeDispatch} myTurn={myTurn} />;
      case 'game-over':
        return <GameOverScreen state={state} dispatch={dispatch} />;
      default:
        return <StartScreen state={state} dispatch={dispatch} />;
    }
  })();

  return <ErrorBoundary>{screen}</ErrorBoundary>;
}
