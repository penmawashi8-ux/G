import React, { useState } from 'react';
import { GameState, PlayerType } from '../types';
import { GameAction } from '../gameReducer';
import { generateRoomCode, createRoom, joinRoom, pushState } from '../lib/supabase';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  onSyncedDispatch: (action: GameAction) => Promise<void>;
}

const PLAYER_COLORS = ['bg-rose-500', 'bg-emerald-500', 'bg-slate-700', 'bg-violet-500'];
const PLAYER_LABELS = ['赤', '緑', '黒', '紫'];

export default function OnlineLobby({ state, dispatch, onSyncedDispatch }: Props) {
  const [mode, setMode] = useState<'choose' | 'host' | 'join'>('choose');
  const [joinCode, setJoinCode] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const roomCode = state.onlineRoomCode;
  const playerCount = state.playerCount;
  // Count how many slots are 'human' in the current synced state
  const connectedCount = (state.playerTypes ?? []).filter(t => t === 'human').length;

  async function handleHost() {
    setLoading(true);
    const code = generateRoomCode();
    const count = playerCount;
    // First slot = host (human), rest = cpu until guests join
    const playerTypes: PlayerType[] = ['human', ...Array(count - 1).fill('cpu')] as PlayerType[];
    const hostState: GameState = {
      ...state,
      playerCount: count,
      onlineRoomCode: code,
      localPlayerIndex: 0,
      playerTypes,
      gameMode: 'online',
    };
    const err = await createRoom(code, hostState);
    if (err) {
      setStatus(`エラー: ${err}`);
      setLoading(false);
      return;
    }
    dispatch({ type: 'SET_LOCAL_PLAYER', index: 0, roomCode: code });
    // Sync playerTypes to local state
    dispatch({ type: 'SET_GAME_MODE', mode: 'online', playerTypes });
    dispatch({ type: 'SET_PLAYER_COUNT', count });
    setMode('host');
    setStatus('');
    setLoading(false);
  }

  async function handleJoin() {
    if (joinCode.length < 4) return;
    setLoading(true);
    const code = joinCode.toUpperCase();
    const remoteState = await joinRoom(code);
    if (!remoteState) {
      setStatus('ルームが見つかりません。コードを確認してください。');
      setLoading(false);
      return;
    }
    // Find first CPU slot (index >= 1) to claim as this guest
    const guestIndex = remoteState.playerTypes.findIndex((t, i) => i > 0 && t === 'cpu');
    if (guestIndex < 0) {
      setStatus('ルームが満員です。');
      setLoading(false);
      return;
    }
    // Mark our slot as human and push to Supabase so host sees us
    // localPlayerIndex is device-specific; push only shared state
    const updatedTypes: PlayerType[] = remoteState.playerTypes.map((t, i) =>
      i === guestIndex ? 'human' : t
    ) as PlayerType[];
    const sharedState: GameState = { ...remoteState, playerTypes: updatedTypes };
    await pushState(code, sharedState);
    dispatch({ type: 'SET_LOCAL_PLAYER', index: guestIndex, roomCode: code });
    dispatch({ type: 'SYNC_STATE', newState: sharedState });
    setMode('join');
    setStatus('');
    setLoading(false);
  }

  // ── Choose screen ────────────────────────────────────────────────────────────
  if (mode === 'choose') {
    return (
      <div className="min-h-screen bg-emerald-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
          <h2 className="text-2xl font-bold text-emerald-800 text-center mb-6">オンライン対戦</h2>

          {/* Player count selection (for host) */}
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-600 mb-2">人数を選択（ホスト設定）</p>
            <div className="flex gap-2">
              {[2, 3, 4].map(n => (
                <button
                  key={n}
                  onClick={() => dispatch({ type: 'SET_PLAYER_COUNT', count: n })}
                  className={`flex-1 py-3 rounded-xl border-2 font-bold text-lg transition-all ${
                    playerCount === n
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-md scale-105'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400'
                  }`}
                >
                  {n}人
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleHost}
              disabled={loading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-xl shadow transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {loading ? '作成中…' : `ルームを作成する（${playerCount}人・ホスト）`}
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white font-bold text-lg rounded-xl shadow transition-all hover:scale-105 active:scale-95"
            >
              ルームに参加する
            </button>
          </div>

          <button
            onClick={() => dispatch({ type: 'EXIT_ONLINE_LOBBY' })}
            className="mt-6 w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← 戻る
          </button>
          {status && <p className="mt-3 text-sm text-red-500 text-center">{status}</p>}
        </div>
      </div>
    );
  }

  // ── Join screen ──────────────────────────────────────────────────────────────
  if (mode === 'join' && !roomCode) {
    return (
      <div className="min-h-screen bg-emerald-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
          <h2 className="text-2xl font-bold text-emerald-800 text-center mb-6">ルームに参加</h2>
          <input
            type="text"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            placeholder="ルームコードを入力"
            maxLength={6}
            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-center text-2xl font-mono font-bold tracking-widest mb-4 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleJoin}
            disabled={loading || joinCode.length < 4}
            className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white font-bold text-lg rounded-xl shadow transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {loading ? '参加中…' : '参加する'}
          </button>
          <button
            onClick={() => setMode('choose')}
            className="mt-4 w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← 戻る
          </button>
          {status && <p className="mt-3 text-sm text-red-500 text-center">{status}</p>}
        </div>
      </div>
    );
  }

  // ── Waiting room ─────────────────────────────────────────────────────────────
  const isHost = state.localPlayerIndex === 0;

  return (
    <div className="min-h-screen bg-emerald-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <h2 className="text-2xl font-bold text-emerald-800 text-center mb-2">待機中…</h2>

        {roomCode && (
          <div className="text-center mb-5">
            <p className="text-sm text-gray-500 mb-1">ルームコード</p>
            <p className="text-4xl font-mono font-bold tracking-widest text-emerald-700">{roomCode}</p>
            <p className="text-xs text-gray-400 mt-1">相手にこのコードを伝えてください</p>
          </div>
        )}

        {/* Player slots */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {Array.from({ length: playerCount }).map((_, i) => {
            const isHuman = (state.playerTypes[i] ?? 'cpu') === 'human';
            return (
              <div
                key={i}
                className={`py-3 rounded-xl border-2 text-center text-sm font-bold transition-all ${
                  isHuman
                    ? `${PLAYER_COLORS[i]} text-white border-transparent`
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}
              >
                <div>{PLAYER_LABELS[i]}</div>
                <div className="text-xs font-normal mt-0.5">
                  {isHuman ? '接続済み' : 'CPU（空き）'}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-gray-400 mb-4">
          空きスロットはCPUとして自動参加します
        </p>

        {isHost ? (
          <button
            onClick={() => onSyncedDispatch({ type: 'START_GAME' })}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-xl shadow transition-all hover:scale-105 active:scale-95"
          >
            ゲームスタート（{connectedCount}/{playerCount}人接続）
          </button>
        ) : (
          <p className="text-center text-gray-500 text-sm">ホストがゲームを開始するのを待っています</p>
        )}
      </div>
    </div>
  );
}
