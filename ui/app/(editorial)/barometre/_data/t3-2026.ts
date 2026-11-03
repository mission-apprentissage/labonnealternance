import type { HeroMetric } from "../_components/BarometreHero"
import type { CompositionRow, CompositionSeries } from "../_components/CompositionBars"
import type { RegionValue } from "../_components/RegionsMap"

export const PUBLISHED_DATE = "2026-11-03"
export const PUBLISHED_LABEL = "Publié le 3 novembre 2026"

// Couleurs fixes, identiques en thème clair et sombre, alignées sur les graphiques sources du baromètre.
const COLOR_SPONTANEES = "#6a6af4"
const COLOR_OFFRES_LBA = "#000091"
const COLOR_PARTENAIRES = "#e4794a"

export const BAROMETRE_FAQ = [
  {
    question: "Combien de personnes utilisent La bonne alternance ?",
    answer:
      "Chaque mois, 500 000 usagers candidats, recruteurs et organismes de formations utilisent La bonne alternance. Depuis janvier 2026, près de 5 millions de personnes ont utilisé le service.",
  },
  {
    question: "Comment a évolué la fréquentation de La bonne alternance aux deuxième et troisième trimestres 2026 ?",
    answer: "Par rapport à 2025, la fréquentation a fortement augmenté : +66 % de visiteurs, +56 % de candidats et +156 % de candidatures envoyées.",
  },
  {
    question: "Dans quelles entreprises démarrent les contrats en alternance ?",
    answer: "70 % des contrats en alternance démarrés au cours des douze derniers mois l’ont été dans des petites et moyennes entreprises (source : base DECA).",
  },
  {
    question: "Combien de candidats attire une offre en alternance sur La bonne alternance ?",
    answer:
      "Une offre suscite en moyenne six intentions de candidature. Certains métiers du numérique attirent plus de vingt candidats par offre, tandis que des métiers de l’aide à la personne, du bâtiment ou de l’industrie peinent à dépasser une candidature par offre.",
  },
]

export const BAROMETRE_KEYWORDS = [
  "baromètre alternance",
  "marché de l’alternance",
  "alternance 2026",
  "candidatures alternance",
  "offres apprentissage",
  "TPE PME alternance",
  "métiers qui recrutent en alternance",
  "candidature spontanée alternance",
  "La bonne alternance",
]

export const usageMetrics: HeroMetric[] = [
  { label: "Visites", before: 2243768, after: 3737789, beforeDisplay: "2 243 768", afterDisplay: "3 737 789", change: "+66,6 %" },
  { label: "Candidats", before: 114769, after: 179333, beforeDisplay: "114 769", afterDisplay: "179 333", change: "+56,3 %" },
  { label: "Candidatures", before: 542975, after: 1393848, beforeDisplay: "542 975", afterDisplay: "1 393 848", change: "+156,7 %" },
]

export const clicsParType = [
  { label: "Candidatures spontanées", detail: "1 067 888 clics", value: 1067888, share: "42,2 %", color: COLOR_SPONTANEES, textColor: "#fff" },
  { label: "Offres partenaires", detail: "1 035 922 clics", value: 1035922, share: "40,9 %", color: COLOR_PARTENAIRES, textColor: "#161616" },
  { label: "Offres La bonne alternance", detail: "428 420 clics", value: 428420, share: "16,9 %", color: COLOR_OFFRES_LBA, textColor: "#fff" },
]

const SERIES = {
  spontanees: { key: "spontanees", label: "Candidatures spontanées (algorithme La bonne alternance)", color: COLOR_SPONTANEES, textColor: "#fff" },
  offresLba: { key: "offresLba", label: "Offres La bonne alternance", color: COLOR_OFFRES_LBA, textColor: "#fff" },
  partenaires: { key: "partenaires", label: "Offres partenaires", color: COLOR_PARTENAIRES, textColor: "#161616" },
} satisfies Record<string, CompositionSeries>

export const opportunitesSeries: CompositionSeries[] = [SERIES.offresLba, SERIES.partenaires, SERIES.spontanees]
export const clicsSeries: CompositionSeries[] = [SERIES.spontanees, SERIES.offresLba, SERIES.partenaires]

export const opportunitesParTaille: CompositionRow[] = [
  { label: "TPE (0-19 salariés)", total: "189 355 opportunités (38,5 %)", segments: { offresLba: 4, partenaires: 7, spontanees: 89 } },
  { label: "PME (20-249 salariés)", total: "87 499 opportunités (17,8 %)", segments: { offresLba: 4, partenaires: 27, spontanees: 69 } },
  { label: "ETI et GE (250 salariés et plus)", total: "45 032 opportunités (9,1 %)", segments: { offresLba: 3, partenaires: 88, spontanees: 9 } },
  { label: "Taille non renseignée", total: "170 389 opportunités (34,6 %)", segments: { offresLba: 3, partenaires: 97, spontanees: 0 } },
]

export const clicsParTaille: CompositionRow[] = [
  { label: "TPE (0-19 salariés)", total: "794 222 clics (31,4 %)", segments: { spontanees: 73, offresLba: 19, partenaires: 9 } },
  { label: "PME (20-249 salariés)", total: "572 146 clics (22,6 %)", segments: { spontanees: 65, offresLba: 17, partenaires: 18 } },
  { label: "ETI et GE (250 salariés et plus)", total: "337 506 clics (13,3 %)", segments: { spontanees: 18, offresLba: 12, partenaires: 70 } },
  { label: "Taille non renseignée", total: "828 356 clics (32,7 %)", segments: { spontanees: 7, offresLba: 17, partenaires: 76 } },
]

export const opportunitesParNiveau: CompositionRow[] = [
  { label: "CAP, BEP", total: "21 216 offres (26,0 %)", segments: { offresLba: 17, partenaires: 83 } },
  { label: "Bac, Bac Pro, BP", total: "14 817 offres (18,2 %)", segments: { offresLba: 20, partenaires: 80 } },
  { label: "BTS, DEUST (Bac+2)", total: "17 207 offres (21,1 %)", segments: { offresLba: 33, partenaires: 67 } },
  { label: "Licence, BUT (Bac+3)", total: "13 855 offres (17,0 %)", segments: { offresLba: 15, partenaires: 85 } },
  { label: "Master, ingénieur (Bac+5)", total: "14 427 offres (17,7 %)", segments: { offresLba: 11, partenaires: 89 } },
]

export const clicsParNiveau: CompositionRow[] = [
  { label: "CAP, BEP", total: "77 928 clics (12,1 %)", segments: { offresLba: 55, partenaires: 45 } },
  { label: "Bac, Bac Pro, BP", total: "74 865 clics (11,6 %)", segments: { offresLba: 67, partenaires: 33 } },
  { label: "BTS, DEUST (Bac+2)", total: "201 242 clics (31,2 %)", segments: { offresLba: 72, partenaires: 28 } },
  { label: "Licence, BUT (Bac+3)", total: "149 124 clics (23,2 %)", segments: { offresLba: 55, partenaires: 45 } },
  { label: "Master, ingénieur (Bac+5)", total: "140 855 clics (21,9 %)", segments: { offresLba: 56, partenaires: 44 } },
]

export const metiersLesPlusSollicites = [
  { label: "Monteur / Monteuse vidéo", detail: "4,5 k clics / 106 offres", value: 42.7, displayValue: "42,7" },
  { label: "Préparateur / Préparatrice en pharmacie", detail: "8,0 k clics / 230 offres", value: 35, displayValue: "35,0" },
  { label: "Administrateur / Administratrice de systèmes d’information (SI)", detail: "9,0 k clics / 263 offres", value: 34.3, displayValue: "34,3" },
  { label: "Administrateur / Administratrice réseaux - télécoms", detail: "5,0 k clics / 156 offres", value: 32.2, displayValue: "32,2" },
  { label: "Développeur / Développeuse logiciel ou d’application", detail: "2,8 k clics / 102 offres", value: 27.9, displayValue: "27,9" },
  { label: "Expert / Experte systèmes et réseaux informatiques", detail: "6,2 k clics / 228 offres", value: 27, displayValue: "27,0" },
  { label: "Éducateur spécialisé / Éducatrice spécialisée", detail: "2,7 k clics / 103 offres", value: 26, displayValue: "26,0" },
  { label: "Ingénieur / Ingénieure sécurité informatique", detail: "4,2 k clics / 166 offres", value: 25.2, displayValue: "25,2" },
  { label: "Technicien / Technicienne d’exploitation informatique", detail: "10 k clics / 426 offres", value: 24.5, displayValue: "24,5" },
  { label: "Responsable paie et administration du personnel", detail: "3,2 k clics / 138 offres", value: 23.3, displayValue: "23,3" },
]

export const metiersLesMoinsSollicites = [
  { label: "Boucher / Bouchère", detail: "672 clics / 1,9 k offres", value: 0.3, displayValue: "0,3" },
  { label: "Assistant / Assistante de vie aux familles", detail: "1,0 k clics / 3,0 k offres", value: 0.4, displayValue: "0,4" },
  { label: "Agent / Agente de propreté de locaux", detail: "645 clics / 611 offres", value: 1.1, displayValue: "1,1" },
  { label: "Conducteur / Conductrice d’engins de chantier", detail: "519 clics / 484 offres", value: 1.1, displayValue: "1,1" },
  { label: "Tourneur-fraiseur / Tourneuse-fraiseuse", detail: "770 clics / 678 offres", value: 1.1, displayValue: "1,1" },
  { label: "Accompagnant éducatif et social (AES) / Accompagnante éducative et sociale (AES)", detail: "937 clics / 768 offres", value: 1.2, displayValue: "1,2" },
  { label: "Chargé / Chargée de produit en assurances", detail: "944 clics / 749 offres", value: 1.3, displayValue: "1,3" },
  { label: "Agent / Agente d’exploitation des réseaux d’assainissement", detail: "638 clics / 504 offres", value: 1.3, displayValue: "1,3" },
  { label: "Mécanicien / Mécanicienne des véhicules des transports routiers", detail: "761 clics / 599 offres", value: 1.3, displayValue: "1,3" },
  { label: "Chargé / Chargée d’affaires bancaires entreprise", detail: "1,5 k clics / 1,1 k offres", value: 1.3, displayValue: "1,3" },
]

export const ratioParRegion: RegionValue[] = [
  { name: "Île-de-France", value: 8.5, displayValue: "8,5", detail: "1,0 M clics / 117 k offres" },
  { name: "Mayotte", value: 6.9, displayValue: "6,9", detail: "3,3 k clics / 474 offres" },
  { name: "Hauts-de-France", value: 5.7, displayValue: "5,7", detail: "184 k clics / 32 k offres" },
  { name: "Occitanie", value: 5.3, displayValue: "5,3", detail: "208 k clics / 39 k offres" },
  { name: "Grand Est", value: 4.9, displayValue: "4,9", detail: "152 k clics / 31 k offres" },
  { name: "Provence-Alpes-Côte d’Azur", value: 4.8, displayValue: "4,8", detail: "169 k clics / 35 k offres" },
  { name: "Centre-Val de Loire", value: 4.7, displayValue: "4,7", detail: "70 k clics / 15 k offres" },
  { name: "Auvergne-Rhône-Alpes", value: 4.7, displayValue: "4,7", detail: "272 k clics / 58 k offres" },
  { name: "Pays de la Loire", value: 3.7, displayValue: "3,7", detail: "93 k clics / 25 k offres" },
  { name: "Nouvelle-Aquitaine", value: 3.6, displayValue: "3,6", detail: "148 k clics / 41 k offres" },
  { name: "Normandie", value: 3.6, displayValue: "3,6", detail: "70 k clics / 19 k offres" },
  { name: "La Réunion", value: 3.5, displayValue: "3,5", detail: "29 k clics / 8,0 k offres" },
  { name: "Bourgogne-Franche-Comté", value: 3.1, displayValue: "3,1", detail: "50 k clics / 16 k offres" },
  { name: "Guadeloupe", value: 2.9, displayValue: "2,9", detail: "8,7 k clics / 3,0 k offres" },
  { name: "Bretagne", value: 2.7, displayValue: "2,7", detail: "60 k clics / 22 k offres" },
  { name: "Martinique", value: 2.7, displayValue: "2,7", detail: "5,3 k clics / 2,0 k offres" },
  { name: "Guyane", value: 2.1, displayValue: "2,1", detail: "2,0 k clics / 946 offres" },
  { name: "Corse", value: 0.9, displayValue: "0,9", detail: "1,9 k clics / 2,1 k offres" },
]

export const ratioClasses = [
  { min: 8, label: "8 et plus" },
  { min: 5, label: "De 5 à 8" },
  { min: 4, label: "De 4 à 5" },
  { min: 3, label: "De 3 à 4" },
  { min: 0, label: "Moins de 3" },
]
