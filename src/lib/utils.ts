import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Resolve the best genotype field from a sequence record (handles mixed case) */
export function resolveGenotype(record: Record<string, unknown>): string {
  const candidates = [
    record.GENOTYPE,
    record.genotype,
    record.LINEAGE,
    record.lineage,
    // COVID-19 Nextstrain pango lineage
    record.pango_lineage,
    // HPV type
    record.hpv_type,
    // Hantavirus species / clade
    record.hanta_species,
    record.hanta_clade,
    // Ebola virus species (EBOV, SUDV, BDBV, etc.)
    record.ebola_species,
    // Lassa fever lineage
    record.lassa_lineage,
    // Norovirus detailed genotype
    record.norovirus_genotype,
    // SIV host species
    record.siv_species,
    // Standard fields
    record.clade,
    record.serotype,
    record.hiv_type,
    record.influenza_subtype,
    record.CLADE,
    record.SEROTYPE,
    record.subtype,
    record.genogroup,
  ];
  for (const c of candidates) {
    if (c && typeof c === 'string' && c.trim() !== '' && c.trim() !== 'Unknown') {
      return c.trim();
    }
  }
  return 'Unknown';
}

/** Aggregate records by country → count + genotype breakdown */
export function aggregateByCountry(
  records: Record<string, unknown>[]
): Record<string, { count: number; genotypeCounts: Record<string, number> }> {
  const result: Record<string, { count: number; genotypeCounts: Record<string, number> }> = {};

  for (const r of records) {
    const country = (
      (r.COUNTRY as string | undefined) ||
      (r.COUNTRY_ONLY as string | undefined) ||
      (r.country as string | undefined)
    )?.trim();
    if (!country) continue;

    if (!result[country]) {
      result[country] = { count: 0, genotypeCounts: {} };
    }
    result[country].count++;

    const gt = resolveGenotype(r);
    result[country].genotypeCounts[gt] = (result[country].genotypeCounts[gt] ?? 0) + 1;
  }

  return result;
}

/** Aggregate records into genotype × year timeseries */
export function aggregateGenotypeTrends(
  records: Record<string, unknown>[]
): { year: number; genotype: string; count: number }[] {
  const map: Record<string, number> = {};

  for (const r of records) {
    // Support YEAR (int), DATE (string/int starting with year), date field
    let year = r.YEAR as number | undefined;
    if (!year) {
      const raw = r.DATE ?? r.date ?? r.collection_date;
      if (raw) {
        const parsed = parseInt(String(raw).substring(0, 4), 10);
        if (parsed >= 1900 && parsed <= 2100) year = parsed;
      }
    }
    if (!year || year < 1950 || year > 2100) continue;

    const gt = resolveGenotype(r);
    const key = `${year}__${gt}`;
    map[key] = (map[key] ?? 0) + 1;
  }

  return Object.entries(map).map(([key, count]) => {
    const [yearStr, genotype] = key.split('__');
    return { year: Number(yearStr), genotype, count };
  }).sort((a, b) => a.year - b.year);
}
