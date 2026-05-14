/**
 * GET /api/viruses
 * Returns the catalogue of all viruses with their metadata.
 */
import { NextResponse } from 'next/server';
import { VIRUSES } from '@/lib/viruses';
import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
let _client: MongoClient | null = null;
let _available: boolean | null = null;

async function getClient(): Promise<MongoClient | null> {
  if (_available === false) return null;
  if (_client) return _client;
  try {
    const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 4000, family: 4 });
    await client.connect();
    _client = client;
    _available = true;
    return client;
  } catch {
    _available = false;
    return null;
  }
}

export async function GET() {
  const client = await getClient();

  // Attach counts from MongoDB if available
  const virusesWithCounts = await Promise.all(
    VIRUSES.map(async v => {
      let count = 0;
      if (client) {
        try {
          count = await client.db(v.id).collection('genomes')
            .countDocuments({});
        } catch {
          // DB doesn't exist yet — count stays 0
        }
      }
      return { ...v, count };
    })
  );

  return NextResponse.json(virusesWithCounts, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
    },
  });
}
