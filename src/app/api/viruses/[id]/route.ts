/**
 * GET /api/viruses/:id
 * Returns all sequence records for a given virus from MongoDB.
 * Each virus lives in its own MongoDB database named by ID, collection: "genomes".
 *
 * Query params:
 *   page    (default: 1)
 *   limit   (default: 5000)
 *   fields  comma-separated list of fields to project (optional)
 */
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { VIRUS_MAP } from '@/lib/viruses';
import { resolveGenotype } from '@/lib/utils';
import { normaliseCountry } from '@/lib/countryNorm';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

// Singleton client — shared across route invocations in same process
let _client: MongoClient | null = null;
let _lastFailure = 0; // timestamp of last failed attempt

async function getClient(): Promise<MongoClient | null> {
  if (_client) return _client;
  // Retry cooldown: 15 s after a failure (don't permanently short-circuit)
  if (_lastFailure > 0 && Date.now() - _lastFailure < 15_000) return null;
  try {
    const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 4000, family: 4 });
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    _client = client;
    _lastFailure = 0;
    return _client;
  } catch (err) {
    _lastFailure = Date.now();
    console.warn('[viruses API] MongoDB unavailable:', (err as Error).message);
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Validate against known viruses
  if (!VIRUS_MAP.has(id)) {
    return NextResponse.json({ error: `Unknown virus: ${id}` }, { status: 404 });
  }

  const url = req.nextUrl;
  const page  = Math.max(1, parseInt(url.searchParams.get('page')  ?? '1',     10));
  const limit = Math.min(50_000, parseInt(url.searchParams.get('limit') ?? '5000', 10));
  const skip  = (page - 1) * limit;

  const client = await getClient();
  if (!client) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  try {
    const db  = client.db(id);
    const col = db.collection('genomes');

    // Projection: only the fields the dashboard actually uses.
    // Drops QC metrics, long text fields, coverage stats etc.
    // Cuts payload from ~16 MB → ~2 MB for large collections.
    const PROJECTION: Record<string, 1> = {
      // ── country resolution ──────────────────────────
      COUNTRY: 1, COUNTRY_ONLY: 1, country: 1,
      // ── year resolution ─────────────────────────────
      YEAR: 1, DATE: 1, date: 1, collection_date: 1,
      // ── genotype resolution ──────────────────────────
      GENOTYPE: 1, genotype: 1,
      LINEAGE: 1,  lineage: 1,
      CLADE: 1,    clade: 1,
      SEROTYPE: 1, serotype: 1,
      hiv_type: 1, influenza_subtype: 1,
      pango_lineage: 1,        // COVID-19 Nextstrain
      hpv_type: 1,             // HPV (also in insight fields below)
      hanta_species: 1,        // Hantavirus (also in insight fields below)
      hanta_clade: 1,          // Hantavirus
      ebola_species: 1,        // Ebola virus species (EBOV, SUDV, etc.)
      lassa_lineage: 1,        // Lassa fever lineage (I–IV)
      siv_species: 1,          // SIV host species (SIVcpz, SIVmac, etc.)
      norovirus_genotype: 1,   // Norovirus detailed genotype (GI.1, GII.4, etc.)
      // ── virus-specific insight fields ─────────────────
      region: 1,
      outbreak: 1,
      clinical_syndrome: 1,
      oncogenic_risk: 1,
      host_type: 1,
      host: 1,
      genogroup: 1,
      subtype: 1,
      // ── antiviral susceptibility ─────────────────────
      oseltamivir_susceptibility: 1,
      baloxavir_susceptibility: 1,
      adamantane_susceptibility: 1,
      ribavirin_susceptibility: 1,
      tecovirimat_susceptibility: 1,
      cidofovir_susceptibility: 1,
      molnupiravir_susceptibility: 1,
      pi_susceptibility: 1,
      nrti_susceptibility: 1,
      nnrti_susceptibility: 1,
      insti_susceptibility: 1,
    };

    const total = await col.countDocuments({});
    const raw   = await col
      .find({}, { projection: { _id: 0, ...PROJECTION } })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Normalise fields to canonical uppercase names used by the frontend:
    //   COUNTRY_ONLY / country → COUNTRY
    //   DATE (year string/number) → YEAR
    //   Resolve GENOTYPE from best available field
    const records = raw.map(r => {
      const rec = r as Record<string, unknown>;

      // Country — normalise to Natural Earth / world-atlas canonical names
      const rawCountry =
        (rec.COUNTRY_ONLY as string | undefined) ||
        (rec.COUNTRY    as string | undefined) ||
        (rec.country    as string | undefined) ||
        '';
      rec.COUNTRY = normaliseCountry(rawCountry);

      // Year
      if (!rec.YEAR) {
        const raw = rec.DATE ?? rec.date ?? rec.collection_date;
        if (raw) {
          const parsed = parseInt(String(raw).substring(0, 4), 10);
          if (parsed >= 1900 && parsed <= 2100) rec.YEAR = parsed;
        }
      }

      // Genotype
      if (!rec.GENOTYPE || String(rec.GENOTYPE).trim() === '' || rec.GENOTYPE === 'Unknown') {
        const resolved = resolveGenotype(rec);
        if (resolved && resolved !== 'Unknown') rec.GENOTYPE = resolved;
      }

      return rec;
    });

    return NextResponse.json(
      { id, total, page, limit, records },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    );
  } catch (err) {
    console.error(`[viruses API] Error fetching ${id}:`, err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
