import React, { useEffect, useRef } from 'react';
import { GameState, ActionType, RaceSubPhase } from '../types';
import { GameAction } from '../gameReducer';
import { COLOR_CLASS, COLOR_LABEL, COLOR_BORDER } from '../data';
import { getEffectiveStats, isDiceSuccess } from '../utils';
import TrackBoard from './TrackBoard';
import DiceRoller from './DiceRoller';
import { HorseStateCard } from './HorseCard';
import { sounds } from '../sounds';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  myTurn?: boolean;
}

const DIR_LABEL = { left: '左 ←', right: '右 →' };
const PLAYER_TEXT_COLORS = ['text-rose-600', 'text-emerald-600', 'text-slate-700', 'text-violet-600'];

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

export default function RaceScreen({ state, dispatch }: Props) {
  const sub = state.raceSubPhase;
  const prevSubRef = useRef<RaceSubPhase | null>(null);

  // Sound effects on subphase transitions
  useEffect(() => {
    const prev = prevSubRef.current;
    if (sub !== prev) {
      if (sub === 'draw-initiative') {
        sounds.card();
      } else if (sub === 'resolve' && state.diceValues.length > 0) {
        const attackerStats = state.attackerPlayerIndex != null && state.attackerHorseIndex != null
          ? getEffectiveStats(state.players[state.attackerPlayerIndex].horses[state.attackerHorseIndex])
          : null;
        if (attackerStats) {
          const success = isDiceSuccess(state.diceValues[0], attackerStats.speed);
          if (!success) {
            sounds.fail();
          } else if (state.declaredAction === 'advance') {
            sounds.advance();
          } else {
            sounds.attack();
          }
        }
      }
      prevSubRef.current = sub;
    }
  });

  // Play fall sound when a horse is eliminated
  const totalFallen = state.players.reduce(
    (n, p) => n + p.horses.filter(h => h.fallen).length,
    0,
  );
  const prevFallenRef = useRef(0);
  useEffect(() => {
    if (totalFallen > prevFallenRef.current) {
      sounds.fall();
    }
    prevFallenRef.current = totalFallen;
  }, [totalFallen]);

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
              {inheritPlayer.name}: 脱落した馬の魂を引き継ぐ馬を選んでください（体力+1）
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
                      ${canReceive ? 'border-orange-400 hover:bg-orange-100 cursor-pointer' : 'border-gray-300 opacity-50 cursor-not-allowed'}`}
                  >
                    <p className="font-bold text-gray-800">{h.base.name}</p>
                    <p className="text-xs text-gray-500">
                      体力 {getEffectiveStats(h).hp} → {getEffectiveStats(h).hp + 1}
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
              {bondPlayer.name}: チームの仲間の魂を引き継ぐ馬を選んでください（体力+1）
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
                      ${canReceive ? 'border-pink-400 hover:bg-pink-100 cursor-pointer' : 'border-gray-300 opacity-50 cursor-not-allowed'}`}
                  >
                    <p className="font-bold text-gray-800">{h.base.name}</p>
                    <p className="text-xs text-gray-500">
                      体力 {getEffectiveStats(h).hp} → {getEffectiveStats(h).hp + 1}
                    </p>
                    {!canReceive && <p className="text-xs text-red-500">継承済み</p>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── MAIN TURN AREA ── */}
        {(sub === 'draw-initiative' || sub === 'action-declare' || sub === 'target-declare' || sub === 'dice-roll' || sub === 'resolve') && (
          <div className="bg-white rounded-xl p-4 shadow-md">

            <BattleStepIndicator current={sub} />

            {/* Draw initiative */}
            {sub === 'draw-initiative' && (
              <div className="text-center py-4">
                <button
                  onClick={() => dispatch({ type: 'DRAW_INITIATIVE' })}
                  className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xl rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  🃏 カードを引く
                </button>
              </div>
            )}

            {/* Initiative card shown */}
            {(sub === 'action-declare' || sub === 'target-declare' || sub === 'dice-roll' || sub === 'resolve') && state.currentInitiativeCard && attacker && attackerHorse && attackerStats && (() => {
              const isAttackerCpu = state.playerTypes[state.attackerPlayerIndex!] === 'cpu';
              const isDefenderCpu = state.defenderPlayerIndex != null && state.playerTypes[state.defenderPlayerIndex] === 'cpu';

              return (
                <>
                  {/* Current turn banner */}
                  <div className={`flex items-center gap-3 mb-4 p-3 rounded-xl ${['bg-rose-50','bg-emerald-50','bg-slate-50','bg-violet-50'][state.attackerPlayerIndex!]}`}>
                    <div className={`w-10 h-10 rounded-lg border-2 ${COLOR_CLASS[attacker.color]} flex items-center justify-center shadow flex-shrink-0`}>
                      <span className="text-white font-bold text-sm">{state.currentInitiativeCard.direction === 'right' ? '→' : '←'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-base leading-tight ${PLAYER_TEXT_COLORS[state.attackerPlayerIndex!]}`}>
                        {attacker.name} <span className="text-gray-500 font-normal text-sm">/ {attackerHorse.base.name}</span>
                      </p>
                      <div className="flex gap-1.5 mt-1">
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">SPD {attackerStats.speed}</span>
                        <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-medium">❤️ {attackerStats.hp - attackerHorse.damage}/{attackerStats.hp}</span>
                      </div>
                    </div>
                    {defender && sub !== 'action-declare' && (
                      <div className="text-right flex-shrink-0">
                        <p className={`font-bold text-sm ${PLAYER_TEXT_COLORS[state.defenderPlayerIndex!]}`}>{defender.name}</p>
                        {defenderHorse && <p className="text-xs text-gray-500">{defenderHorse.base.name}</p>}
                      </div>
                    )}
                  </div>

                  {/* Action declare */}
                  {sub === 'action-declare' && (
                    isAttackerCpu ? (
                      <div className="text-center py-4 text-gray-400 text-sm animate-pulse">CPU 思考中…</div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => dispatch({ type: 'DECLARE_ACTION', actionType: 'advance' })}
                          className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-xl hover:bg-emerald-100 transition-all active:scale-95 text-center"
                        >
                          <div className="text-2xl mb-1">🏃</div>
                          <div className="font-bold text-emerald-700">前進</div>
                          <div className="text-xs text-gray-500 mt-1">出目マス進む</div>
                        </button>
                        <button
                          onClick={() => dispatch({ type: 'DECLARE_ACTION', actionType: 'obstruct' })}
                          className="p-4 bg-red-50 border-2 border-red-400 rounded-xl hover:bg-red-100 transition-all active:scale-95 text-center"
                        >
                          <div className="text-2xl mb-1">⚔️</div>
                          <div className="font-bold text-red-700">斜行</div>
                          <div className="text-xs text-gray-500 mt-1">相手の体力−1</div>
                        </button>
                      </div>
                    )
                  )}

                  {/* Target declare */}
                  {sub === 'target-declare' && defender && (
                    isDefenderCpu ? (
                      <div className="text-center py-4 text-gray-400 text-sm animate-pulse">CPU 思考中…</div>
                    ) : (
                      <div>
                        <p className="text-center text-red-700 font-medium text-sm mb-3">
                          ⚔️ {attacker.name} の斜行！どの馬で受けますか？
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {defender.horses.map((h, hi) => {
                            if (h.fallen) return null;
                            const stats = getEffectiveStats(h);
                            const hpRemaining = stats.hp - h.damage;
                            const hpPercent = stats.hp > 0 ? (hpRemaining / stats.hp) * 100 : 0;
                            return (
                              <button
                                key={hi}
                                onClick={() => dispatch({ type: 'SELECT_DEFENDER_HORSE', horseIndex: hi })}
                                className="p-3 bg-gray-50 border-2 border-gray-300 rounded-xl hover:border-red-400 hover:bg-red-50 transition-all text-left"
                              >
                                <p className="font-bold text-gray-800 text-sm">{h.base.name}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className={`h-1.5 rounded-full ${hpPercent <= 33 ? 'bg-red-400' : hpPercent <= 66 ? 'bg-yellow-400' : 'bg-emerald-400'}`}
                                      style={{ width: `${hpPercent}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold text-gray-700">{hpRemaining}/{stats.hp}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )
                  )}

                  {/* Dice roll */}
                  {sub === 'dice-roll' && state.diceValues.length > 0 && (
                    isAttackerCpu ? (
                      <div className="text-center py-4 text-gray-400 text-sm animate-pulse">CPU 思考中…</div>
                    ) : (
                      <DiceRoller
                        dieValue={state.diceValues[0]}
                        speed={attackerStats.speed}
                        action={state.declaredAction as 'advance' | 'obstruct'}
                        onConfirm={() => dispatch({ type: 'CONFIRM_DICE' })}
                      />
                    )
                  )}

                  {/* Resolve */}
                  {sub === 'resolve' && state.diceValues.length > 0 && (() => {
                    const die = state.diceValues[0];
                    const success = isDiceSuccess(die, attackerStats.speed);
                    const isAdvance = state.declaredAction === 'advance';

                    return (
                      <div>
                        <div className={`rounded-xl p-4 mb-3 border-2 ${isAdvance ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}`}>
                          {/* Die + result */}
                          <div className="flex items-center justify-center gap-4 mb-3">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-4xl border-2
                              ${success ? 'border-emerald-400 bg-emerald-100' : 'border-red-300 bg-red-100'}`}>
                              {['','⚀','⚁','⚂','⚃','⚄','⚅'][die]}
                            </div>
                            <div className="text-sm text-gray-600 leading-relaxed">
                              <p className="font-medium">{die} {success ? '≥' : '<'} {attackerStats.speed} →{' '}
                                <span className={`font-bold ${success ? 'text-emerald-700' : 'text-red-600'}`}>
                                  {success ? '成功！' : '失敗…'}
                                </span>
                              </p>
                            </div>
                          </div>
                          {/* Outcome */}
                          {isAdvance ? (
                            <div className="text-center">
                              <p className={`font-black text-3xl ${success ? 'text-emerald-700' : 'text-gray-400'}`}>
                                {success ? `+${attackerStats.speed} マス！` : '前進なし'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">{attackerHorse.position} / {state.raceDistance} マス</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <p className={`font-black text-3xl ${success ? 'text-red-600' : 'text-gray-400'}`}>
                                {success ? '−1 ダメージ！' : 'ダメージなし'}
                              </p>
                              {success && defenderHorse && defenderStats && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {defenderHorse.base.name}: ❤️ {Math.max(0, defenderStats.hp - defenderHorse.damage)} / {defenderStats.hp}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => dispatch({ type: 'DRAW_INITIATIVE' })}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all active:scale-95"
                        >
                          次のターンへ →
                        </button>
                      </div>
                    );
                  })()}
                </>
              );
            })()}
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
                  <HorseStateCard key={hi} horse={h} playerColor={p.color} compact showDamage />
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
              <p key={i} className={`text-xs ${i === 0 ? 'text-white' : 'text-white/50'}`}>{entry}</p>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
