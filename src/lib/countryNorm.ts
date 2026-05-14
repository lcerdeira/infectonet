/**
 * countryNorm.ts
 * Normalises database country name variants to the exact names used
 * by the world-atlas 2.0 / Natural Earth GeoJSON (countries-110m.json).
 *
 * Usage:
 *   import { normaliseCountry } from '@/lib/countryNorm';
 *   const geoName = normaliseCountry('USA'); // → 'United States of America'
 */

/** Map from common variant → canonical Natural Earth name */
const ALIAS: Record<string, string> = {
  // United States
  'usa':                          'United States of America',
  'u.s.a.':                       'United States of America',
  'u.s.':                         'United States of America',
  'us':                           'United States of America',
  'united states':                'United States of America',
  'the united states':            'United States of America',

  // United Kingdom
  'uk':                           'United Kingdom',
  'u.k.':                         'United Kingdom',
  'great britain':                'United Kingdom',
  'england':                      'United Kingdom',
  'scotland':                     'United Kingdom',
  'wales':                        'United Kingdom',

  // Russia
  'russian federation':           'Russia',

  // Czech Republic
  'czech republic':               'Czechia',

  // Ivory Coast
  'ivory coast':                  'Côte d\'Ivoire',
  "cote d'ivoire":                'Côte d\'Ivoire',
  'cote divoire':                 'Côte d\'Ivoire',

  // DR Congo
  'democratic republic of the congo': 'Dem. Rep. Congo',
  'democratic republic of congo': 'Dem. Rep. Congo',
  'dr congo':                     'Dem. Rep. Congo',
  'drc':                          'Dem. Rep. Congo',
  'drc congo':                    'Dem. Rep. Congo',
  'congo, dem. rep.':             'Dem. Rep. Congo',
  'congo-kinshasa':               'Dem. Rep. Congo',

  // Republic of Congo
  'republic of congo':            'Congo',
  'republic of the congo':        'Congo',
  'congo, rep.':                  'Congo',
  'congo brazzaville':            'Congo',
  'congo-brazzaville':            'Congo',

  // Central African Republic
  'central african republic':     'Central African Rep.',
  'car':                          'Central African Rep.',

  // Dominican Republic
  'dominican republic':           'Dominican Rep.',

  // Equatorial Guinea
  'equatorial guinea':            'Eq. Guinea',

  // South Sudan
  'south sudan':                  'S. Sudan',

  // Eswatini / Swaziland
  'eswatini':                     'eSwatini',
  'swaziland':                    'eSwatini',

  // Bosnia and Herzegovina
  'bosnia and herzegovina':       'Bosnia and Herz.',
  'bosnia-herzegovina':           'Bosnia and Herz.',
  'bosnia':                       'Bosnia and Herz.',

  // North Macedonia
  'north macedonia':              'Macedonia',
  'republic of north macedonia':  'Macedonia',
  'former yugoslav republic of macedonia': 'Macedonia',
  'fyrom':                        'Macedonia',

  // Western Sahara
  'western sahara':               'W. Sahara',

  // Solomon Islands
  'solomon islands':              'Solomon Is.',

  // Falkland Islands
  'falkland islands':             'Falkland Is.',
  'falklands':                    'Falkland Is.',

  // Myanmar / Burma
  'burma':                        'Myanmar',

  // Laos
  "lao people's democratic republic": 'Laos',
  'lao pdr':                      'Laos',
  'lao':                          'Laos',

  // Palestine
  'palestinian territory':        'Palestine',
  'west bank':                    'Palestine',
  'gaza':                         'Palestine',
  'gaza strip':                   'Palestine',
  'state of palestine':           'Palestine',

  // Taiwan
  'chinese taipei':               'Taiwan',
  'taiwan, province of china':    'Taiwan',

  // Iran
  'iran, islamic republic of':    'Iran',
  'islamic republic of iran':     'Iran',

  // Syria
  'syrian arab republic':         'Syria',

  // Vietnam
  'viet nam':                     'Vietnam',

  // Korea
  'republic of korea':            'South Korea',
  'south korea':                  'South Korea',
  'korea':                        'South Korea',
  'korea, south':                 'South Korea',
  'democratic people\'s republic of korea': 'North Korea',
  'korea, north':                 'North Korea',
  'dprk':                         'North Korea',

  // Timor-Leste
  'east timor':                   'Timor-Leste',

  // Cabo Verde / Cape Verde
  'cape verde':                   'Cabo Verde',

  // North Cyprus
  'turkish republic of northern cyprus': 'N. Cyprus',

  // Trinidad and Tobago — ok, but normalise spacing
  'trinidad & tobago':            'Trinidad and Tobago',

  // Vatican (not in GeoJSON but normalise anyway)
  'holy see':                     'Vatican',
  'vatican city':                 'Vatican',

  // Kosovo is in GeoJSON as 'Kosovo'
  'republic of kosovo':           'Kosovo',

  // Somaliland is in GeoJSON as 'Somaliland'
  // Yugoslavia successors — generic fallback
  'yugoslavia':                   'Serbia',

  // NCBI / GenBank specific variants
  'pr china':                     'China',
  'people\'s republic of china':  'China',
  'hong kong':                    'China',          // NE has Hong Kong as part of China
  'macau':                        'China',
  'macao':                        'China',
  'guam':                         'United States of America',
  'puerto rico':                  'United States of America',
  'u.s. virgin islands':          'United States of America',
  'virgin islands':               'United States of America',
  'american samoa':               'United States of America',
  'northern mariana islands':     'United States of America',
  'korea, republic of':           'South Korea',
  'democratic republic of korea': 'North Korea',
  'moldova':                      'Moldova',
  'republic of moldova':          'Moldova',
  'tanzania':                     'Tanzania',
  'united republic of tanzania':  'Tanzania',
  'gambia':                       'Gambia',
  'the gambia':                   'Gambia',
  'czechia':                      'Czechia',
  'turkey':                       'Turkey',
  'republic of türkiye':          'Turkey',
  'türkiye':                      'Turkey',
  'north korea':                  'North Korea',
  'antarctica':                   '',       // not on world map
  'unknown':                      '',
  'not applicable':               '',
  'n/a':                          '',
};

/**
 * Normalise a country string to the canonical Natural Earth / world-atlas name.
 * Handles:
 *  - NCBI "Country: Region" format  → strips region suffix
 *  - Embedded quotes  → strips them
 *  - Known alias variants  → maps to Natural Earth canonical name
 * Falls back to the trimmed string if no alias found.
 */
export function normaliseCountry(raw: string | undefined | null): string {
  if (!raw) return '';
  // Strip embedded quotes
  let s = raw.trim().replace(/^"(.*)"$/, '$1').trim();
  // NCBI stores "Country: Region, sub-region" — keep only the country part
  const colonIdx = s.indexOf(':');
  if (colonIdx > 0) s = s.substring(0, colonIdx).trim();
  const lower = s.toLowerCase();
  return ALIAS[lower] ?? s;
}
