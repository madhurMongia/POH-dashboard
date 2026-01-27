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
      registrationsBridged
      registrationsTransferredOut
      registrationsWithdrawn
      renewalsSubmitted
      airdropClaims
    }
  }
`;

// Legacy fallback for queries that might fail on older subgraphs
export const STATS_BY_RANGE_QUERY = gql`
  query StatsByRange($startDate: BigInt!, $endDate: BigInt!, $skip: Int!) {
    dailyAnalytics_collection(
      where: {
        date_gte: $startDate
        date_lt: $endDate
      }
      orderBy: date
      orderDirection: asc
      first: 1000
      skip: $skip
    ) {
      id
      date
      verifiedHumanProfiles
      registrationsSubmitted
      registrationsPending
      registrationsFunded
      registrationsChallenged
      registrationsRejected
      registrationsBridged
      registrationsWithdrawn
      renewalsSubmitted
      airdropClaims
    }
  }
`;

export const EXPIRED_REGISTRATIONS_QUERY = gql`
  query ExpiredRegistrations($now: BigInt!, $lastId: String) {
    registrations(
      first: 1000
      orderBy: id
      orderDirection: asc
      where: { expirationTime_lt: $now, id_gt: $lastId }
    ) {
      id
    }
  }
`;

export const EXPIRED_REGISTRATIONS_V2_ONLY_QUERY = gql`
  query ExpiredV2Only($now: BigInt!, $lastId: Bytes) {
    registrations(
      first: 1000
      orderBy: id
      orderDirection: asc
      where: {
        expirationTime_lt: $now
        id_gt: $lastId
        humanity_: { nbLegacyRequests_eq: 0 }
      }
    ) {
      id
    }
  }
`;
