import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const METRIC_NAME = 'seer_claim_render';

const getBaseUrl = () =>
  process.env.POH_WEB_ANALYTICS_BASE_URL ||
  "https://deploy-preview-345--proof-of-humanity-v2.netlify.app";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const baseUrl = getBaseUrl();
  // baseUrl is guaranteed to be defined due to the fallback default
  const target = new URL(`${baseUrl}/.netlify/functions/seer-claim-metrics`);

  if (scope === 'global') target.searchParams.set('scope', 'global');
  if (from) target.searchParams.set('from', from);
  if (to) target.searchParams.set('to', to);

  try {
    const response = await fetch(target.toString(), { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`seer-claim-metrics upstream status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch seer claim metrics:', error);

    // Fallback response in case of error
    if (scope === 'global') {
      return NextResponse.json({
        metric: METRIC_NAME,
        scope: 'global',
        uniqueEstimate: 0
      });
    }

    return NextResponse.json({
      metric: METRIC_NAME,
      from: from ? Number.parseInt(from, 10) : 0,
      to: to ? Number.parseInt(to, 10) : 0,
      totalUniqueEstimate: 0,
    });
  }
}
