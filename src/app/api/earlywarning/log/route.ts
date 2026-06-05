/**
 * GET /api/earlywarning/log?virus=<id>&limit=<n>
 *
 * Returns the tamper-evident SENTINEL-Φ prediction log and verifies the
 * hash chain. `verified: true` proves no record has been altered since it
 * was written; `head` is the current chain head (Merkle-root analogue).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getLog } from '@/lib/predictionLog';

export async function GET(req: NextRequest) {
  const virus = req.nextUrl.searchParams.get('virus') ?? undefined;
  const limit = Math.min(500, parseInt(req.nextUrl.searchParams.get('limit') ?? '100', 10));

  const log = await getLog(virus, limit);
  if (!log) return NextResponse.json({ error: 'Prediction log unavailable' }, { status: 503 });

  return NextResponse.json({
    algorithm: 'SENTINEL-Φ prediction log',
    chain: 'SHA-256 hash-chain (each record = sha256(payloadHash ‖ prevHash))',
    verified: log.verified,
    brokenAtSeq: log.brokenAt,
    head: log.head,
    totalRecords: log.count,
    shown: log.records.length,
    records: log.records,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
