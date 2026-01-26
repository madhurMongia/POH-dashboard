'use client';

import { useState, useEffect } from 'react';
import { useGlobalStats, useCustomRangeStats, useExpiredProfiles } from '@/hooks/useAnalytics';
import { StatCard } from '@/components/ui/StatCard';
import { DateRangePicker } from '@/components/DateRangePicker';
import { ChainSelector } from '@/components/ChainSelector';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { Activity, Globe } from 'lucide-react';
import { ChainId, getChainConfig } from '@/lib/graphql';

export default function Dashboard() {
  // Use state without initializer to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  const [selectedChain, setSelectedChain] = useState<ChainId>('ethereum');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });

  // Set initial state on mount
  useEffect(() => {
    const end = endOfDay(new Date());
    const start = startOfDay(subDays(end, 30));
    setDateRange({ start, end });
    setMounted(true);
  }, []);

  const { data: globalStats, isLoading: globalLoading } = useGlobalStats(selectedChain);
  const { data: expiredCount, isLoading: expiredLoading } = useExpiredProfiles(selectedChain);
  
  const { data: rangeData, isLoading: rangeLoading } = useCustomRangeStats(
    selectedChain,
    dateRange.start ? dateRange.start.getTime() : null,
    dateRange.end ? dateRange.end.getTime() : null
  );

  const stats = globalStats?.globalAnalytics;
  const periodStats = rangeData?.aggregated;
  const chainConfig = getChainConfig(selectedChain);

  if (!mounted) {
    return null; // or a loading skeleton
  }

  return (
    <main className="min-h-screen bg-poh-bg-primary p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-poh-text-primary">Proof of Humanity Analytics</h1>
            <p className="text-poh-text-secondary">Real-time dashboard and historical trends</p>
          </div>
        </div>

        {/* Chain Selector */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <ChainSelector 
            selectedChain={selectedChain}
            onChainChange={setSelectedChain}
          />
        </div>
      </div>

      {/* Chain Info Banner */}
      <div className="bg-gradient-to-r from-poh-orange/10 to-poh-pink/10 border border-poh-orange/20 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-lg font-semibold text-poh-text-primary">
              Viewing {chainConfig.name} Data
            </h3>
            <p className="text-sm text-poh-text-secondary">
              Analytics from the {chainConfig.name} subgraph
            </p>
          </div>
        </div>
      </div>

      {/* Global Stats Grid */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-poh-text-primary flex items-center gap-2">
          <Globe className="w-5 h-5 text-poh-orange" />
          Global Network State
          <span className="text-sm font-normal text-poh-text-secondary ml-2">
            ({chainConfig.name})
          </span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Current Verified" 
            value={stats ? (Number(stats.verifiedHumanProfiles) - (expiredCount || 0)) : 0} 
            loading={globalLoading || expiredLoading}
            variant="green"
            description="Active (Included)"
          />
          <StatCard 
            title="In Queue" 
            value={stats?.registrationsPending || 0} 
            loading={globalLoading}
            variant="purple"
            description="Vouching stage"
          />
          <StatCard 
            title="Ready for Challenge" 
            value={stats?.registrationsFunded || 0} 
            loading={globalLoading}
            variant="blue"
            description="Resolving stage"
          />
          <StatCard 
            title="Active Disputes" 
            value={stats?.registrationsChallenged || 0} 
            loading={globalLoading}
            variant="yellow"
            description="Currently challenged"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
           <StatCard 
            title="Total Rejected" 
            value={stats?.registrationsRejected || 0} 
            loading={globalLoading}
            variant="red"
            description="Cumulative rejected"
          />
          <StatCard 
            title="Total Submissions" 
            value={stats?.registrationsSubmitted || 0} 
            loading={globalLoading}
            variant="orange"
            description="All-time submissions"
          />
           <StatCard 
            title="Total Renewals" 
            value={stats?.renewalsSubmitted || 0} 
            loading={globalLoading}
            variant="blue"
            description="All-time renewals"
          />
           <StatCard 
            title="Transferred In" 
            value={stats?.registrationsBridged || 0} 
            loading={globalLoading}
            variant="green"
            description="Bridged in (Included)"
          />
           <StatCard 
            title="Transferred Out" 
            value={stats?.registrationsTransferredOut || 0} 
            loading={globalLoading}
            variant="gray"
            description="Bridged out"
          />
           <StatCard 
            title="Withdrawn" 
            value={stats?.registrationsWithdrawn || 0} 
            loading={globalLoading}
            variant="gray"
            description="Withdrawn submissions"
          />
           <StatCard 
            title="Expired" 
            value={expiredCount || 0} 
            loading={expiredLoading}
            variant="black"
            description="Expired profiles"
          />
           {selectedChain === 'gnosis' && (
             <StatCard 
              title="Airdrop Claims" 
              value={stats?.airdropClaims || 0} 
              loading={globalLoading}
              variant="orange"
              description="Total claimed"
            />
           )}
        </div>
      </section>

      {/* Period Analysis */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-semibold text-poh-text-primary flex items-center gap-2">
            <Activity className="w-5 h-5 text-poh-pink" />
            Period Analysis 
            <span className="text-sm font-normal text-poh-text-secondary ml-2">
              ({dateRange.start?.toLocaleDateString()} - {dateRange.end?.toLocaleDateString()})
            </span>
          </h2>
          <DateRangePicker 
            startDate={dateRange.start} 
            endDate={dateRange.end} 
            onRangeChange={(start, end) => setDateRange({ start, end })}
          />
        </div>

        {/* Period Aggregates */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <StatCard 
            title="Verifications Issued" 
            value={periodStats?.verifiedHumanProfiles || 0} 
            loading={rangeLoading}
            variant="green"
            description="New verifications"
          />
          <StatCard 
            title="New Submissions" 
            value={periodStats?.registrationsSubmitted || 0} 
            loading={rangeLoading}
            variant="orange"
            description="New submissions"
          />
          <StatCard 
            title="Renewals" 
            value={periodStats?.renewalsSubmitted || 0} 
            loading={rangeLoading}
            variant="blue"
            description="New renewals"
          />
           <StatCard 
            title="Transferred In" 
            value={periodStats?.registrationsBridged || 0} 
            loading={rangeLoading}
            variant="green"
            description="Bridged in"
          />
          <StatCard 
            title="Disputes Created" 
            value={periodStats?.registrationsChallenged || 0} 
            loading={rangeLoading}
            variant="yellow"
            description="New disputes"
          />
          <StatCard 
            title="Rejections" 
            value={periodStats?.registrationsRejected || 0} 
            loading={rangeLoading}
            variant="red"
            description="New rejections"
          />
          <StatCard 
            title="Withdrawn" 
            value={periodStats?.registrationsWithdrawn || 0} 
            loading={rangeLoading}
            variant="gray"
            description="Withdrawn"
          />
          {selectedChain === 'gnosis' && (
            <StatCard 
              title="Airdrop Claims" 
              value={periodStats?.airdropClaims || 0} 
              loading={rangeLoading}
              variant="orange"
              description="Claims in period"
            />
          )}
        </div>
      </section>
    </main>
  );
}
