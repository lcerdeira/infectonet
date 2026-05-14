/**
 * GET /api/outbreak/[virus]
 * Fetches and filters WHO Disease Outbreak News + ReliefWeb RSS feeds
 * for a given virus. Returns an array of alert items.
 *
 * Cache: 30 min (server), stale-while-revalidate 10 min.
 */
import { NextResponse } from 'next/server';

interface AlertItem {
  title: string;
  link: string;
  pubDate: string;
  summary: string;
  source: string;
}

/* ── per-virus keyword config ─────────────────────────────────────────────── */
const VIRUS_KEYWORDS: Record<string, string[]> = {
  hantavirus:    ['hantavirus', 'hantaviral', 'andes virus', 'sin nombre', 'hps', 'hfrs', 'hanta'],
  ebola:         ['ebola', 'ebolavirus'],
  marburg:       ['marburg', 'marburgvirus'],
  mpox:          ['mpox', 'monkeypox'],
  lassa:         ['lassa'],
  crimean:       ['crimean-congo', 'cchf', 'crimean congo'],
  nipah:         ['nipah'],
  dengue:        ['dengue'],
  riftvalley:    ['rift valley', 'rvf'],
  oropouche:     ['oropouche'],
  covid19:       ['covid-19', 'sars-cov-2', 'covid'],
  influenza:     ['influenza', 'flu', 'h1n1', 'h3n2'],
  influenzab:    ['influenza b', 'flu b'],
  avianflu:      ['avian influenza', 'h5n1', 'h5n2', 'h5', 'bird flu'],
  rabies:        ['rabies'],
  yellowfever:   ['yellow fever'],
  chikungunya:   ['chikungunya', 'chikv'],
  zika:          ['zika'],
  westnile:      ['west nile', 'wnv'],
  measles:       ['measles', 'morbillivirus', 'rubeola'],
  mumps:         ['mumps', 'parotitis'],
  rubella:       ['rubella', 'german measles'],
  varicella:     ['varicella', 'chickenpox', 'vzv', 'zoster'],
  polio:         ['polio', 'poliovirus'],
  rotavirus:     ['rotavirus'],
  adenovirus:    ['adenovirus'],
  enterovirus:   ['enterovirus', 'ev-a71', 'ev71', 'hand foot mouth', 'hfmd', 'coxsackie'],
  norovirus:     ['norovirus', 'norwalk'],
  hepatitisa:    ['hepatitis a', 'hav'],
  hepatitisb:    ['hepatitis b', 'hbv'],
  hepatitisc:    ['hepatitis c', 'hcv'],
  hsv:           ['herpes simplex', 'hsv'],
  cmv:           ['cytomegalovirus', 'cmv'],
  piv:           ['parainfluenza', 'piv'],
  rhinovirus:    ['rhinovirus', 'common cold'],
  hcov:          ['human coronavirus', 'hcov', 'oc43', 'nl63', '229e'],
  hmpv:          ['metapneumovirus', 'hmpv'],
  rsv:           ['respiratory syncytial', 'rsv'],
  parvovirus:    ['parvovirus', 'fifth disease', 'erythema infectiosum'],
  htlv:          ['htlv', 'human t-lymphotropic', 'human t-cell'],
  cauris:        ['candida auris', 'c. auris', 'candidozyma'],
  diseasex:      ['disease x', 'unknown pathogen', 'novel pathogen'],
  hpv:           ['human papillomavirus', 'hpv'],
  hiv:           ['hiv', 'aids'],
};

/* ── RSS sources ──────────────────────────────────────────────────────────── */
const RSS_SOURCES = [
  {
    name: 'WHO',
    url: 'https://www.who.int/feeds/entity/csr/don/en/rss.xml',
    timeout: 8000,
  },
  {
    name: 'ReliefWeb',
    url: 'https://reliefweb.int/updates/rss.xml?primary_type=R',
    timeout: 8000,
  },
];

/* ── XML helpers ──────────────────────────────────────────────────────────── */
function extractAll(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    results.push(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim());
  }
  return results;
}

function stripTags(html: string): string {
  return html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') // unwrap CDATA
    // Decode HTML entities FIRST (feeds may entity-encode their HTML)
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, ' ')
    // Now strip all HTML tags (including those just decoded from entities)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseItems(xml: string, source: string): AlertItem[] {
  // Split on <item> tags
  const itemChunks = xml.split(/<item[\s>]/i).slice(1);
  return itemChunks.map(chunk => {
    const title   = extractAll(chunk, 'title')[0]   ?? '';
    const link    = extractAll(chunk, 'link')[0]    ?? '';
    const pubDate = extractAll(chunk, 'pubDate')[0] ?? extractAll(chunk, 'dc:date')[0] ?? '';
    const desc    = extractAll(chunk, 'description')[0] ?? '';
    return {
      title:   stripTags(title),
      link:    link.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
      pubDate: pubDate,
      summary: stripTags(desc).slice(0, 300),
      source,
    };
  });
}

/* ── fetch one feed ───────────────────────────────────────────────────────── */
async function fetchFeed(url: string, source: string, timeout: number): Promise<AlertItem[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'InfectoNET/1.0 (genomic surveillance platform)' },
      next: { revalidate: 1800 }, // 30 min Next.js cache
    });
    clearTimeout(timer);
    if (!res.ok) return [];
    const xml = await res.text();
    return parseItems(xml, source);
  } catch {
    return [];
  }
}

/* ── route handler ─────────────────────────────────────────────────────────── */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ virus: string }> }
) {
  const { virus } = await params;
  const keywords = VIRUS_KEYWORDS[virus] ?? [virus.replace(/_/g, ' ')];

  // Fetch all feeds in parallel
  const allItems = (
    await Promise.all(RSS_SOURCES.map(s => fetchFeed(s.url, s.name, s.timeout)))
  ).flat();

  // Filter by keywords (title + summary, case-insensitive)
  const filtered = allItems.filter(item => {
    const text = `${item.title} ${item.summary}`.toLowerCase();
    return keywords.some(kw => text.includes(kw));
  });

  // Deduplicate by title
  const seen = new Set<string>();
  const deduped = filtered.filter(item => {
    const key = item.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by date descending (best-effort)
  deduped.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return db - da;
  });

  return NextResponse.json(
    { virus, items: deduped.slice(0, 20) },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=600',
      },
    }
  );
}
