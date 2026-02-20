import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const METRIC_NAME = 'seer_claim_render';
const DAY_SECONDS = 86_400;

const getBaseUrl = () =>
  process.env.POH_WEB_ANALYTICS_BASE_URL ||
  "https://deploy-preview-345--proof-of-humanity-v2.netlify.app";

const toUtcDayStart = (unixSeconds: number) =>
  Math.floor(unixSeconds / DAY_SECONDS) * DAY_SECONDS;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope');
  const day = searchParams.get('day');

  const baseUrl = getBaseUrl();
  // baseUrl is guaranteed to be defined due to the fallback default
  const target = new URL(`${baseUrl}/.netlify/functions/seer-claim-metrics`);

  if (scope === 'global') {
    target.searchParams.set('scope', 'global');
  } else if (scope === 'day') {
    const dayNum = Number(day);
    if (!day || !Number.isFinite(dayNum) || dayNum < 0) {
      return NextResponse.json(
        { error: 'Invalid day query param' },
        { status: 400 }
      );
    }

    const dayStart = toUtcDayStart(dayNum);
    target.searchParams.set('scope', 'day');
    target.searchParams.set('day', String(dayStart));
  } else {
    return NextResponse.json(
      { error: 'scope must be either global or day' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(target.toString(), { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`seer-claim-metrics upstream status ${response.status}`);
    }

    const data = await response.json();
    if (scope === 'day') {
      const dayStart = toUtcDayStart(Number(day));
      return NextResponse.json({
        metric: METRIC_NAME,
        scope: 'day',
        day: dayStart,
        uniqueEstimate: Math.round(
          Number(
            data.uniqueEstimate ??
            data.totalUniqueEstimate ??
            0
          )
        ),
      });
    }

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

    if (scope === 'day') {
      return NextResponse.json({
        metric: METRIC_NAME,
        scope: 'day',
        day: day ? toUtcDayStart(Number.parseInt(day, 10)) : 0,
        uniqueEstimate: 0,
      });
    }

    return NextResponse.json({
      metric: METRIC_NAME,
      scope: 'day',
      day: day ? toUtcDayStart(Number.parseInt(day, 10)) : 0,
      uniqueEstimate: 0,
    });
  }
}
