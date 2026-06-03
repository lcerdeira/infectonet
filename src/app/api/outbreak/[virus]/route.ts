/**
 * GET /api/outbreak/[virus]
 * Fetches and filters WHO News + PAHO + ReliefWeb Alerts RSS feeds
 * for a given virus. Returns an array of alert items.
 *
 * Sources:
 *   - WHO News (https://www.who.int/rss-feeds/news-english.xml) — replaces the
 *     old DON feed (/feeds/entity/csr/don/en/rss.xml) which is now Cloudflare-blocked
 *   - PAHO     (https://www.paho.org/en/rss.xml)           — Americas outbreak coverage
 *   - ReliefWeb Alerts (?primary_type=AL)                   — humanitarian alert type
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
  hantavirus:    ['hantavirus', 'hantaviral', 'andes virus', 'andv', 'sin nombre', 'hps', 'hfrs', 'hanta', 'patagonia'],
  ebola:         ['ebola', 'ebolavirus', 'evd', 'ebola virus disease', 'bundibugyo', 'sudan ebolavirus', 'zaire ebolavirus'],
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
  avianflu:      ['avian influenza', 'h5n1', 'h5n2', 'h5n5', 'h5n6', 'h5', 'bird flu',
                  'highly pathogenic', 'hpai', 'antarctica', 'antarctic', 'penguin',
                  'polar bear', 'polar bird', 'arctic', 'seabird', 'ursus maritimus',
                  'svalbard', 'spitsbergen', 'walrus', 'lynx', 'arctic fox',
                  'poultry outbreak', 'dairy cow', 'cattle flu', 'raudfjorden'],
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
// NOTE: The old WHO DON feed (/feeds/entity/csr/don/en/rss.xml) is blocked
// (returns HTML, Cloudflare). Use the WHO News feed which carries all DON
// items plus broader outbreak coverage. PAHO added for Americas coverage.
// WOAH added for animal disease events (essential for avian flu, RVF, Nipah).
const RSS_SOURCES = [
  {
    name: 'WHO',
    url: 'https://www.who.int/rss-feeds/news-english.xml',
    timeout: 8000,
  },
  {
    name: 'PAHO',
    url: 'https://www.paho.org/en/rss.xml',
    timeout: 8000,
  },
  {
    name: 'WOAH',
    url: 'https://www.woah.org/en/feed/',
    timeout: 8000,
  },
  {
    name: 'ReliefWeb',
    url: 'https://reliefweb.int/updates/rss.xml?primary_type=AL',
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

/* ── WHO DON search terms per virus (for OData API) ─────────────────────────
 * The WHO Disease Outbreak News OData API allows targeted keyword search
 * across ALL historical DONs — not limited to the RSS recency window.
 * URL: https://www.who.int/api/news/diseaseoutbreaknews
 */
const WHO_DON_TERMS: Record<string, string> = {
  avianflu:   "contains(Title,'influenza') or contains(Title,'H5N') or contains(Title,'H9N') or contains(Title,'H7N') or contains(Title,'avian') or contains(Title,'H5N5') or contains(Title,'H5N1') or contains(Title,'H5N2')",
  influenza:  "contains(Title,'influenza') or contains(Title,'H1N1') or contains(Title,'H3N2')",
  influenzab: "contains(Title,'influenza') or contains(Title,'flu')",
  ebola:      "contains(Title,'Ebola') or contains(Title,'ebola') or contains(Title,'Bundibugyo') or contains(Title,'ebolavirus')",
  marburg:    "contains(Title,'Marburg') or contains(Title,'marburg')",
  mpox:       "contains(Title,'mpox') or contains(Title,'monkeypox')",
  lassa:      "contains(Title,'Lassa') or contains(Title,'lassa')",
  crimean:    "contains(Title,'Crimean') or contains(Title,'CCHF')",
  nipah:      "contains(Title,'Nipah') or contains(Title,'nipah')",
  dengue:     "contains(Title,'Dengue') or contains(Title,'dengue')",
  riftvalley: "contains(Title,'Rift Valley') or contains(Title,'RVF')",
  covid19:    "contains(Title,'COVID') or contains(Title,'SARS-CoV-2')",
  hantavirus: "contains(Title,'hantavirus') or contains(Title,'Hantavirus')",
  oropouche:  "contains(Title,'Oropouche') or contains(Title,'oropouche')",
  chikungunya:"contains(Title,'Chikungunya') or contains(Title,'chikungunya')",
  zika:       "contains(Title,'Zika') or contains(Title,'zika')",
  yellowfever:"contains(Title,'Yellow fever') or contains(Title,'yellow fever')",
  westnile:   "contains(Title,'West Nile') or contains(Title,'WNV')",
  measles:    "contains(Title,'Measles') or contains(Title,'measles')",
};

/* ── WHO DON OData API fetch ─────────────────────────────────────────────── */
async function fetchWHODON(filter: string): Promise<AlertItem[]> {
  try {
    const params = new URLSearchParams({
      '$filter':  filter,
      '$orderby': 'PublicationDateAndTime desc',
      '$top':     '10',
      '$select':  'Title,PublicationDateAndTime,ItemDefaultUrl,Summary',
    });
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 10000);
    const res = await fetch(
      `https://www.who.int/api/news/diseaseoutbreaknews?${params.toString()}`,
      {
        signal: controller.signal,
        headers: { 'User-Agent': 'InfectoNET/1.0' },
        next: { revalidate: 1800 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json() as { value: { Title: string; PublicationDateAndTime: string; ItemDefaultUrl: string; Summary: string }[] };
    return (data.value ?? []).map(item => ({
      title:   item.Title ?? '',
      link:    item.ItemDefaultUrl
        ? `https://www.who.int/emergencies/disease-outbreak-news/item/${item.ItemDefaultUrl.split('/').pop()}`
        : 'https://www.who.int/emergencies/disease-outbreak-news',
      pubDate: item.PublicationDateAndTime ?? '',
      summary: stripTags(item.Summary ?? '').slice(0, 300),
      source:  'WHO DON',
    }));
  } catch {
    return [];
  }
}

/* ── fetch one RSS feed ──────────────────────────────────────────────────── */
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
  const keywords   = VIRUS_KEYWORDS[virus] ?? [virus.replace(/_/g, ' ')];
  const donFilter  = WHO_DON_TERMS[virus];

  // Fetch RSS feeds + WHO DON API in parallel
  const [rssItems, donItems] = await Promise.all([
    Promise.all(RSS_SOURCES.map(s => fetchFeed(s.url, s.name, s.timeout))).then(r => r.flat()),
    donFilter ? fetchWHODON(donFilter) : Promise.resolve([] as AlertItem[]),
  ]);
  const allItems = [...donItems, ...rssItems];

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
    { virus, items: deduped.slice(0, 25) },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=600',
      },
    }
  );
}
