import {
  GameState, GamePhase, Player, HorseState, Part, BaseHorse,
  InitiativeCard, ActionType, SlotType,
} from './types';
import {
  BASE_HORSES_HONMEI, BASE_HORSES_TAIKOU, ALL_PARTS,
  PLAYER_COLORS, PLAYER_NAMES,
} from './data';
import {
  shuffleArray, rollDie, rollDice, getEffectiveStats,
  buildInitiativeDeck, countValidDice,
} from './utils';

// ─── Actions ────────────────────────────────────────────────────────────────

export type GameAction =
  | { type: 'SET_PLAYER_COUNT'; count: number }
  | { type: 'SET_TEAM_MODE'; enabled: boolean }
  | { type: 'START_GAME' }
  | { type: 'SELECT_HONMEI'; horseId: string }
  | { type: 'SELECT_TAIKOU'; horseId: string }
  | { type: 'ROLL_RACE_DISTANCE' }
  | { type: 'CONFIRM_RACE_DISTANCE' }
  | { type: 'SELECT_PART'; partId: string }
  | { type: 'EQUIP_PART'; horseIndex: number; slot: SlotType; partId: string }
  | { type: 'UNEQUIP_PART'; horseIndex: number; slot: SlotType }
  | { type: 'CONFIRM_EQUIP' }
  | { type: 'DRAW_INITIATIVE' }
  | { type: 'DECLARE_ACTION'; actionType: ActionType }
  | { type: 'SELECT_DEFENDER_HORSE'; horseIndex: number }
  | { type: 'ROLL_DICE' }
  | { type: 'REROLL_DIE'; dieIndex: number }
  | { type: 'CONFIRM_DICE' }
  | { type: 'SELECT_INHERITANCE_HORSE'; targetHorseIndex: number }
  | { type: 'SELECT_BOND_HORSE'; targetHorseIndex: number }
  | { type: 'RESET_GAME' };

// ─── Initial State ───────────────────────────────────────────────────────────

export const initialState: GameState = {
  phase: 'start',
  raceSubPhase: null,
  playerCount: 2,
  teamMode: false,
  players: [],
  startPlayerIndex: 0,
  currentDraftPlayerIndex: 0,
  availableHonmei: [],
  availableTaikou: [],
  allParts: [],
  currentDraftParts: [],
  backDraftParts: [],
  partsPhase: 'front',
  partsPicksDone: 0,
  raceDistance: 16,
  raceDistanceDie: null,
  currentEquipPlayerIndex: 0,
  initiativeDeck: [],
  initiativeDiscard: [],
  currentInitiativeCard: null,
  attackerPlayerIndex: null,
  attackerHorseIndex: null,
  defenderPlayerIndex: null,
  defenderHorseIndex: null,
  declaredAction: null,
  diceValues: [],
  diceRerolled: [],
  rerollsRemaining: 0,
  pendingInheritancePlayerIndex: null,
  pendingInheritanceFallenHorseIndex: null,
  pendingBondPlayerIndex: null,
  pendingBondFallenHorses: [],
  winnerPlayerIndex: null,
  winnerTeamId: null,
  gameLog: [],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeHorseState(base: BaseHorse): HorseState {
  return { base, damage: 0, position: 0, fallen: false, soulInherited: false, bondInherited: false };
}

function addLog(state: GameState, msg: string): GameState {
  return { ...state, gameLog: [msg, ...state.gameLog].slice(0, 30) };
}

function checkVictory(state: GameState): GameState {
  const { players, raceDistance, teamMode } = state;

  // Goal reached
  for (let pi = 0; pi < players.length; pi++) {
    for (const h of players[pi].horses) {
      if (!h.fallen && h.position >= raceDistance) {
        const msg = `🏆 ${players[pi].name}の${h.base.name}がゴール！`;
        const s = addLog(state, msg);
        return {
          ...s,
          phase: 'game-over',
          raceSubPhase: 'victory',
          ...(teamMode
            ? { winnerTeamId: players[pi].teamId }
            : { winnerPlayerIndex: pi }),
        };
      }
    }
  }

  // Elimination
  if (teamMode) {
    const teamActive = [0, 1].map(tid =>
      players.filter(p => p.teamId === tid).flatMap(p => p.horses).filter(h => !h.fallen).length
    );
    if (teamActive[0] === 0) {
      const s = addLog(state, '🏆 紫チームの勝利！');
      return { ...s, phase: 'game-over', raceSubPhase: 'victory', winnerTeamId: 1 };
    }
    if (teamActive[1] === 0) {
      const s = addLog(state, '🏆 赤チームの勝利！');
      return { ...s, phase: 'game-over', raceSubPhase: 'victory', winnerTeamId: 0 };
    }
  } else {
    const active = players.filter(p => p.horses.some(h => !h.fallen));
    if (active.length === 1) {
      const s = addLog(state, `🏆 ${active[0].name}の勝利！`);
      return { ...s, phase: 'game-over', raceSubPhase: 'victory', winnerPlayerIndex: active[0].id };
    }
  }

  return state;
}

function applyFallAndContinue(state: GameState, victimPlayerIndex: number, victimHorseIndex: number): GameState {
  // Mark horse as fallen, clear damage
  const newPlayers = state.players.map((p, pi) => {
    if (pi !== victimPlayerIndex) return p;
    return {
      ...p,
      horses: p.horses.map((h, hi) => hi === victimHorseIndex ? { ...h, fallen: true, damage: 0 } : h),
    };
  });
  let s: GameState = {
    ...state,
    players: newPlayers,
  };
  s = addLog(s, `💀 ${state.players[victimPlayerIndex].name}の${state.players[victimPlayerIndex].horses[victimHorseIndex].base.name}が脱落！`);

  // Check victory first
  const afterVictory = checkVictory(s);
  if (afterVictory.phase === 'game-over') return afterVictory;

  const victim = s.players[victimPlayerIndex];
  const otherHorses = victim.horses.filter((h, hi) => hi !== victimHorseIndex && !h.fallen);

  if (otherHorses.length > 0) {
    // Soul inheritance
    return {
      ...s,
      raceSubPhase: 'inheritance',
      pendingInheritancePlayerIndex: victimPlayerIndex,
      pendingInheritanceFallenHorseIndex: victimHorseIndex,
    };
  }

  // All of this player's horses are fallen
  // Check bond inheritance (team mode)
  if (s.teamMode) {
    const teamId = victim.teamId;
    const teammate = s.players.find(p => p.teamId === teamId && p.id !== victim.id);
    if (teammate && !teammate.bondInheritanceUsed) {
      const teammateLivingHorses = teammate.horses.filter(h => !h.fallen);
      if (teammateLivingHorses.length > 0) {
        const fallenHorses = victim.horses.map(h => h.base);
        return {
          ...s,
          raceSubPhase: 'bond-inheritance',
          pendingBondPlayerIndex: teammate.id,
          pendingBondFallenHorses: fallenHorses,
        };
      }
    }
  }

  return { ...s, raceSubPhase: 'draw-initiative' };
}

function rebuildDeckIfNeeded(state: GameState): GameState {
  if (state.initiativeDeck.length > 0) return state;
  const activeCards = state.initiativeDiscard.filter(card => {
    const player = state.players[card.playerIndex];
    const horse = player?.horses[card.horseIndex];
    return horse && !horse.fallen;
  });
  return {
    ...state,
    initiativeDeck: shuffleArray(activeCards),
    initiativeDiscard: [],
  };
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {

    case 'SET_PLAYER_COUNT':
      return {
        ...state,
        playerCount: action.count,
        teamMode: action.count === 4 ? state.teamMode : false,
      };

    case 'SET_TEAM_MODE':
      return { ...state, teamMode: action.enabled };

    case 'RESET_GAME':
      return { ...initialState };

    case 'START_GAME': {
      const players: Player[] = Array.from({ length: state.playerCount }, (_, i) => ({
        id: i,
        color: PLAYER_COLORS[i],
        name: PLAYER_NAMES[i],
        horses: [],
        parts: [],
        teamId: state.teamMode ? i % 2 : i,
        bondInheritanceUsed: false,
      }));
      const startPlayerIndex = Math.floor(Math.random() * state.playerCount);
      const shuffledParts = shuffleArray([...ALL_PARTS]);
      return {
        ...state,
        phase: 'honmei-draft',
        players,
        startPlayerIndex,
        currentDraftPlayerIndex: startPlayerIndex,
        availableHonmei: shuffleArray([...BASE_HORSES_HONMEI]),
        availableTaikou: shuffleArray([...BASE_HORSES_TAIKOU]),
        allParts: shuffledParts,
        currentDraftParts: shuffledParts.slice(0, 9),
        backDraftParts: shuffledParts.slice(9, 18),
        partsPhase: 'front',
        partsPicksDone: 0,
        gameLog: [`ゲーム開始！スタートプレイヤー: ${PLAYER_NAMES[startPlayerIndex]}`],
      };
    }

    case 'SELECT_HONMEI': {
      const horse = state.availableHonmei.find(h => h.id === action.horseId)!;
      const pi = state.currentDraftPlayerIndex;
      const newPlayers = state.players.map((p, i) =>
        i === pi ? { ...p, horses: [makeHorseState(horse)] } : p
      );
      const picked = newPlayers.filter(p => p.horses.length >= 1).length;
      const nextIndex = (pi + 1) % state.playerCount;
      const log = `${state.players[pi].name}が${horse.name}を選択`;

      if (picked === state.playerCount) {
        return addLog({
          ...state,
          players: newPlayers,
          availableHonmei: state.availableHonmei.filter(h => h.id !== horse.id),
          phase: 'taikou-draft',
          currentDraftPlayerIndex: state.startPlayerIndex,
        }, log);
      }
      return addLog({
        ...state,
        players: newPlayers,
        availableHonmei: state.availableHonmei.filter(h => h.id !== horse.id),
        currentDraftPlayerIndex: nextIndex,
      }, log);
    }

    case 'SELECT_TAIKOU': {
      const horse = state.availableTaikou.find(h => h.id === action.horseId)!;
      const pi = state.currentDraftPlayerIndex;
      const newPlayers = state.players.map((p, i) =>
        i === pi ? { ...p, horses: [...p.horses, makeHorseState(horse)] } : p
      );
      const picked = newPlayers.filter(p => p.horses.length >= 2).length;
      const nextIndex = (pi + 1) % state.playerCount;
      const log = `${state.players[pi].name}が${horse.name}を選択`;

      if (picked === state.playerCount) {
        return addLog({
          ...state,
          players: newPlayers,
          availableTaikou: state.availableTaikou.filter(h => h.id !== horse.id),
          phase: 'race-distance',
          raceDistanceDie: null,
        }, log);
      }
      return addLog({
        ...state,
        players: newPlayers,
        availableTaikou: state.availableTaikou.filter(h => h.id !== horse.id),
        currentDraftPlayerIndex: nextIndex,
      }, log);
    }

    case 'ROLL_RACE_DISTANCE': {
      const die = rollDie();
      const distance = die <= 2 ? 12 : die <= 4 ? 16 : 20;
      const label = die <= 2 ? '短距離' : die <= 4 ? '中距離' : '長距離';
      return addLog({
        ...state,
        raceDistanceDie: die,
        raceDistance: distance,
      }, `🎲 出目${die} → ${label}（${distance}マス）`);
    }

    case 'CONFIRM_RACE_DISTANCE':
      return { ...state, phase: 'parts-draft' };

    case 'SELECT_PART': {
      const part = state.currentDraftParts.find(p => p.id === action.partId)!;
      const pi = state.currentDraftPlayerIndex;
      const newPlayers = state.players.map((p, i) =>
        i === pi ? { ...p, parts: [...p.parts, part] } : p
      );
      const remaining = state.currentDraftParts.filter(p => p.id !== part.id);
      const newPicksDone = state.partsPicksDone + 1;
      const totalPicks = 2 * state.playerCount;
      const nextIndex = (state.startPlayerIndex + newPicksDone) % state.playerCount;
      const log = `${state.players[pi].name}が${part.name}（${part.slot === 'jockey' ? 'J' : part.slot === 'blinker' ? 'B' : 'C'}）を選択`;

      if (newPicksDone >= totalPicks) {
        if (state.partsPhase === 'front') {
          return addLog({
            ...state,
            players: newPlayers,
            currentDraftParts: state.backDraftParts,
            partsPhase: 'back',
            partsPicksDone: 0,
            currentDraftPlayerIndex: state.startPlayerIndex,
          }, log);
        } else {
          // Done with all parts — go to equip
          return addLog({
            ...state,
            players: newPlayers,
            phase: 'equip',
            currentEquipPlayerIndex: 0,
          }, log);
        }
      }

      return addLog({
        ...state,
        players: newPlayers,
        currentDraftParts: remaining,
        partsPicksDone: newPicksDone,
        currentDraftPlayerIndex: nextIndex,
      }, log);
    }

    case 'EQUIP_PART': {
      const { horseIndex, slot, partId } = action;
      const pi = state.currentEquipPlayerIndex;
      const part = state.players[pi].parts.find(p => p.id === partId)!;

      // Build test horse to validate
      const horse = state.players[pi].horses[horseIndex];
      const testHorse: HorseState = { ...horse, [slot]: part };
      const stats = getEffectiveStats(testHorse);
      if (stats.ability < 1 || stats.motivation < 1 || stats.grit < 1) return state;

      const newPlayers = state.players.map((p, i) => {
        if (i !== pi) return p;
        const newHorses = p.horses.map((h, hi) =>
          hi === horseIndex ? { ...h, [slot]: part } : h
        );
        // Remove part from unequipped parts only if it was unequipped before
        const oldHorse = p.horses[horseIndex];
        const oldPart = oldHorse[slot as keyof HorseState] as Part | undefined;
        let newParts = p.parts.filter(pp => pp.id !== partId);
        if (oldPart) newParts = [...newParts, oldPart]; // return old part
        return { ...p, horses: newHorses, parts: newParts };
      });
      return { ...state, players: newPlayers };
    }

    case 'UNEQUIP_PART': {
      const { horseIndex, slot } = action;
      const pi = state.currentEquipPlayerIndex;
      const horse = state.players[pi].horses[horseIndex];
      const part = horse[slot as keyof HorseState] as Part | undefined;
      if (!part) return state;

      const newPlayers = state.players.map((p, i) => {
        if (i !== pi) return p;
        const newHorses = p.horses.map((h, hi) =>
          hi === horseIndex ? { ...h, [slot]: undefined } : h
        );
        return { ...p, horses: newHorses, parts: [...p.parts, part] };
      });
      return { ...state, players: newPlayers };
    }

    case 'CONFIRM_EQUIP': {
      const pi = state.currentEquipPlayerIndex;
      const nextEquipIndex = pi + 1;

      if (nextEquipIndex >= state.playerCount) {
        // Build initiative deck and start race
        const deck = buildInitiativeDeck(state.players);
        return addLog({
          ...state,
          phase: 'race',
          raceSubPhase: 'draw-initiative',
          initiativeDeck: deck,
          initiativeDiscard: [],
          currentEquipPlayerIndex: 0,
        }, 'レーススタート！');
      }
      return { ...state, currentEquipPlayerIndex: nextEquipIndex };
    }

    case 'DRAW_INITIATIVE': {
      let s = rebuildDeckIfNeeded(state);
      let deck = [...s.initiativeDeck];
      let discard = [...s.initiativeDiscard];

      let drawnCard: InitiativeCard | null = null;
      while (deck.length > 0) {
        const card = deck.shift()!;
        const horse = s.players[card.playerIndex]?.horses[card.horseIndex];
        if (horse && !horse.fallen) {
          drawnCard = card;
          discard = [...discard, card];
          break;
        }
        // Fallen horse card: permanently discard (don't add to discard pile)
      }

      if (!drawnCard) {
        // Rebuild and try again (shouldn't normally happen)
        const activeCards = discard.filter(c => {
          const h = s.players[c.playerIndex]?.horses[c.horseIndex];
          return h && !h.fallen;
        });
        deck = shuffleArray(activeCards);
        discard = [];
        while (deck.length > 0) {
          const card = deck.shift()!;
          const horse = s.players[card.playerIndex]?.horses[card.horseIndex];
          if (horse && !horse.fallen) {
            drawnCard = card;
            discard = [card];
            break;
          }
        }
        if (!drawnCard) return state;
      }

      const attackerPlayerIndex = drawnCard.playerIndex;
      const attackerHorseIndex = drawnCard.horseIndex;
      const direction = drawnCard.direction;
      const defenderPlayerIndex =
        direction === 'right'
          ? (attackerPlayerIndex + 1) % s.playerCount
          : (attackerPlayerIndex - 1 + s.playerCount) % s.playerCount;

      const attackerHorse = s.players[attackerPlayerIndex].horses[attackerHorseIndex];
      const log = `【${s.players[attackerPlayerIndex].name}】${attackerHorse.base.name}の手番 (${direction === 'right' ? '右' : '左'})`;

      return addLog({
        ...s,
        initiativeDeck: deck,
        initiativeDiscard: discard,
        currentInitiativeCard: drawnCard,
        attackerPlayerIndex,
        attackerHorseIndex,
        defenderPlayerIndex,
        defenderHorseIndex: null,
        declaredAction: null,
        raceSubPhase: 'action-declare',
      }, log);
    }

    case 'DECLARE_ACTION': {
      const { actionType } = action;
      if (actionType === 'advance') {
        // Roll dice immediately (no target needed)
        const attacker = state.players[state.attackerPlayerIndex!];
        const horse = attacker.horses[state.attackerHorseIndex!];
        const stats = getEffectiveStats(horse);
        const diceCount = Math.max(1, stats.ability + stats.extraDice);
        const values = rollDice(diceCount);
        return {
          ...state,
          declaredAction: 'advance',
          diceValues: values,
          diceRerolled: new Array(diceCount).fill(false),
          rerollsRemaining: stats.extraReroll,
          raceSubPhase: 'dice-roll',
        };
      } else {
        // Need defender to select horse
        return {
          ...state,
          declaredAction: 'obstruct',
          raceSubPhase: 'target-declare',
        };
      }
    }

    case 'SELECT_DEFENDER_HORSE': {
      const attacker = state.players[state.attackerPlayerIndex!];
      const horse = attacker.horses[state.attackerHorseIndex!];
      const stats = getEffectiveStats(horse);
      const diceCount = Math.max(1, stats.ability + stats.extraDice);
      const values = rollDice(diceCount);
      return {
        ...state,
        defenderHorseIndex: action.horseIndex,
        diceValues: values,
        diceRerolled: new Array(diceCount).fill(false),
        rerollsRemaining: stats.extraReroll,
        raceSubPhase: 'dice-roll',
      };
    }

    case 'REROLL_DIE': {
      const { dieIndex } = action;
      if (state.diceRerolled[dieIndex] || state.rerollsRemaining <= 0) return state;
      const newValues = [...state.diceValues];
      newValues[dieIndex] = rollDie();
      const newRerolled = [...state.diceRerolled];
      newRerolled[dieIndex] = true;
      return {
        ...state,
        diceValues: newValues,
        diceRerolled: newRerolled,
        rerollsRemaining: state.rerollsRemaining - 1,
      };
    }

    case 'CONFIRM_DICE': {
      const attackerPlayer = state.players[state.attackerPlayerIndex!];
      const attackerHorse = attackerPlayer.horses[state.attackerHorseIndex!];
      const stats = getEffectiveStats(attackerHorse);
      const validCount = countValidDice(state.diceValues, stats.motivation);

      if (state.declaredAction === 'advance') {
        const advance = validCount * stats.speed;
        const newPos = attackerHorse.position + advance;
        const newPlayers = state.players.map((p, pi) => {
          if (pi !== state.attackerPlayerIndex) return p;
          return {
            ...p,
            horses: p.horses.map((h, hi) =>
              hi === state.attackerHorseIndex ? { ...h, position: newPos } : h
            ),
          };
        });
        const log = `→ 有効サイコロ${validCount}個 × スピード${stats.speed} = ${advance}マス前進 (位置: ${newPos})`;
        let s = addLog({ ...state, players: newPlayers, raceSubPhase: 'resolve' }, log);
        s = checkVictory(s);
        if (s.phase === 'game-over') return s;
        return { ...s, raceSubPhase: 'resolve' };

      } else {
        // Obstruct
        const damage = validCount;
        const defPI = state.defenderPlayerIndex!;
        const defHI = state.defenderHorseIndex!;
        const defHorse = state.players[defPI].horses[defHI];
        const defStats = getEffectiveStats(defHorse);
        const newDamage = defHorse.damage + damage;

        const newPlayers = state.players.map((p, pi) => {
          if (pi !== defPI) return p;
          return {
            ...p,
            horses: p.horses.map((h, hi) =>
              hi === defHI ? { ...h, damage: newDamage } : h
            ),
          };
        });
        const log = `→ 有効サイコロ${validCount}個のダメージ → ${defHorse.base.name}の根性: ${defHorse.damage}+${damage}=${newDamage}/${defStats.grit}`;
        let s = addLog({ ...state, players: newPlayers, raceSubPhase: 'resolve' }, log);

        if (newDamage >= defStats.grit) {
          // Horse eliminated
          s = applyFallAndContinue(s, defPI, defHI);
          if (s.phase === 'game-over') return s;
          return s;
        }
        return { ...s, raceSubPhase: 'resolve' };
      }
    }

    case 'SELECT_INHERITANCE_HORSE': {
      const { targetHorseIndex } = action;
      const pi = state.pendingInheritancePlayerIndex!;
      const fallenHI = state.pendingInheritanceFallenHorseIndex!;

      const newPlayers = state.players.map((p, i) => {
        if (i !== pi) return p;
        return {
          ...p,
          horses: p.horses.map((h, hi) =>
            hi === targetHorseIndex
              ? { ...h, soulInherited: true }
              : h
          ),
        };
      });
      const fallenName = state.players[pi].horses[fallenHI].base.name;
      const targetName = state.players[pi].horses[targetHorseIndex].base.name;
      const log = `💫 気合の継承: ${fallenName} → ${targetName}（やる気・根性+1）`;

      let s = addLog({
        ...state,
        players: newPlayers,
        pendingInheritancePlayerIndex: null,
        pendingInheritanceFallenHorseIndex: null,
        raceSubPhase: 'draw-initiative',
      }, log);

      // After inheritance, check if there's bond inheritance pending
      if (s.teamMode) {
        // Check if the player who just inherited's whole team's other member is fully fallen
        const player = s.players[pi];
        const teamId = player.teamId;
        const teammate = s.players.find(p => p.teamId === teamId && p.id !== pi);
        if (teammate && !teammate.bondInheritanceUsed) {
          const allTeammateFallen = teammate.horses.every(h => h.fallen);
          if (allTeammateFallen) {
            const teammateLiving = player.horses.filter(h => !h.fallen);
            if (teammateLiving.length > 0) {
              const fallenHorses = teammate.horses.map(h => h.base);
              return {
                ...s,
                raceSubPhase: 'bond-inheritance',
                pendingBondPlayerIndex: pi,
                pendingBondFallenHorses: fallenHorses,
              };
            }
          }
        }
      }

      return s;
    }

    case 'SELECT_BOND_HORSE': {
      const { targetHorseIndex } = action;
      const pi = state.pendingBondPlayerIndex!;

      const newPlayers = state.players.map((p, i) => {
        if (i !== pi) return p;
        // Mark bond inheritance used on the teammate
        return {
          ...p,
          bondInheritanceUsed: true,
          horses: p.horses.map((h, hi) =>
            hi === targetHorseIndex
              ? { ...h, bondInherited: true }
              : h
          ),
        };
      });

      const targetName = state.players[pi].horses[targetHorseIndex].base.name;
      const log = `💛 絆の継承: ${state.players[pi].name}の${targetName}（やる気・根性+1）`;

      return addLog({
        ...state,
        players: newPlayers,
        pendingBondPlayerIndex: null,
        pendingBondFallenHorses: [],
        raceSubPhase: 'draw-initiative',
      }, log);
    }

    default:
      return state;
  }
}
