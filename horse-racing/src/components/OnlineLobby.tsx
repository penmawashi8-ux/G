import React, { useState, useEffect } from 'react';
import { GameState } from '../types';
import { GameAction } from '../gameReducer';
import { generateRoomCode, createRoom, joinRoom, subscribeToRoom } from '../lib/supabase';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  onSyncedDispatch: (action: GameAction) => Promise<void>;
}

export default function OnlineLobby({ state, dispatch, onSyncedDispatch }: Props) {
  const [mode, setMode] = useState<'choose' | 'host' | 'join'>('choose');
  const [joinCode, setJoinCode] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Show current room code if already in a room
  const roomCode = state.onlineRoomCode;

  useEffect(() => {
    if (!roomCode) return;
    const unsub = subscribeToRoom(roomCode, (newState) => {
      dispatch({ type: 'SYNC_STATE', newState });
    });
    return unsub;
  }, [roomCode]);

  async function handleHost() {
    setLoading(true);
    const code = generateRoomCode();
    // Prepare host state: 2 players, both remote until guests join
    dispatch({ type: 'SET_PLAYER_COUNT', count: 2 });
    const hostState: GameState = {
      ...state,
      playerCount: 2,
      onlineRoomCode: code,
      localPlayerIndex: 0,
      playerTypes: ['human', 'human'],
    };
    const ok = await createRoom(code, hostState);
    if (!ok) {
      setStatus('ルーム作成に失敗しました。Supabaseの設定を確認してください。');
      setLoading(false);
      return;
    }
    dispatch({ type: 'SET_LOCAL_PLAYER', index: 0, roomCode: code });
    setMode('host');
    setStatus('');
    setLoading(false);
  }

  async function handleJoin() {
    if (joinCode.length < 4) return;
    setLoading(true);
    const remoteState = await joinRoom(joinCode.toUpperCase());
    if (!remoteState) {
      setStatus('ルームが見つかりません。コードを確認してください。');
      setLoading(false);
      return;
    }
    dispatch({ type: 'SYNC_STATE', newState: remoteState });
    dispatch({ type: 'SET_LOCAL_PLAYER', index: 1, roomCode: joinCode.toUpperCase() });
    setMode('join');
    setStatus('');
    setLoading(false);
  }

  if (mode === 'choose') {
    return (
      <div className="min-h-screen bg-emerald-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
          <h2 className="text-2xl font-bold text-emerald-800 text-center mb-6">オンライン対戦</h2>
          <div className="space-y-3">
            <button
              onClick={handleHost}
              disabled={loading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-xl shadow transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {loading ? '作成中…' : 'ルームを作成する（ホスト）'}
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

  // Waiting room (host or guest already joined)
  const isHost = state.localPlayerIndex === 0;
  const playerCount = state.playerCount;
  const connectedCount = isHost ? 1 : 2; // simplified; in full impl track per-slot join

  return (
    <div className="min-h-screen bg-emerald-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <h2 className="text-2xl font-bold text-emerald-800 text-center mb-2">待機中…</h2>
        {roomCode && (
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500 mb-1">ルームコード</p>
            <p className="text-4xl font-mono font-bold tracking-widest text-emerald-700">{roomCode}</p>
            <p className="text-xs text-gray-400 mt-1">相手にこのコードを伝えてください</p>
          </div>
        )}
        <div className="flex gap-3 mb-6">
          {Array.from({ length: playerCount }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 py-3 rounded-xl border-2 text-center font-bold text-sm ${
                i < connectedCount
                  ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                  : 'bg-gray-100 border-gray-300 text-gray-400'
              }`}
            >
              {i < connectedCount ? `P${i + 1} 接続済み` : `P${i + 1} 待機中…`}
            </div>
          ))}
        </div>
        {isHost && (
          <button
            onClick={() => onSyncedDispatch({ type: 'START_GAME' })}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-xl shadow transition-all hover:scale-105 active:scale-95"
          >
            ゲームスタート
          </button>
        )}
        {!isHost && (
          <p className="text-center text-gray-500 text-sm">ホストがゲームを開始するのを待っています</p>
        )}
      </div>
    </div>
  );
}
