export type PlayerColor = 'red' | 'green' | 'black' | 'purple';
export type SlotType = 'jockey' | 'blinker' | 'cheek';
export type HorseType = 'honmei' | 'taikou';
export type ActionType = 'advance' | 'obstruct';
export type Direction = 'left' | 'right';

export type GamePhase =
  | 'start'
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
  | 'reroll'
  | 'resolve'
  | 'inheritance'
  | 'bond-inheritance'
  | 'victory';

export interface BaseHorse {
  id: string;
  name: string;
  ability: number;
  speed: number;
  motivation: number;
  grit: number;
  type: HorseType;
}

export interface Part {
  id: string;
  slot: SlotType;
  name: string;
  abilityMod: number;
  speedMod: number;
  motivationMod: number;
  gritMod: number;
  extraDice: number;
  extraReroll: number;
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
  ability: number;
  speed: number;
  motivation: number;
  grit: number;
  extraDice: number;
  extraReroll: number;
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

  // Dice
  diceValues: number[];
  diceRerolled: boolean[];
  rerollsRemaining: number;

  // Inheritance
  pendingInheritancePlayerIndex: number | null;
  pendingInheritanceFallenHorseIndex: number | null;

  // Bond inheritance (team mode)
  pendingBondPlayerIndex: number | null;
  pendingBondFallenHorses: BaseHorse[];

  // Winner
  winnerPlayerIndex: number | null;
  winnerTeamId: number | null;

  // Log
  gameLog: string[];
}
