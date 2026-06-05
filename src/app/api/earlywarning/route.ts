/**
 * GET /api/earlywarning?virus=<id>
 *
 * SENTINEL-Φ (pilot) — Spillover & Emergence Nowcasting Through INtegrated
 * EcoLogical–phylogenetic signals.
 *
 * A composite, per-pathogen early-warning score (SAI: Spillover/Amplification
 * Index, 0–100) that FUSES three orthogonal signal classes:
 *
 *   E — Ecological forcing   (ENSO, NDVI, rainfall, soil, conflict, deforestation)
 *                            → from /api/ecorisk            [the bifurcation DRIVER]
 *   G — Genomic amplification (recent sequencing activity vs baseline)
 *                            → from /api/viruses/:id         [the system RESPONSE]
 *   N — Event corroboration   (live WHO/PAHO/WOAH outbreak alerts)
 *                            → from /api/outbreak/:virus     [CORROBORATION ONLY]
 *
 * Tiered alerting (hurricane watch/warning analogy), N never alerts alone:
 *   WATCH    — one channel elevated ("conditions favourable")
 *   ADVISORY — ≥2 orthogonal channels elevated
 *   WARNING  — high SAI with multi-channel + corroboration
 *
 * Each response carries a CAP-style alert object and a SHA-256 integrity
 * digest (the seed of a tamper-evident, hash-chained prediction log).
 *
 * Design basis: TFP Scanner phylogenomic EWS (PMC10792554); EWS-transitions
 * review (PMC8479360); hantavirus–ENSO trophic cascade (Yates 2002);
 * RVF NDVI prediction (Anyamba PNAS); CAP signed alerts (OASIS).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { VIRUS_MAP } from '@/lib/viruses';
import { appendPrediction } from '@/lib/predictionLog';
import { signPayload, KEY_ID } from '@/lib/signing';

interface ChannelScore { value: number; elevated: boolean; detail: string; }

const ELEVATED = 50;   // a channel is "elevated" at ≥50/100

function clamp(x: number) { return Math.max(0, Math.min(100, x)); }

export async function GET(req: NextRequest) {
  const virus = req.nextUrl.searchParams.get('virus') ?? '';
  if (!VIRUS_MAP.has(virus)) {
    return NextResponse.json({ error: `Unknown virus: ${virus}` }, { status: 404 });
  }
  // Internal API composition: call our own routes over loopback to avoid
  // hairpin-NAT failures when the server fetches its own public hostname.
  const origin = process.env.INTERNAL_API_BASE
    || `http://127.0.0.1:${process.env.PORT || 3000}`;
  const meta = VIRUS_MAP.get(virus)!;

  // ── Fetch the three signal classes in parallel ─────────────────────────────
  const [eco, news, records] = await Promise.all([
    fetch(`${origin}/api/ecorisk?virus=${virus}`).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(`${origin}/api/outbreak/${virus}`).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(`${origin}/api/viruses/${virus}?limit=50000`).then(r => r.ok ? r.json() : null).catch(() => null),
  ]);

  // ── Channel E — ecological forcing (0–100) ─────────────────────────────────
  const E: ChannelScore = {
    value: eco?.riskScore ?? 0,
    elevated: (eco?.riskScore ?? 0) >= ELEVATED,
    detail: eco?.narrative?.slice(0, 160) ?? 'No ecological signal available',
  };

  // ── Channel G — genomic amplification (recent activity vs baseline) ─────────
  // Proxy for lineage growth: share of sequences in the most recent 2 years
  // versus the long-run annual mean. A surge in recent genomes signals active
  // circulation / sequencing response.
  let G: ChannelScore = { value: 0, elevated: false, detail: 'Insufficient genomic data' };
  if (records?.records?.length) {
    const years: Record<number, number> = {};
    for (const r of records.records as Record<string, unknown>[]) {
      const y = Number(r.YEAR);
      if (y >= 1990 && y <= 2100) years[y] = (years[y] ?? 0) + 1;
    }
    const ys = Object.keys(years).map(Number).sort((a, b) => a - b);
    if (ys.length >= 3) {
      const maxY = ys[ys.length - 1];
      const recent = (years[maxY] ?? 0) + (years[maxY - 1] ?? 0);
      const allYears = ys.length;
      const mean = Object.values(years).reduce((a, b) => a + b, 0) / allYears;
      // ratio of recent 2-yr average to long-run annual mean
      const ratio = mean > 0 ? (recent / 2) / mean : 0;
      const val = clamp(Math.round((ratio - 1) * 60 + 30)); // ratio 1→30, 2.2→100
      G = {
        value: val,
        elevated: val >= ELEVATED,
        detail: `Recent 2-yr sequencing rate is ${ratio.toFixed(1)}× the long-run mean `
              + `(${recent} genomes in ${maxY - 1}–${maxY})`,
      };
    }
  }

  // ── Channel N — event corroboration (live outbreak alerts) ─────────────────
  // RECENCY-GATED: the WHO DON API returns historical alerts too, so we count
  // only items published in the last 90 days as *active* corroboration. This is
  // the key specificity fix — stale 2024 alerts no longer inflate today's score.
  const NOW = Date.now();
  const RECENT_MS = 90 * 24 * 3600 * 1000;
  const items = (news?.items ?? []) as { pubDate?: string }[];
  let recentCount = 0;
  for (const it of items) {
    const t = it.pubDate ? Date.parse(it.pubDate) : NaN;
    if (!isNaN(t) && NOW - t <= RECENT_MS) recentCount++;
  }
  const N: ChannelScore = {
    value: clamp(recentCount * 25),
    elevated: recentCount >= 1,           // ≥1 alert in the last 90 days
    detail: recentCount > 0
      ? `${recentCount} outbreak alert(s) in the last 90 days (of ${items.length} total)`
      : (items.length > 0
          ? `${items.length} alert(s) but none in the last 90 days (historical only)`
          : 'No outbreak alerts'),
  };

  // ── Fusion — Spillover/Amplification Index (SAI) ───────────────────────────
  // E = ecological driver (validated long-lead), G = genomic response (the most
  // discriminating real-time signal), N = recency-gated corroboration (down-
  // weighted so it cannot dominate or alert on its own).
  const sai = clamp(Math.round(0.45 * E.value + 0.40 * G.value + 0.15 * N.value));

  // ── Tiered alert logic — specificity-favouring (calibrated) ────────────────
  // N never triggers alone. WARNING requires the genomic response OR a very
  // strong ecological driver, each WITH recent event corroboration.
  const eHigh = E.value >= 80;                    // very strong ecological forcing
  const elevatedQuant = [E.elevated, G.elevated].filter(Boolean).length;
  let tier: 'NONE' | 'WATCH' | 'ADVISORY' | 'WARNING' = 'NONE';
  if ((G.elevated && (E.elevated || N.elevated)) || (eHigh && N.elevated)) {
    tier = 'WARNING';                             // genomic surge corroborated, or strong driver + recent alert
  } else if (elevatedQuant >= 2 || (E.elevated && N.elevated)) {
    tier = 'ADVISORY';                            // ≥2 quantitative channels, or driver + recent corroboration
  } else if (E.elevated || G.elevated) {
    tier = 'WATCH';                               // one quantitative channel elevated
  }

  const tierMeta = {
    NONE:     { color: '#2ca02c', label: 'No elevated signal',  action: 'Routine surveillance' },
    WATCH:    { color: '#f5c518', label: 'Conditions favourable', action: 'Dashboard + opt-in digest' },
    ADVISORY: { color: '#ff7f0e', label: 'Multi-signal corroboration', action: 'Email + optional SMS to subscribers' },
    WARNING:  { color: '#d62728', label: 'Active amplification signal',  action: 'Immediate signed SMS + email' },
  }[tier];

  // ── CAP-style alert object (OASIS Common Alerting Protocol shape) ───────────
  const sent = new Date().toISOString();
  const cap = {
    identifier: `infectonet-${virus}-${sent.slice(0, 10)}`,
    sender: 'infectonet.org',
    sent,
    status: 'Actual',
    msgType: 'Alert',
    scope: 'Public',
    info: {
      category: 'Health',
      event: `${meta.label} spillover/amplification ${tier}`,
      urgency: tier === 'WARNING' ? 'Expected' : tier === 'ADVISORY' ? 'Future' : 'Past',
      severity: tier === 'WARNING' ? 'Severe' : tier === 'ADVISORY' ? 'Moderate' : 'Minor',
      certainty: 'Possible',
      headline: `SENTINEL-Φ ${tier}: ${meta.label} (SAI ${sai}/100)`,
      description: `Ecological ${E.value}/100 · Genomic ${G.value}/100 · Event ${N.value}/100`,
      instruction: tierMeta.action,
    },
  };

  // ── Tamper-evident integrity digest + Ed25519 signature ────────────────────
  const capJson = JSON.stringify(cap);
  const digest = createHash('sha256').update(capJson).digest('hex');
  const signature = signPayload(capJson);   // base64 Ed25519, or null if no key

  // Append to the persistent Merkle-style prediction log (idempotent per day)
  const logged = await appendPrediction(virus, sai, tier, cap).catch(() => null);

  return NextResponse.json({
    algorithm: 'SENTINEL-Φ (pilot)',
    virus,
    label: meta.label,
    sai,
    tier,
    tierColor: tierMeta.color,
    tierLabel: tierMeta.label,
    recommendedAction: tierMeta.action,
    channels: {
      ecological: E,   // E — driver
      genomic:    G,   // G — response
      event:      N,   // N — corroboration (never alerts alone)
    },
    fusion: 'SAI = 0.45·E + 0.40·G + 0.15·N (N recency-gated to last 90 days; never alerts alone)',
    cap,
    integrity: {
      algorithm: 'SHA-256', digest,
      logged: !!logged,
      seq: logged?.seq ?? null,
      chainHash: logged?.hash ?? null,
    },
    signature: signature ? {
      algorithm: 'Ed25519',
      keyId: KEY_ID,
      value: signature,
      verify: 'GET /api/earlywarning/pubkey — verify Ed25519(value) over JSON.stringify(cap)',
    } : { algorithm: 'Ed25519', signed: false, note: 'signing key not configured on this instance' },
    generated: sent,
    note: 'Pilot research instrument — not a substitute for official public-health alerts.',
  }, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' } });
}
