/**
 * POST /api/earlywarning/subscribe
 *   body: { channel: 'email'|'sms', address, virus?: '*'|id, minTier?: 'WATCH'|'ADVISORY'|'WARNING' }
 *
 * Registers a subscriber for SENTINEL-Φ alerts. Storage only — actual delivery
 * is dry-run by default (see lib/alertDispatch.ts). Basic validation; no PII
 * beyond the contact address the user voluntarily provides.
 */
import { NextRequest, NextResponse } from 'next/server';
import { addSubscriber } from '@/lib/alertDispatch';
import { VIRUS_MAP } from '@/lib/viruses';

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_RX  = /^\+[1-9]\d{6,14}$/;   // international phone format

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const channel = String(body.channel ?? '');
  const address = String(body.address ?? '').trim();
  const virus   = String(body.virus ?? '*');
  const minTier = String(body.minTier ?? 'ADVISORY');

  if (channel !== 'email' && channel !== 'sms')
    return NextResponse.json({ error: 'channel must be "email" or "sms"' }, { status: 400 });
  if (channel === 'email' && !EMAIL_RX.test(address))
    return NextResponse.json({ error: 'invalid email address' }, { status: 400 });
  if (channel === 'sms' && !E164_RX.test(address))
    return NextResponse.json({ error: 'invalid phone number (use E.164, e.g. +5511999999999)' }, { status: 400 });
  if (virus !== '*' && !VIRUS_MAP.has(virus))
    return NextResponse.json({ error: `unknown virus: ${virus}` }, { status: 400 });
  if (!['WATCH', 'ADVISORY', 'WARNING'].includes(minTier))
    return NextResponse.json({ error: 'minTier must be WATCH, ADVISORY or WARNING' }, { status: 400 });

  const ok = await addSubscriber({
    channel: channel as 'email' | 'sms',
    address,
    virus,
    minTier: minTier as 'WATCH' | 'ADVISORY' | 'WARNING',
    verified: false,
  });
  if (!ok) return NextResponse.json({ error: 'subscription store unavailable' }, { status: 503 });

  return NextResponse.json({
    ok: true,
    message: `Subscribed ${channel} for ${virus === '*' ? 'all pathogens' : virus} at ${minTier}+ tier.`,
    note: 'Delivery is in dry-run mode until the platform enables live alerting.',
  });
}
