/**
 * GET /api/earlywarning/pubkey
 *
 * Returns the published Ed25519 public key used to sign SENTINEL-Φ CAP alerts
 * and the prediction-log chain head. Anyone can use it to verify that an alert
 * or chain head is authentic and untampered.
 *
 * Verification (Node):
 *   crypto.verify(null, Buffer.from(JSON.stringify(cap)), publicKey,
 *                 Buffer.from(signature.value, 'base64'))
 */
import { NextResponse } from 'next/server';
import { SENTINEL_PUBLIC_KEY_PEM, KEY_ID, signingEnabled } from '@/lib/signing';

export async function GET() {
  return NextResponse.json({
    algorithm: 'Ed25519',
    keyId: KEY_ID,
    publicKeyPem: SENTINEL_PUBLIC_KEY_PEM,
    signingActive: signingEnabled(),
    usage: 'Verify the base64 `signature.value` over the exact JSON.stringify(cap) bytes '
         + '(for alerts) or over the chain `head` string (for the prediction log).',
  }, { headers: { 'Cache-Control': 'public, s-maxage=86400' } });
}
