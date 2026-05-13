export type PlayerColor = 'red' | 'green' | 'black' | 'purple';
export type SlotType = 'jockey' | 'blinker' | 'cheek';
export type HorseType = 'honmei' | 'taikou';
export type ActionType = 'advance' | 'obstruct';
export type Direction = 'left' | 'right';
export type GameMode = 'local' | 'cpu' | 'online';
export type PlayerType = 'human' | 'cpu';

export type GamePhase =
  | 'start'
  | 'online-lobby'
  | 'honmei-draft'
  | 'taikou-draft'
  | 'race-distance'
  | 'parts-draft'
  | 'equip'
  | 'race'
  | 'game-over';

export type RaceSubPhase =
  | 'draw-initiative'
  | 'action-declare'
  | 'target-declare'
  | 'dice-roll'
  | 'resolve'
  | 'inheritance'
  | 'bond-inheritance'
  | 'victory';

export interface BaseHorse {
  id: string;
  name: string;
  /** Dice threshold: roll 1d6, succeed if die > speed. Lower = easier to succeed. */
  speed: number;
  /** Health points. Eliminated when accumulated damage >= hp. */
  hp: number;
  type: HorseType;
}

export interface Part {
  id: string;
  slot: SlotType;
  name: string;
  speedMod: number;
  hpMod: number;
}

export interface HorseState {
  base: BaseHorse;
  jockey?: Part;
  blinker?: Part;
  cheek?: Part;
  damage: number;
  position: number;
  fallen: boolean;
  soulInherited: boolean;
  bondInherited: boolean;
}

export interface EffectiveStats {
  speed: number;
  hp: number;
}

export interface Player {
  id: number;
  color: PlayerColor;
  name: string;
  horses: HorseState[];
  parts: Part[];
  teamId: number;
  bondInheritanceUsed: boolean;
}

export interface InitiativeCard {
  id: string;
  playerIndex: number;
  horseIndex: number;
  direction: Direction;
}

export interface GameState {
  phase: GamePhase;
  raceSubPhase: RaceSubPhase | null;
  playerCount: number;
  teamMode: boolean;
  gameMode: GameMode;
  playerTypes: PlayerType[];
  localPlayerIndex: number;
  onlineRoomCode: string | null;
  players: Player[];
  startPlayerIndex: number;

  // Draft
  currentDraftPlayerIndex: number;
  availableHonmei: BaseHorse[];
  availableTaikou: BaseHorse[];
  allParts: Part[];
  currentDraftParts: Part[];
  backDraftParts: Part[];
  partsPhase: 'front' | 'back';
  partsPicksDone: number;

  // Race distance
  raceDistance: number;
  raceDistanceDie: number | null;

  // Equip
  currentEquipPlayerIndex: number;

  // Initiative
  initiativeDeck: InitiativeCard[];
  initiativeDiscard: InitiativeCard[];

  // Race turn
  currentInitiativeCard: InitiativeCard | null;
  attackerPlayerIndex: number | null;
  attackerHorseIndex: number | null;
  defenderPlayerIndex: number | null;
  defenderHorseIndex: number | null;
  declaredAction: ActionType | null;

  // Single die roll
  diceValues: number[];

  // Inheritance
  pendingInheritancePlayerIndex: number | null;
  pendingInheritanceFallenHorseIndex: number | null;
  pendingBondPlayerIndex: number | null;
  pendingBondFallenHorses: BaseHorse[];

  // Winner
  winnerPlayerIndex: number | null;
  winnerTeamId: number | null;

  // Log
  gameLog: string[];
}
