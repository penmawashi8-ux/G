import React from 'react';
import { GameState, GameMode } from '../types';
import { GameAction } from '../gameReducer';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const MODE_OPTIONS: { mode: GameMode; label: string; desc: string }[] = [
  { mode: 'local', label: 'ローカル対戦', desc: '同じ画面で複数人' },
  { mode: 'cpu', label: 'CPU対戦', desc: 'コンピューターと対戦' },
  { mode: 'online', label: 'オンライン対戦', desc: 'ネット越しに対戦' },
];

export default function StartScreen({ state, dispatch }: Props) {
  const { playerCount, teamMode, gameMode } = state;

  function handleModeSelect(mode: GameMode) {
    if (mode === 'online') {
      // Start the online lobby flow
      dispatch({ type: 'START_ONLINE_LOBBY' });
      return;
    }
    if (mode === 'local') {
      dispatch({ type: 'SET_GAME_MODE', mode: 'local', playerTypes: Array(playerCount).fill('human') });
    }
    if (mode === 'cpu') {
      // Player 0 is human, rest are CPU
      const types = Array(playerCount).fill('cpu');
      types[0] = 'human';
      dispatch({ type: 'SET_GAME_MODE', mode: 'cpu', playerTypes: types });
    }
  }

  return (
    <div className="min-h-screen bg-emerald-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏇</div>
          <h1 className="text-3xl font-bold text-emerald-800">競馬ボードゲーム</h1>
          <p className="text-gray-500 mt-2 text-sm">ドラフトして最強の馬を育てろ！</p>
        </div>

        {/* Game Mode */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">対戦モード</label>
          <div className="flex gap-2">
            {MODE_OPTIONS.map(({ mode, label, desc }) => (
              <button
                key={mode}
                onClick={() => handleModeSelect(mode)}
                className={`flex-1 py-3 px-2 rounded-xl border-2 text-center transition-all ${
                  gameMode === mode
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-md scale-105'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400'
                }`}
              >
                <div className="font-bold text-sm leading-tight">{label}</div>
                <div className={`text-xs mt-0.5 ${gameMode === mode ? 'text-emerald-100' : 'text-gray-400'}`}>{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Player Count (not shown for online mode) */}
        {gameMode !== 'online' && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">プレイヤー人数</label>
            <div className="flex gap-3">
              {(gameMode === 'cpu' ? [2, 3, 4] : [2, 3, 4]).map(n => (
                <button
                  key={n}
                  onClick={() => {
                    dispatch({ type: 'SET_PLAYER_COUNT', count: n });
                    if (gameMode === 'cpu') {
                      const types = Array(n).fill('cpu');
                      types[0] = 'human';
                      dispatch({ type: 'SET_GAME_MODE', mode: 'cpu', playerTypes: types });
                    }
                  }}
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
            {gameMode === 'cpu' && (
              <p className="text-xs text-gray-400 mt-1.5">あなたは赤プレイヤー。残りはCPUです。</p>
            )}
          </div>
        )}

        {/* Team Mode (4 players, local only) */}
        {playerCount === 4 && gameMode === 'local' && (
          <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-700">チームバトルモード</p>
                <p className="text-xs text-gray-500 mt-1">向かい合うプレイヤー同士がチーム</p>
              </div>
              <button
                onClick={() => dispatch({ type: 'SET_TEAM_MODE', enabled: !teamMode })}
                className={`w-14 h-7 rounded-full transition-all relative ${teamMode ? 'bg-emerald-500' : 'bg-gray-300'}`}
              >
                <span
                  className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${teamMode ? 'left-7' : 'left-0.5'}`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Player preview */}
        {gameMode !== 'online' && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">参加プレイヤー</p>
            <div className="flex gap-2">
              {(['赤', '緑', '黒', '紫'] as const).slice(0, playerCount).map((label, i) => {
                const colors = ['bg-rose-500', 'bg-emerald-500', 'bg-slate-700', 'bg-violet-500'];
                const isCpu = gameMode === 'cpu' && i > 0;
                return (
                  <div key={i} className={`flex-1 ${colors[i]} text-white rounded-lg py-2 text-center text-sm font-bold`}>
                    {label}
                    <div className="text-xs opacity-80">{isCpu ? 'CPU' : 'あなた'}</div>
                    {teamMode && playerCount === 4 && (
                      <div className="text-xs opacity-70">チーム{i % 2 + 1}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Game Rules Summary */}
        <div className="mb-6 p-3 bg-gray-50 rounded-xl text-xs text-gray-600 space-y-1">
          <p className="font-semibold">ゲームの流れ:</p>
          <p>① 馬カードのドラフト → ② レース距離決定 → ③ パーツドラフト → ④ 装備 → ⑤ レース</p>
          <p className="mt-1 font-semibold">勝利条件:</p>
          <p>ゴール到達 or 相手の馬を全脱落</p>
        </div>

        <button
          onClick={() => dispatch({ type: 'START_GAME' })}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xl rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          ゲームスタート
        </button>
      </div>
    </div>
  );
}
