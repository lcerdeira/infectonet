/**
 * GET /api/viruses/:id/countries
 *
 * Returns aggregated country → {count, genotypeCounts} from ALL records
 * (not a capped sample). Uses MongoDB aggregation for efficiency.
 * This powers the WorldMap so every sequence is counted regardless
 * of the sample limit used by the main /api/viruses/:id route.
 */
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { VIRUS_MAP } from '@/lib/viruses';
import { normaliseCountry } from '@/lib/countryNorm';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

let _client: MongoClient | null = null;
let _lastFailure = 0;

async function getClient(): Promise<MongoClient | null> {
  if (_client) return _client;
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
    console.warn('[countries API] MongoDB unavailable:', (err as Error).message);
    return null;
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!VIRUS_MAP.has(id)) {
    return NextResponse.json({ error: `Unknown virus: ${id}` }, { status: 404 });
  }

  const client = await getClient();
  if (!client) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  try {
    const col = client.db(id).collection('genomes');

    // Two-pass aggregation:
    // 1. Group by (country, genotype) → count
    // 2. Re-group by country → total + genotype breakdown object
    //
    // NOTE: $ifNull only catches null/missing — NOT empty string "".
    // We use $reduce over a candidate array to pick the first non-empty value.
    const COALESCE_GENOTYPE = {
      $let: {
        vars: {
          picked: {
            $reduce: {
              input: [
                { $ifNull: ['$GENOTYPE',       ''] },
                { $ifNull: ['$genotype',        ''] },
                { $ifNull: ['$pango_lineage',   ''] },
                { $ifNull: ['$hpv_type',        ''] },
                { $ifNull: ['$hanta_species',   ''] },
                { $ifNull: ['$LINEAGE',         ''] },
                { $ifNull: ['$lineage',         ''] },
                { $ifNull: ['$clade',           ''] },
                { $ifNull: ['$serotype',        ''] },
                { $ifNull: ['$subtype',         ''] },
              ],
              initialValue: '',
              in: {
                $cond: [
                  { $and: [
                    { $eq:  ['$$value', ''] },
                    { $and: [
                      { $ne: ['$$this', ''] },
                      { $ne: ['$$this', 'Unknown'] },
                      { $ne: ['$$this', 'unknown'] },
                    ]},
                  ]},
                  '$$this',
                  '$$value',
                ],
              },
            },
          },
        },
        in: { $cond: [{ $eq: ['$$picked', ''] }, 'Unknown', '$$picked'] },
      },
    };

    const pipeline = [
      {
        $group: {
          _id: {
            country: {
              $let: {
                vars: {
                  c: {
                    $reduce: {
                      input: [
                        { $ifNull: ['$COUNTRY_ONLY', ''] },
                        { $ifNull: ['$COUNTRY',      ''] },
                        { $ifNull: ['$country',      ''] },
                      ],
                      initialValue: '',
                      in: {
                        $cond: [
                          { $and: [{ $eq: ['$$value', ''] }, { $ne: ['$$this', ''] }] },
                          '$$this', '$$value',
                        ],
                      },
                    },
                  },
                },
                in: '$$c',
              },
            },
            genotype: COALESCE_GENOTYPE,
          },
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          '_id.country': { $nin: ['', null, '?', 'N/A', 'Unknown', 'unknown'] },
        },
      },
      {
        $group: {
          _id: '$_id.country',
          count: { $sum: '$count' },
          genotypes: { $push: { k: '$_id.genotype', v: '$count' } },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 300 },
    ];

    const raw = await col.aggregate(pipeline).toArray();

    // Normalise country names and merge duplicates (e.g. "USA" + "United States")
    const result: Record<string, { count: number; genotypeCounts: Record<string, number> }> = {};

    for (const doc of raw) {
      const normCountry = normaliseCountry(doc._id as string);
      if (!normCountry) continue;

      if (!result[normCountry]) {
        result[normCountry] = { count: 0, genotypeCounts: {} };
      }
      result[normCountry].count += doc.count as number;

      for (const { k, v } of doc.genotypes as { k: string; v: number }[]) {
        const gt = !k || k === 'Unknown' || k === '?' ? 'Unknown' : k;
        result[normCountry].genotypeCounts[gt] =
          (result[normCountry].genotypeCounts[gt] ?? 0) + v;
      }
    }

    return NextResponse.json(
      { id, total: Object.values(result).reduce((s, v) => s + v.count, 0), countryStat: result },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } }
    );
  } catch (err) {
    console.error(`[countries API] Error for ${id}:`, err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
