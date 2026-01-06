import { gql } from 'graphql-request';

export const GLOBAL_STATS_QUERY = gql`
  query GlobalStats {
    globalAnalytics(id: "global") {
      verifiedHumanProfiles
      registrationsPending
      registrationsFunded
      registrationsChallenged
      registrationsRejected
      registrationsSubmitted
      registrationsSubmittedLocal
      registrationsSubmittedBridged
    }
  }
`;

export const DAILY_TRENDS_QUERY = gql`
  query DailyTrends($first: Int = 30) {
    dailyAnalytics_collection(
      first: $first
      orderBy: date
      orderDirection: desc
    ) {
      date
      registrationsSubmitted
      verifiedHumanProfiles
      registrationsChallenged
      registrationsRejected
    }
  }
`;

export const STATS_BY_RANGE_QUERY = gql`
  query StatsByRange($startDate: BigInt!, $endDate: BigInt!) {
    dailyAnalytics_collection(
      where: {
        date_gte: $startDate
        date_lte: $endDate
      }
      orderBy: date
      orderDirection: asc
    ) {
      date
      verifiedHumanProfiles
      registrationsSubmitted
      registrationsChallenged
      registrationsRejected
    }
  }
`;
