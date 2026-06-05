/**
 * InfectoNET — data-quality cleanup (mongosh script)
 * ===================================================
 * Non-destructive: contaminant records are FLAGGED with { excluded: true }
 * rather than deleted, so the operation is fully reversible. The API routes
 * filter out { excluded: true }.
 *
 * Run:  mongosh < scripts/fix_data_quality.js
 *
 * Fixes:
 *   1. Strip embedded quotes from country fields (all virus DBs)
 *   2. Flag non-human herpesvirus contaminants in the VZV (varicella) DB
 *   3. Canonicalise HPV genotype aliases  (16 / HPV 16 / type 16 → HPV16)
 *   4. Flag poliovirus records that leaked into the enterovirus DB
 */

const VIRUS_IDS = [
  'covid19','merscov','merssars','influenza','avianflu','rsv','dengue','zika',
  'chikungunya','yellowfever','oropouche','riftvalley','ebola','marburg','lassa',
  'crimean','rabies','nipah','hantavirus','measles','mumps','rubella','hpv','mpox',
  'diseasex','westnile','adenovirus','influenzab','piv','rhinovirus','hcov','hmpv',
  'varicella','rotavirus','enterovirus','polio','parvovirus','hepatitisa','hepatitisb',
  'hepatitisc','norovirus','hsv','cmv','hiv','htlv','siv','fiv','mlv','herv',
];

print('═══ 1. Strip embedded quotes from country fields ═══');
let quoteFixed = 0;
for (const vid of VIRUS_IDS) {
  const g = db.getSiblingDB(vid).genomes;
  for (const field of ['COUNTRY_ONLY', 'COUNTRY', 'country']) {
    const q = {}; q[field] = /^\s*["'].*["']\s*$/;
    const r = g.updateMany(q, [{
      $set: { [field]: { $trim: { input: { $trim: { input: `$${field}` } }, chars: '"\'' } } },
    }]);
    if (r.modifiedCount) { quoteFixed += r.modifiedCount; print(`  ${vid}.${field}: ${r.modifiedCount}`); }
  }
}
print(`  Total country fields de-quoted: ${quoteFixed}`);

print('\n═══ 2. Flag non-human herpesvirus in VZV (varicella) DB ═══');
{
  const g = db.getSiblingDB('varicella').genomes;
  // Keep ONLY human VZV: "Human alphaherpesvirus 3" / "Varicellovirus humanalpha3" / contains varicella/VZV
  const keep = /Human alphaherpesvirus 3|Varicellovirus humanalpha3|varicella|VZV|chickenpox|zoster/i;
  const before = g.countDocuments({});
  const r = g.updateMany(
    { organism: { $exists: true, $not: keep } },
    { $set: { excluded: true, excluded_reason: 'non-human herpesvirus (not VZV)' } }
  );
  const kept = g.countDocuments({ excluded: { $ne: true } });
  print(`  total ${before} → flagged ${r.modifiedCount} contaminants → ${kept} genuine human VZV remain`);
}

print('\n═══ 3. Canonicalise HPV genotype aliases ═══');
{
  const g = db.getSiblingDB('hpv').genomes;
  // Build canonical mapping from distinct GENOTYPE values
  const distinct = g.distinct('GENOTYPE').filter(x => x);
  let mapped = 0;
  for (const raw of distinct) {
    const s = String(raw).trim();
    // Extract a type number from common alias forms: "16", "HPV16", "HPV-16",
    // "HPV 16", "type 16", "16V" → HPV16
    const m = s.match(/(?:hpv[\s_-]*|type[\s_-]*)?(\d{1,3})/i);
    let canon = null;
    if (m && /^(hpv|type|\d|\s|-|_)/i.test(s) && !/[a-z]{3,}/i.test(s.replace(/hpv|type/ig, ''))) {
      canon = 'HPV' + m[1];
    } else if (/^(alpha|beta|gamma|mu|nu)/i.test(s)) {
      // genus-level designation — capitalise consistently
      canon = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() + ' (genus)';
    }
    if (canon && canon !== s) {
      const r = g.updateMany({ GENOTYPE: raw }, { $set: { GENOTYPE: canon } });
      mapped += r.modifiedCount;
    }
  }
  print(`  HPV genotype records canonicalised: ${mapped}`);
  // Show resulting top genotypes
  const top = g.aggregate([
    { $match: { GENOTYPE: { $nin: [null, ''] } } },
    { $group: { _id: '$GENOTYPE', n: { $sum: 1 } } },
    { $sort: { n: -1 } }, { $limit: 10 },
  ]).toArray();
  top.forEach(d => print(`    ${d._id}: ${d.n}`));
}

print('\n═══ 4. Flag poliovirus leaked into enterovirus DB ═══');
{
  const g = db.getSiblingDB('enterovirus').genomes;
  const polioRx = /poliovirus|enterovirus c\b|sabin|EV-?C/i;
  const r = g.updateMany(
    { $or: [
        { organism: polioRx }, { TITLE: polioRx }, { title: polioRx },
        { GENOTYPE: /^polio|PV[123]/i },
    ] },
    { $set: { excluded: true, excluded_reason: 'poliovirus — tracked in polio dashboard' } }
  );
  const kept = g.countDocuments({ excluded: { $ne: true } });
  print(`  flagged ${r.modifiedCount} poliovirus records in enterovirus DB → ${kept} enterovirus remain`);
}

print('\n═══ Done ═══');
