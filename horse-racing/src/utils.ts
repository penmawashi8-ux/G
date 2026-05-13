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
  const inheritBonus = (horse.soulInherited ? 1 : 0) + (horse.bondInherited ? 1 : 0);
  const parts = [horse.jockey, horse.blinker, horse.cheek].filter(Boolean) as Part[];
  return {
    ability: horse.base.ability + parts.reduce((s, p) => s + p.abilityMod, 0),
    speed: horse.base.speed + parts.reduce((s, p) => s + p.speedMod, 0),
    motivation: horse.base.motivation + parts.reduce((s, p) => s + p.motivationMod, 0) + inheritBonus,
    grit: horse.base.grit + parts.reduce((s, p) => s + p.gritMod, 0) + inheritBonus,
    extraDice: parts.reduce((s, p) => s + p.extraDice, 0),
    extraReroll: parts.reduce((s, p) => s + p.extraReroll, 0),
  };
}

export function isEquipValid(horse: HorseState, slot: keyof Pick<HorseState, 'jockey' | 'blinker' | 'cheek'>, part: Part | undefined): boolean {
  const testHorse: HorseState = { ...horse, [slot]: part };
  const stats = getEffectiveStats(testHorse);
  return stats.ability >= 1 && stats.motivation >= 1 && stats.grit >= 1;
}

export function buildInitiativeDeck(players: Player[]): InitiativeCard[] {
  const cards: InitiativeCard[] = [];
  players.forEach((player, playerIndex) => {
    player.horses.forEach((horse, horseIndex) => {
      if (horse.fallen) return;
      const stats = getEffectiveStats(horse);
      const ability = Math.max(0, stats.ability);
      if (ability === 0) return;

      const leftCount = Math.floor(ability / 2) + (ability % 2 === 1 && Math.random() < 0.5 ? 1 : 0);
      const rightCount = ability - leftCount;

      for (let i = 0; i < leftCount; i++) {
        cards.push({ id: `${playerIndex}-${horseIndex}-L${i}`, playerIndex, horseIndex, direction: 'left' });
      }
      for (let i = 0; i < rightCount; i++) {
        cards.push({ id: `${playerIndex}-${horseIndex}-R${i}`, playerIndex, horseIndex, direction: 'right' });
      }
    });
  });
  return shuffleArray(cards);
}

export function countValidDice(values: number[], motivation: number): number {
  return values.filter(v => v <= motivation).length;
}

export function getSlotLabel(slot: string): string {
  if (slot === 'jockey') return 'ジョッキー';
  if (slot === 'blinker') return 'ブリンカー';
  return 'チークピーシーズ';
}
