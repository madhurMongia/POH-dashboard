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
      seerCreditsBuys
      seerCreditsUsers
    }
  }
`;

export const GLOBAL_STATS_QUERY_ETHEREUM = gql`
  query GlobalStatsEthereum {
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

export const GLOBAL_STATS_QUERY_ETHEREUM_LEGACY = gql`
  query GlobalStatsEthereumLegacy {
    globalAnalytics(id: "global") {
      verifiedHumanProfiles
      registrationsPending
      registrationsFunded
      registrationsChallenged
      registrationsRejected
      registrationsSubmitted
    }
  }
`;

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
      seerCreditsBuys
      seerCreditsUsers
    }
  }
`;

export const STATS_BY_RANGE_QUERY_ETHEREUM = gql`
  query StatsByRangeEthereum($startDate: BigInt!, $endDate: BigInt!, $skip: Int!) {
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

export const STATS_BY_RANGE_QUERY_ETHEREUM_LEGACY = gql`
  query StatsByRangeEthereumLegacy($startDate: BigInt!, $endDate: BigInt!, $skip: Int!) {
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
        humanity_: { nbLegacyRequests: "0" }
      }
    ) {
      id
    }
  }
`;

export const OUT_TRANSFERS_COUNT_QUERY = gql`
  query OutTransfersCount($lastId: Bytes) {
    outTransfers(
      first: 1000
      orderBy: id
      orderDirection: asc
      where: { id_gt: $lastId }
    ) {
      id
    }
  }
`;

export const SEER_CREDITS_DAILY_USERS_BY_RANGE_QUERY = gql`
  query SeerCreditsDailyUsersByRange($lastId: ID!, $endId: ID!) {
    seerCreditsDailyUsers(
      first: 1000
      orderBy: id
      orderDirection: asc
      where: { id_gt: $lastId, id_lt: $endId }
    ) {
      id
    }
  }
`;
