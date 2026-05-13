import React from 'react';
import { GameState, Part } from '../types';
import { GameAction } from '../gameReducer';
import { COLOR_CLASS, COLOR_LABEL } from '../data';
import { getSlotLabel } from '../utils';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  myTurn?: boolean;
}

const SLOT_ICON: Record<string, string> = { jockey: '🏇', blinker: '👁', cheek: '🔷' };
const SLOT_COLOR: Record<string, string> = {
  jockey: 'bg-amber-50 border-amber-200 text-amber-800',
  blinker: 'bg-sky-50 border-sky-200 text-sky-800',
  cheek: 'bg-purple-50 border-purple-200 text-purple-800',
};

function PartCard({ part, onClick, selected }: { part: Part; onClick?: () => void; selected?: boolean }) {
  const mods = [
    part.abilityMod !== 0 && `脚力${part.abilityMod > 0 ? '+' : ''}${part.abilityMod}`,
    part.speedMod !== 0 && `速${part.speedMod > 0 ? '+' : ''}${part.speedMod}`,
    part.motivationMod !== 0 && `気${part.motivationMod > 0 ? '+' : ''}${part.motivationMod}`,
    part.gritMod !== 0 && `根${part.gritMod > 0 ? '+' : ''}${part.gritMod}`,
    part.extraDice > 0 && `🎲+${part.extraDice}`,
    part.extraReroll > 0 && `↺+${part.extraReroll}`,
  ].filter(Boolean) as string[];

  return (
    <div
      onClick={onClick}
      className={`
        rounded-xl border-2 p-3 transition-all cursor-pointer
        ${selected
          ? 'border-emerald-500 bg-emerald-50 shadow-md scale-105'
          : 'border-gray-200 bg-white hover:border-emerald-400 hover:shadow-md'}
      `}
    >
      <div className="flex items-start gap-2 mb-2">
        <span className="text-lg">{SLOT_ICON[part.slot]}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-tight">{part.name}</p>
          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${SLOT_COLOR[part.slot]}`}>
            {getSlotLabel(part.slot)}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {mods.map((m, i) => (
          <span key={i} className={`text-xs px-1.5 py-0.5 rounded font-medium ${
            m.includes('+') ? 'bg-green-100 text-green-700' : m.startsWith('🎲') || m.startsWith('↺') ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
          }`}>
            {m}
          </span>
        ))}
        {mods.length === 0 && <span className="text-xs text-gray-400">補正なし</span>}
      </div>
    </div>
  );
}

export default function PartsDraftScreen({ state, dispatch, myTurn = true }: Props) {
  const player = state.players[state.currentDraftPlayerIndex];
  const totalPicks = 2 * state.playerCount;
  const progress = state.partsPicksDone;
  const phaseLabel = state.partsPhase === 'front' ? '前半（1〜9枚目）' : '後半（10〜18枚目）';

  return (
    <div className="min-h-screen bg-emerald-900 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-3 bg-white/10 rounded-full px-6 py-2">
            <span className="text-xl">🔧</span>
            <h1 className="text-lg font-bold text-white">パーツドラフト — {phaseLabel}</h1>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white/10 rounded-xl p-3 mb-4">
          <div className="flex justify-between text-white text-sm mb-1">
            <span>進捗: {progress} / {totalPicks} ピック</span>
            <span>残り: {state.currentDraftParts.length} 枚</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all"
              style={{ width: `${(progress / totalPicks) * 100}%` }}
            />
          </div>
        </div>

        {/* Draft order */}
        <div className="flex justify-center gap-2 mb-4">
          {Array.from({ length: totalPicks }).map((_, i) => {
            const pIdx = (state.startPlayerIndex + i) % state.playerCount;
            const p = state.players[pIdx];
            const isDone = i < progress;
            const isCurrent = i === progress;
            return (
              <div key={i} className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2
                ${isCurrent ? COLOR_CLASS[p.color] + ' scale-125 shadow-lg' : isDone ? 'bg-white/20 border-white/30 text-white/50' : 'bg-white/10 border-white/20 text-white/40'}
              `}>
                {COLOR_LABEL[p.color]}
              </div>
            );
          })}
        </div>

        {/* Current player */}
        <div className={`text-center mb-4 p-3 rounded-xl border-2 ${COLOR_CLASS[player.color]}`}>
          <p className="text-white/80 text-sm">選択中</p>
          <p className="text-xl font-bold text-white">{player.name}</p>
          <p className="text-white/80 text-sm">パーツを1枚選んでください</p>
        </div>

        {/* Available parts */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {state.currentDraftParts.map(part => (
            <PartCard
              key={part.id}
              part={part}
              onClick={() => dispatch({ type: 'SELECT_PART', partId: part.id })}
            />
          ))}
        </div>

        {/* Players' picked parts */}
        <div className="bg-white/10 rounded-xl p-4">
          <p className="text-white/70 text-sm mb-2">各プレイヤーの取得パーツ</p>
          <div className="grid grid-cols-2 gap-3">
            {state.players.map((p) => (
              <div key={p.id} className="bg-white/10 rounded-lg p-2">
                <p className={`text-sm font-bold mb-1 ${['text-rose-300','text-emerald-300','text-slate-300','text-violet-300'][p.id]}`}>
                  {p.name} ({p.parts.length}/4枚)
                </p>
                {p.parts.length === 0 ? (
                  <p className="text-white/40 text-xs">未取得</p>
                ) : (
                  <div className="space-y-0.5">
                    {p.parts.map(pt => (
                      <p key={pt.id} className="text-white/70 text-xs">• {pt.name}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
