import {
  GameState,
  Player,
  MechCard,
  PartCard,
  AssembledMech,
  MechStats,
  InitiativeCard,
  AssemblyConfirmPayload,
  DraftState,
  BattleRound,
  Direction,
} from "../../shared/types";

// ---------- ユーティリティ ----------

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}
export { generateRoomCode };

// ---------- ステータス計算 ----------

export function computeStats(
  base: MechStats,
  parts: { right?: PartCard; left?: PartCard; backpack?: PartCard }
): MechStats {
  let { sp, hp, aim, dice, reroll } = base;
  for (const p of [parts.right, parts.left, parts.backpack]) {
    if (!p) continue;
    sp += p.spMod;
    hp += p.hpMod;
    aim += p.aimMod;
    dice += p.bonusDice;
    reroll += p.bonusReroll;
  }
  return { sp, hp, aim, dice, reroll };
}

export function isValidAssembly(
  base: MechStats,
  parts: { right?: PartCard; left?: PartCard; backpack?: PartCard }
): boolean {
  const s = computeStats(base, parts);
  return s.hp > 0 && s.aim > 0 && s.sp > 0;
}

// ---------- ドラフト ----------

export function startDraft(
  allLeaders: MechCard[],
  allSupports: MechCard[],
  allParts: PartCard[],
  playerIds: string[]
): DraftState {
  const shuffledParts = shuffle(allParts);
  return {
    availableLeaders: shuffle(allLeaders).slice(0, 4),
    availableSupports: shuffle(allSupports).slice(0, 4),
    availableParts: shuffledParts.slice(0, 10),
    remainingParts: shuffledParts.slice(10),
    step: "leader",
    pickOrder: [...playerIds],
    currentPickerIndex: 0,
    partsPickCount: 0,
    partsPickInBatch: 0,
  };
}

export function applyDraftPick(
  state: GameState,
  playerId: string,
  cardId: string
): GameState {
  const draft = state.draftState!;
  const expectedPicker = draft.pickOrder[draft.currentPickerIndex];
  if (expectedPicker !== playerId) return state;

  const players = state.players.map((p) => ({ ...p, selectedMechs: [...p.selectedMechs], hand: [...p.hand] }));
  const player = players.find((p) => p.id === playerId)!;

  let newDraft = { ...draft };
  const log = [...state.log];

  if (draft.step === "leader") {
    const card = draft.availableLeaders.find((c) => c.id === cardId);
    if (!card) return state;
    player.selectedMechs = [...player.selectedMechs, card];
    newDraft.availableLeaders = draft.availableLeaders.filter((c) => c.id !== cardId);
    log.push(`${player.name} が長機「${card.name}」を選択`);

    newDraft.currentPickerIndex++;
    if (newDraft.currentPickerIndex >= draft.pickOrder.length) {
      newDraft.step = "support";
      newDraft.currentPickerIndex = 0;
    }
  } else if (draft.step === "support") {
    const card = draft.availableSupports.find((c) => c.id === cardId);
    if (!card) return state;
    player.selectedMechs = [...player.selectedMechs, card];
    newDraft.availableSupports = draft.availableSupports.filter((c) => c.id !== cardId);
    log.push(`${player.name} が僚機「${card.name}」を選択`);

    newDraft.currentPickerIndex++;
    if (newDraft.currentPickerIndex >= draft.pickOrder.length) {
      newDraft.step = "parts";
      newDraft.currentPickerIndex = 0;
    }
  } else {
    // parts: 8 picks total (4 each), alternating P1 P2 P1 P2...
    // shown in batches of 10; after 4 picks per batch, discard remaining and show next 10
    const card = draft.availableParts.find((c) => c.id === cardId);
    if (!card) return state;
    player.hand = [...player.hand, card];
    newDraft.availableParts = draft.availableParts.filter((c) => c.id !== cardId);
    log.push(`${player.name} が「${card.name}」を選択`);

    newDraft.partsPickCount++;
    newDraft.partsPickInBatch = (draft.partsPickInBatch ?? 0) + 1;
    newDraft.currentPickerIndex = newDraft.partsPickCount % draft.pickOrder.length;

    // After both players each pick 2 in this batch, advance to next batch
    if (newDraft.partsPickInBatch >= 4 && draft.remainingParts.length > 0) {
      newDraft.availableParts = draft.remainingParts.slice(0, 10);
      newDraft.remainingParts = draft.remainingParts.slice(10);
      newDraft.partsPickInBatch = 0;
    }
  }

  const totalParts = 8; // 4 per player × 2 players
  const draftDone =
    newDraft.step === "parts" && newDraft.partsPickCount >= totalParts;

  return {
    ...state,
    players,
    draftState: draftDone ? null : newDraft,
    phase: draftDone ? "assembly" : state.phase,
    assemblyData: draftDone
      ? {
          pending: {},
          confirmed: [],
          deadline: Date.now() + 60_000,
        }
      : state.assemblyData,
    log: draftDone ? [...log, "ドラフト終了。パーツを配備してください（60秒）"] : log,
  };
}

// ---------- アセンブリ ----------

function resolvePartById(player: Player, partId: string): PartCard | undefined {
  return player.hand.find((p) => p.id === partId);
}

export function applyAssemblyConfirm(
  state: GameState,
  playerId: string,
  payload: AssemblyConfirmPayload
): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return state;
  if (state.assemblyData?.confirmed.includes(playerId)) return state;

  const leaderCard = player.selectedMechs[0];
  const supportCard = player.selectedMechs[1];

  const leaderParts = {
    right: resolvePartById(player, payload.leader.right ?? ""),
    left: resolvePartById(player, payload.leader.left ?? ""),
    backpack: resolvePartById(player, payload.leader.backpack ?? ""),
  };
  const supportParts = {
    right: resolvePartById(player, payload.support.right ?? ""),
    left: resolvePartById(player, payload.support.left ?? ""),
    backpack: resolvePartById(player, payload.support.backpack ?? ""),
  };

  if (!isValidAssembly(leaderCard.baseStats, leaderParts)) return state;
  if (!isValidAssembly(supportCard.baseStats, supportParts)) return state;

  const usedPartIds = new Set([
    payload.leader.right, payload.leader.left, payload.leader.backpack,
    payload.support.right, payload.support.left, payload.support.backpack,
  ].filter(Boolean) as string[]);
  // check no duplicate parts
  if (usedPartIds.size !== [...[payload.leader.right, payload.leader.left, payload.leader.backpack,
    payload.support.right, payload.support.left, payload.support.backpack]].filter(Boolean).length) {
    return state;
  }

  const prevData = state.assemblyData!;
  const newPending = {
    ...prevData.pending,
    [playerId]: payload,
  };
  const newConfirmed = [...prevData.confirmed, playerId];
  const newData = { ...prevData, pending: newPending, confirmed: newConfirmed };

  const newState: GameState = { ...state, assemblyData: newData };

  if (newConfirmed.length >= state.players.length) {
    return finalizeAssembly(newState);
  }
  return newState;
}

export function forceAssemblyTimeout(state: GameState): GameState {
  // For players who haven't confirmed, use base stats only (no parts)
  const allConfirmed = state.players.every((p) =>
    state.assemblyData!.confirmed.includes(p.id)
  );
  if (allConfirmed) return state;

  // Fake confirm for unconfirmed players with no parts
  let updated = state;
  for (const player of state.players) {
    if (!updated.assemblyData!.confirmed.includes(player.id)) {
      updated = applyAssemblyConfirm(updated, player.id, {
        leader: {},
        support: {},
        directionChoices: {},
      });
    }
  }
  return finalizeAssembly(updated);
}

function finalizeAssembly(state: GameState): GameState {
  const assemblyData = state.assemblyData!;
  const players: Player[] = state.players.map((player) => {
    const payload = assemblyData.pending[player.id] ?? {
      leader: {},
      support: {},
      directionChoices: {},
    };

    const mkMech = (
      mechCard: MechCard,
      slotAssignment: { right?: string; left?: string; backpack?: string }
    ): AssembledMech => {
      const parts = {
        right: player.hand.find((p) => p.id === slotAssignment.right),
        left: player.hand.find((p) => p.id === slotAssignment.left),
        backpack: player.hand.find((p) => p.id === slotAssignment.backpack),
      };
      const computed = computeStats(mechCard.baseStats, parts);
      return {
        mechCard,
        parts,
        computedStats: computed,
        currentHP: computed.hp,
        damageCounters: 0,
        isDestroyed: false,
        inheritedMechId: null,
        inheritBonus: { hp: 0, aim: 0 },
      };
    };

    return {
      ...player,
      mechs: [
        mkMech(player.selectedMechs[0], payload.leader),
        mkMech(player.selectedMechs[1], payload.support),
      ],
      hand: [],
    };
  });

  const initiativeDeck = buildInitiativeDeck(players, assemblyData);

  return {
    ...state,
    phase: "battle",
    players,
    assemblyData: null,
    battleRound: {
      subPhase: "draw",
      initiativeDeck,
      initiativeDiscard: [],
      currentCard: null,
      attackPlayerId: null,
      defensePlayerId: null,
      defenderMechId: null,
      diceResults: [],
      rerollsUsed: 0,
      maxRerolls: 0,
      pendingHits: 0,
      pendingDestroyedMechId: null,
      inheritPlayerId: null,
    },
    log: [...state.log, "アセンブリ完了。戦闘開始！"],
  };
}

// ---------- イニシアチブデッキ構築 ----------

export function buildInitiativeDeck(
  players: Player[],
  assemblyData: { pending: { [playerId: string]: AssemblyConfirmPayload } }
): InitiativeCard[] {
  const cards: InitiativeCard[] = [];
  let idx = 0;

  for (const player of players) {
    const choices = assemblyData.pending[player.id]?.directionChoices ?? {};

    for (const mech of player.mechs) {
      if (mech.isDestroyed) continue;
      const sp = mech.computedStats.sp;
      const mechId = mech.mechCard.id;

      let rightCount: number;
      let leftCount: number;

      if (sp % 2 === 0) {
        rightCount = sp / 2;
        leftCount = sp / 2;
      } else {
        const preferRight = (choices[mechId] ?? "right") !== "left";
        rightCount = preferRight ? Math.ceil(sp / 2) : Math.floor(sp / 2);
        leftCount = sp - rightCount;
      }

      for (let i = 0; i < rightCount; i++) {
        cards.push({ id: `i${idx++}`, playerId: player.id, mechId, direction: "right" });
      }
      for (let i = 0; i < leftCount; i++) {
        cards.push({ id: `i${idx++}`, playerId: player.id, mechId, direction: "left" });
      }
    }
  }
  return shuffle(cards);
}

// ---------- 戦闘 ----------

export function drawInitiativeCard(state: GameState): GameState {
  let round = { ...state.battleRound! };
  let deck = [...round.initiativeDeck];
  let discard = [...round.initiativeDiscard];

  if (deck.length === 0) {
    // rebuild deck excluding destroyed mechs
    const aliveMechIds = new Set<string>();
    for (const p of state.players) {
      for (const m of p.mechs) {
        if (!m.isDestroyed) aliveMechIds.add(m.mechCard.id);
      }
    }
    const rebuiltCards = discard.filter((c) => aliveMechIds.has(c.mechId));
    deck = shuffle(rebuiltCards);
    discard = [];
  }

  // skip destroyed mechs' cards
  while (deck.length > 0) {
    const card = deck[0];
    const owner = state.players.find((p) => p.id === card.playerId);
    const mech = owner?.mechs.find((m) => m.mechCard.id === card.mechId);
    if (mech && !mech.isDestroyed) break;
    discard.push(deck.shift()!);
  }

  if (deck.length === 0) {
    return { ...state, battleRound: { ...round, subPhase: "draw", initiativeDeck: deck, initiativeDiscard: discard } };
  }

  const card = deck.shift()!;
  discard.push(card);

  const defensePlayerId = state.players.find((p) => p.id !== card.playerId)?.id ?? null;

  return {
    ...state,
    battleRound: {
      ...round,
      subPhase: "roll",
      initiativeDeck: deck,
      initiativeDiscard: discard,
      currentCard: card,
      attackPlayerId: card.playerId,
      defensePlayerId,
      defenderMechId: null,
      diceResults: [],
      rerollsUsed: 0,
      maxRerolls: 0,
    },
    log: [...state.log, `イニシアチブカード公開: ${getMechName(state, card.mechId)}`],
  };
}

export function applySelectDefender(state: GameState, mechId: string): GameState {
  const round = state.battleRound!;
  const defPlayer = state.players.find((p) => p.id === round.defensePlayerId);
  if (!defPlayer) return state;
  const mech = defPlayer.mechs.find((m) => m.mechCard.id === mechId && !m.isDestroyed);
  if (!mech) return state;

  return {
    ...state,
    battleRound: { ...round, subPhase: "draw", defenderMechId: mechId },
    log: [...state.log, `${defPlayer.name} が「${mech.mechCard.name}」を被弾対象に選択`],
  };
}

export function applyRollDice(state: GameState): GameState {
  const round = state.battleRound!;
  const attacker = getAttackerMech(state);
  if (!attacker) return state;

  const diceCount = attacker.computedStats.dice;
  const results = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
  const maxRerolls = attacker.computedStats.reroll;

  return {
    ...state,
    battleRound: {
      ...round,
      subPhase: maxRerolls > 0 ? "reroll" : "resolve",
      diceResults: results,
      maxRerolls,
      rerollsUsed: 0,
    },
    log: [...state.log, `サイコロ: [${results.join(", ")}]`],
  };
}

export function applyRerollDice(state: GameState, indices: number[]): GameState {
  const round = state.battleRound!;
  if (round.rerollsUsed >= round.maxRerolls) return state;

  const newResults = [...round.diceResults];
  for (const i of indices) {
    if (i >= 0 && i < newResults.length) {
      newResults[i] = Math.floor(Math.random() * 6) + 1;
    }
  }

  const rerollsUsed = round.rerollsUsed + 1;
  return {
    ...state,
    battleRound: {
      ...round,
      diceResults: newResults,
      rerollsUsed,
      subPhase: rerollsUsed < round.maxRerolls ? "reroll" : "resolve",
    },
    log: [...state.log, `リロール: [${newResults.join(", ")}]`],
  };
}

export function applyResolveAttack(state: GameState): GameState {
  const round = state.battleRound!;
  const attacker = getAttackerMech(state);
  if (!attacker) return state;

  const aim = attacker.computedStats.aim + attacker.inheritBonus.aim;
  const hits = round.diceResults.filter((d) => d <= aim).length;
  return {
    ...state,
    battleRound: {
      ...round,
      subPhase: "selectDefender",
      pendingHits: hits,
    },
    log: [...state.log, `攻撃確定: ${hits}ヒット。防御側が被弾メックを選択`],
  };
}

export function applyApplyDamage(state: GameState): GameState {
  const round = state.battleRound!;
  const defender = getDefenderMech(state);
  if (!defender) return state;
  const hits = round.pendingHits;

  const defPlayer = state.players.find((p) => p.id === round.defensePlayerId)!;
  const newPlayers = state.players.map((player) => {
    if (player.id !== round.defensePlayerId) return player;
    return {
      ...player,
      mechs: player.mechs.map((m) => {
        if (m.mechCard.id !== round.defenderMechId) return m;
        const newCounters = m.damageCounters + hits;
        const isDestroyed = newCounters >= m.computedStats.hp + m.inheritBonus.hp;
        return {
          ...m,
          damageCounters: newCounters,
          currentHP: Math.max(0, m.computedStats.hp + m.inheritBonus.hp - newCounters),
          isDestroyed,
        };
      }),
    };
  });

  const updatedState = { ...state, players: newPlayers };
  const destroyedMech = newPlayers
    .find((p) => p.id === round.defensePlayerId)!
    .mechs.find((m) => m.mechCard.id === round.defenderMechId && m.isDestroyed);

  const logEntry = `${hits}ヒット → ${defender.mechCard.name} に${hits}ダメージ`;

  if (destroyedMech) {
    const aliveInDefPlayer = newPlayers
      .find((p) => p.id === round.defensePlayerId)!
      .mechs.filter((m) => !m.isDestroyed);

    const winner = checkWinCondition(updatedState);
    if (winner) {
      return {
        ...updatedState,
        phase: "ended",
        winnerId: winner,
        battleRound: { ...round, subPhase: "draw" },
        log: [...state.log, logEntry, `${destroyedMech.mechCard.name} が破壊された！`, `ゲーム終了！`],
      };
    }

    // soul inheritance possible if alive mechs remain
    const canInherit = aliveInDefPlayer.some((m) => m.inheritedMechId === null);

    return {
      ...updatedState,
      battleRound: {
        ...round,
        subPhase: canInherit ? "inherit" : "draw",
        pendingDestroyedMechId: destroyedMech.mechCard.id,
        inheritPlayerId: round.defensePlayerId,
        diceResults: round.diceResults,
      },
      log: [...state.log, logEntry, `${destroyedMech.mechCard.name} が破壊された！`],
    };
  }

  return {
    ...updatedState,
    battleRound: { ...round, subPhase: "draw", pendingHits: 0 },
    log: [...state.log, logEntry],
  };
}

export function applyInheritSoul(state: GameState, targetMechId: string | null): GameState {
  const round = state.battleRound!;
  const destroyedId = round.pendingDestroyedMechId;
  if (!destroyedId) return { ...state, battleRound: { ...round, subPhase: "draw" } };

  if (!targetMechId) {
    return {
      ...state,
      battleRound: { ...round, subPhase: "draw", pendingDestroyedMechId: null, inheritPlayerId: null },
    };
  }

  const inheritPlayer = state.players.find((p) => p.id === round.inheritPlayerId)!;
  const targetMech = inheritPlayer.mechs.find((m) => m.mechCard.id === targetMechId);
  if (!targetMech || targetMech.isDestroyed || targetMech.inheritedMechId !== null) {
    return { ...state, battleRound: { ...round, subPhase: "draw" } };
  }

  const newPlayers = state.players.map((player) => {
    if (player.id !== round.inheritPlayerId) return player;
    return {
      ...player,
      mechs: player.mechs.map((m) => {
        if (m.mechCard.id !== targetMechId) return m;
        return {
          ...m,
          inheritedMechId: destroyedId,
          inheritBonus: { hp: 1, aim: 1 },
          currentHP: m.currentHP + 1,
        };
      }),
    };
  });

  const targetName = getMechName(state, targetMechId);
  return {
    ...state,
    players: newPlayers,
    battleRound: { ...round, subPhase: "draw", pendingDestroyedMechId: null, inheritPlayerId: null },
    log: [...state.log, `魂の継承: ${targetName} がHP+1, AIM+1を獲得`],
  };
}

// ---------- ヘルパー ----------

function getAttackerMech(state: GameState): AssembledMech | null {
  const round = state.battleRound!;
  const player = state.players.find((p) => p.id === round.attackPlayerId);
  return player?.mechs.find((m) => m.mechCard.id === round.currentCard?.mechId) ?? null;
}

function getDefenderMech(state: GameState): AssembledMech | null {
  const round = state.battleRound!;
  const player = state.players.find((p) => p.id === round.defensePlayerId);
  return player?.mechs.find((m) => m.mechCard.id === round.defenderMechId) ?? null;
}

function getMechName(state: GameState, mechId: string): string {
  for (const p of state.players) {
    const m = p.mechs.find((m) => m.mechCard.id === mechId) ??
      p.selectedMechs.find((m) => m.id === mechId);
    if (m) return "name" in m ? m.name : (m as AssembledMech).mechCard.name;
  }
  return mechId;
}

export function checkWinCondition(state: GameState): string | null {
  for (const player of state.players) {
    const opponent = state.players.find((p) => p.id !== player.id);
    if (!opponent) continue;
    if (opponent.mechs.length > 0 && opponent.mechs.every((m) => m.isDestroyed)) {
      return player.id;
    }
  }
  return null;
}

export function createInitialGameState(roomCode: string): GameState {
  return {
    roomCode,
    phase: "lobby",
    hasCpu: false,
    players: [],
    draftState: null,
    assemblyData: null,
    battleRound: null,
    winnerId: null,
    log: [],
  };
}
