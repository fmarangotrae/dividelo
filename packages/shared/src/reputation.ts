/**
 * Sistema de reputación ponderado
 * Score 0–100
 */

export interface ReputationSignals {
  totalTransactions: number;
  successfulTransactions: number;
  disputesLost: number;
  disputesInitiated: number;
  averageRatingStars: number; // 1-5
  accountAgeDays: number;
  kycLevel: number; // 0-3
  phoneVerified: boolean;
  emailVerified: boolean;
  payoutFailed: number;
}

export const BADGES = {
  VERIFIED: { minScore: 70, kycMin: 2, label: 'Verificado ✓', color: 'emerald' },
  PAYS_ON_TIME: { minSuccessful: 10, disputesLost: 0, label: 'Paga a tiempo', color: 'blue' },
  TOP_HOST: { minHostSlots: 20, avgRating: 4.5, label: 'Anfitrión Top', color: 'amber' },
  NEW_USER: { accountAgeMaxDays: 30, label: 'Nuevo', color: 'gray' },
  TRUSTED: { accountAgeMinDays: 180, minScore: 85, label: 'Usuario de confianza', color: 'purple' },
} as const;

export function calcReputationScore(signals: ReputationSignals): number {
  let score = 50;

  // Verificaciones básicas
  if (signals.emailVerified) score += 5;
  if (signals.phoneVerified) score += 10;
  score += Math.min(10, signals.kycLevel * 5);

  // Antigüedad
  score += Math.min(10, Math.floor(signals.accountAgeDays / 30));

  // Transacciones exitosas
  const successRate =
    signals.totalTransactions > 0
      ? signals.successfulTransactions / signals.totalTransactions
      : 1;
  score += Math.min(15, Math.floor(signals.totalTransactions / 5) * successRate * 5);

  // Disputas perdidas penalizan
  score -= Math.min(30, signals.disputesLost * 15);

  // Calificaciones
  if (signals.averageRatingStars) {
    score += Math.min(10, (signals.averageRatingStars - 3) * 5);
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Reglas de liberación de escrow según score
 * Prioridad alta
 */
export function getEscrowReleaseHours(reputationScore: number, successfulTransactions: number): {
  hours: number;
  instant: boolean;
  reason: string;
} {
  if (reputationScore >= 90 && successfulTransactions >= 10) {
    return { hours: 0, instant: true, reason: 'score-alto-instantaneo' };
  }
  if (reputationScore >= 70) {
    return { hours: 24, instant: false, reason: 'score-medio-24h' };
  }
  return { hours: 48, instant: false, reason: 'score-bajo-48h' };
}
