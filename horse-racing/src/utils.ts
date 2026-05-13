import { HorseState, EffectiveStats, Part, InitiativeCard, Player } from './types';

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function rollDice(count: number): number[] {
  return Array.from({ length: count }, rollDie);
}

export function getEffectiveStats(horse: HorseState): EffectiveStats {
  const hpBonus = (horse.soulInherited ? 1 : 0) + (horse.bondInherited ? 1 : 0);
  const parts = [horse.jockey, horse.blinker, horse.cheek].filter(Boolean) as Part[];
  return {
    speed: horse.base.speed + parts.reduce((s, p) => s + p.speedMod, 0),
    hp: horse.base.hp + parts.reduce((s, p) => s + p.hpMod, 0) + hpBonus,
  };
}

/** Returns true when the die result beats the speed threshold (die > speed). */
export function isDiceSuccess(dieValue: number, speed: number): boolean {
  return dieValue > speed;
}

export function isEquipValid(horse: HorseState, slot: keyof Pick<HorseState, 'jockey' | 'blinker' | 'cheek'>, part: Part | undefined): boolean {
  const testHorse: HorseState = { ...horse, [slot]: part };
  const stats = getEffectiveStats(testHorse);
  return stats.speed >= 1 && stats.hp >= 1;
}

export function buildInitiativeDeck(players: Player[]): InitiativeCard[] {
  const cards: InitiativeCard[] = [];
  players.forEach((player, playerIndex) => {
    player.horses.forEach((horse, horseIndex) => {
      if (horse.fallen) return;
      const direction = Math.random() < 0.5 ? 'left' : ('right' as 'left' | 'right');
      cards.push({ id: `${playerIndex}-${horseIndex}-0`, playerIndex, horseIndex, direction });
    });
  });
  return shuffleArray(cards);
}

export function getSlotLabel(slot: string): string {
  if (slot === 'jockey') return 'ジョッキー';
  if (slot === 'blinker') return 'ブリンカー';
  return 'チークピーシーズ';
}
