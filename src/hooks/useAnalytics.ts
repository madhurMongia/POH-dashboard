import { useQuery } from '@tanstack/react-query';
import { getGraphQLClient, ChainId } from '@/lib/graphql';
import { 
  GLOBAL_STATS_QUERY, 
  DAILY_TRENDS_QUERY, 
  STATS_BY_RANGE_QUERY 
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
      try {
        const client = getGraphQLClient(chainId);
        console.log(client);
        const data = await client.request<GlobalStatsResponse>(GLOBAL_STATS_QUERY);
        console.log(data);
        return data || { globalAnalytics: null };
      } catch (error) {
        console.error(`Error fetching global stats for ${chainId}:`, error);
        // Return null data structure on error instead of undefined
        return { globalAnalytics: null };
      }
    },
  });
}

export function useDailyTrends(chainId: ChainId, days: number = 30) {
  return useQuery({
    queryKey: ['dailyTrends', chainId, days],
    queryFn: async () => {
      try {
        const client = getGraphQLClient(chainId);
        const data = await client.request<DailyTrendsResponse>(DAILY_TRENDS_QUERY, {
          first: days,
        });
        return data || { dailyAnalytics_collection: [] };
      } catch (error) {
        console.error(`Error fetching daily trends for ${chainId}:`, error);
        return { dailyAnalytics_collection: [] };
      }
    },
    select: (data) => {
      // Reverse to show oldest to newest on chart
      return {
        dailyAnalytics: [...(data.dailyAnalytics_collection || [])].reverse(),
      };
    },
  });
}

export function useCustomRangeStats(chainId: ChainId, startDate: number | null, endDate: number | null) {
  return useQuery({
    queryKey: ['customRangeStats', chainId, startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return { dailyAnalytics_collection: [] };
      
      try {
        const client = getGraphQLClient(chainId);
        // Convert ms to seconds for Subgraph if needed (usually timestamps are seconds)
        const startSec = Math.floor(startDate / 1000);
        const endSec = Math.floor(endDate / 1000);

        const data = await client.request<DailyTrendsResponse>(STATS_BY_RANGE_QUERY, {
          startDate: startSec,
          endDate: endSec,
        });
        return data || { dailyAnalytics_collection: [] };
      } catch (error) {
        console.error(`Error fetching custom range stats for ${chainId}:`, error);
        return { dailyAnalytics_collection: [] };
      }
    },
    enabled: !!startDate && !!endDate,
    select: (data) => {
      // Aggregate data
      const analytics = data.dailyAnalytics_collection || [];
      const total = analytics.reduce((acc, day) => ({
        verifiedHumanProfiles: acc.verifiedHumanProfiles + Number(day.verifiedHumanProfiles),
        registrationsSubmitted: acc.registrationsSubmitted + Number(day.registrationsSubmitted),
        registrationsChallenged: acc.registrationsChallenged + Number(day.registrationsChallenged),
        registrationsRejected: acc.registrationsRejected + Number(day.registrationsRejected),
      }), {
        verifiedHumanProfiles: 0,
        registrationsSubmitted: 0,
        registrationsChallenged: 0,
        registrationsRejected: 0,
      });

      return {
        dailyAnalytics: analytics,
        aggregated: total
      };
    },
  });
}

// Hook to fetch data from all chains
export function useMultiChainStats() {
  const ethereumStats = useGlobalStats('ethereum');
  const gnosisStats = useGlobalStats('gnosis');
  console.log(ethereumStats, gnosisStats);

  return {
    ethereum: ethereumStats,
    gnosis: gnosisStats,
    isLoading: ethereumStats.isLoading || gnosisStats.isLoading,
    isError: ethereumStats.isError || gnosisStats.isError,
  };
}
