Pathogens
=========

InfectoNET currently catalogues **50+ viral pathogens** organised into eight
disease groups. Each pathogen is identified by a short lowercase ``id`` used
in dashboard URLs and API endpoints.

.. contents:: Groups
   :local:
   :depth: 1

Respiratory Viruses
-------------------

.. list-table::
   :widths: 18 30 22 15 15
   :header-rows: 1

   * - ID
     - Name
     - Family
     - Genome
     - GISAID db
   * - ``covid19``
     - COVID-19 (SARS-CoV-2)
     - Coronaviridae
     - ssRNA(+)
     - EpiCoV
   * - ``influenza``
     - Influenza A (H1N1 / H3N2)
     - Orthomyxoviridae
     - ssRNA(-)
     - EpiFlu
   * - ``avianflu``
     - Avian Influenza A (H5Nx)
     - Orthomyxoviridae
     - ssRNA(-)
     - EpiFlu
   * - ``influenzab``
     - Influenza B
     - Orthomyxoviridae
     - ssRNA(-)
     - EpiFlu
   * - ``rsv``
     - Respiratory Syncytial Virus
     - Pneumoviridae
     - ssRNA(-)
     - EpiRSV
   * - ``merscov``
     - MERS-CoV
     - Coronaviridae
     - ssRNA(+)
     - —
   * - ``hcov``
     - Human Coronavirus (HCoV)
     - Coronaviridae
     - ssRNA(+)
     - —
   * - ``hmpv``
     - Human Metapneumovirus
     - Pneumoviridae
     - ssRNA(-)
     - —
   * - ``piv``
     - Parainfluenza Virus (PIV)
     - Paramyxoviridae
     - ssRNA(-)
     - —
   * - ``rhinovirus``
     - Rhinovirus
     - Picornaviridae
     - ssRNA(+)
     - —
   * - ``adenovirus``
     - Adenovirus
     - Adenoviridae
     - dsDNA
     - —

Vector-borne Viruses
--------------------

.. list-table::
   :widths: 18 30 22 15 15
   :header-rows: 1

   * - ID
     - Name
     - Family
     - Genome
     - GISAID db
   * - ``dengue``
     - Dengue virus (DENV 1–4)
     - Flaviviridae
     - ssRNA(+)
     - EpiArbo
   * - ``zika``
     - Zika virus
     - Flaviviridae
     - ssRNA(+)
     - EpiArbo
   * - ``chikungunya``
     - Chikungunya virus
     - Togaviridae
     - ssRNA(+)
     - EpiArbo
   * - ``yellowfever``
     - Yellow Fever virus
     - Flaviviridae
     - ssRNA(+)
     - EpiArbo
   * - ``westnile``
     - West Nile Virus
     - Flaviviridae
     - ssRNA(+)
     - EpiArbo
   * - ``oropouche``
     - Oropouche virus
     - Peribunyaviridae
     - ssRNA(-)
     - EpiArbo
   * - ``riftvalley``
     - Rift Valley Fever
     - Phenuiviridae
     - ssRNA(-)
     - EpiArbo

Viral Haemorrhagic Fevers
--------------------------

.. list-table::
   :widths: 18 30 22 15
   :header-rows: 1

   * - ID
     - Name
     - Family
     - Genome
   * - ``ebola``
     - Ebola virus (EBOV / SUDV / BDBV …)
     - Filoviridae
     - ssRNA(-)
   * - ``marburg``
     - Marburg virus
     - Filoviridae
     - ssRNA(-)
   * - ``lassa``
     - Lassa Fever (lineages I–IV)
     - Arenaviridae
     - ssRNA(-)
   * - ``crimean``
     - Crimean-Congo Haemorrhagic Fever
     - Nairoviridae
     - ssRNA(-)

Zoonotic & Neurological
------------------------

.. list-table::
   :widths: 18 30 22 15
   :header-rows: 1

   * - ID
     - Name
     - Family
     - Genome
   * - ``rabies``
     - Rabies virus
     - Rhabdoviridae
     - ssRNA(-)
   * - ``nipah``
     - Nipah virus
     - Paramyxoviridae
     - ssRNA(-)
   * - ``hantavirus``
     - Hantavirus (Sin Nombre, Andes …)
     - Hantaviridae
     - ssRNA(-)

Childhood / Vaccine-preventable
--------------------------------

.. list-table::
   :widths: 18 30 22 15
   :header-rows: 1

   * - ID
     - Name
     - Family
     - Genome
   * - ``measles``
     - Measles virus
     - Paramyxoviridae
     - ssRNA(-)
   * - ``mumps``
     - Mumps virus
     - Paramyxoviridae
     - ssRNA(-)
   * - ``rubella``
     - Rubella virus
     - Matonaviridae
     - ssRNA(+)
   * - ``varicella``
     - Varicella-Zoster Virus (VZV)
     - Herpesviridae
     - dsDNA
   * - ``rotavirus``
     - Rotavirus
     - Reoviridae
     - dsRNA
   * - ``enterovirus``
     - Enterovirus / HFMD (EV-A71)
     - Picornaviridae
     - ssRNA(+)
   * - ``polio``
     - Poliovirus
     - Picornaviridae
     - ssRNA(+)
   * - ``parvovirus``
     - Parvovirus B19
     - Parvoviridae
     - ssDNA
   * - ``hpv``
     - Human Papillomavirus (HPV)
     - Papillomaviridae
     - dsDNA

Gastrointestinal Viruses
-------------------------

.. list-table::
   :widths: 18 30 22 15
   :header-rows: 1

   * - ID
     - Name
     - Family
     - Genome
   * - ``hepatitisa``
     - Hepatitis A Virus (HAV)
     - Picornaviridae
     - ssRNA(+)
   * - ``hepatitisb``
     - Hepatitis B Virus (HBV)
     - Hepadnaviridae
     - dsDNA/RT
   * - ``hepatitisc``
     - Hepatitis C Virus (HCV)
     - Flaviviridae
     - ssRNA(+)
   * - ``norovirus``
     - Norovirus
     - Caliciviridae
     - ssRNA(+)

Retroviral
----------

.. list-table::
   :widths: 18 30 22 15
   :header-rows: 1

   * - ID
     - Name
     - Family
     - Genome
   * - ``hiv``
     - HIV-1 / HIV-2
     - Retroviridae
     - ssRNA(+)/RT
   * - ``htlv``
     - HTLV-1 / HTLV-2
     - Retroviridae
     - ssRNA(+)/RT
   * - ``siv``
     - Simian Immunodeficiency Virus
     - Retroviridae
     - ssRNA(+)/RT

Other / Emerging
----------------

.. list-table::
   :widths: 18 30 22 15
   :header-rows: 1

   * - ID
     - Name
     - Family
     - Genome
   * - ``mpox``
     - Mpox (monkeypox)
     - Poxviridae
     - dsDNA
   * - ``hsv``
     - Herpes Simplex Virus (HSV-1/2)
     - Herpesviridae
     - dsDNA
   * - ``cmv``
     - Cytomegalovirus (CMV)
     - Herpesviridae
     - dsDNA
   * - ``diseasex``
     - Disease X (WHO priority placeholder)
     - Unknown
     - Unknown

Genotype / Lineage Labels
--------------------------

Each pathogen uses the most clinically meaningful classification scheme:

.. list-table::
   :widths: 20 80
   :header-rows: 1

   * - Pathogen
     - Genotype scheme
   * - COVID-19
     - WHO variant-wave groups (Alpha, Delta, Omicron BA.1/BA.2/XBB/JN.1/KP …)
       derived from PANGO lineage prefix rules; Nextstrain epoch clades used as
       fallback
   * - Influenza A
     - HA subtype (H1N1pdm09, H3N2, H5N1, H5N6 …)
   * - Influenza B
     - Victoria / Yamagata lineages
   * - Dengue
     - Serotype (DENV-1 to DENV-4) + Nextstrain genotype (e.g. DENV1/I)
   * - RSV
     - RSV-A / RSV-B with Nextstrain clade (A.1, B.1.1.1 …)
   * - Mpox
     - PANGO clade (Ia, Ib, IIa, IIb …)
   * - HIV
     - Subtype (B, C, A1, CRF01_AE …)
   * - Hepatitis C
     - Genotype 1–7
   * - HPV
     - HPV type (HPV16, HPV18, HPV6 …)
   * - Hantavirus
     - Species / haplogroup (Andes, Sin Nombre, Puumala …)
   * - Ebola
     - Species (EBOV, SUDV, BDBV, TAFV, RESTV)
   * - Norovirus
     - Genogroup + genotype (GI.1, GII.4 Sydney …)
