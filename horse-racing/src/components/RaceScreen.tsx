import React from 'react';
import { GameState, ActionType, RaceSubPhase } from '../types';
import { GameAction } from '../gameReducer';
import { COLOR_CLASS, COLOR_LABEL, COLOR_BG_LIGHT, COLOR_BORDER } from '../data';
import { getEffectiveStats, countValidDice } from '../utils';
import TrackBoard from './TrackBoard';
import DiceRoller from './DiceRoller';
import { HorseStateCard } from './HorseCard';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  myTurn?: boolean;
}

const DIR_LABEL = { left: '左 ←', right: '右 →' };

const PLAYER_TEXT_COLORS = ['text-rose-600', 'text-emerald-600', 'text-slate-700', 'text-violet-600'];

// Step indicator config
const BATTLE_STEPS = [
  { id: 'draw-initiative', label: '手番決定', icon: '🃏' },
  { id: 'action-declare', label: '行動選択', icon: '✋' },
  { id: 'dice-roll', label: 'サイコロ', icon: '🎲' },
  { id: 'resolve', label: '結果確認', icon: '📋' },
];

function BattleStepIndicator({ current }: { current: RaceSubPhase | null }) {
  const stepId = current === 'target-declare' ? 'action-declare' : current;
  return (
    <div className="flex items-center gap-1 justify-center mb-3">
      {BATTLE_STEPS.map((step, i) => {
        const isActive = step.id === stepId;
        const isDone = BATTLE_STEPS.findIndex(s => s.id === stepId) > i;
        return (
          <React.Fragment key={step.id}>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all
              ${isActive ? 'bg-emerald-600 text-white font-bold shadow-md scale-105' : isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
              <span>{step.icon}</span>
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {i < BATTLE_STEPS.length - 1 && (
              <span className={`text-xs ${isDone ? 'text-emerald-400' : 'text-gray-300'}`}>→</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function RaceScreen({ state, dispatch, myTurn = true }: Props) {
  const sub = state.raceSubPhase;

  const attacker = state.attackerPlayerIndex != null ? state.players[state.attackerPlayerIndex] : null;
  const attackerHorse = attacker && state.attackerHorseIndex != null ? attacker.horses[state.attackerHorseIndex] : null;
  const attackerStats = attackerHorse ? getEffectiveStats(attackerHorse) : null;

  const defender = state.defenderPlayerIndex != null ? state.players[state.defenderPlayerIndex] : null;
  const defenderHorse = defender && state.defenderHorseIndex != null ? defender.horses[state.defenderHorseIndex] : null;
  const defenderStats = defenderHorse ? getEffectiveStats(defenderHorse) : null;

  const inheritPlayer = state.pendingInheritancePlayerIndex != null ? state.players[state.pendingInheritancePlayerIndex] : null;
  const bondPlayer = state.pendingBondPlayerIndex != null ? state.players[state.pendingBondPlayerIndex] : null;

  return (
    <div className="min-h-screen bg-emerald-900 p-3">
      <div className="max-w-4xl mx-auto space-y-3">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="bg-white/10 rounded-full px-4 py-2 text-white font-bold text-sm flex items-center gap-2">
            <span>🏇</span>
            <span>競走フェイズ</span>
            <span className="text-white/60">|</span>
            <span className="text-yellow-300">{state.raceDistance}マスレース</span>
          </div>
          <div className="bg-white/10 rounded-full px-4 py-2 text-white/70 text-sm">
            山札: {state.initiativeDeck.length}枚
          </div>
        </div>

        {/* Track */}
        <TrackBoard players={state.players} raceDistance={state.raceDistance} />

        {/* ── INHERITANCE MODALS ── */}
        {sub === 'inheritance' && inheritPlayer && (
          <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4">
            <h3 className="font-bold text-orange-800 text-lg mb-2">💫 気合の継承</h3>
            <p className="text-orange-700 text-sm mb-3">
              {inheritPlayer.name}: 脱落した馬の魂を引き継ぐ馬を選んでください（やる気・根性+1）
            </p>
            <div className="grid grid-cols-2 gap-3">
              {inheritPlayer.horses.map((h, hi) => {
                if (h.fallen) return null;
                if (hi === state.pendingInheritanceFallenHorseIndex) return null;
                const canReceive = !h.soulInherited;
                return (
                  <button
                    key={hi}
                    onClick={() => canReceive && dispatch({ type: 'SELECT_INHERITANCE_HORSE', targetHorseIndex: hi })}
                    disabled={!canReceive}
                    className={`p-3 rounded-xl border-2 text-left transition-all
                      ${canReceive ? 'border-orange-400 hover:bg-orange-100 cursor-pointer' : 'border-gray-300 opacity-50 cursor-not-allowed'}
                    `}
                  >
                    <p className="font-bold text-gray-800">{h.base.name}</p>
                    <p className="text-xs text-gray-500">
                      やる気{getEffectiveStats(h).motivation}→{getEffectiveStats(h).motivation + 1} /
                      根性(HP){getEffectiveStats(h).grit}→{getEffectiveStats(h).grit + 1}
                    </p>
                    {!canReceive && <p className="text-xs text-red-500">継承済み</p>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {sub === 'bond-inheritance' && bondPlayer && (
          <div className="bg-pink-50 border-2 border-pink-300 rounded-xl p-4">
            <h3 className="font-bold text-pink-800 text-lg mb-2">💛 絆の継承</h3>
            <p className="text-pink-700 text-sm mb-3">
              {bondPlayer.name}: チームの仲間の魂を引き継ぐ馬を選んでください（やる気・根性+1）
            </p>
            <div className="grid grid-cols-2 gap-3">
              {bondPlayer.horses.map((h, hi) => {
                if (h.fallen) return null;
                const canReceive = !h.bondInherited;
                return (
                  <button
                    key={hi}
                    onClick={() => canReceive && dispatch({ type: 'SELECT_BOND_HORSE', targetHorseIndex: hi })}
                    disabled={!canReceive}
                    className={`p-3 rounded-xl border-2 text-left transition-all
                      ${canReceive ? 'border-pink-400 hover:bg-pink-100 cursor-pointer' : 'border-gray-300 opacity-50 cursor-not-allowed'}
                    `}
                  >
                    <p className="font-bold text-gray-800">{h.base.name}</p>
                    <p className="text-xs text-gray-500">
                      やる気{getEffectiveStats(h).motivation}→{getEffectiveStats(h).motivation + 1} /
                      根性(HP){getEffectiveStats(h).grit}→{getEffectiveStats(h).grit + 1}
                    </p>
                    {!canReceive && <p className="text-xs text-red-500">継承済み</p>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── MAIN TURN AREA ── */}
        {(sub === 'draw-initiative' || sub === 'action-declare' || sub === 'target-declare' || sub === 'dice-roll' || sub === 'reroll' || sub === 'resolve') && (
          <div className="bg-white rounded-xl p-4 shadow-md">

            {/* Step indicator */}
            <BattleStepIndicator current={sub} />

            {/* Draw initiative */}
            {sub === 'draw-initiative' && (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm mb-4">イニシアチブカードを引いて手番プレイヤーを決定します</p>
                <button
                  onClick={() => dispatch({ type: 'DRAW_INITIATIVE' })}
                  className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xl rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  🃏 カードを引く
                </button>
              </div>
            )}

            {/* Initiative card shown */}
            {(sub === 'action-declare' || sub === 'target-declare' || sub === 'dice-roll' || sub === 'reroll' || sub === 'resolve') && state.currentInitiativeCard && attacker && attackerHorse && (
              <>
                {/* Current turn banner */}
                <div className={`flex items-center gap-3 mb-4 p-3 rounded-xl ${['bg-rose-50','bg-emerald-50','bg-slate-50','bg-violet-50'][state.attackerPlayerIndex!]}`}>
                  <div className={`w-12 h-16 rounded-lg border-2 ${COLOR_CLASS[attacker.color]} flex flex-col items-center justify-center shadow flex-shrink-0`}>
                    <span className="text-white text-xs font-bold">{COLOR_LABEL[attacker.color]}</span>
                    <span className="text-white text-xl">{state.currentInitiativeCard.direction === 'right' ? '→' : '←'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-400 font-medium">手番プレイヤー</p>
                    <p className={`font-bold text-lg ${PLAYER_TEXT_COLORS[state.attackerPlayerIndex!]}`}>
                      {attacker.name}
                    </p>
                    <p className="text-sm text-gray-700 font-medium">🏇 {attackerHorse.base.name}</p>
                    {attackerStats && (
                      <div className="flex flex-wrap gap-1.5 text-xs mt-1">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">
                          脚力{attackerStats.ability}<span className="text-yellow-600 font-normal ml-1 text-[10px]">手番頻度</span>
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                          速{attackerStats.speed}<span className="text-blue-600 font-normal ml-1 text-[10px]">前進倍率</span>
                        </span>
                        <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-medium">
                          気{attackerStats.motivation}<span className="text-orange-600 font-normal ml-1 text-[10px]">有効出目≤</span>
                        </span>
                        {attackerStats.extraDice > 0 && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">🎲+{attackerStats.extraDice}</span>}
                        {attackerStats.extraReroll > 0 && <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">↺+{attackerStats.extraReroll}</span>}
                      </div>
                    )}
                  </div>
                  {defender && sub !== 'action-declare' && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-[11px] text-gray-400">{DIR_LABEL[state.currentInitiativeCard.direction]}</p>
                      <p className={`font-bold text-sm ${PLAYER_TEXT_COLORS[state.defenderPlayerIndex!]}`}>
                        {defender.name}
                      </p>
                      {defenderHorse && (
                        <p className="text-xs text-gray-500">{defenderHorse.base.name}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Action declare */}
                {sub === 'action-declare' && (
                  <div>
                    <p className="text-center text-gray-600 font-medium mb-3 text-sm">
                      {attacker.name} — どちらの行動をしますか？
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => dispatch({ type: 'DECLARE_ACTION', actionType: 'advance' })}
                        className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-xl hover:bg-emerald-100 transition-all hover:scale-105 text-center"
                      >
                        <div className="font-bold text-emerald-700 text-lg">🏃 前進</div>
                        <div className="text-xs text-gray-600 mt-2 leading-relaxed">
                          有効サイコロ数 × <span className="font-bold text-blue-600">スピード({attackerStats?.speed})</span> マス進む
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1">
                          やる気{attackerStats?.motivation}以下が有効
                        </div>
                      </button>
                      <button
                        onClick={() => dispatch({ type: 'DECLARE_ACTION', actionType: 'obstruct' })}
                        className="p-4 bg-red-50 border-2 border-red-400 rounded-xl hover:bg-red-100 transition-all hover:scale-105 text-center"
                      >
                        <div className="font-bold text-red-700 text-lg">⚔️ 斜行</div>
                        <div className="text-xs text-gray-600 mt-2 leading-relaxed">
                          有効サイコロ数 分だけ<br />相手の<span className="font-bold text-red-600">根性(HP)</span>にダメージ
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1">
                          {DIR_LABEL[state.currentInitiativeCard.direction]}のプレイヤーが対象
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Target declare */}
                {sub === 'target-declare' && defender && (
                  <div>
                    <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3 text-center">
                      <p className="text-red-700 font-medium text-sm">
                        ⚔️ <span className={`font-bold ${PLAYER_TEXT_COLORS[state.attackerPlayerIndex!]}`}>{attacker.name}</span> の斜行！
                      </p>
                      <p className="text-gray-600 text-xs mt-0.5">
                        {defender.name} — どの馬でダメージを受けますか？
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {defender.horses.map((h, hi) => {
                        if (h.fallen) return null;
                        const stats = getEffectiveStats(h);
                        const hpPercent = Math.min(100, (h.damage / stats.grit) * 100);
                        return (
                          <button
                            key={hi}
                            onClick={() => dispatch({ type: 'SELECT_DEFENDER_HORSE', horseIndex: hi })}
                            className="p-3 bg-gray-50 border-2 border-gray-300 rounded-xl hover:border-red-400 hover:bg-red-50 transition-all text-left"
                          >
                            <p className="font-bold text-gray-800 text-sm">{h.base.name}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-xs text-gray-500">根性(HP)</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${hpPercent >= 75 ? 'bg-red-400' : hpPercent >= 40 ? 'bg-yellow-400' : 'bg-emerald-400'}`}
                                  style={{ width: `${100 - hpPercent}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-gray-700">{stats.grit - h.damage}/{stats.grit}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Dice roll */}
                {(sub === 'dice-roll' || sub === 'reroll') && attackerStats && (
                  <DiceRoller
                    values={state.diceValues}
                    rerolled={state.diceRerolled}
                    rerollsRemaining={state.rerollsRemaining}
                    motivation={attackerStats.motivation}
                    onReroll={(i) => dispatch({ type: 'REROLL_DIE', dieIndex: i })}
                    onConfirm={() => dispatch({ type: 'CONFIRM_DICE' })}
                    phase={state.rerollsRemaining > 0 ? 'reroll' : 'rolling'}
                  />
                )}

                {/* Resolve result */}
                {sub === 'resolve' && attackerStats && (() => {
                  const validCount = countValidDice(state.diceValues, attackerStats.motivation);
                  const isAdvance = state.declaredAction === 'advance';

                  return (
                    <div>
                      {/* Result card */}
                      <div className={`rounded-xl p-4 mb-3 border-2 ${isAdvance ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}`}>
                        {/* Who did what */}
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
                          <span className="text-2xl">{isAdvance ? '🏃' : '⚔️'}</span>
                          <div>
                            <p className="font-bold text-gray-800">
                              {attacker.name} / {attackerHorse.base.name}
                            </p>
                            {isAdvance ? (
                              <p className="text-emerald-700 text-sm font-semibold">前進アクション</p>
                            ) : (
                              <p className="text-red-700 text-sm font-semibold">
                                斜行 → {defender?.name} / {defenderHorse?.base.name}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Dice display */}
                        <div className="flex justify-center gap-1.5 mb-2">
                          {state.diceValues.map((v, i) => {
                            const valid = v <= attackerStats.motivation;
                            return (
                              <div key={i} className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center text-lg
                                ${valid ? 'border-emerald-400 bg-emerald-100' : 'border-gray-300 bg-gray-100 opacity-40'}`}>
                                {['','⚀','⚁','⚂','⚃','⚄','⚅'][v]}
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-center text-xs text-gray-500 mb-3">
                          有効 {validCount}/{state.diceValues.length} 個（やる気{attackerStats.motivation}以下が有効）
                        </p>

                        {/* Result */}
                        {isAdvance ? (
                          <div className="text-center">
                            <p className="font-black text-emerald-700 text-3xl">
                              +{validCount * attackerStats.speed} マス！
                            </p>
                            <p className="text-xs text-emerald-600 mt-1">
                              有効{validCount}個 × スピード{attackerStats.speed} = {validCount * attackerStats.speed}マス前進
                            </p>
                            <p className="text-sm text-gray-600 mt-2 font-medium">
                              現在位置: <span className="font-bold text-gray-800">{attackerHorse.position}</span>
                              <span className="text-gray-400"> / {state.raceDistance}</span>
                            </p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <p className="font-black text-red-600 text-3xl">
                              -{validCount} ダメージ！
                            </p>
                            {defenderHorse && defenderStats && (
                              <div className="mt-2 bg-white/60 rounded-lg p-2">
                                <p className="text-sm text-gray-700 font-medium">{defenderHorse.base.name} の根性(HP)</p>
                                <div className="flex items-center justify-center gap-2 mt-1">
                                  <span className="text-gray-500 font-bold">{defenderHorse.damage - validCount}</span>
                                  <span className="text-gray-400">→</span>
                                  <span className={`font-black text-lg ${defenderHorse.damage >= defenderStats.grit ? 'text-red-700' : 'text-gray-800'}`}>
                                    {defenderHorse.damage}
                                  </span>
                                  <span className="text-gray-400 text-sm">/ {defenderStats.grit}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-1.5">
                                  <div
                                    className={`h-2 rounded-full transition-all ${
                                      defenderHorse.damage / defenderStats.grit >= 0.75 ? 'bg-red-500' :
                                      defenderHorse.damage / defenderStats.grit >= 0.5 ? 'bg-yellow-500' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${Math.max(0, 100 - (defenderHorse.damage / defenderStats.grit) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => dispatch({ type: 'DRAW_INITIATIVE' })}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95"
                      >
                        次のターンへ →
                      </button>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* ── PLAYER STATUS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {state.players.map((p) => (
            <div key={p.id} className={`bg-white rounded-xl p-3 border-2 ${COLOR_BORDER[p.color]}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-4 h-4 rounded-full ${['bg-rose-500','bg-emerald-500','bg-slate-700','bg-violet-500'][p.id]}`} />
                <p className={`font-bold text-sm ${PLAYER_TEXT_COLORS[p.id]}`}>
                  {p.name}
                  {state.teamMode && <span className="text-xs text-gray-400 ml-1">(チーム{p.teamId + 1})</span>}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {p.horses.map((h, hi) => (
                  <HorseStateCard
                    key={hi}
                    horse={h}
                    playerColor={p.color}
                    compact
                    showDamage
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── GAME LOG ── */}
        <div className="bg-white/10 rounded-xl p-3">
          <p className="text-white/70 text-xs font-medium mb-2">ゲームログ</p>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {state.gameLog.map((entry, i) => (
              <p key={i} className={`text-xs ${i === 0 ? 'text-white' : 'text-white/50'}`}>
                {entry}
              </p>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
