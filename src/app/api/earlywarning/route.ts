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

interface ChannelScore { value: number; elevated: boolean; detail: string; }

const ELEVATED = 50;   // a channel is "elevated" at ≥50/100

function clamp(x: number) { return Math.max(0, Math.min(100, x)); }

export async function GET(req: NextRequest) {
  const virus = req.nextUrl.searchParams.get('virus') ?? '';
  if (!VIRUS_MAP.has(virus)) {
    return NextResponse.json({ error: `Unknown virus: ${virus}` }, { status: 404 });
  }
  const origin = req.nextUrl.origin;
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
  const alertCount = news?.items?.length ?? 0;
  const N: ChannelScore = {
    value: clamp(alertCount * 20),
    elevated: alertCount >= 2,
    detail: alertCount > 0
      ? `${alertCount} live WHO/PAHO/WOAH outbreak alert(s)`
      : 'No current outbreak alerts',
  };

  // ── Fusion — Spillover/Amplification Index (SAI) ───────────────────────────
  // Transparent weighted fusion (pilot). E is the validated long-lead driver,
  // G the response, N corroboration. N is capped so it cannot dominate.
  const sai = clamp(Math.round(0.50 * E.value + 0.30 * G.value + 0.20 * N.value));

  // ── Tiered alert logic (N never alerts alone) ──────────────────────────────
  const elevatedChannels = [E.elevated, G.elevated].filter(Boolean).length;
  let tier: 'NONE' | 'WATCH' | 'ADVISORY' | 'WARNING' = 'NONE';
  if (E.value >= 70 && (N.elevated || G.elevated)) tier = 'WARNING';
  else if (elevatedChannels >= 2) tier = 'ADVISORY';
  else if (E.elevated || G.elevated) tier = 'WATCH';
  // Escalate one level if news corroborates an already-elevated quantitative channel
  if (tier === 'WATCH' && N.elevated && elevatedChannels >= 1) tier = 'ADVISORY';

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

  // ── Tamper-evident integrity digest (seed of a hash-chained log) ───────────
  const digest = createHash('sha256').update(JSON.stringify(cap)).digest('hex');

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
    fusion: 'SAI = 0.50·E + 0.30·G + 0.20·N (pilot weights; N capped, never alerts alone)',
    cap,
    integrity: { algorithm: 'SHA-256', digest },
    generated: sent,
    note: 'Pilot research instrument — not a substitute for official public-health alerts.',
  }, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' } });
}
