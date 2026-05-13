import { GameState, BaseHorse, Part, HorseState, SlotType } from './types';
import { GameAction } from './gameReducer';
import { getEffectiveStats, isEquipValid } from './utils';

// Returns the action a CPU player should take, or null if it's not CPU's turn
export function getCpuAction(state: GameState): GameAction | null {
  const actorIndex = getCurrentActorIndex(state);
  if (actorIndex === null) return null;
  if (state.playerTypes[actorIndex] !== 'cpu') return null;
  return buildAction(state, actorIndex);
}

function getCurrentActorIndex(state: GameState): number | null {
  switch (state.phase) {
    case 'honmei-draft':
    case 'taikou-draft':
    case 'parts-draft':
      return state.currentDraftPlayerIndex;
    case 'equip':
      return state.currentEquipPlayerIndex;
    case 'race': {
      const s = state.raceSubPhase;
      // 'resolve' is intentionally excluded: the human always confirms the result
      if (s === 'draw-initiative' || s === 'action-declare' || s === 'dice-roll')
        return state.attackerPlayerIndex;
      if (s === 'target-declare') return state.defenderPlayerIndex;
      if (s === 'inheritance') return state.pendingInheritancePlayerIndex;
      if (s === 'bond-inheritance') return state.pendingBondPlayerIndex;
      return null;
    }
    default: return null;
  }
}

function buildAction(state: GameState, cpuIdx: number): GameAction | null {
  switch (state.phase) {
    case 'honmei-draft': {
      const best = state.availableHonmei.reduce((a, b) => horseScore(a) >= horseScore(b) ? a : b);
      return { type: 'SELECT_HONMEI', horseId: best.id };
    }
    case 'taikou-draft': {
      const best = state.availableTaikou.reduce((a, b) => horseScore(a) >= horseScore(b) ? a : b);
      return { type: 'SELECT_TAIKOU', horseId: best.id };
    }
    case 'parts-draft': {
      const best = state.currentDraftParts.reduce((a, b) => partScore(a) >= partScore(b) ? a : b);
      return { type: 'SELECT_PART', partId: best.id };
    }
    case 'equip':
      return autoEquip(state, cpuIdx);
    case 'race':
      return raceAction(state, cpuIdx);
    default:
      return null;
  }
}

// ── Scoring helpers ───────────────────────────────────────────────────────────

function horseScore(h: BaseHorse) {
  // Lower speed = easier to succeed (more actions); higher hp = more survivable
  return (5 - h.speed) * 2 + h.hp;
}

function partScore(p: Part) {
  // Negative speedMod lowers the threshold (good); positive hpMod increases survivability (good)
  return -p.speedMod * 1.5 + p.hpMod;
}

// ── Equip phase ───────────────────────────────────────────────────────────────

function autoEquip(state: GameState, cpuIdx: number): GameAction {
  const player = state.players[cpuIdx];

  // Find any unequipped part that can fit somewhere valid
  for (const part of player.parts) {
    const slot = part.slot as SlotType;
    for (let hi = 0; hi < player.horses.length; hi++) {
      const horse = player.horses[hi];
      if (!horse[slot] && isEquipValid(horse, slot, part)) {
        return { type: 'EQUIP_PART', horseIndex: hi, slot, partId: part.id };
      }
    }
  }
  return { type: 'CONFIRM_EQUIP' };
}

// ── Race phase ────────────────────────────────────────────────────────────────

function raceAction(state: GameState, cpuIdx: number): GameAction | null {
  const sub = state.raceSubPhase;

  if (sub === 'draw-initiative') return { type: 'DRAW_INITIATIVE' };

  if (sub === 'action-declare') {
    if (state.attackerPlayerIndex !== cpuIdx) return null;
    const horse = state.players[cpuIdx].horses[state.attackerHorseIndex!];
    const stats = getEffectiveStats(horse);

    // Attack if an opponent can be finished off
    const opponents = state.players.filter((_, i) => i !== cpuIdx);
    const canFinish = opponents.some(p =>
      p.horses.some(h => !h.fallen && getEffectiveStats(h).hp - h.damage <= 1)
    );
    if (canFinish) return { type: 'DECLARE_ACTION', actionType: 'obstruct' };

    // Advance if near goal
    if (state.raceDistance - horse.position <= 5) {
      return { type: 'DECLARE_ACTION', actionType: 'advance' };
    }
    // Mix: prefer advance slightly
    return { type: 'DECLARE_ACTION', actionType: Math.random() < 0.55 ? 'advance' : 'obstruct' };
  }

  if (sub === 'target-declare') {
    if (state.defenderPlayerIndex !== cpuIdx) return null;
    // Sacrifice the horse with highest damage ratio
    let targetIdx = 0;
    let maxRatio = -1;
    state.players[cpuIdx].horses.forEach((h, hi) => {
      if (h.fallen) return;
      const ratio = h.damage / Math.max(1, getEffectiveStats(h).hp);
      if (ratio > maxRatio) { maxRatio = ratio; targetIdx = hi; }
    });
    return { type: 'SELECT_DEFENDER_HORSE', horseIndex: targetIdx };
  }

  if (sub === 'dice-roll') {
    if (state.attackerPlayerIndex !== cpuIdx) return null;
    return { type: 'CONFIRM_DICE' };
  }

  if (sub === 'inheritance') {
    if (state.pendingInheritancePlayerIndex !== cpuIdx) return null;
    const fallenIdx = state.pendingInheritanceFallenHorseIndex!;
    let bestIdx = -1, bestHp = -1;
    state.players[cpuIdx].horses.forEach((h, hi) => {
      if (h.fallen || hi === fallenIdx || h.soulInherited) return;
      const g = getEffectiveStats(h).hp;
      if (g > bestHp) { bestHp = g; bestIdx = hi; }
    });
    return bestIdx >= 0 ? { type: 'SELECT_INHERITANCE_HORSE', targetHorseIndex: bestIdx } : null;
  }

  if (sub === 'bond-inheritance') {
    if (state.pendingBondPlayerIndex !== cpuIdx) return null;
    let bestIdx = 0, bestHp = -1;
    state.players[cpuIdx].horses.forEach((h, hi) => {
      if (h.fallen || h.bondInherited) return;
      const g = getEffectiveStats(h).hp;
      if (g > bestHp) { bestHp = g; bestIdx = hi; }
    });
    return { type: 'SELECT_BOND_HORSE', targetHorseIndex: bestIdx };
  }

  return null;
}
