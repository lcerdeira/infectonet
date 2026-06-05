/**
 * adminCentroids — admin-1 (state/province) centroid gazetteer for the
 * countries InfectoNET maps at sub-national level. Used by ProvinceBubbleMap
 * to place genomic-sequence bubbles from the messy free-text `division` field.
 *
 * The matcher de-quotes, lowercases, strips accents, and matches names,
 * 2-letter abbreviations, and a set of major-city aliases → state centroid.
 */

export interface AdminUnit {
  name: string;
  lon: number;
  lat: number;
  aliases: string[];   // abbreviations, common spellings, major cities
}

// ── BRAZIL (27 federative units) — for oropouche, yellow fever, zika, dengue ──
export const BRAZIL_STATES: AdminUnit[] = [
  { name: 'Acre',                lon: -70.5, lat:  -9.0, aliases: ['ac'] },
  { name: 'Alagoas',             lon: -36.6, lat:  -9.6, aliases: ['al'] },
  { name: 'Amapá',               lon: -51.8, lat:   1.4, aliases: ['ap', 'amapa'] },
  { name: 'Amazonas',            lon: -64.6, lat:  -4.1, aliases: ['am', 'manaus', 'amazonas_manaus'] },
  { name: 'Bahia',               lon: -41.7, lat: -12.5, aliases: ['ba', 'salvador'] },
  { name: 'Ceará',               lon: -39.6, lat:  -5.5, aliases: ['ce', 'ceara', 'fortaleza'] },
  { name: 'Distrito Federal',    lon: -47.8, lat: -15.8, aliases: ['df', 'brasilia', 'brasília'] },
  { name: 'Espírito Santo',      lon: -40.3, lat: -19.6, aliases: ['es', 'espirito santo', 'vitoria'] },
  { name: 'Goiás',               lon: -49.6, lat: -16.0, aliases: ['go', 'goias', 'goiania'] },
  { name: 'Maranhão',            lon: -45.3, lat:  -5.0, aliases: ['ma', 'maranhao', 'sao luis'] },
  { name: 'Mato Grosso',         lon: -55.9, lat: -12.6, aliases: ['mt', 'cuiaba', 'cuiabá'] },
  { name: 'Mato Grosso do Sul',  lon: -54.8, lat: -20.5, aliases: ['ms', 'campo grande'] },
  { name: 'Minas Gerais',        lon: -44.4, lat: -18.5, aliases: ['mg', 'belo horizonte', 'coronel fabriciano', 'joanesia', 'timoteo', 'ipatinga'] },
  { name: 'Pará',                lon: -52.3, lat:  -3.8, aliases: ['pa', 'para', 'belem', 'breves'] },
  { name: 'Paraíba',             lon: -36.8, lat:  -7.1, aliases: ['pb', 'paraiba', 'joao pessoa'] },
  { name: 'Paraná',              lon: -51.6, lat: -24.5, aliases: ['pr', 'parana', 'curitiba'] },
  { name: 'Pernambuco',          lon: -37.8, lat:  -8.4, aliases: ['pe', 'recife'] },
  { name: 'Piauí',               lon: -42.8, lat:  -7.7, aliases: ['pi', 'piaui', 'teresina'] },
  { name: 'Rio de Janeiro',      lon: -42.6, lat: -22.3, aliases: ['rj', 'marica-rj', 'teresopolis-rj', 'valenca-rj', 'niteroi'] },
  { name: 'Rio Grande do Norte', lon: -36.5, lat:  -5.8, aliases: ['rn', 'natal'] },
  { name: 'Rio Grande do Sul',   lon: -53.5, lat: -30.0, aliases: ['rs', 'porto alegre'] },
  { name: 'Rondônia',            lon: -63.0, lat: -10.9, aliases: ['ro', 'rondonia', 'porto velho'] },
  { name: 'Roraima',             lon: -61.4, lat:   2.1, aliases: ['rr', 'boa vista'] },
  { name: 'Santa Catarina',      lon: -50.5, lat: -27.2, aliases: ['sc', 'florianopolis'] },
  { name: 'São Paulo',           lon: -48.6, lat: -22.2, aliases: ['sp', 'sao paulo', 'campinas', 'ribeirao preto'] },
  { name: 'Sergipe',             lon: -37.4, lat: -10.6, aliases: ['se', 'aracaju'] },
  { name: 'Tocantins',           lon: -48.3, lat: -10.2, aliases: ['to', 'palmas'] },
];

// ── NIGERIA (Lassa belt + major states) — for lassa, yellow fever ────────────
export const NIGERIA_STATES: AdminUnit[] = [
  { name: 'Ondo',        lon:  5.1, lat: 7.1,  aliases: ['akure'] },
  { name: 'Edo',         lon:  5.9, lat: 6.5,  aliases: ['benin city', 'irrua', 'ebudin'] },
  { name: 'Ebonyi',      lon:  8.1, lat: 6.2,  aliases: ['abakaliki'] },
  { name: 'Bauchi',      lon: 10.0, lat: 10.5, aliases: [] },
  { name: 'Taraba',      lon: 10.8, lat: 8.0,  aliases: ['jalingo'] },
  { name: 'Plateau',     lon:  9.5, lat: 9.2,  aliases: ['jos'] },
  { name: 'Nasarawa',    lon:  8.5, lat: 8.5,  aliases: ['lafia'] },
  { name: 'Kogi',        lon:  6.7, lat: 7.8,  aliases: ['lokoja'] },
  { name: 'Benue',       lon:  8.8, lat: 7.3,  aliases: ['makurdi'] },
  { name: 'Enugu',       lon:  7.5, lat: 6.5,  aliases: [] },
  { name: 'Anambra',     lon:  7.0, lat: 6.2,  aliases: ['awka'] },
  { name: 'Delta',       lon:  6.0, lat: 5.7,  aliases: ['asaba'] },
  { name: 'Lagos',       lon:  3.4, lat: 6.5,  aliases: [] },
  { name: 'Oyo',         lon:  3.9, lat: 8.0,  aliases: ['ibadan'] },
  { name: 'Kano',        lon:  8.5, lat: 12.0, aliases: [] },
  { name: 'Kaduna',      lon:  7.7, lat: 10.5, aliases: [] },
  { name: 'Rivers',      lon:  6.9, lat: 4.8,  aliases: ['port harcourt'] },
  { name: 'Cross River', lon:  8.6, lat: 5.9,  aliases: ['calabar'] },
  { name: 'Abia',        lon:  7.5, lat: 5.5,  aliases: ['umuahia'] },
  { name: 'FCT Abuja',   lon:  7.4, lat: 9.1,  aliases: ['abuja', 'fct'] },
];

const GAZETTEERS: Record<string, AdminUnit[]> = {
  brazil: BRAZIL_STATES,
  nigeria: NIGERIA_STATES,
};

function norm(s: string): string {
  return s
    .replace(/^["'\s]+|["'\s]+$/g, '')          // strip surrounding quotes/space
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
    .toLowerCase().trim();
}

/** Match a free-text division string to an admin unit in the given country */
export function matchAdmin(division: string, country: string): AdminUnit | undefined {
  const units = GAZETTEERS[country];
  if (!units || !division) return undefined;
  const d = norm(division);
  if (!d) return undefined;
  for (const u of units) {
    if (norm(u.name) === d) return u;
    if (u.aliases.some(a => norm(a) === d)) return u;
  }
  // substring fallback (e.g. "amazonas_manaus" contains "manaus")
  for (const u of units) {
    if (d.includes(norm(u.name)) || u.aliases.some(a => a && d.includes(norm(a)))) return u;
  }
  return undefined;
}
