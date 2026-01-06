import { GraphQLClient } from 'graphql-request';

export type ChainId = 'ethereum' | 'gnosis';

export interface ChainConfig {
  id: ChainId;
  name: string;
  subgraphUrl: string;
}

// POH v2 Subgraph URLs
const CHAIN_CONFIGS: Record<ChainId, ChainConfig> = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    subgraphUrl: process.env.NEXT_PUBLIC_ETHEREUM_SUBGRAPH_URL || 
      'https://api.studio.thegraph.com/query/90401/poh-origin-mainnet/version/latest',
  },
  gnosis: {
    id: 'gnosis',
    name: 'Gnosis Chain',
    subgraphUrl: process.env.NEXT_PUBLIC_GNOSIS_SUBGRAPH_URL || 
      'https://api.studio.thegraph.com/query/90401/poh-origin-gnosis/version/latest',
  },
};

export const CHAINS: ChainConfig[] = Object.values(CHAIN_CONFIGS);

export function getGraphQLClient(chainId: ChainId): GraphQLClient {
  const config = CHAIN_CONFIGS[chainId];
  return new GraphQLClient(config.subgraphUrl);
}

export function getChainConfig(chainId: ChainId): ChainConfig {
  return CHAIN_CONFIGS[chainId];
}
