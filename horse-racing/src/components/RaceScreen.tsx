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

export default function RaceScreen({ state, dispatch, myTurn = true }: Props) {
  const sub = state.raceSubPhase;

  const attacker = state.attackerPlayerIndex != null ? state.players[state.attackerPlayerIndex] : null;
  const attackerHorse = attacker && state.attackerHorseIndex != null ? attacker.horses[state.attackerHorseIndex] : null;
  const attackerStats = attackerHorse ? getEffectiveStats(attackerHorse) : null;

  const defender = state.defenderPlayerIndex != null ? state.players[state.defenderPlayerIndex] : null;

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
                      根性{getEffectiveStats(h).grit}→{getEffectiveStats(h).grit + 1}
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
                      根性{getEffectiveStats(h).grit}→{getEffectiveStats(h).grit + 1}
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
            {/* Draw initiative */}
            {sub === 'draw-initiative' && (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-4">イニシアチブカードを引いて手番プレイヤーを決定します</p>
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
                {/* Initiative card info */}
                <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                  <div className={`w-12 h-16 rounded-lg border-2 ${COLOR_CLASS[attacker.color]} flex flex-col items-center justify-center shadow`}>
                    <span className="text-white text-xs">{COLOR_LABEL[attacker.color]}</span>
                    <span className="text-white text-lg">{state.currentInitiativeCard.direction === 'right' ? '→' : '←'}</span>
                    <span className="text-white/70 text-[10px]">{DIR_LABEL[state.currentInitiativeCard.direction]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">攻めプレイヤー</p>
                    <p className={`font-bold text-lg ${['text-rose-600','text-emerald-600','text-slate-700','text-violet-600'][state.attackerPlayerIndex!]}`}>
                      {attacker.name}
                    </p>
                    <p className="text-sm text-gray-600">馬: <span className="font-medium">{attackerHorse.base.name}</span></p>
                    {attackerStats && (
                      <div className="flex gap-2 text-xs mt-1">
                        <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">脚力{attackerStats.ability}</span>
                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">速{attackerStats.speed}</span>
                        <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">気{attackerStats.motivation}</span>
                        {attackerStats.extraDice > 0 && <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">🎲+{attackerStats.extraDice}</span>}
                        {attackerStats.extraReroll > 0 && <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">↺+{attackerStats.extraReroll}</span>}
                      </div>
                    )}
                  </div>
                  {defender && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500">{DIR_LABEL[state.currentInitiativeCard.direction]}</p>
                      <p className={`font-bold ${['text-rose-600','text-emerald-600','text-slate-700','text-violet-600'][state.defenderPlayerIndex!]}`}>
                        {defender.name}
                      </p>
                      <p className="text-xs text-gray-400">受けプレイヤー候補</p>
                    </div>
                  )}
                </div>

                {/* Action declare */}
                {sub === 'action-declare' && (
                  <div>
                    <p className="text-center text-gray-700 font-medium mb-3">
                      {attacker.name} — 行動を選んでください
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => dispatch({ type: 'DECLARE_ACTION', actionType: 'advance' })}
                        className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-xl hover:bg-emerald-100 transition-all hover:scale-105 text-center"
                      >
                        <div className="font-bold text-emerald-700">前進</div>
                        <div className="text-xs text-gray-500 mt-1">
                          有効出目×スピード({attackerStats?.speed})マス進む
                        </div>
                      </button>
                      <button
                        onClick={() => dispatch({ type: 'DECLARE_ACTION', actionType: 'obstruct' })}
                        className="p-4 bg-red-50 border-2 border-red-400 rounded-xl hover:bg-red-100 transition-all hover:scale-105 text-center"
                      >
                        <div className="font-bold text-red-700">斜行</div>
                        <div className="text-xs text-gray-500 mt-1">
                          相手の馬に有効出目分ダメージ
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Target declare */}
                {sub === 'target-declare' && defender && (
                  <div>
                    <p className="text-center text-gray-700 font-medium mb-3">
                      {defender.name} — 斜行を受ける馬を選んでください
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {defender.horses.map((h, hi) => {
                        if (h.fallen) return null;
                        const stats = getEffectiveStats(h);
                        return (
                          <button
                            key={hi}
                            onClick={() => dispatch({ type: 'SELECT_DEFENDER_HORSE', horseIndex: hi })}
                            className="p-3 bg-gray-50 border-2 border-gray-300 rounded-xl hover:border-red-400 hover:bg-red-50 transition-all text-left"
                          >
                            <p className="font-bold text-gray-800">{h.base.name}</p>
                            <div className="flex gap-1 text-xs mt-1">
                              <span className="bg-red-100 text-red-600 px-1 rounded">根性{stats.grit}</span>
                              <span className="bg-gray-100 text-gray-600 px-1 rounded">ダメージ{h.damage}</span>
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
                {sub === 'resolve' && attackerStats && (
                  <div>
                    <div className="bg-gray-50 rounded-xl p-4 mb-3">
                      <p className="text-center text-gray-600 text-sm mb-2">結果</p>
                      <div className="flex justify-center gap-2 mb-3">
                        {state.diceValues.map((v, i) => {
                          const valid = v <= attackerStats.motivation;
                          return (
                            <div key={i} className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xl
                              ${valid ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 bg-gray-50 opacity-50'}`}>
                              {['','⚀','⚁','⚂','⚃','⚄','⚅'][v]}
                            </div>
                          );
                        })}
                      </div>
                      {state.declaredAction === 'advance' ? (
                        <p className="text-center font-bold text-emerald-700 text-lg">
                          +{countValidDice(state.diceValues, attackerStats.motivation) * attackerStats.speed} マス前進！
                        </p>
                      ) : (
                        <p className="text-center font-bold text-red-600 text-lg">
                          -{countValidDice(state.diceValues, attackerStats.motivation)} ダメージ！
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => dispatch({ type: 'DRAW_INITIATIVE' })}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95"
                    >
                      次のターンへ →
                    </button>
                  </div>
                )}
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
                <p className={`font-bold text-sm ${['text-rose-600','text-emerald-600','text-slate-700','text-violet-600'][p.id]}`}>
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
