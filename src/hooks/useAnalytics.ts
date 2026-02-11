import { useQuery } from '@tanstack/react-query';
import { getGraphQLClient, ChainId } from '@/lib/graphql';
import {
  GLOBAL_STATS_QUERY,
  GLOBAL_STATS_QUERY_ETHEREUM,
  GLOBAL_STATS_QUERY_ETHEREUM_LEGACY,
  STATS_BY_RANGE_QUERY,
  STATS_BY_RANGE_QUERY_ETHEREUM,
  STATS_BY_RANGE_QUERY_ETHEREUM_LEGACY,
  EXPIRED_REGISTRATIONS_QUERY,
  EXPIRED_REGISTRATIONS_V2_ONLY_QUERY,
  OUT_TRANSFERS_COUNT_QUERY,
  SEER_CREDITS_DAILY_USERS_BY_RANGE_QUERY,
} from '@/lib/queries';
import {
  GlobalStatsResponse,
  DailyTrendsResponse,
  DailyAnalytics
} from '@/types/analytics';

export function useGlobalStats(chainId: ChainId) {
  return useQuery({
    queryKey: ['globalStats', chainId],
    queryFn: async () => {
      const client = getGraphQLClient(chainId);
      const globalQuery = chainId === 'ethereum' ? GLOBAL_STATS_QUERY_ETHEREUM : GLOBAL_STATS_QUERY;
      let data: GlobalStatsResponse;
      try {
        data = await client.request<GlobalStatsResponse>(globalQuery);
      } catch (error) {
        if (chainId !== 'ethereum') throw error;
        data = await client.request<GlobalStatsResponse>(GLOBAL_STATS_QUERY_ETHEREUM_LEGACY);
      }

      if (chainId === 'ethereum' && data.globalAnalytics) {
        data.globalAnalytics.registrationsBridged = data.globalAnalytics.registrationsBridged || '0';
        data.globalAnalytics.registrationsTransferredOut = data.globalAnalytics.registrationsTransferredOut || '0';
        data.globalAnalytics.registrationsWithdrawn = data.globalAnalytics.registrationsWithdrawn || '0';
        data.globalAnalytics.renewalsSubmitted = data.globalAnalytics.renewalsSubmitted || '0';
        data.globalAnalytics.airdropClaims = data.globalAnalytics.airdropClaims || '0';
        data.globalAnalytics.seerCreditsBuys = '0';
        data.globalAnalytics.seerCreditsUsers = '0';
      }

      if (
        chainId === 'ethereum' &&
        data.globalAnalytics &&
        Number(data.globalAnalytics.registrationsTransferredOut || 0) === 0
      ) {
        let lastId = '0x00';
        let outTransfersCount = 0;

        while (true) {
          const outTransfersData = await client.request<{ outTransfers: { id: string }[] }>(
            OUT_TRANSFERS_COUNT_QUERY,
            { lastId }
          );

          const outTransfers = outTransfersData.outTransfers || [];
          outTransfersCount += outTransfers.length;

          if (outTransfers.length < 1000) break;
          lastId = outTransfers[outTransfers.length - 1].id;
        }

        data.globalAnalytics.registrationsTransferredOut = String(outTransfersCount);
      }

      return data;
    },
  });
}

export function useCustomRangeStats(chainId: ChainId, startDate: number | null, endDate: number | null) {
  return useQuery({
    queryKey: ['customRangeStats', chainId, startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return { dailyAnalytics_collection: [], seerCreditsUsersInRange: null };
      const client = getGraphQLClient(chainId);
      const rangeQuery = chainId === 'ethereum' ? STATS_BY_RANGE_QUERY_ETHEREUM : STATS_BY_RANGE_QUERY;
      let activeRangeQuery = rangeQuery;
      let ethereumLegacyRange = false;

      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      const startUtcSec = Math.floor(Date.UTC(
        startDateObj.getUTCFullYear(),
        startDateObj.getUTCMonth(),
        startDateObj.getUTCDate()
      ) / 1000);
      const endUtcSec = Math.floor(Date.UTC(
        endDateObj.getUTCFullYear(),
        endDateObj.getUTCMonth(),
        endDateObj.getUTCDate()
      ) / 1000);
      const endUtcSecExclusive = endUtcSec + 86400;

      const allRows: DailyAnalytics[] = [];
      let skip = 0;
      while (true) {
        let data: DailyTrendsResponse;
        try {
          data = await client.request<DailyTrendsResponse>(activeRangeQuery, {
            startDate: startUtcSec,
            endDate: endUtcSecExclusive,
            skip,
          });
        } catch (error) {
          if (chainId !== 'ethereum' || ethereumLegacyRange) throw error;
          activeRangeQuery = STATS_BY_RANGE_QUERY_ETHEREUM_LEGACY;
          ethereumLegacyRange = true;
          continue;
        }

        const batch = data.dailyAnalytics_collection || [];
        if (ethereumLegacyRange) {
          batch.forEach((row) => {
            const day = row as Partial<DailyAnalytics>;
            day.registrationsBridged = day.registrationsBridged || '0';
            day.registrationsWithdrawn = day.registrationsWithdrawn || '0';
            day.renewalsSubmitted = day.renewalsSubmitted || '0';
            day.airdropClaims = day.airdropClaims || '0';
            day.seerCreditsBuys = day.seerCreditsBuys || '0';
            day.seerCreditsUsers = day.seerCreditsUsers || '0';
          });
        }

        allRows.push(...batch);
        if (batch.length < 1000) break;
        skip += 1000;
      }

      let seerCreditsUsersInRange: number | null = null;
      if (chainId === 'gnosis') {
        const walletSet = new Set<string>();
        const endId = `${endUtcSecExclusive}-`;
        let lastId = `${startUtcSec}-`;

        while (true) {
          const data = await client.request<{ seerCreditsDailyUsers: { id: string }[] }>(
            SEER_CREDITS_DAILY_USERS_BY_RANGE_QUERY,
            { lastId, endId }
          );
          const rows = data.seerCreditsDailyUsers || [];
          for (const row of rows) {
            const separatorIndex = row.id.indexOf('-');
            if (separatorIndex === -1) continue;
            walletSet.add(row.id.slice(separatorIndex + 1).toLowerCase());
          }

          if (rows.length < 1000) break;
          lastId = rows[rows.length - 1].id;
        }

        seerCreditsUsersInRange = walletSet.size;
      }

      return {
        dailyAnalytics_collection: allRows,
        seerCreditsUsersInRange,
      };
    },
    enabled: !!startDate && !!endDate,
    select: (data) => {
      // Aggregate data
      const analytics = data.dailyAnalytics_collection || [];
      const total = analytics.reduce((acc, day) => {
        const result = {
          verifiedHumanProfiles: acc.verifiedHumanProfiles + Number(day.verifiedHumanProfiles || 0),
          registrationsSubmitted: acc.registrationsSubmitted + Number(day.registrationsSubmitted || 0),
          registrationsPending: acc.registrationsPending + Number(day.registrationsPending || 0),
          registrationsFunded: acc.registrationsFunded + Number(day.registrationsFunded || 0),
          registrationsChallenged: acc.registrationsChallenged + Number(day.registrationsChallenged || 0),
          registrationsRejected: acc.registrationsRejected + Number(day.registrationsRejected || 0),
          registrationsBridged: acc.registrationsBridged + Number(day.registrationsBridged || 0),
          registrationsWithdrawn: acc.registrationsWithdrawn + Number(day.registrationsWithdrawn || 0),
          renewalsSubmitted: acc.renewalsSubmitted + Number(day.renewalsSubmitted || 0),
          airdropClaims: acc.airdropClaims + Number(day.airdropClaims || 0),
          seerCreditsBuys: acc.seerCreditsBuys + Number(day.seerCreditsBuys || 0),
          seerCreditsUsers: acc.seerCreditsUsers + Number(day.seerCreditsUsers || 0),
          registrationsTransferredOut: 0,
          // Mock ID and Date for the aggregated object (not used in display)
          id: "aggregated",
          date: "0"
        };
        return result;
      }, {
        verifiedHumanProfiles: 0,
        registrationsSubmitted: 0,
        registrationsPending: 0,
        registrationsFunded: 0,
        registrationsChallenged: 0,
        registrationsRejected: 0,
        registrationsBridged: 0,
        registrationsWithdrawn: 0,
        renewalsSubmitted: 0,
        airdropClaims: 0,
        seerCreditsBuys: 0,
        seerCreditsUsers: 0,
        registrationsTransferredOut: 0,
        id: "aggregated",
        date: "0"
      });

      return {
        dailyAnalytics: analytics,
        aggregated: {
          ...total,
          seerCreditsUsers:
            typeof data.seerCreditsUsersInRange === 'number'
              ? data.seerCreditsUsersInRange
              : total.seerCreditsUsers,
        }
      };
    },
  });
}

export function useExpiredProfiles(chainId: ChainId) {
  return useQuery({
    queryKey: ['expiredProfiles', chainId],
    queryFn: async () => {
      try {
        const client = getGraphQLClient(chainId);
        const now = Math.floor(Date.now() / 1000);
        let expiredCount = 0;
        let lastId = "0x00";
        let hasMore = true;
        const expiredQuery =
          chainId === 'ethereum'
            ? EXPIRED_REGISTRATIONS_V2_ONLY_QUERY
            : EXPIRED_REGISTRATIONS_QUERY;

        while (hasMore) {
          const data = await client.request<{ registrations: { id: string }[] }>(expiredQuery, {
            now,
            lastId
          });

          const registrations = data.registrations || [];
          expiredCount += registrations.length;

          if (registrations.length < 1000) {
            hasMore = false;
          } else {
            lastId = registrations[registrations.length - 1].id;
          }
        }

        return expiredCount;
      } catch (error) {
        console.error(`Error fetching expired profiles for ${chainId}:`, error);
        return 0;
      }
    },
    // Cache for a longer time since this is a heavy query
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Hook to fetch data from all chains
export function useMultiChainStats() {
  const ethereumStats = useGlobalStats('ethereum');
  const gnosisStats = useGlobalStats('gnosis');

  return {
    ethereum: ethereumStats,
    gnosis: gnosisStats,
    isLoading: ethereumStats.isLoading || gnosisStats.isLoading,
    isError: ethereumStats.isError || gnosisStats.isError,
  };
}
