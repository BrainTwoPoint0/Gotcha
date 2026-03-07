export interface NpsResult {
  score: number; // -100 to 100
  promoters: number;
  passives: number;
  detractors: number;
  promoterPct: number;
  passivePct: number;
  detractorPct: number;
  total: number;
}

/**
 * Calculate Net Promoter Score from an array of 0-10 ratings.
 * Promoters: 9-10, Passives: 7-8, Detractors: 0-6
 */
export function calculateNPS(ratings: number[]): NpsResult | null {
  if (ratings.length === 0) return null;

  let promoters = 0;
  let passives = 0;
  let detractors = 0;

  for (const r of ratings) {
    if (r >= 9) promoters++;
    else if (r >= 7) passives++;
    else detractors++;
  }

  const total = ratings.length;
  const promoterPct = Math.round((promoters / total) * 100);
  const passivePct = Math.round((passives / total) * 100);
  const detractorPct = Math.round((detractors / total) * 100);
  const score = promoterPct - detractorPct;

  return {
    score,
    promoters,
    passives,
    detractors,
    promoterPct,
    passivePct,
    detractorPct,
    total,
  };
}
