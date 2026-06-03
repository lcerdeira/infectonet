/**
 * GET /api/viruses/:id/divisions?country=<country substring>
 *
 * Returns sub-national aggregation (by the Nextstrain-style `division` field)
 * for a virus, optionally restricted to a country. Powers the province-level
 * map (e.g. Ebola in the DRC).
 */
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { VIRUS_MAP } from '@/lib/viruses';

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
    console.warn('[divisions API] MongoDB unavailable:', (err as Error).message);
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!VIRUS_MAP.has(id)) {
    return NextResponse.json({ error: `Unknown virus: ${id}` }, { status: 404 });
  }

  const country = req.nextUrl.searchParams.get('country');
  const client = await getClient();
  if (!client) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  try {
    const col = client.db(id).collection('genomes');

    // Optional country filter — match across the candidate country fields
    const match: Record<string, unknown> = {};
    if (country) {
      const rx = new RegExp(country, 'i');
      match.$or = [
        { COUNTRY_ONLY: rx }, { COUNTRY: rx }, { country: rx },
      ];
    }

    const pipeline = [
      ...(country ? [{ $match: match }] : []),
      {
        $group: {
          _id: {
            $let: {
              vars: {
                div: {
                  $reduce: {
                    input: [
                      { $ifNull: ['$division', ''] },
                      { $ifNull: ['$region',   ''] },
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
              in: '$$div',
            },
          },
          count: { $sum: 1 },
          genotypes: { $addToSet: { $ifNull: ['$genotype', { $ifNull: ['$GENOTYPE', 'Unknown'] }] } },
        },
      },
      { $match: { _id: { $nin: ['', null] } } },
      { $sort: { count: -1 } },
    ];

    const raw = await col.aggregate(pipeline).toArray();

    const divisions: Record<string, { count: number; genotypes: string[] }> = {};
    let withDivision = 0;
    for (const d of raw) {
      const name = String(d._id).trim();
      if (!name) continue;
      divisions[name] = { count: d.count as number, genotypes: (d.genotypes as string[]).filter(Boolean) };
      withDivision += d.count as number;
    }

    const totalForCountry = country
      ? await col.countDocuments(match)
      : await col.countDocuments({});

    return NextResponse.json(
      {
        id,
        country: country ?? null,
        total: totalForCountry,
        withDivision,
        coverage: totalForCountry > 0 ? Math.round((withDivision / totalForCountry) * 100) : 0,
        divisions,
      },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } }
    );
  } catch (err) {
    console.error(`[divisions API] Error for ${id}:`, err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
