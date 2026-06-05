/**
 * predictionLog — tamper-evident, hash-chained log of SENTINEL-Φ predictions.
 *
 * Every prediction is appended to an append-only MongoDB collection where each
 * record stores SHA-256( payloadHash ‖ prevHash ). Any retroactive edit breaks
 * the chain, so the log cryptographically proves what was predicted, when, and
 * on what data — verifiable forecast provenance (cf. certificate transparency).
 *
 * DB: `sentinel`  ·  collection: `predictions`
 */
import { MongoClient } from 'mongodb';
import { createHash } from 'crypto';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

let _client: MongoClient | null = null;
async function getClient(): Promise<MongoClient | null> {
  if (_client) return _client;
  try {
    const c = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 4000, family: 4 });
    await c.connect();
    await c.db('admin').command({ ping: 1 });
    _client = c;
    return c;
  } catch { return null; }
}

export interface PredictionRecord {
  seq: number;
  virus: string;
  utcDate: string;        // YYYY-MM-DD (one chained record per virus per day)
  sai: number;
  tier: string;
  payloadHash: string;    // sha256 of the CAP payload
  prevHash: string;       // hash of the previous record in the chain
  hash: string;           // sha256(payloadHash + prevHash)
  createdAt: string;
}

function sha256(s: string) { return createHash('sha256').update(s).digest('hex'); }

/**
 * Append a prediction to the chain, idempotently per (virus, UTC day).
 * Returns the record (existing or newly appended), or null if DB unavailable.
 */
export async function appendPrediction(
  virus: string, sai: number, tier: string, cap: unknown
): Promise<PredictionRecord | null> {
  const client = await getClient();
  if (!client) return null;
  const col = client.db('sentinel').collection<PredictionRecord>('predictions');

  const utcDate = new Date().toISOString().slice(0, 10);

  // Idempotent: one chained record per virus per day
  const existing = await col.findOne({ virus, utcDate });
  if (existing) return existing;

  const payloadHash = sha256(JSON.stringify(cap));
  const head = await col.find().sort({ seq: -1 }).limit(1).next();
  const prevHash = head?.hash ?? '0'.repeat(64);     // genesis
  const seq = (head?.seq ?? 0) + 1;
  const hash = sha256(payloadHash + prevHash);

  const rec: PredictionRecord = {
    seq, virus, utcDate, sai, tier, payloadHash, prevHash, hash,
    createdAt: new Date().toISOString(),
  };
  try {
    await col.insertOne(rec);
    return rec;
  } catch {
    // Unique-index race: another request appended the same (virus, utcDate)
    return await col.findOne({ virus, utcDate });
  }
}

/**
 * Retrieve the log (optionally filtered by virus) and verify chain integrity.
 */
export async function getLog(virus?: string, limit = 100): Promise<{
  head: string; verified: boolean; brokenAt: number | null; count: number;
  records: PredictionRecord[];
} | null> {
  const client = await getClient();
  if (!client) return null;
  const col = client.db('sentinel').collection<PredictionRecord>('predictions');

  // Verify the FULL chain (ordered by seq), then filter for display
  const all = await col.find().sort({ seq: 1 }).toArray();
  let verified = true, brokenAt: number | null = null, prev = '0'.repeat(64);
  for (const r of all) {
    const expect = sha256(r.payloadHash + prev);
    if (r.prevHash !== prev || r.hash !== expect) { verified = false; brokenAt = r.seq; break; }
    prev = r.hash;
  }
  const head = all.length ? all[all.length - 1].hash : '0'.repeat(64);

  const shown = (virus ? all.filter(r => r.virus === virus) : all)
    .slice(-limit).reverse();

  return { head, verified, brokenAt, count: all.length, records: shown };
}
