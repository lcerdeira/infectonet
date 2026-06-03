/**
 * DRC Ebola outbreak geography
 * ============================
 * Province centroids and documented historical outbreak sites for the
 * Democratic Republic of the Congo, used by the EbolaProvinceMap component.
 *
 * Sources: WHO Disease Outbreak News archive, CDC Ebola outbreak history,
 * peer-reviewed genomic epidemiology literature. Coordinates are approximate
 * province/health-zone centroids (lon, lat).
 */

export interface DRCProvince {
  name: string;
  altNames: string[];   // matches against the `division` field in records
  lon: number;
  lat: number;
}

/** The 26 provinces of the DRC most relevant to filovirus surveillance */
export const DRC_PROVINCES: DRCProvince[] = [
  { name: 'Équateur',       altNames: ['Equateur', 'Equator'],            lon: 18.3, lat:  0.0 },
  { name: 'Tshuapa',        altNames: ['Tshuapa', 'Boende', 'Lokolia'],   lon: 22.0, lat: -0.9 },
  { name: 'Mongala',        altNames: ['Mongala', 'Lisala'],              lon: 21.5, lat:  2.0 },
  { name: 'Nord-Ubangi',    altNames: ['Nord-Ubangi', 'Nord Ubangi'],     lon: 21.0, lat:  3.6 },
  { name: 'Sud-Ubangi',     altNames: ['Sud-Ubangi', 'Sud Ubangi'],       lon: 19.5, lat:  3.0 },
  { name: 'Bas-Uélé',       altNames: ['Bas-Uele', 'Bas Uele', 'Likati'], lon: 24.0, lat:  3.5 },
  { name: 'Haut-Uélé',      altNames: ['Haut-Uele', 'Haut Uele', 'Isiro', 'Watsi'], lon: 27.6, lat:  2.8 },
  { name: 'Ituri',          altNames: ['Ituri', 'Mambasa', 'Mayinga'],    lon: 29.2, lat:  1.6 },
  { name: 'Nord-Kivu',      altNames: ['Nord Kivu', 'North Kivu', 'Beni', 'Butembo'], lon: 29.0, lat: -0.6 },
  { name: 'Sud-Kivu',       altNames: ['Sud Kivu', 'South Kivu', 'Bukavu'], lon: 28.5, lat: -2.5 },
  { name: 'Tshopo',         altNames: ['Tshopo', 'Kisangani'],            lon: 24.5, lat:  0.5 },
  { name: 'Kasaï',          altNames: ['Kasai', 'Mweka'],                 lon: 21.0, lat: -5.0 },
  { name: 'Kasaï-Central',  altNames: ['Kasai-Central', 'Kananga'],       lon: 22.4, lat: -5.9 },
  { name: 'Kwilu',          altNames: ['Kwilu', 'Kikwit', 'Bandundu'],    lon: 18.8, lat: -5.0 },
  { name: 'Maï-Ndombe',     altNames: ['Mai-Ndombe', 'Inongo', 'Bikoro'], lon: 18.3, lat: -2.5 },
  { name: 'Kinshasa',       altNames: ['Kinshasa'],                       lon: 15.3, lat: -4.4 },
  { name: 'Sankuru',        altNames: ['Sankuru', 'Lusambo'],             lon: 23.5, lat: -3.5 },
  { name: 'Haut-Katanga',   altNames: ['Haut-Katanga', 'Lubumbashi'],     lon: 27.5, lat: -11.5 },
];

export type EbolaSpecies = 'EBOV' | 'SUDV' | 'BDBV';

export interface DRCOutbreak {
  year: number;
  place: string;
  province: string;
  lon: number;
  lat: number;
  species: EbolaSpecies;
  cases: number;
  deaths: number;
  note?: string;
}

/**
 * Documented DRC (+ immediately cross-border) Ebola outbreaks.
 * The 2025–26 Bundibugyo event spans the Uganda–DRC Albertine Rift border.
 */
export const DRC_OUTBREAKS: DRCOutbreak[] = [
  { year: 1976, place: 'Yambuku',          province: 'Mongala',    lon: 22.4, lat:  2.8, species: 'EBOV', cases: 318,  deaths: 280,  note: 'First-ever Ebola outbreak' },
  { year: 1977, place: 'Tandala',          province: 'Sud-Ubangi', lon: 19.5, lat:  3.0, species: 'EBOV', cases: 1,    deaths: 1 },
  { year: 1995, place: 'Kikwit',           province: 'Kwilu',      lon: 18.8, lat: -5.0, species: 'EBOV', cases: 315,  deaths: 250 },
  { year: 2007, place: 'Mweka (Kasaï)',    province: 'Kasaï',      lon: 21.6, lat: -4.8, species: 'EBOV', cases: 264,  deaths: 187 },
  { year: 2008, place: 'Mweka (Kasaï)',    province: 'Kasaï',      lon: 21.6, lat: -4.8, species: 'EBOV', cases: 32,   deaths: 15 },
  { year: 2012, place: 'Isiro',            province: 'Haut-Uélé',  lon: 27.6, lat:  2.8, species: 'BDBV', cases: 57,   deaths: 29,   note: '2nd-ever BDBV outbreak' },
  { year: 2014, place: 'Boende',           province: 'Tshuapa',    lon: 20.9, lat: -0.2, species: 'EBOV', cases: 66,   deaths: 49 },
  { year: 2017, place: 'Likati',           province: 'Bas-Uélé',   lon: 23.9, lat:  3.4, species: 'EBOV', cases: 8,    deaths: 4 },
  { year: 2018, place: 'Bikoro/Mbandaka',  province: 'Équateur',   lon: 18.3, lat: -0.8, species: 'EBOV', cases: 54,   deaths: 33 },
  { year: 2018, place: 'Beni/Butembo',     province: 'Nord-Kivu',  lon: 29.0, lat:  0.5, species: 'EBOV', cases: 3481, deaths: 2299, note: 'Largest DRC outbreak; active conflict zone' },
  { year: 2020, place: 'Mbandaka',         province: 'Équateur',   lon: 18.3, lat:  0.0, species: 'EBOV', cases: 130,  deaths: 55 },
  { year: 2021, place: 'Beni',             province: 'Nord-Kivu',  lon: 29.5, lat:  0.5, species: 'EBOV', cases: 11,   deaths: 9 },
  { year: 2022, place: 'Mbandaka',         province: 'Équateur',   lon: 18.3, lat:  0.0, species: 'EBOV', cases: 5,    deaths: 5 },
  { year: 2022, place: 'Beni',             province: 'Nord-Kivu',  lon: 29.5, lat:  0.5, species: 'EBOV', cases: 1,    deaths: 1 },
  { year: 2026, place: 'Bundibugyo border', province: 'Ituri / Uganda', lon: 30.0, lat:  0.7, species: 'BDBV', cases: 0, deaths: 0, note: '2025–26 PHEIC; cross-border Albertine Rift (case count not yet public)' },
];

export const SPECIES_COLOR: Record<EbolaSpecies, string> = {
  EBOV: '#d62728',  // Zaire ebolavirus — red
  SUDV: '#ff7f0e',  // Sudan ebolavirus — orange
  BDBV: '#9467bd',  // Bundibugyo ebolavirus — purple
};

/** Match a free-text division string to a canonical DRC province name */
export function matchProvince(division: string): DRCProvince | undefined {
  if (!division) return undefined;
  const d = division.trim().toLowerCase();
  return DRC_PROVINCES.find(p =>
    p.name.toLowerCase() === d ||
    p.altNames.some(a => a.toLowerCase() === d || d.includes(a.toLowerCase()))
  );
}
