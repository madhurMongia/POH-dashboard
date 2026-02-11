import { ChainId } from '@/lib/graphql';

export interface GlobalAnalytics {
  id: string;
  verifiedHumanProfiles: string;
  registrationsPending: string;
  registrationsFunded: string;
  registrationsChallenged: string;
  registrationsRejected: string;
  registrationsSubmitted: string;
  registrationsBridged: string;
  registrationsTransferredOut: string;
  registrationsWithdrawn: string;
  renewalsSubmitted: string;
  airdropClaims: string;
  seerCreditsBuys: string;
  seerCreditsUsers: string;
}

export interface DailyAnalytics {
  id: string;
  date: string;
  verifiedHumanProfiles: string;
  registrationsPending: string;
  registrationsFunded: string;
  registrationsChallenged: string;
  registrationsRejected: string;
  registrationsSubmitted: string;
  registrationsBridged: string;
  registrationsWithdrawn: string;
  renewalsSubmitted: string;
  airdropClaims: string;
  seerCreditsBuys: string;
  seerCreditsUsers: string;
}

export interface GlobalStatsResponse {
  globalAnalytics: GlobalAnalytics | null;
}

export interface DailyTrendsResponse {
  dailyAnalytics_collection: DailyAnalytics[];
}
