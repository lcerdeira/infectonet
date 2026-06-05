/**
 * Vector & Host maps — per-pathogen reservoir/vector hotspot configuration.
 *
 * Each pathogen has a characteristic reservoir host and/or arthropod vector.
 * This file defines, per virus:
 *   - the vector/host emoji "drawing" and colour
 *   - curated reservoir/vector hotspots (lon, lat, species, note)
 *   - optional documented outbreak sites
 *   - map bounds and ecological overlays (forest / hydro)
 *
 * Sources: WHO, CDC, WOAH, ECDC and peer-reviewed reservoir-ecology literature.
 * Coordinates are approximate hotspot centroids.
 */

export interface HostHotspot {
  name: string;
  species: string;
  lon: number;
  lat: number;
  note: string;
}

export interface VHOutbreak {
  place: string;
  year: number;
  lon: number;
  lat: number;
  cases?: number;
  deaths?: number;
  note?: string;
}

export interface VectorHostConfig {
  /** Display label for the host/vector layer */
  layerLabel: string;
  /** Emoji glyph(s) drawn at each hotspot */
  icon: string;
  /** Accent colour (hex) */
  color: string;
  /** Is this a reservoir host, an arthropod vector, or both? */
  kind: 'reservoir' | 'vector' | 'both';
  /** One-line scientific framing shown under the map */
  blurb: string;
  hotspots: HostHotspot[];
  outbreaks?: VHOutbreak[];
  /** Map view */
  bounds: { lon: [number, number]; lat: [number, number] };
  center: { lon: number; lat: number };
  scope: 'world' | 'africa' | 'asia' | 'south america' | 'north america' | 'europe';
  /** Ecological overlays */
  showHydro?: boolean;
}

export const VECTOR_HOST_MAPS: Record<string, VectorHostConfig> = {

  // ── RABIES — dog + bat + wildlife reservoir (97% host data) ──────────────────
  rabies: {
    layerLabel: 'Rabies reservoirs',
    icon: '🦮',
    color: '#b45309',
    kind: 'reservoir',
    blurb: 'Rabies virus is maintained in distinct reservoir cycles: domestic dogs '
      + '(>99% of human deaths, mainly Africa & Asia), insectivorous & vampire bats '
      + '(Americas), and wild carnivores — foxes, raccoons, jackals, mongooses.',
    hotspots: [
      { name: 'India (dog cycle)',        species: '🐕 Domestic dog', lon: 79.0, lat: 22.0, note: 'Highest human rabies burden worldwide; dog-mediated' },
      { name: 'Sub-Saharan Africa',       species: '🐕 Domestic dog', lon: 20.0, lat:  2.0, note: 'Dog-mediated rabies endemic; under-vaccinated dog populations' },
      { name: 'SE Asia (dog cycle)',      species: '🐕 Domestic dog', lon: 105.0, lat: 14.0, note: 'Dog-mediated; Philippines, Vietnam, Indonesia' },
      { name: 'Latin America (vampire bat)', species: '🦇 Vampire bat (Desmodus)', lon: -65.0, lat: -10.0, note: 'Bat-transmitted rabies in livestock & humans, Amazon basin' },
      { name: 'North America (bats/raccoon)', species: '🦇 Bats, 🦝 raccoon', lon: -90.0, lat: 38.0, note: 'Wildlife reservoir; raccoon, skunk, bat variants' },
      { name: 'Europe/Arctic (fox)',      species: '🦊 Red & Arctic fox', lon: 30.0, lat: 60.0, note: 'Sylvatic fox cycle; oral vaccination has eliminated much of W. Europe' },
    ],
    bounds: { lon: [-130, 150], lat: [-40, 72] },
    center: { lon: 20, lat: 25 },
    scope: 'world',
  },

  // ── AVIAN FLU — migratory & domestic birds + mammal spillover ────────────────
  avianflu: {
    layerLabel: 'Bird & mammal hosts',
    icon: '🦆',
    color: '#0891b2',
    kind: 'reservoir',
    blurb: 'Wild aquatic birds (ducks, geese, gulls) are the natural reservoir of avian '
      + 'influenza. HPAI H5N1/H5N5 clade 2.3.4.4b now spills into poultry and a widening '
      + 'range of mammals — including dairy cattle, seals, foxes, and polar bears.',
    hotspots: [
      { name: 'East Asia flyway',     species: '🦆 Wild waterfowl', lon: 115.0, lat: 35.0, note: 'Major reassortment hub; live-bird markets' },
      { name: 'Central Asia flyway',  species: '🦆 Migratory geese', lon: 70.0,  lat: 48.0, note: 'Qinghai Lake lineage spread westward' },
      { name: 'US dairy cattle',      species: '🐄 Dairy cattle',    lon: -100.0, lat: 40.0, note: '2024 unprecedented bovine outbreak; farm-worker cases' },
      { name: 'Antarctica',           species: '🐧 Penguins/seabirds', lon: -60.0, lat: -63.0, note: 'HPAI reached Antarctic wildlife 2023-24 (first ever)' },
      { name: 'Svalbard (Arctic)',    species: '🐻‍❄️ Polar bear, walrus', lon: 16.0, lat: 78.0, note: 'H5N5 in polar bear & walrus 2026 (first ever, NVI)' },
      { name: 'South America coast',  species: '🦭 Sea lions, seabirds', lon: -75.0, lat: -15.0, note: 'Mass marine-mammal die-offs Peru/Chile/Argentina' },
    ],
    bounds: { lon: [-130, 150], lat: [-70, 82] },
    center: { lon: 20, lat: 25 },
    scope: 'world',
  },

  // ── HANTAVIRUS — rodent reservoir (ENSO-driven) ──────────────────────────────
  hantavirus: {
    layerLabel: 'Rodent reservoirs',
    icon: '🐁',
    color: '#9333ea',
    kind: 'reservoir',
    blurb: 'Hantaviruses are maintained in rodent reservoirs with no arthropod vector. '
      + 'Each virus has a specific host; human infection follows inhalation of aerosolised '
      + 'rodent excreta. El Niño-driven food booms trigger rodent irruptions and outbreaks.',
    hotspots: [
      { name: 'Patagonia (ANDV)',       species: '🐁 Oligoryzomys longicaudatus', lon: -71.0, lat: -42.0, note: 'Andes virus — only hantavirus with person-to-person spread' },
      { name: 'SW USA (Sin Nombre)',    species: '🐁 Peromyscus maniculatus', lon: -108.0, lat: 36.0, note: 'Deer mouse; 1993 Four Corners HPS outbreak' },
      { name: 'Scandinavia/Europe (Puumala)', species: '🐁 Bank vole', lon: 20.0, lat: 62.0, note: 'Nephropathia epidemica (mild HFRS)' },
      { name: 'East Asia (Hantaan)',    species: '🐁 Striped field mouse', lon: 125.0, lat: 38.0, note: 'Severe HFRS; Korea, China, Russia' },
      { name: 'Brazil/S. America',      species: '🐁 Sigmodontine rodents', lon: -50.0, lat: -15.0, note: 'Multiple HPS-causing hantaviruses' },
    ],
    bounds: { lon: [-125, 140], lat: [-55, 70] },
    center: { lon: 0, lat: 20 },
    scope: 'world',
  },

  // ── LASSA — Mastomys rat reservoir (Nigeria/West Africa) ─────────────────────
  lassa: {
    layerLabel: 'Rodent reservoir',
    icon: '🐀',
    color: '#dc2626',
    kind: 'reservoir',
    blurb: 'Lassa virus is maintained by the multimammate rat (Mastomys natalensis), '
      + 'which sheds virus in urine/faeces. Transmission peaks in the dry season across '
      + 'the West African "Lassa belt".',
    hotspots: [
      { name: 'Nigeria (Edo/Ondo)',   species: '🐀 Mastomys natalensis', lon: 5.6,  lat: 6.5,  note: 'Highest annual case burden; Irrua treatment centre' },
      { name: 'Sierra Leone (Kenema)', species: '🐀 Mastomys natalensis', lon: -11.2, lat: 7.9, note: 'Historic Lassa focus; KGH ward' },
      { name: 'Liberia',              species: '🐀 Mastomys natalensis', lon: -9.4,  lat: 6.5,  note: 'Endemic; Lassa belt' },
      { name: 'Guinea',               species: '🐀 Mastomys natalensis', lon: -10.0, lat: 9.5,  note: 'Forest region; cross-border transmission' },
    ],
    outbreaks: [
      { place: 'Nigeria 2018 surge', year: 2018, lon: 7.5, lat: 9.0, cases: 633, deaths: 171, note: 'Largest recorded Lassa outbreak' },
    ],
    bounds: { lon: [-16, 16], lat: [3, 16] },
    center: { lon: -2, lat: 8 },
    scope: 'africa',
  },

  // ── NIPAH — fruit bat reservoir + pig amplifier ──────────────────────────────
  nipah: {
    layerLabel: 'Bat & pig hosts',
    icon: '🦇',
    color: '#7c3aed',
    kind: 'reservoir',
    blurb: 'Nipah virus reservoir is the Pteropus fruit bat. Spillover occurs via '
      + 'date-palm sap contaminated by bats (Bangladesh) or via intermediate pig hosts '
      + '(Malaysia 1998). Person-to-person transmission documented.',
    hotspots: [
      { name: 'Bangladesh "Nipah belt"', species: '🦇 Pteropus medius', lon: 89.5, lat: 24.5, note: 'Annual winter outbreaks via raw date-palm sap' },
      { name: 'Kerala, India',          species: '🦇 Pteropus medius', lon: 76.0, lat: 11.0, note: 'Recurrent outbreaks 2018, 2021, 2023' },
      { name: 'Malaysia (1998 origin)', species: '🦇 → 🐖 pig amplifier', lon: 102.0, lat: 2.8, note: 'Original outbreak; pig-farm amplification' },
    ],
    bounds: { lon: [72, 122], lat: [-6, 30] },
    center: { lon: 95, lat: 14 },
    scope: 'asia',
  },

  // ── MARBURG — Rousettus cave bat reservoir ───────────────────────────────────
  marburg: {
    layerLabel: 'Bat reservoir',
    icon: '🦇',
    color: '#9467bd',
    kind: 'reservoir',
    blurb: 'Marburg virus reservoir is the Egyptian rousette bat (Rousettus aegyptiacus), '
      + 'a cave-roosting fruit bat. Spillover is linked to mine and cave exposure.',
    hotspots: [
      { name: 'Uganda (Kitaka/Python caves)', species: '🦇 Rousettus aegyptiacus', lon: 30.4, lat: -0.7, note: 'Miners/tourists infected in bat caves' },
      { name: 'DRC (Durba mines)',     species: '🦇 Rousettus aegyptiacus', lon: 29.8, lat: 1.7, note: '1998-2000 outbreak in gold miners' },
      { name: 'Angola (Uige)',         species: '🦇 Rousettus aegyptiacus', lon: 15.0, lat: -7.6, note: '2005 outbreak — highest CFR (~90%)' },
      { name: 'Rwanda',                species: '🦇 Rousettus aegyptiacus', lon: 30.0, lat: -2.0, note: '2024 outbreak' },
      { name: 'Equatorial Guinea/Tanzania', species: '🦇 Rousettus aegyptiacus', lon: 11.0, lat: 1.5, note: '2023 outbreaks (EG & Tanzania)' },
    ],
    bounds: { lon: [8, 42], lat: [-12, 6] },
    center: { lon: 24, lat: -3 },
    scope: 'africa',
  },

  // ── YELLOW FEVER — mosquito vector + primate reservoir ───────────────────────
  yellowfever: {
    layerLabel: 'Mosquito vector & primates',
    icon: '🦟',
    color: '#ca8a04',
    kind: 'both',
    blurb: 'Yellow fever virus cycles between non-human primates and forest mosquitoes '
      + '(Haemagogus, Sabethes in the Americas; Aedes in Africa). Urban transmission by '
      + 'Aedes aegypti can ignite explosive epidemics.',
    hotspots: [
      { name: 'Amazon basin (sylvatic)', species: '🐒 Howler monkeys + 🦟 Haemagogus', lon: -60.0, lat: -4.0, note: 'Sylvatic cycle; monkey die-offs precede human cases' },
      { name: 'Brazil SE (2017-18)',  species: '🦟 Haemagogus', lon: -44.0, lat: -20.0, note: 'Largest recent epidemic; spread toward coast' },
      { name: 'West Africa savanna',  species: '🦟 Aedes', lon: 0.0, lat: 9.0, note: 'Intermediate (savanna) cycle' },
      { name: 'Central Africa',       species: '🐒 primates + 🦟 Aedes', lon: 20.0, lat: 2.0, note: 'Endemic zone; periodic outbreaks' },
    ],
    bounds: { lon: [-80, 45], lat: [-30, 18] },
    center: { lon: -15, lat: -5 },
    scope: 'world',
  },

  // ── WEST NILE — mosquito vector + bird reservoir ─────────────────────────────
  westnile: {
    layerLabel: 'Mosquito vector & birds',
    icon: '🦟',
    color: '#16a34a',
    kind: 'both',
    blurb: 'West Nile virus is amplified in birds and transmitted by Culex mosquitoes. '
      + 'Humans and horses are dead-end hosts. Summer heat accelerates the transmission cycle.',
    hotspots: [
      { name: 'Mediterranean basin', species: '🦟 Culex + 🐦 corvids', lon: 14.0, lat: 42.0, note: 'Annual summer outbreaks (Italy, Greece, Balkans)' },
      { name: 'USA (continental)',   species: '🦟 Culex + 🐦 birds', lon: -98.0, lat: 39.0, note: 'Established since 1999; nationwide' },
      { name: 'Sub-Saharan Africa',  species: '🐦 Birds (enzootic)', lon: 20.0, lat: 8.0, note: 'Ancestral enzootic range' },
    ],
    bounds: { lon: [-125, 50], lat: [0, 60] },
    center: { lon: -20, lat: 35 },
    scope: 'world',
  },

  // ── MPOX — rodent/primate reservoir ──────────────────────────────────────────
  mpox: {
    layerLabel: 'Animal reservoir',
    icon: '🐁',
    color: '#db2777',
    kind: 'reservoir',
    blurb: 'The mpox reservoir is thought to be rope squirrels and other forest rodents, '
      + 'with primates as incidental hosts. Clade I (Central Africa, DRC) is more severe; '
      + 'clade II drove the 2022 global outbreak.',
    hotspots: [
      { name: 'DRC (Clade I/Ia/Ib)',  species: '🐁 Rope squirrels, rodents', lon: 23.0, lat: -2.0, note: 'Endemic reservoir zone; 2024 clade Ib emergence' },
      { name: 'West Africa (Clade II)', species: '🐁 Forest rodents', lon: 5.0, lat: 7.0, note: 'Nigeria — source of 2022 global clade IIb' },
      { name: 'Congo Basin forest',   species: '🐒 Primates (incidental)', lon: 18.0, lat: 1.0, note: 'Forest interface spillover' },
    ],
    bounds: { lon: [-18, 40], lat: [-13, 16] },
    center: { lon: 12, lat: 2 },
    scope: 'africa',
  },

  // ── OROPOUCHE — Culicoides midge vector ──────────────────────────────────────
  oropouche: {
    layerLabel: 'Midge vector',
    icon: '🦟',
    color: '#0d9488',
    kind: 'vector',
    blurb: 'Oropouche virus is transmitted mainly by the biting midge Culicoides paraensis '
      + '(and some Culex). A major 2023-24 Amazonian expansion reached new areas of Brazil, '
      + 'Cuba and beyond, with vertical-transmission concerns.',
    hotspots: [
      { name: 'Amazonas, Brazil',     species: '🦟 Culicoides paraensis', lon: -64.0, lat: -4.0, note: 'Historic endemic focus; 2024 surge' },
      { name: 'Acre/Rondônia',        species: '🦟 Culicoides paraensis', lon: -67.0, lat: -9.5, note: '2024 expansion zone' },
      { name: 'Cuba (2024)',          species: '🦟 Culicoides', lon: -79.0, lat: 22.0, note: 'First Caribbean detection 2024' },
      { name: 'Peru/Bolivia Amazon',  species: '🦟 Culicoides', lon: -70.0, lat: -12.0, note: 'Amazon spread' },
    ],
    bounds: { lon: [-82, -34], lat: [-25, 24] },
    center: { lon: -60, lat: -5 },
    scope: 'south america',
  },

  // ── DENGUE / ZIKA / CHIKUNGUNYA — Aedes aegypti vector ───────────────────────
  dengue: {
    layerLabel: 'Aedes mosquito vector',
    icon: '🦟',
    color: '#e11d48',
    kind: 'vector',
    blurb: 'Dengue is transmitted by Aedes aegypti (and Ae. albopictus) — urban, '
      + 'container-breeding mosquitoes. Range is expanding with warming and urbanisation.',
    hotspots: [
      { name: 'Brazil (hyperendemic)', species: '🦟 Aedes aegypti', lon: -47.0, lat: -15.0, note: 'World\'s largest dengue burden' },
      { name: 'SE Asia',              species: '🦟 Aedes aegypti', lon: 105.0, lat: 12.0, note: 'Hyperendemic; all 4 serotypes co-circulate' },
      { name: 'South Asia',           species: '🦟 Aedes aegypti', lon: 80.0, lat: 20.0, note: 'India, Bangladesh, Sri Lanka' },
      { name: 'Caribbean/C. America', species: '🦟 Aedes aegypti', lon: -85.0, lat: 15.0, note: 'Recurrent epidemics' },
      { name: 'Southern Europe (Ae. albopictus)', species: '🦟 Aedes albopictus', lon: 10.0, lat: 43.0, note: 'Autochthonous transmission expanding north' },
    ],
    bounds: { lon: [-110, 130], lat: [-35, 50] },
    center: { lon: 10, lat: 10 },
    scope: 'world',
  },

  zika: {
    layerLabel: 'Aedes mosquito vector',
    icon: '🦟',
    color: '#0ea5e9',
    kind: 'vector',
    blurb: 'Zika virus is transmitted by Aedes aegypti, with sexual and vertical '
      + 'transmission also documented. The 2015-16 Americas epidemic linked Zika to '
      + 'congenital microcephaly.',
    hotspots: [
      { name: 'NE Brazil (2015-16)',  species: '🦟 Aedes aegypti', lon: -38.0, lat: -8.0, note: 'Epicentre of congenital Zika syndrome' },
      { name: 'Americas',             species: '🦟 Aedes aegypti', lon: -75.0, lat: 5.0, note: 'Widespread 2015-16 epidemic' },
      { name: 'SE Asia/Pacific',      species: '🦟 Aedes aegypti', lon: 110.0, lat: 5.0, note: 'Endemic circulation' },
    ],
    bounds: { lon: [-110, 130], lat: [-35, 35] },
    center: { lon: 0, lat: 0 },
    scope: 'world',
  },

  chikungunya: {
    layerLabel: 'Aedes mosquito vector',
    icon: '🦟',
    color: '#f59e0b',
    kind: 'vector',
    blurb: 'Chikungunya virus is transmitted by Aedes aegypti and Ae. albopictus. '
      + 'The E1-A226V mutation enhanced albopictus transmission, enabling temperate spread.',
    hotspots: [
      { name: 'India/South Asia',     species: '🦟 Aedes', lon: 78.0, lat: 18.0, note: 'Large recurrent epidemics' },
      { name: 'SE Asia',              species: '🦟 Aedes', lon: 105.0, lat: 12.0, note: 'Endemic' },
      { name: 'Americas (2013→)',     species: '🦟 Aedes aegypti', lon: -70.0, lat: 0.0, note: 'Introduced 2013, swept the Americas' },
      { name: 'Indian Ocean (2005-06)', species: '🦟 Aedes albopictus', lon: 55.5, lat: -21.0, note: 'Réunion epidemic; E1-A226V mutation' },
    ],
    bounds: { lon: [-110, 130], lat: [-35, 40] },
    center: { lon: 30, lat: 5 },
    scope: 'world',
  },

  // ── RIFT VALLEY FEVER — mosquito vector + livestock ──────────────────────────
  riftvalley: {
    layerLabel: 'Mosquito vector & livestock',
    icon: '🦟',
    color: '#ea580c',
    kind: 'both',
    blurb: 'Rift Valley fever virus is transmitted by floodwater Aedes and Culex '
      + 'mosquitoes and amplified in livestock. Heavy El Niño / positive-IOD rains flood '
      + 'dambos, hatching infected mosquito eggs and igniting epizootics.',
    hotspots: [
      { name: 'Kenya/Somalia (Horn)', species: '🦟 Aedes + 🐄 livestock', lon: 42.0, lat: 1.0, note: '1997-98 & 2006-07 post-El Niño epidemics' },
      { name: 'Tanzania',             species: '🦟 + 🐄 livestock', lon: 35.0, lat: -5.0, note: 'Flood-linked outbreaks' },
      { name: 'Sudan/Sahel',          species: '🦟 + 🐄 livestock', lon: 30.0, lat: 14.0, note: '2007 large human outbreak' },
      { name: 'Southern Africa',      species: '🦟 + 🐑 sheep', lon: 25.0, lat: -28.0, note: '2010 South Africa epizootic' },
      { name: 'Arabian Peninsula',    species: '🦟 + 🐄', lon: 44.0, lat: 17.0, note: '2000 — first spread outside Africa' },
    ],
    bounds: { lon: [10, 55], lat: [-32, 22] },
    center: { lon: 33, lat: -3 },
    scope: 'africa',
  },

  // ── CRIMEAN-CONGO HF — tick vector + livestock ───────────────────────────────
  crimean: {
    layerLabel: 'Tick vector & livestock',
    icon: '🕷️',
    color: '#78716c',
    kind: 'both',
    blurb: 'Crimean-Congo haemorrhagic fever virus is transmitted by Hyalomma ticks and '
      + 'amplified in livestock. Human cases follow tick bites or contact with infected '
      + 'animal blood (abattoir workers, herders).',
    hotspots: [
      { name: 'Turkey/Caucasus',      species: '🕷️ Hyalomma marginatum', lon: 36.0, lat: 40.0, note: 'Highest reported case numbers' },
      { name: 'Central Asia',         species: '🕷️ Hyalomma', lon: 65.0, lat: 42.0, note: 'Endemic; Afghanistan, Kazakhstan, Pakistan' },
      { name: 'Middle East',          species: '🕷️ Hyalomma + 🐄', lon: 45.0, lat: 33.0, note: 'Iran, Iraq — abattoir-linked' },
      { name: 'Sub-Saharan Africa',   species: '🕷️ Hyalomma + 🐄', lon: 25.0, lat: 5.0, note: 'Widespread enzootic' },
      { name: 'Iberia/SW Europe',     species: '🕷️ Hyalomma marginatum', lon: -5.0, lat: 39.0, note: 'Emerging — Spain autochthonous cases' },
    ],
    bounds: { lon: [-12, 80], lat: [0, 55] },
    center: { lon: 35, lat: 35 },
    scope: 'world',
  },
};
