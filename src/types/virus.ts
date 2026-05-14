export type VirusGroup =
  | 'respiratory'
  | 'vector_borne'
  | 'haemorrhagic'
  | 'zoonotic'
  | 'childhood'
  | 'other'
  | 'retroviral'
  | 'gastrointestinal';

export interface VirusInfo {
  /** Unique key matching MongoDB collection / data folder names */
  id: string;
  /** Display name */
  label: string;
  /** Short abbreviation for chips / map legends */
  abbr: string;
  /** Virus family */
  family: string;
  /** Genome type */
  genome: string;
  /** Thematic group */
  group: VirusGroup;
  /** Hex accent colour for the group card */
  color: string;
}

/** A single sequence record returned from the API */
export interface SequenceRecord {
  ACCESSION?: string;
  COUNTRY?: string;
  COLLECTION_DATE?: string;
  YEAR?: number;
  GENOTYPE?: string;
  LINEAGE?: string;
  clade?: string;
  serotype?: string;
  hiv_type?: string;
  influenza_subtype?: string;
  LATITUDE?: number;
  LONGITUDE?: number;
  [key: string]: unknown;
}

/** Aggregated country-level stats used by the map */
export interface CountryStat {
  country: string;
  count: number;
  genotypeCounts: Record<string, number>;
}

/** Aggregated genotype/year timeseries */
export interface GenotypeTrend {
  year: number;
  genotype: string;
  count: number;
}
