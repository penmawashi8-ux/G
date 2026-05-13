import React from 'react';
import { GameState, BaseHorse } from '../types';
import { GameAction } from '../gameReducer';
import { BaseHorseCard } from './HorseCard';
import { COLOR_CLASS, COLOR_LABEL } from '../data';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export default function HorseDraftScreen({ state, dispatch }: Props) {
  const isHonmei = state.phase === 'honmei-draft';
  const available: BaseHorse[] = isHonmei ? state.availableHonmei : state.availableTaikou;
  const player = state.players[state.currentDraftPlayerIndex];
  const pickedCount = state.players.filter(p =>
    isHonmei ? p.horses.length >= 1 : p.horses.length >= 2
  ).length;

  function handleSelect(horseId: string) {
    dispatch(isHonmei ? { type: 'SELECT_HONMEI', horseId } : { type: 'SELECT_TAIKOU', horseId });
  }

  return (
    <div className="min-h-screen bg-emerald-900 p-4">
      {/* Header */}
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 bg-white/10 rounded-full px-6 py-3">
            <span className="text-2xl">{isHonmei ? '🏆' : '🏅'}</span>
            <h1 className="text-xl font-bold text-white">
              {isHonmei ? '本命馬ドラフト' : '対抗馬ドラフト'}
            </h1>
          </div>
        </div>

        {/* Draft progress */}
        <div className="flex justify-center gap-2 mb-6">
          {state.players.map((p, i) => {
            const hasPicked = isHonmei ? p.horses.length >= 1 : p.horses.length >= 2;
            return (
              <div key={i} className={`
                px-3 py-1.5 rounded-full text-sm font-medium border-2
                ${i === state.currentDraftPlayerIndex
                  ? COLOR_CLASS[p.color] + ' scale-110 shadow-lg'
                  : hasPicked
                    ? 'bg-white/30 text-white border-white/30 opacity-60'
                    : 'bg-white/10 text-white/60 border-white/20'}
              `}>
                {COLOR_LABEL[p.color]}
                {hasPicked && ' ✓'}
                {i === state.currentDraftPlayerIndex && ' ←'}
              </div>
            );
          })}
        </div>

        {/* Current player indicator */}
        <div className={`text-center mb-6 p-4 rounded-xl border-2 ${COLOR_CLASS[player.color]}`}>
          <p className="text-white/80 text-sm">選択中のプレイヤー</p>
          <p className="text-2xl font-bold text-white">{player.name}</p>
          <p className="text-white/80 text-sm mt-1">
            {isHonmei ? '本命馬' : '対抗馬'}を1枚選んでください
          </p>
        </div>

        {/* Available horses */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {available.map(horse => (
            <BaseHorseCard
              key={horse.id}
              horse={horse}
              onClick={() => handleSelect(horse.id)}
            />
          ))}
          {/* Placeholders for discarded spots */}
          {Array.from({ length: 4 - available.length }).map((_, i) => (
            <div key={`empty-${i}`} className="rounded-xl border-2 border-dashed border-white/20 bg-white/5 p-4 flex items-center justify-center text-white/30">
              選択済み
            </div>
          ))}
        </div>

        {/* Already picked by players */}
        {state.players.some(p => isHonmei ? p.horses.length >= 1 : p.horses.length >= 2) && (
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-white/70 text-sm mb-2">選択済み</p>
            <div className="flex flex-wrap gap-2">
              {state.players.map((p, i) => {
                const horse = isHonmei ? p.horses[0] : p.horses[1];
                if (!horse) return null;
                return (
                  <div key={i} className={`px-3 py-1 rounded-full text-sm font-medium ${COLOR_CLASS[p.color]}`}>
                    {p.name}: {horse.base.name}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
