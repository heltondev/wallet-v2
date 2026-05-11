import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CostExplorerClient, GetCostAndUsageCommand } from '@aws-sdk/client-cost-explorer';
import { extractAuth, isOwner } from '../shared/auth';
import { queryItems } from '../shared/dynamo';
import { ok, forbidden, serverError } from '../shared/response';

const costExplorer = new CostExplorerClient({});

function getDateRange(): { start: string; end: string } {
  const now = new Date();
  const end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const start = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;

  return { start, end };
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuth(event);
    if (!auth) return serverError(event, 'Unable to extract auth context');
    if (!isOwner(auth)) return forbidden(event, 'Owner access required');

    const { start, end } = getDateRange();

    const [awsCosts, aiUsage] = await Promise.all([
      costExplorer.send(new GetCostAndUsageCommand({
        TimePeriod: { Start: start, End: end },
        Granularity: 'MONTHLY',
        Metrics: ['UnblendedCost'],
        GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }],
      })),
      queryItems('GLOBAL', 'AI_USAGE#'),
    ]);

    const awsBreakdown = (awsCosts.ResultsByTime ?? []).map((period) => ({
      period: period.TimePeriod,
      services: (period.Groups ?? []).map((group) => ({
        service: group.Keys?.[0] ?? 'Unknown',
        cost: group.Metrics?.UnblendedCost?.Amount ?? '0',
        unit: group.Metrics?.UnblendedCost?.Unit ?? 'USD',
      })),
    }));

    return ok(event, {
      aws: awsBreakdown,
      ai: aiUsage,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return serverError(event, message);
  }
}
