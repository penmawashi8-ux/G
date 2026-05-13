import React, { useState } from 'react';
import { GameState, Part, HorseState, SlotType } from '../types';
import { GameAction } from '../gameReducer';
import { COLOR_CLASS } from '../data';
import { getEffectiveStats, isEquipValid, getSlotLabel } from '../utils';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  myTurn?: boolean;
}

const SLOT_ICON: Record<SlotType, string> = { jockey: '🏇', blinker: '👁', cheek: '🔷' };

function PartBadge({ part, onRemove }: { part: Part; onRemove?: () => void }) {
  return (
    <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 text-xs">
      <span className="font-medium text-blue-800">{part.name}</span>
      {onRemove && (
        <button onClick={onRemove} className="text-red-400 hover:text-red-600 ml-1">✕</button>
      )}
    </div>
  );
}

function StatDiff({ label, base, eff, icon }: { label: string; base: number; eff: number; icon: string }) {
  const diff = eff - base;
  return (
    <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1 text-xs">
      <span>{icon}</span>
      <span className="text-gray-500">{label}</span>
      <span className={`font-bold ml-auto ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-gray-800'}`}>
        {eff}
        {diff !== 0 && <span className="text-xs ml-0.5">({diff > 0 ? '+' : ''}{diff})</span>}
      </span>
    </div>
  );
}

export default function EquipScreen({ state, dispatch, myTurn = true }: Props) {
  const pi = state.currentEquipPlayerIndex;
  const player = state.players[pi];
  const [selectedHorse, setSelectedHorse] = useState(0);

  const horse = player.horses[selectedHorse];
  const stats = getEffectiveStats(horse);

  function handleEquip(slot: SlotType, partId: string) {
    dispatch({ type: 'EQUIP_PART', horseIndex: selectedHorse, slot, partId });
  }

  function handleUnequip(slot: SlotType) {
    dispatch({ type: 'UNEQUIP_PART', horseIndex: selectedHorse, slot });
  }

  function canEquip(horse: HorseState, slot: SlotType, part: Part): boolean {
    return isEquipValid(horse, slot, part);
  }

  const slots: SlotType[] = ['jockey', 'blinker', 'cheek'];
  const availableBySlot = (slot: SlotType) =>
    player.parts.filter(p => p.slot === slot);

  return (
    <div className="min-h-screen bg-emerald-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-3 bg-white/10 rounded-full px-6 py-2">
            <span className="text-xl">⚙️</span>
            <h1 className="text-lg font-bold text-white">パーツ装備フェイズ</h1>
          </div>
        </div>

        {/* Player progress */}
        <div className="flex justify-center gap-2 mb-4">
          {state.players.map((p, i) => (
            <div key={i} className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all
              ${i === pi
                ? COLOR_CLASS[p.color] + ' scale-110 shadow-lg'
                : i < pi
                  ? 'bg-white/30 text-white border-white/30 opacity-60'
                  : 'bg-white/10 text-white/40 border-white/10'}
            `}>
              {p.name.slice(0, 2)}{i < pi && ' ✓'}
            </div>
          ))}
        </div>

        <div className={`p-3 rounded-xl border-2 text-center mb-4 ${COLOR_CLASS[player.color]}`}>
          <p className="text-white font-bold">{player.name} — 馬にパーツを装備してください</p>
          <p className="text-white/80 text-xs mt-0.5">手札: {player.parts.length}枚 | 各スロット最大1枚 | スピード・体力が0以下になる装備は禁止</p>
        </div>

        {/* Horse selector */}
        <div className="flex gap-3 mb-4">
          {player.horses.map((h, hi) => (
            <button
              key={hi}
              onClick={() => setSelectedHorse(hi)}
              className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${
                selectedHorse === hi
                  ? 'bg-white text-emerald-700 border-emerald-500 shadow-md'
                  : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
              }`}
            >
              {h.base.name}
              <span className="text-xs font-normal ml-2">({h.base.type === 'honmei' ? '本命' : '対抗'})</span>
            </button>
          ))}
        </div>

        {/* Main equip area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Horse stats */}
          <div className="bg-white rounded-xl p-4">
            <h3 className="font-bold text-gray-700 mb-3">{horse.base.name} のステータス</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <StatDiff label="スピード" base={horse.base.speed} eff={stats.speed} icon="💨" />
              <StatDiff label="体力" base={horse.base.hp} eff={stats.hp} icon="❤️" />
            </div>

            {/* Equipped parts */}
            <div className="mt-3 space-y-2">
              {slots.map(slot => (
                <div key={slot} className="flex items-center gap-2">
                  <span className="text-lg w-6">{SLOT_ICON[slot]}</span>
                  <span className="text-xs text-gray-500 w-20">{getSlotLabel(slot)}</span>
                  {horse[slot] ? (
                    <PartBadge part={horse[slot]!} onRemove={() => handleUnequip(slot)} />
                  ) : (
                    <span className="text-xs text-gray-300 border border-dashed border-gray-200 rounded-lg px-2 py-1">空き</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Available parts */}
          <div className="bg-white rounded-xl p-4">
            <h3 className="font-bold text-gray-700 mb-3">手札パーツ ({player.parts.length}枚)</h3>
            {player.parts.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">すべて装備済み</p>
            ) : (
              <div className="space-y-2">
                {slots.map(slot => {
                  const slotParts = availableBySlot(slot);
                  if (slotParts.length === 0) return null;
                  return (
                    <div key={slot}>
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        {SLOT_ICON[slot]} {getSlotLabel(slot)}
                      </p>
                      {slotParts.map(part => {
                        const valid = canEquip(horse, slot, part);
                        const alreadyEquipped = !!horse[slot];
                        return (
                          <button
                            key={part.id}
                            onClick={() => valid ? handleEquip(slot, part.id) : null}
                            disabled={!valid}
                            title={!valid ? 'この装備では能力値が0以下になります' : alreadyEquipped ? 'スロットを上書き' : '装備する'}
                            className={`
                              w-full text-left px-3 py-2 rounded-lg border text-sm mb-1 transition-all
                              ${valid
                                ? 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 cursor-pointer'
                                : 'border-red-200 bg-red-50 opacity-50 cursor-not-allowed'}
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{part.name}</span>
                              {!valid && <span className="text-xs text-red-500">装備不可</span>}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {[
                                part.speedMod !== 0 && `速${part.speedMod>0?'+':''}${part.speedMod}`,
                                part.hpMod !== 0 && `体力${part.hpMod>0?'+':''}${part.hpMod}`,
                              ].filter(Boolean).map((m, i) => (
                                <span key={i} className="text-xs text-gray-500">{m}</span>
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Confirm */}
        <div className="mt-4">
          <button
            onClick={() => dispatch({ type: 'CONFIRM_EQUIP' })}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            {pi === state.playerCount - 1 ? 'レース開始！ 🏁' : '装備確定 → 次のプレイヤーへ'}
          </button>
        </div>
      </div>
    </div>
  );
}
