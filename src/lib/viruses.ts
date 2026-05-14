import type { VirusInfo } from '@/types/virus';

// Colour palette — one per group
export const GROUP_COLORS: Record<string, string> = {
  respiratory:  '#3B82F6', // blue-500
  vector_borne: '#10B981', // emerald-500
  haemorrhagic: '#EF4444', // red-500
  zoonotic:     '#F59E0B', // amber-500
  childhood:    '#8B5CF6', // violet-500
  other:        '#6B7280', // gray-500
  retroviral:   '#EC4899', // pink-500 — retroviruses & endogenous
  gastrointestinal: '#F97316', // orange-500
};

export const VIRUSES: VirusInfo[] = [
  // ── Respiratory ─────────────────────────────────────────────────────────────
  { id: 'covid19',    label: 'COVID-19 (SARS-CoV-2)',        abbr: 'COVID-19',    family: 'Coronaviridae',    genome: 'ssRNA(+)',               group: 'respiratory',  color: GROUP_COLORS.respiratory },
  { id: 'merscov',    label: 'MERS-CoV',                     abbr: 'MERS-CoV',    family: 'Coronaviridae',    genome: 'ssRNA(+)',               group: 'respiratory',  color: GROUP_COLORS.respiratory },
  { id: 'merssars',   label: 'MERS-SARS',                    abbr: 'MERS-SARS',   family: 'Coronaviridae',    genome: 'ssRNA(+)',               group: 'respiratory',  color: GROUP_COLORS.respiratory },
  { id: 'influenza',  label: 'Influenza A (H5/H5N2)',         abbr: 'Influenza A', family: 'Orthomyxoviridae', genome: 'ssRNA(-)',               group: 'respiratory',  color: GROUP_COLORS.respiratory },
  { id: 'avianflu',   label: 'Avian Influenza A (H5)',        abbr: 'Avian Flu',   family: 'Orthomyxoviridae', genome: 'ssRNA(-)',               group: 'respiratory',  color: GROUP_COLORS.respiratory },
{ id: 'rsv',        label: 'Respiratory Syncytial Virus',   abbr: 'RSV',         family: 'Pneumoviridae',    genome: 'ssRNA(-)',               group: 'respiratory',  color: GROUP_COLORS.respiratory },

  // ── Vector-borne ─────────────────────────────────────────────────────────────
  { id: 'dengue',      label: 'Dengue virus',          abbr: 'Dengue',      family: 'Flaviviridae',      genome: 'ssRNA(+)', group: 'vector_borne', color: GROUP_COLORS.vector_borne },
  { id: 'zika',        label: 'Zika virus',            abbr: 'Zika',        family: 'Flaviviridae',      genome: 'ssRNA(+)', group: 'vector_borne', color: GROUP_COLORS.vector_borne },
  { id: 'chikungunya', label: 'Chikungunya virus',     abbr: 'CHIKV',       family: 'Togaviridae',       genome: 'ssRNA(+)', group: 'vector_borne', color: GROUP_COLORS.vector_borne },
  { id: 'yellowfever', label: 'Yellow Fever virus',    abbr: 'Yellow Fever',family: 'Flaviviridae',      genome: 'ssRNA(+)', group: 'vector_borne', color: GROUP_COLORS.vector_borne },
  { id: 'oropouche',   label: 'Oropouche virus',       abbr: 'Oropouche',   family: 'Peribunyaviridae',  genome: 'ssRNA(-)', group: 'vector_borne', color: GROUP_COLORS.vector_borne },
  { id: 'riftvalley',  label: 'Rift Valley Fever',     abbr: 'RVF',         family: 'Phenuiviridae',     genome: 'ssRNA(-)', group: 'vector_borne', color: GROUP_COLORS.vector_borne },

  // ── Viral Haemorrhagic Fever ─────────────────────────────────────────────────
  { id: 'ebola',   label: 'Ebola virus',                  abbr: 'Ebola',  family: 'Filoviridae',   genome: 'ssRNA(-)', group: 'haemorrhagic', color: GROUP_COLORS.haemorrhagic },
  { id: 'marburg', label: 'Marburg virus',                abbr: 'Marburg',family: 'Filoviridae',   genome: 'ssRNA(-)', group: 'haemorrhagic', color: GROUP_COLORS.haemorrhagic },
  { id: 'lassa',   label: 'Lassa Fever',                  abbr: 'Lassa',  family: 'Arenaviridae',  genome: 'ssRNA(-)', group: 'haemorrhagic', color: GROUP_COLORS.haemorrhagic },
  { id: 'crimean', label: 'Crimean-Congo Haemorrhagic Fever', abbr: 'CCHF',family: 'Nairoviridae', genome: 'ssRNA(-)', group: 'haemorrhagic', color: GROUP_COLORS.haemorrhagic },

  // ── Zoonotic & Neurological ──────────────────────────────────────────────────
  { id: 'rabies',      label: 'Rabies virus',  abbr: 'Rabies',    family: 'Rhabdoviridae',  genome: 'ssRNA(-)', group: 'zoonotic', color: GROUP_COLORS.zoonotic },
  { id: 'nipah',       label: 'Nipah virus',   abbr: 'Nipah',     family: 'Paramyxoviridae',genome: 'ssRNA(-)', group: 'zoonotic', color: GROUP_COLORS.zoonotic },
  { id: 'hantavirus',  label: 'Hantavirus',    abbr: 'Hantavirus',family: 'Hantaviridae',   genome: 'ssRNA(-)', group: 'zoonotic', color: GROUP_COLORS.zoonotic },

  // ── Childhood / Vaccine-preventable ─────────────────────────────────────────
  { id: 'measles', label: 'Measles virus',    abbr: 'Measles', family: 'Paramyxoviridae', genome: 'ssRNA(-)', group: 'childhood', color: GROUP_COLORS.childhood },
  { id: 'mumps',   label: 'Mumps virus',      abbr: 'Mumps',   family: 'Paramyxoviridae', genome: 'ssRNA(-)', group: 'childhood', color: GROUP_COLORS.childhood },
  { id: 'rubella', label: 'Rubella virus',    abbr: 'Rubella', family: 'Matonaviridae',   genome: 'ssRNA(+)', group: 'childhood', color: GROUP_COLORS.childhood },
  { id: 'hpv',     label: 'Human Papillomavirus (HPV)', abbr: 'HPV', family: 'Papillomaviridae', genome: 'dsDNA', group: 'childhood', color: GROUP_COLORS.childhood },

  // ── Other & Emerging ─────────────────────────────────────────────────────────
  { id: 'mpox',       label: 'Mpox (monkeypox)',                abbr: 'Mpox',      family: 'Poxviridae',         genome: 'dsDNA',               group: 'other', color: GROUP_COLORS.other },
  { id: 'diseasex',   label: 'Disease X (WHO Priority)',        abbr: 'Disease X', family: 'Unknown',            genome: 'Unknown',             group: 'other', color: GROUP_COLORS.other },
  { id: 'westnile',   label: 'West Nile Virus',                 abbr: 'WNV',       family: 'Flaviviridae',       genome: 'ssRNA(+)',             group: 'vector_borne', color: GROUP_COLORS.vector_borne },

  // ── Respiratory (additional) ─────────────────────────────────────────────────
  { id: 'adenovirus', label: 'Adenovirus',                      abbr: 'Adenovirus',family: 'Adenoviridae',       genome: 'dsDNA',                group: 'respiratory', color: GROUP_COLORS.respiratory },
  { id: 'influenzab', label: 'Influenza B',                     abbr: 'Influenza B',family: 'Orthomyxoviridae', genome: 'ssRNA(-)',              group: 'respiratory', color: GROUP_COLORS.respiratory },
  { id: 'piv',        label: 'Parainfluenza Virus (PIV)',       abbr: 'PIV',       family: 'Paramyxoviridae',    genome: 'ssRNA(-)',              group: 'respiratory', color: GROUP_COLORS.respiratory },
  { id: 'rhinovirus', label: 'Rhinovirus (RV)',                 abbr: 'RV',        family: 'Picornaviridae',     genome: 'ssRNA(+)',              group: 'respiratory', color: GROUP_COLORS.respiratory },
  { id: 'hcov',       label: 'Human Coronavirus (HCoV)',        abbr: 'HCoV',      family: 'Coronaviridae',      genome: 'ssRNA(+)',              group: 'respiratory', color: GROUP_COLORS.respiratory },
  { id: 'hmpv',       label: 'Human Metapneumovirus (HMPV)',    abbr: 'HMPV',      family: 'Pneumoviridae',      genome: 'ssRNA(-)',              group: 'respiratory', color: GROUP_COLORS.respiratory },

  // ── Childhood / Vaccine-preventable (additional) ─────────────────────────────
  { id: 'varicella',  label: 'Varicella-Zoster Virus (VZV)',    abbr: 'VZV',       family: 'Herpesviridae',      genome: 'dsDNA',                group: 'childhood',   color: GROUP_COLORS.childhood },
  { id: 'rotavirus',  label: 'Rotavirus',                       abbr: 'Rotavirus', family: 'Reoviridae',         genome: 'dsRNA',                group: 'childhood',   color: GROUP_COLORS.childhood },
  { id: 'enterovirus',label: 'Enterovirus (EV / HFMD)',         abbr: 'EV/HFMD',   family: 'Picornaviridae',     genome: 'ssRNA(+)',              group: 'childhood',   color: GROUP_COLORS.childhood },
  { id: 'polio',      label: 'Poliovirus',                      abbr: 'Polio',     family: 'Picornaviridae',     genome: 'ssRNA(+)',              group: 'childhood',   color: GROUP_COLORS.childhood },
  { id: 'parvovirus', label: 'Parvovirus B19',                  abbr: 'Parvo B19', family: 'Parvoviridae',       genome: 'ssDNA',                group: 'childhood',   color: GROUP_COLORS.childhood },

  // ── Gastrointestinal ─────────────────────────────────────────────────────────
  { id: 'hepatitisa', label: 'Hepatitis A Virus (HAV)',         abbr: 'HAV',       family: 'Picornaviridae',     genome: 'ssRNA(+)',              group: 'gastrointestinal', color: GROUP_COLORS.gastrointestinal },
  { id: 'hepatitisb', label: 'Hepatitis B Virus (HBV)',         abbr: 'HBV',       family: 'Hepadnaviridae',     genome: 'dsDNA/RT',             group: 'gastrointestinal', color: GROUP_COLORS.gastrointestinal },
  { id: 'hepatitisc', label: 'Hepatitis C Virus (HCV)',         abbr: 'HCV',       family: 'Flaviviridae',       genome: 'ssRNA(+)',              group: 'gastrointestinal', color: GROUP_COLORS.gastrointestinal },
  { id: 'norovirus',  label: 'Norovirus',                       abbr: 'Norovirus', family: 'Caliciviridae',      genome: 'ssRNA(+)',              group: 'gastrointestinal', color: GROUP_COLORS.gastrointestinal },

  // ── Herpesviridae ────────────────────────────────────────────────────────────
  { id: 'hsv',        label: 'Herpes Simplex Virus (HSV)',      abbr: 'HSV',       family: 'Herpesviridae',      genome: 'dsDNA',                group: 'other',       color: GROUP_COLORS.other },
  { id: 'cmv',        label: 'Cytomegalovirus (CMV)',           abbr: 'CMV',       family: 'Herpesviridae',      genome: 'dsDNA',                group: 'other',       color: GROUP_COLORS.other },

  // ── Retroviruses & Endogenous ─────────────────────────────────────────────────
  { id: 'hiv',        label: 'HIV',                             abbr: 'HIV',       family: 'Retroviridae',       genome: 'ssRNA(+)/Retrovirus',  group: 'retroviral',  color: GROUP_COLORS.retroviral },
  { id: 'htlv',       label: 'HTLV-1 / HTLV-2',                abbr: 'HTLV',      family: 'Retroviridae',       genome: 'ssRNA(+)/Retrovirus',  group: 'retroviral',  color: GROUP_COLORS.retroviral },
  { id: 'siv',        label: 'Simian Immunodeficiency Virus',   abbr: 'SIV',       family: 'Retroviridae',       genome: 'ssRNA(+)/Retrovirus',  group: 'retroviral',  color: GROUP_COLORS.retroviral },
  { id: 'fiv',        label: 'Feline Immunodeficiency Virus',   abbr: 'FIV',       family: 'Retroviridae',       genome: 'ssRNA(+)/Retrovirus',  group: 'retroviral',  color: GROUP_COLORS.retroviral },
  { id: 'mlv',        label: 'Murine Leukaemia Virus (MLV)',    abbr: 'MLV',       family: 'Retroviridae',       genome: 'ssRNA(+)/Retrovirus',  group: 'retroviral',  color: GROUP_COLORS.retroviral },
  { id: 'herv',       label: 'Human Endogenous Retroviruses',   abbr: 'HERV',      family: 'Retroviridae',       genome: 'ssRNA(+)/Retrovirus',  group: 'retroviral',  color: GROUP_COLORS.retroviral },
];

export const VIRUS_MAP = new Map(VIRUSES.map(v => [v.id, v]));

export function getVirus(id: string): VirusInfo | undefined {
  return VIRUS_MAP.get(id);
}

export function getVirusesByGroup(group: string): VirusInfo[] {
  return VIRUSES.filter(v => v.group === group);
}
