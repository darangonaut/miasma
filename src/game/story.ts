/** Koniec hry podľa toho, koľko preživších lekár zachránil. */
export type Ending = 'good' | 'mid' | 'bad';

export function ending(saved: number, total: number): Ending {
  const share = total > 0 ? saved / total : 0;
  return share >= 0.7 ? 'good' : share >= 0.3 ? 'mid' : 'bad';
}

/** Tajomstvo na konci: len so všetkými stranami denníka. */
export function secretUnlocked(pages: number, total: number): boolean {
  return total > 0 && pages >= total;
}
