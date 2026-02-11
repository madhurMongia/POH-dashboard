// LEGACY: kept for fallback/reference only.
// Active dashboard path reads Seer Credits metrics from subgraph fields.
import {
  createPublicClient,
  http,
  isAddressEqual,
  parseAbiItem,
  toFunctionSelector,
  type Address,
  type Hex,
} from 'viem';
import { gnosis } from 'viem/chains';
import { gql } from 'graphql-request';
import { getStore } from '@netlify/blobs';
import { getGraphQLClient } from './graphql';

const SEER_CREDITS_ADDRESS = '0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF' as Address;
const CREDITS_MANAGER_ADDRESS = '0xB29D0C9875D93483891c0645fdC13D665a4d2D70' as Address;
const CREDITS_MANAGER_DEPLOYMENT_BLOCK = BigInt(42_439_736);

const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 amount)');
const EXECUTE_SELECTOR = toFunctionSelector('execute(address,bytes,uint256,address)');

const LOG_BLOCK_CHUNK_SIZE = BigInt(75_000);
const TX_LOOKUP_BATCH_SIZE = 50;
const POH_QUERY_BATCH_SIZE = 1000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const BLOBS_STORE_NAME = 'seer-credits-stats';
const BLOBS_CACHE_KEY = 'gnosis-poh-active';

export interface SeerCreditsStats {
  totalTradesUsingCredits: number;
  uniqueWalletsUsingCredits: number;
}

interface CachedSeerCreditsStats {
  updatedAt: number;
  stats: SeerCreditsStats;
}

const ACTIVE_POH_REGISTRATIONS_QUERY = gql`
  query ActivePohRegistrations($ids: [Bytes!], $now: BigInt!) {
    registrations(
      where: {
        id_in: $ids
        expirationTime_gt: $now
      }
    ) {
      id
    }
  }
`;

function getPublicClient(rpcUrl: string) {
  return createPublicClient({
    chain: gnosis,
    transport: http(rpcUrl, {
      batch: false,
      fetchOptions: {
        cache: 'no-store',
      },
    }),
  });
}

function isExecuteTx(tx: { to?: Address | null; input: Hex } | null | undefined): boolean {
  if (!tx?.to) return false;
  return isAddressEqual(tx.to, CREDITS_MANAGER_ADDRESS) && tx.input.toLowerCase().startsWith(EXECUTE_SELECTOR);
}

async function fetchActivePohWallets(addresses: string[]): Promise<Set<string>> {
  if (!addresses.length) return new Set<string>();

  const now = Math.floor(Date.now() / 1000);
  const activeWallets = new Set<string>();
  const ethereumClient = getGraphQLClient('ethereum');
  const gnosisClient = getGraphQLClient('gnosis');

  for (let i = 0; i < addresses.length; i += POH_QUERY_BATCH_SIZE) {
    const ids = addresses.slice(i, i + POH_QUERY_BATCH_SIZE);
    const [ethereumData, gnosisData] = await Promise.all([
      ethereumClient.request<{ registrations: { id: string }[] }>(ACTIVE_POH_REGISTRATIONS_QUERY, {
        ids,
        now,
      }),
      gnosisClient.request<{ registrations: { id: string }[] }>(ACTIVE_POH_REGISTRATIONS_QUERY, {
        ids,
        now,
      }),
    ]);

    for (const registration of ethereumData.registrations || []) {
      activeWallets.add(registration.id.toLowerCase());
    }
    for (const registration of gnosisData.registrations || []) {
      activeWallets.add(registration.id.toLowerCase());
    }
  }

  return activeWallets;
}

async function getCachedSeerCreditsStats(): Promise<CachedSeerCreditsStats | null> {
  try {
    const store = getStore(BLOBS_STORE_NAME);
    return (await store.get(BLOBS_CACHE_KEY, { type: 'json' })) as CachedSeerCreditsStats | null;
  } catch (error) {
    console.error('Failed to read Seer Credits stats cache from Netlify Blobs:', error);
    return null;
  }
}

async function setCachedSeerCreditsStats(stats: SeerCreditsStats): Promise<void> {
  try {
    const store = getStore(BLOBS_STORE_NAME);
    await store.setJSON(BLOBS_CACHE_KEY, {
      updatedAt: Date.now(),
      stats,
    });
  } catch (error) {
    console.error('Failed to write Seer Credits stats cache to Netlify Blobs:', error);
  }
}

async function computeSeerCreditsStats(
  rpcUrl = process.env.NEXT_PUBLIC_GNOSIS_RPC_URL || 'https://rpc.gnosischain.com'
): Promise<SeerCreditsStats> {
  const client = getPublicClient(rpcUrl);
  const latestBlock = await client.getBlockNumber();

  const walletTradeCount = new Map<string, number>();

  for (
    let fromBlock = CREDITS_MANAGER_DEPLOYMENT_BLOCK;
    fromBlock <= latestBlock;
    fromBlock += LOG_BLOCK_CHUNK_SIZE
  ) {
    const chunkEnd = fromBlock + LOG_BLOCK_CHUNK_SIZE - BigInt(1);
    const toBlock = chunkEnd < latestBlock ? chunkEnd : latestBlock;
    const logs = await client.getLogs({
      address: SEER_CREDITS_ADDRESS,
      event: TRANSFER_EVENT,
      args: {
        to: '0x0000000000000000000000000000000000000000',
      },
      fromBlock,
      toBlock,
    });

    if (!logs.length) continue;

    const txHashes = Array.from(new Set(logs.map((log) => log.transactionHash.toLowerCase())));
    const txMap = new Map<string, Awaited<ReturnType<typeof client.getTransaction>> | null>();

    for (let i = 0; i < txHashes.length; i += TX_LOOKUP_BATCH_SIZE) {
      const hashBatch = txHashes.slice(i, i + TX_LOOKUP_BATCH_SIZE);
      const txBatch = await Promise.all(
        hashBatch.map(async (hash) => {
          try {
            return await client.getTransaction({ hash: hash as Hex });
          } catch {
            return null;
          }
        })
      );

      hashBatch.forEach((hash, index) => {
        txMap.set(hash, txBatch[index]);
      });
    }

    for (const log of logs) {
      const tx = txMap.get(log.transactionHash.toLowerCase());
      if (!isExecuteTx(tx)) continue;

      const userAddress = log.args.from?.toLowerCase();
      if (!userAddress) continue;
      walletTradeCount.set(userAddress, (walletTradeCount.get(userAddress) || 0) + 1);
    }
  }

  const activePohWallets = await fetchActivePohWallets(Array.from(walletTradeCount.keys()));
  let totalTradesUsingCredits = 0;
  let uniqueWalletsUsingCredits = 0;

  for (const [wallet, trades] of walletTradeCount) {
    if (!activePohWallets.has(wallet)) continue;
    totalTradesUsingCredits += trades;
    uniqueWalletsUsingCredits += 1;
  }

  return {
    totalTradesUsingCredits,
    uniqueWalletsUsingCredits,
  };
}

export async function fetchSeerCreditsStats(
  rpcUrl = process.env.NEXT_PUBLIC_GNOSIS_RPC_URL || 'https://rpc.gnosischain.com'
): Promise<SeerCreditsStats> {
  const now = Date.now();
  const cached = await getCachedSeerCreditsStats();
  if (
    cached &&
    typeof cached.updatedAt === 'number' &&
    typeof cached.stats?.totalTradesUsingCredits === 'number' &&
    typeof cached.stats?.uniqueWalletsUsingCredits === 'number' &&
    now - cached.updatedAt < CACHE_TTL_MS
  ) {
    return cached.stats;
  }

  const stats = await computeSeerCreditsStats(rpcUrl);
  await setCachedSeerCreditsStats(stats);
  return stats;
}
