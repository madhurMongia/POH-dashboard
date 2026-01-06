'use client';

import { ChainId, CHAINS, getChainConfig } from '@/lib/graphql';
import { cn } from '@/lib/utils';

interface ChainSelectorProps {
  selectedChain: ChainId;
  onChainChange: (chain: ChainId) => void;
}

export function ChainSelector({ selectedChain, onChainChange }: ChainSelectorProps) {
  return (
    <div className="flex bg-poh-bg-secondary border border-poh-stroke p-1 rounded-lg gap-1">
      {CHAINS.map((chain) => (
        <button
          key={chain.id}
          onClick={() => onChainChange(chain.id)}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
            selectedChain === chain.id
              ? "bg-poh-orange text-white shadow-md"
              : "text-poh-text-secondary hover:text-poh-text-primary hover:bg-poh-bg-primary"
          )}
        >
          <span className="text-lg">{chain.icon}</span>
          <span>{chain.name}</span>
        </button>
      ))}
    </div>
  );
}
