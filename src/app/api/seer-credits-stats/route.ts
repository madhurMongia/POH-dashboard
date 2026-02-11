import { NextResponse } from 'next/server';
import { fetchSeerCreditsStats } from '@/lib/seerCredits';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await fetchSeerCreditsStats();
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Failed to fetch Seer Credits stats:', error);
    return NextResponse.json({
      totalTradesUsingCredits: 0,
      uniqueWalletsUsingCredits: 0,
    });
  }
}
