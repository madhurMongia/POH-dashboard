import { ChainId } from '@/lib/graphql';

export interface GlobalAnalytics {
  verifiedHumanProfiles: string;
  registrationsPending: string;
  registrationsFunded: string;
  registrationsChallenged: string;
  registrationsRejected: string;
  registrationsSubmitted: string;
  registrationsSubmittedLocal: string;
  registrationsSubmittedBridged: string;
}

export interface DailyAnalytics {
  date: string; // UNIX timestamp
  registrationsSubmitted: string;
  verifiedHumanProfiles: string;
  registrationsChallenged: string;
  registrationsRejected: string;
  registrationsPending?: string;
}

export interface GlobalStatsResponse {
  globalAnalytics: GlobalAnalytics | null;
}

export interface DailyTrendsResponse {
  dailyAnalytics_collection: DailyAnalytics[];
}

export interface ChainData {
  chain: ChainId;
  stats: GlobalAnalytics | null;
  dailyAnalytics: DailyAnalytics[];
}
