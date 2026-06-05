/**
 * alertDispatch — send SENTINEL-Φ alerts via AWS SES (email) and SNS (SMS).
 *
 * SAFETY: dry-run by DEFAULT. Real sends happen ONLY when the environment
 * variable ALERTS_LIVE === 'true' AND valid AWS credentials are present.
 * In dry-run mode the intended sends are returned/logged but nothing is sent.
 *
 * The AWS SDK is imported dynamically so the build never depends on it and the
 * route degrades gracefully if the package or credentials are absent.
 *
 * Subscriptions live in MongoDB: db `sentinel`, collection `subscribers`
 *   { channel: 'email'|'sms', address, virus: '*'|id, minTier, createdAt, verified }
 */
import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const SES_SENDER = process.env.SES_SENDER || 'alerts@infectonet.org';
const LIVE = process.env.ALERTS_LIVE === 'true';

const TIER_RANK: Record<string, number> = { NONE: 0, WATCH: 1, ADVISORY: 2, WARNING: 3 };

let _client: MongoClient | null = null;
async function getClient(): Promise<MongoClient | null> {
  if (_client) return _client;
  try {
    const c = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 4000, family: 4 });
    await c.connect();
    _client = c;
    return c;
  } catch { return null; }
}

export interface Subscriber {
  channel: 'email' | 'sms';
  address: string;
  virus: string;        // '*' = all
  minTier: 'WATCH' | 'ADVISORY' | 'WARNING';
  createdAt: string;
  verified?: boolean;
}

export async function addSubscriber(s: Omit<Subscriber, 'createdAt'>): Promise<boolean> {
  const client = await getClient();
  if (!client) return false;
  const col = client.db('sentinel').collection<Subscriber>('subscribers');
  await col.updateOne(
    { channel: s.channel, address: s.address, virus: s.virus },
    { $set: { ...s, createdAt: new Date().toISOString() } },
    { upsert: true }
  );
  return true;
}

interface DispatchResult {
  live: boolean;
  matched: number;
  sent: { channel: string; address: string; status: string }[];
  note: string;
}

/**
 * Dispatch an alert to all subscribers whose filter matches (virus + minTier).
 * Returns a report. In dry-run mode, status is 'dry-run' and nothing is sent.
 */
export async function dispatchAlert(opts: {
  virus: string; tier: string; headline: string; body: string;
}): Promise<DispatchResult> {
  const { virus, tier, headline, body } = opts;
  const client = await getClient();
  if (!client) return { live: false, matched: 0, sent: [], note: 'DB unavailable' };

  const col = client.db('sentinel').collection<Subscriber>('subscribers');
  const subs = await col.find({
    $or: [{ virus }, { virus: '*' }],
  }).toArray();

  const rank = TIER_RANK[tier] ?? 0;
  const matched = subs.filter(s => rank >= (TIER_RANK[s.minTier] ?? 1));

  // SMS reserved for WARNING tier only (anti-alert-fatigue)
  const targets = matched.filter(s => s.channel === 'email' || tier === 'WARNING');

  if (!LIVE) {
    return {
      live: false, matched: targets.length,
      sent: targets.map(s => ({ channel: s.channel, address: maskAddr(s.address), status: 'dry-run' })),
      note: 'DRY-RUN — set ALERTS_LIVE=true + AWS credentials to send for real.',
    };
  }

  // ── LIVE send (only reached when ALERTS_LIVE=true) ──────────────────────────
  const sent: DispatchResult['sent'] = [];
  try {
    const { SESv2Client, SendEmailCommand } = await import('@aws-sdk/client-sesv2');
    const { SNSClient, PublishCommand } = await import('@aws-sdk/client-sns');
    const ses = new SESv2Client({ region: AWS_REGION });
    const sns = new SNSClient({ region: AWS_REGION });

    for (const s of targets) {
      try {
        if (s.channel === 'email') {
          await ses.send(new SendEmailCommand({
            FromEmailAddress: SES_SENDER,
            Destination: { ToAddresses: [s.address] },
            Content: { Simple: {
              Subject: { Data: `[InfectoNET ${tier}] ${headline}` },
              Body: { Text: { Data: body } },
            } },
          }));
        } else {
          await sns.send(new PublishCommand({
            PhoneNumber: s.address,
            Message: `InfectoNET ${tier}: ${headline}`,
          }));
        }
        sent.push({ channel: s.channel, address: maskAddr(s.address), status: 'sent' });
      } catch (e) {
        sent.push({ channel: s.channel, address: maskAddr(s.address), status: `error: ${(e as Error).message.slice(0,60)}` });
      }
    }
  } catch {
    return { live: false, matched: targets.length, sent: [],
      note: 'AWS SDK not installed — run: npm i @aws-sdk/client-sesv2 @aws-sdk/client-sns' };
  }

  return { live: true, matched: targets.length, sent, note: 'Live dispatch complete.' };
}

function maskAddr(a: string): string {
  if (a.includes('@')) { const [u, d] = a.split('@'); return `${u.slice(0, 2)}***@${d}`; }
  return a.slice(0, 3) + '***' + a.slice(-2);
}
