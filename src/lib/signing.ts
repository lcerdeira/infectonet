/**
 * signing — Ed25519 digital signatures for SENTINEL-Φ CAP alerts and the
 * prediction-log chain head, giving verifiable forecast provenance.
 *
 * The PUBLIC key is published (here + at /api/earlywarning/pubkey) so anyone
 * can verify that an alert or chain head genuinely came from InfectoNET and
 * was not tampered with. The PRIVATE key is supplied only via the
 * ED25519_PRIVATE_KEY environment variable (set in .env.local on the server,
 * never committed). If absent, signing degrades gracefully to null.
 */
import { createPrivateKey, createPublicKey, sign as nodeSign, verify as nodeVerify } from 'crypto';

// Published public key (PKCS#8 SubjectPublicKeyInfo, PEM). Safe to commit.
export const SENTINEL_PUBLIC_KEY_PEM =
`-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAV6Unx2iZngX4nS46d+jIBQMpEXAupR0UsJ72Qf80OI8=
-----END PUBLIC KEY-----`;

export const KEY_ID = 'infectonet-sentinel-ed25519-2026';

function loadPrivateKey() {
  const raw = process.env.ED25519_PRIVATE_KEY;
  if (!raw) return null;
  // Allow the env var to use literal "\n" for newlines
  const pem = raw.includes('-----BEGIN') ? raw.replace(/\\n/g, '\n') : raw;
  try {
    return createPrivateKey({ key: pem, format: 'pem' });
  } catch {
    return null;
  }
}

/** Sign a string payload with Ed25519. Returns base64 signature, or null. */
export function signPayload(payload: string): string | null {
  const key = loadPrivateKey();
  if (!key) return null;
  try {
    // Ed25519: algorithm must be null in Node's sign()
    return nodeSign(null, Buffer.from(payload, 'utf8'), key).toString('base64');
  } catch {
    return null;
  }
}

/** Verify an Ed25519 signature (base64) against the published public key. */
export function verifyPayload(payload: string, signatureB64: string): boolean {
  try {
    const pub = createPublicKey({ key: SENTINEL_PUBLIC_KEY_PEM, format: 'pem' });
    return nodeVerify(null, Buffer.from(payload, 'utf8'), pub, Buffer.from(signatureB64, 'base64'));
  } catch {
    return false;
  }
}

export function signingEnabled(): boolean {
  return loadPrivateKey() !== null;
}
