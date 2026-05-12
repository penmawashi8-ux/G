// ガニメデ戦記ゼロプラス — 共通型定義

export type GamePhase = "lobby" | "draft" | "assembly" | "battle" | "ended";
export type PartSlot = "right" | "left" | "backpack";
export type MechType = "heavy" | "support"; // 長機 | 僚機
export type Direction = "right" | "left";
export type BattleSubPhase =
  | "draw"
  | "selectDefender"
  | "roll"
  | "reroll"
  | "resolve"
  | "inherit";

// ---------- カードデータ ----------

export interface MechStats {
  sp: number;     // 行動回数（イニシアチブカード枚数）
  hp: number;
  aim: number;    // この数値以下の出目がヒット
  dice: number;   // 攻撃時のサイコロ数
  reroll: number; // リロール回数
}

export interface MechCard {
  id: string;
  name: string;
  type: MechType;
  baseStats: MechStats;
}

export interface PartCard {
  id: string;
  name: string;
  slot: PartSlot;
  spMod: number;
  hpMod: number;
  aimMod: number;
  bonusDice: number;
  bonusReroll: number;
}

// ---------- ゲーム中の状態 ----------

export interface AssembledMech {
  mechCard: MechCard;
  parts: {
    right?: PartCard;
    left?: PartCard;
    backpack?: PartCard;
  };
  computedStats: MechStats;
  currentHP: number;
  damageCounters: number;
  isDestroyed: boolean;
  inheritedMechId: string | null;
  inheritBonus: { hp: number; aim: number };
}

export interface Player {
  id: string;
  name: string;
  isCpu: boolean;
  mechs: AssembledMech[];      // populated after assembly
  hand: PartCard[];             // during draft/assembly
  selectedMechs: MechCard[];   // [0]=leader, [1]=support; set during draft
  isReady: boolean;
}

export interface InitiativeCard {
  id: string;
  playerId: string;
  mechId: string;
  direction: Direction;
}

// ---------- フェイズ別サブ状態 ----------

export interface DraftState {
  availableLeaders: MechCard[];
  availableSupports: MechCard[];
  availableParts: PartCard[];
  step: "leader" | "support" | "parts";
  pickOrder: string[];           // playerIds
  currentPickerIndex: number;
  partsPickCount: number;        // how many parts picks done (0-7)
}

export interface AssemblyData {
  // key: playerId
  // value: part assignments (partId → slot on each mech)
  pending: {
    [playerId: string]: {
      leader: { right?: string; left?: string; backpack?: string };
      support: { right?: string; left?: string; backpack?: string };
      directionChoices: { [mechId: string]: Direction };
    };
  };
  confirmed: string[];   // playerIds who clicked 決定
  deadline: number;      // unix ms
}

export interface BattleRound {
  subPhase: BattleSubPhase;
  initiativeDeck: InitiativeCard[];
  initiativeDiscard: InitiativeCard[];
  currentCard: InitiativeCard | null;
  attackPlayerId: string | null;
  defensePlayerId: string | null;
  defenderMechId: string | null;
  diceResults: number[];
  rerollsUsed: number;
  maxRerolls: number;
  pendingDestroyedMechId: string | null;
  inheritPlayerId: string | null;
}

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  hasCpu: boolean;
  players: Player[];
  draftState: DraftState | null;
  assemblyData: AssemblyData | null;
  battleRound: BattleRound | null;
  winnerId: string | null;
  log: string[];
}

// ---------- Socket イベント ----------

export interface AssemblyConfirmPayload {
  leader: { right?: string; left?: string; backpack?: string };
  support: { right?: string; left?: string; backpack?: string };
  directionChoices: { [mechId: string]: Direction };
}

export interface ClientToServerEvents {
  create_room: (playerName: string, cb: (roomCode: string) => void) => void;
  create_cpu_room: (playerName: string, cb: (roomCode: string) => void) => void;
  join_room: (
    data: { roomCode: string; playerName: string },
    cb: (error?: string) => void
  ) => void;
  draft_pick: (cardId: string) => void;
  assembly_confirm: (payload: AssemblyConfirmPayload) => void;
  select_defender: (mechId: string) => void;
  roll_dice: () => void;
  reroll_dice: (indices: number[]) => void;
  resolve_attack: () => void;
  inherit_soul: (targetMechId: string | null) => void;
}

export interface ServerToClientEvents {
  game_state: (state: GameState) => void;
  error: (message: string) => void;
}
