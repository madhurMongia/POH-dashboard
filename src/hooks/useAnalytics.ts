import { useQuery } from '@tanstack/react-query';
import { getGraphQLClient, ChainId } from '@/lib/graphql';
import { 
  GLOBAL_STATS_QUERY, 
  GLOBAL_STATS_QUERY_NO_RENEWALS,
  STATS_BY_RANGE_QUERY,
  STATS_BY_RANGE_QUERY_NO_NEW_FIELDS,
  EXPIRED_REGISTRATIONS_QUERY,
  EXPIRED_REGISTRATIONS_V2_ONLY_QUERY,
} from '@/lib/queries';
import { 
  GlobalStatsResponse, 
  DailyTrendsResponse, 
  DailyAnalytics
} from '@/types/analytics';

function isMissingFieldError(error: unknown, fieldName: string) {
  const errors = (error as { response?: { errors?: { message?: string }[] } })
    ?.response?.errors;
  if (!errors?.length) return false;
  return errors.some((err) => 
    err.message?.includes(`no field \`${fieldName}\``) || 
    err.message?.includes(`Type \`GlobalAnalytics\` has no field \`${fieldName}\``) ||
    err.message?.includes(`Type \`DailyAnalytics\` has no field \`${fieldName}\``)
  );
}

export function useGlobalStats(chainId: ChainId) {
  return useQuery({
    queryKey: ['globalStats', chainId],
    queryFn: async () => {
      try {
        const client = getGraphQLClient(chainId);
        let data: GlobalStatsResponse | null = null;
        try {
          data = await client.request<GlobalStatsResponse>(GLOBAL_STATS_QUERY);
        } catch (error) {
           console.log(`[${chainId}] Global stats query failed, trying fallback...`, error);
           if (isMissingFieldError(error, 'renewalsSubmitted') || isMissingFieldError(error, 'registrationsBridged') || isMissingFieldError(error, 'airdropClaims')) {
            data = await client.request<GlobalStatsResponse>(GLOBAL_STATS_QUERY_NO_RENEWALS);
          } else {
            throw error;
          }
        }
        return data || { globalAnalytics: null };
      } catch (error) {
        console.error(`Error fetching global stats for ${chainId}:`, error);
        // Return null data structure on error instead of undefined
        return { globalAnalytics: null };
      }
    },
  });
}

export function useCustomRangeStats(chainId: ChainId, startDate: number | null, endDate: number | null) {
  return useQuery({
    queryKey: ['customRangeStats', chainId, startDate, endDate],
    queryFn: async () => {
// #region agent log
      fetch('http://127.0.0.1:7244/ingest/35e463bd-f111-4cd9-b696-69812b6c9c98',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAnalytics.ts:useCustomRangeStats',message:'useCustomRangeStats called',data:{chainId, startDate, endDate},timestamp:Date.now(),sessionId:'debug-session'})}).catch(()=>{});
      // #endregion
      if (!startDate || !endDate) return { dailyAnalytics_collection: [] };
      
      try {
        const client = getGraphQLClient(chainId);
        // Convert ms to seconds for Subgraph (timestamps are seconds)
        const startSec = Math.floor(startDate / 1000);
        const endSec = Math.floor(endDate / 1000);
        
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/35e463bd-f111-4cd9-b696-69812b6c9c98',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAnalytics.ts:useCustomRangeStats',message:'Querying with seconds',data:{startSec, endSec},timestamp:Date.now(),sessionId:'debug-session'})}).catch(()=>{});
        // #endregion

        let data: DailyTrendsResponse | null = null;
        try {
          data = await client.request<DailyTrendsResponse>(STATS_BY_RANGE_QUERY, {
            startDate: startSec,
            endDate: endSec,
          });
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/35e463bd-f111-4cd9-b696-69812b6c9c98',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAnalytics.ts:useCustomRangeStats',message:'Main query success',data:{data},timestamp:Date.now(),sessionId:'debug-session'})}).catch(()=>{});
          // #endregion
        } catch (error) {
           // #region agent log
           fetch('http://127.0.0.1:7244/ingest/35e463bd-f111-4cd9-b696-69812b6c9c98',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAnalytics.ts:useCustomRangeStats',message:'Main query failed, trying fallback',data:{error: String(error)},timestamp:Date.now(),sessionId:'debug-session'})}).catch(()=>{});
           // #endregion
           console.log(`[${chainId}] Stats by range query failed, trying fallback...`, error);
           if (isMissingFieldError(error, 'renewalsSubmitted') || isMissingFieldError(error, 'registrationsBridged') || isMissingFieldError(error, 'registrationsPending') || isMissingFieldError(error, 'airdropClaims')) {
            data = await client.request<DailyTrendsResponse>(STATS_BY_RANGE_QUERY_NO_NEW_FIELDS, {
              startDate: startSec,
              endDate: endSec,
            });
            // #region agent log
            fetch('http://127.0.0.1:7244/ingest/35e463bd-f111-4cd9-b696-69812b6c9c98',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAnalytics.ts:useCustomRangeStats',message:'Fallback query success',data:{data},timestamp:Date.now(),sessionId:'debug-session'})}).catch(()=>{});
            // #endregion
          } else {
            throw error;
          }
        }
        return data || { dailyAnalytics_collection: [] };
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/35e463bd-f111-4cd9-b696-69812b6c9c98',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAnalytics.ts:useCustomRangeStats',message:'All queries failed',data:{error: String(error)},timestamp:Date.now(),sessionId:'debug-session'})}).catch(()=>{});
        // #endregion
        console.error(`Error fetching custom range stats for ${chainId}:`, error);
        return { dailyAnalytics_collection: [] };
      }
    },
    enabled: !!startDate && !!endDate,
    select: (data) => {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/35e463bd-f111-4cd9-b696-69812b6c9c98',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAnalytics.ts:useCustomRangeStats',message:'Select function running',data:{dataLength: data.dailyAnalytics_collection?.length, sample: data.dailyAnalytics_collection?.[0]},timestamp:Date.now(),sessionId:'debug-session'})}).catch(()=>{});
      // #endregion
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
