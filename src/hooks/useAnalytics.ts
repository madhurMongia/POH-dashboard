import { useQuery } from '@tanstack/react-query';
import { getGraphQLClient, ChainId } from '@/lib/graphql';
import {
  GLOBAL_STATS_QUERY,
  STATS_BY_RANGE_QUERY,
  EXPIRED_REGISTRATIONS_QUERY,
  EXPIRED_REGISTRATIONS_V2_ONLY_QUERY,
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
      return client.request<GlobalStatsResponse>(GLOBAL_STATS_QUERY);
    },
  });
}

export function useCustomRangeStats(chainId: ChainId, startDate: number | null, endDate: number | null) {
  return useQuery({
    queryKey: ['customRangeStats', chainId, startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return { dailyAnalytics_collection: [] };
      const client = getGraphQLClient(chainId);

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
        const data = await client.request<DailyTrendsResponse>(STATS_BY_RANGE_QUERY, {
          startDate: startUtcSec,
          endDate: endUtcSecExclusive,
          skip,
        });
        const batch = data.dailyAnalytics_collection || [];
        allRows.push(...batch);
        if (batch.length < 1000) break;
        skip += 1000;
      }

      return { dailyAnalytics_collection: allRows };
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
        // registrationsTransferredOut not available in DailyAnalytics per schema
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
        registrationsTransferredOut: 0,
        id: "aggregated",
        date: "0"
      });
      
      return {
        dailyAnalytics: analytics,
        aggregated: total
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
    staleTime: 1000 * 60 * 5, // 5 minutes
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
