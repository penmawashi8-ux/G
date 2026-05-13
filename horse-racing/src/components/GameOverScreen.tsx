import React from 'react';
import { GameState } from '../types';
import { GameAction } from '../gameReducer';
import { COLOR_CLASS } from '../data';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export default function GameOverScreen({ state, dispatch }: Props) {
  const isTeam = state.teamMode && state.winnerTeamId != null;
  const winnerPlayer = state.winnerPlayerIndex != null ? state.players[state.winnerPlayerIndex] : null;
  const winnerTeamPlayers = isTeam
    ? state.players.filter(p => p.teamId === state.winnerTeamId)
    : [];

  return (
    <div className="min-h-screen bg-emerald-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg text-center">
        <div className="text-7xl mb-4">🏆</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">ゲーム終了！</h1>

        {isTeam ? (
          <div className="mb-6">
            <p className="text-gray-500 mb-3">勝利チーム</p>
            <div className="flex justify-center gap-3">
              {winnerTeamPlayers.map(p => (
                <div key={p.id} className={`px-6 py-3 rounded-xl border-2 ${COLOR_CLASS[p.color]}`}>
                  <p className="text-xl font-bold">{p.name}</p>
                  <p className="text-sm opacity-80">チーム{p.teamId + 1}</p>
                </div>
              ))}
            </div>
          </div>
        ) : winnerPlayer ? (
          <div className="mb-6">
            <p className="text-gray-500 mb-3">勝者</p>
            <div className={`inline-block px-8 py-4 rounded-xl border-2 ${COLOR_CLASS[winnerPlayer.color]}`}>
              <p className="text-3xl font-bold">{winnerPlayer.name}</p>
            </div>
          </div>
        ) : null}

        {/* Final standings */}
        <div className="mb-6 text-left">
          <p className="font-semibold text-gray-600 mb-3">最終結果</p>
          <div className="space-y-2">
            {state.players.map(p => {
              const active = p.horses.filter(h => !h.fallen);
              const isWinner = (winnerPlayer && winnerPlayer.id === p.id) ||
                (isTeam && p.teamId === state.winnerTeamId);
              return (
                <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border ${isWinner ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className={`w-3 h-3 rounded-full ${['bg-rose-500','bg-emerald-500','bg-slate-700','bg-violet-500'][p.id]}`} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-500">
                      生存: {active.length}/{p.horses.length}頭
                      {active.map(h => ` | ${h.base.name} 位置:${h.position}`).join('')}
                    </p>
                  </div>
                  {isWinner && <span className="text-yellow-500 text-xl">🏆</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Log summary */}
        <div className="bg-gray-50 rounded-xl p-3 mb-6 text-left max-h-40 overflow-y-auto">
          <p className="text-xs text-gray-500 mb-1">ゲームログ</p>
          {state.gameLog.map((entry, i) => (
            <p key={i} className="text-xs text-gray-600">{entry}</p>
          ))}
        </div>

        <button
          onClick={() => dispatch({ type: 'RESET_GAME' })}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xl rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          もう一度プレイ 🔄
        </button>
      </div>
    </div>
  );
}
