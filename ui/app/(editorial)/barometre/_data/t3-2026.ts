import { fr } from "@codegouvfr/react-dsfr"

import type { HeroBar } from "../_components/BarometreHero"
import type { RegionValue } from "../_components/RegionsMap"

export const PUBLISHED_DATE = "2026-11-02"

// Trio validé pour les daltonismes : séparation des teintes adjacentes vérifiée sur surface claire.
const COLOR_SPONTANEES = fr.colors.options.blueEcume.sun247moon675.default
const COLOR_REPONSE = fr.colors.options.orangeTerreBattue.main645.default
const COLOR_REDIRECTION = fr.colors.options.purpleGlycine.main494.default

export const BAROMETRE_FAQ = [
  {
    question: "Combien de candidatures ont été envoyées sur La bonne alternance au 3e trimestre 2026 ?",
    answer: "707 059 candidatures ont été déposées sur La bonne alternance au 3e trimestre 2026, soit une progression de 109 % par rapport au 3e trimestre 2025.",
  },
  {
    question: "Quelle est la part des candidatures spontanées sur La bonne alternance au 3e trimestre 2026 ?",
    answer:
      "Au 3e trimestre 2026, 76 % des candidatures déposées sur La bonne alternance sont des candidatures spontanées, contre 36 % au 3e trimestre 2025. Ce levier permet aux candidats d’accéder au marché caché des entreprises qui recrutent sans publier d’offres.",
  },
  {
    question: "Quels sont les métiers les plus recherchés par les recruteurs en alternance au 3e trimestre 2026 ?",
    answer:
      "Sur La bonne alternance, les métiers les plus recherchés par les recruteurs au 3e trimestre 2026 sont serveur / serveuse en restauration (4,8 %), assistant commercial / assistante commerciale (3,6 %), assistant / assistante comptable (3,5 %), attaché commercial / attachée commerciale (3,4 %) et équipier polyvalent / équipière polyvalente de restauration rapide (3,3 %).",
  },
  {
    question: "Quels secteurs recrutent le plus en alternance au 3e trimestre 2026 ?",
    answer:
      "Les secteurs les plus représentés dans les offres sur La bonne alternance au 3e trimestre 2026 sont la restauration traditionnelle (7,9 %), la restauration rapide (4,6 %), les activités des sièges sociaux (3,8 %), la boulangerie-pâtisserie (3,5 %) et le conseil pour les affaires et la gestion (3,4 %).",
  },
  {
    question: "Quelle région concentre le plus d’offres d’alternance sur La bonne alternance au 3e trimestre 2026 ?",
    answer:
      "L’Île-de-France concentre 37,1 % des offres sur La bonne alternance au 3e trimestre 2026, devant Auvergne-Rhône-Alpes (9,6 %) et l’Occitanie (9,5 %). Les cinq premières régions représentent 72 % du total.",
  },
]

export const BAROMETRE_KEYWORDS = [
  "baromètre alternance",
  "marché de l’alternance",
  "alternance T3 2026",
  "candidatures alternance",
  "offres apprentissage",
  "métiers en alternance",
  "secteurs qui recrutent en alternance",
  "secteurs sous tension en alternance",
  "La bonne alternance",
]

export const topMetiersRecruteurs = [
  { label: "Serveur / Serveuse en restauration", value: 4.8, displayValue: "4,8 %" },
  { label: "Assistant commercial / Assistante commerciale", value: 3.6, displayValue: "3,6 %" },
  { label: "Assistant / Assistante comptable", value: 3.5, displayValue: "3,5 %" },
  { label: "Attaché commercial / Attachée commerciale", value: 3.4, displayValue: "3,4 %" },
  { label: "Équipier polyvalent / Équipière polyvalente de restauration rapide", value: 3.3, displayValue: "3,3 %" },
  { label: "Secrétaire", value: 3.2, displayValue: "3,2 %" },
  { label: "Vendeur / Vendeuse en épicerie", value: 3.1, displayValue: "3,1 %" },
  { label: "Commis / Commise de cuisine", value: 2.9, displayValue: "2,9 %" },
  { label: "Employé / Employée de rayon libre-service", value: 2.4, displayValue: "2,4 %" },
  { label: "Cuisinier / Cuisinière", value: 1.9, displayValue: "1,9 %" },
]

export const topSecteursRecruteurs = [
  { label: "Restauration traditionnelle", value: 7.9, displayValue: "7,9 %" },
  { label: "Restauration de type rapide", value: 4.6, displayValue: "4,6 %" },
  { label: "Activités des sièges sociaux", value: 3.8, displayValue: "3,8 %" },
  { label: "Boulangerie et boulangerie-pâtisserie", value: 3.5, displayValue: "3,5 %" },
  { label: "Conseil pour les affaires et autres conseils de gestion", value: 3.4, displayValue: "3,4 %" },
  { label: "Activités comptables", value: 2.7, displayValue: "2,7 %" },
  { label: "Hôtels et hébergement similaire", value: 2.2, displayValue: "2,2 %" },
  { label: "Supermarchés", value: 2.1, displayValue: "2,1 %" },
  { label: "Conseil en systèmes et logiciels informatiques", value: 1.5, displayValue: "1,5 %" },
  { label: "Coiffure", value: 1.4, displayValue: "1,4 %" },
]

export const candidaturesHero: HeroBar[] = [
  { label: "T1 2025", shortLabel: "T1 25", value: 299741, display: "299 741" },
  { label: "T2 2025", shortLabel: "T2 25", value: 311520, display: "311 520" },
  { label: "T3 2025", shortLabel: "T3 25", value: 337928, display: "337 928", showValue: true },
  { label: "T4 2025", shortLabel: "T4 25", value: 193024, display: "193 024" },
  { label: "T1 2026", shortLabel: "T1 26", value: 319768, display: "319 768" },
  { label: "T2 2026", shortLabel: "T2 26", value: 675719, display: "675 719" },
  { label: "T3 2026", shortLabel: "T3 26", value: 707059, display: "707 059", note: "candidatures, +109 % en un an", highlighted: true },
]

export const topRegionsOffres: RegionValue[] = [
  { name: "Île-de-France", share: 37.1, displayValue: "2 284 (37,1 %)" },
  { name: "Auvergne-Rhône-Alpes", share: 9.6, displayValue: "589 (9,6 %)" },
  { name: "Occitanie", share: 9.5, displayValue: "588 (9,5 %)" },
  { name: "Provence-Alpes-Côte d’Azur", share: 8.5, displayValue: "525 (8,5 %)" },
  { name: "Hauts-de-France", share: 7.6, displayValue: "466 (7,6 %)" },
]

export const flopRegionsOffres: RegionValue[] = [
  { name: "Guadeloupe", share: 0.3, displayValue: "19 (0,3 %)" },
  { name: "Martinique", share: 0.3, displayValue: "18 (0,3 %)" },
  { name: "Corse", share: 0.2, displayValue: "11 (0,2 %)" },
  { name: "Mayotte", share: 0.1, displayValue: "5 (0,1 %)" },
  { name: "Guyane", share: 0, displayValue: "1 (0,0 %)" },
]

export const topMetiersCandidats = [
  { label: "Assistant / Assistante RH", value: 8515, displayValue: "8 515" },
  { label: "Assistant commercial / Assistante commerciale", value: 8010, displayValue: "8 010" },
  { label: "Chargé / Chargée de communication", value: 7066, displayValue: "7 066" },
  { label: "Assistant / Assistante comptable", value: 6118, displayValue: "6 118" },
  { label: "Attaché commercial / Attachée commerciale", value: 5158, displayValue: "5 158" },
  { label: "Secrétaire", value: 5059, displayValue: "5 059" },
  { label: "Comptable", value: 4122, displayValue: "4 122" },
  { label: "Assistant / Assistante de gestion administrative", value: 3349, displayValue: "3 349" },
  { label: "Assistant / Assistante de direction", value: 2981, displayValue: "2 981" },
  { label: "Responsable commercial / commerciale", value: 2758, displayValue: "2 758" },
]

export const flopMetiersCandidats = [
  "Chargé / Chargée de formation en entreprise",
  "Chargé / Chargée de développement social",
  "Caissier / Caissière de l’emballage industriel",
  "Aviculteur / Avicultrice",
  "Assembleur / Assembleuse d’ouvrages en bois",
  "Animateur / Animatrice du patrimoine",
  "Aide agricole en production végétale",
  "Agent / Agente d’exploitation de la voirie",
  "Agent / Agente de stérilisation de service hospitalier",
  "Agent / Agente de quai manutentionnaire",
]

export const topRegionsCandidatures: RegionValue[] = [
  { name: "Île-de-France", share: 53.9, displayValue: "93 216 (53,9 %)" },
  { name: "Auvergne-Rhône-Alpes", share: 8.6, displayValue: "14 844 (8,6 %)" },
  { name: "Provence-Alpes-Côte d’Azur", share: 6.4, displayValue: "11 051 (6,4 %)" },
  { name: "Occitanie", share: 6.4, displayValue: "10 989 (6,4 %)" },
  { name: "Hauts-de-France", share: 5.4, displayValue: "9 261 (5,4 %)" },
]

export const flopRegionsCandidatures: RegionValue[] = [
  { name: "Guadeloupe", share: 0.3, displayValue: "490 (0,3 %)" },
  { name: "Martinique", share: 0.2, displayValue: "341 (0,2 %)" },
  { name: "Mayotte", share: 0.1, displayValue: "194 (0,1 %)" },
  { name: "Corse", share: 0.1, displayValue: "91 (0,1 %)" },
  { name: "Guyane", share: 0, displayValue: "13 (0,0 %)" },
]

export const secteursSousTension = [
  { label: "Édition de logiciels applicatifs", detail: "64 opp. / 2 178 candidatures", value: 2.9, displayValue: "2,9" },
  { label: "Activités des organisations patronales et consulaires", detail: "39 opp. / 1 193 candidatures", value: 3.3, displayValue: "3,3" },
  { label: "Autres activités récréatives et de loisirs", detail: "48 opp. / 1 388 candidatures", value: 3.5, displayValue: "3,5" },
  { label: "Programmation informatique", detail: "141 opp. / 4 059 candidatures", value: 3.5, displayValue: "3,5" },
  { label: "Conseil en systèmes et logiciels informatiques", detail: "251 opp. / 6 908 candidatures", value: 3.6, displayValue: "3,6" },
]

export const secteursMoinsSousTension = [
  { label: "Boulangerie et boulangerie-pâtisserie", detail: "444 opp. / 2 246 candidatures", value: 19.8, displayValue: "19,8" },
  { label: "Restauration traditionnelle", detail: "292 opp. / 2 344 candidatures", value: 12.5, displayValue: "12,5" },
  { label: "Accueil de jeunes enfants", detail: "130 opp. / 1 105 candidatures", value: 11.8, displayValue: "11,8" },
  { label: "Soins de beauté", detail: "109 opp. / 1 053 candidatures", value: 10.4, displayValue: "10,4" },
  { label: "Restauration de type rapide", detail: "258 opp. / 2 494 candidatures", value: 10.3, displayValue: "10,3" },
]

export const niveauDiplome = [
  { label: "Infrabac", detail: "CAP, BEP : 1 571 offres", value: 1571, share: "25,5 %" },
  { label: "Bac", detail: "Bac, Bac Pro, BP : 1 037 offres", value: 1037, share: "16,8 %" },
  { label: "Bac+2", detail: "BTS, DEUST : 2 191 offres", value: 2191, share: "35,5 %" },
  { label: "Bac+3", detail: "Licence, BUT : 744 offres", value: 744, share: "12,1 %" },
  { label: "Bac+5", detail: "Master, ingénieur : 624 offres", value: 624, share: "10,1 %" },
]

export const candidaturesParTypeLegend = [
  { label: "Candidatures spontanées", color: COLOR_SPONTANEES },
  { label: "Candidatures sur les offres La bonne alternance", color: COLOR_REPONSE },
  { label: "Candidatures sur les offres de nos partenaires", color: COLOR_REDIRECTION },
]

const candidaturesType = (label: string, total: number, totalDisplay: string, spontanees: number, offres: number, partenaires: number, highlighted = false) => ({
  label,
  shortLabel: label.replace(" 20", " "),
  totalDisplay,
  highlighted,
  segments: [
    { value: Math.round((total * spontanees) / 100), color: COLOR_SPONTANEES, label: `Spontanées (${spontanees} %)`, insideLabel: `${spontanees} %` },
    { value: Math.round((total * offres) / 100), color: COLOR_REPONSE, label: `Sur offre (${offres} %)` },
    { value: Math.round((total * partenaires) / 100), color: COLOR_REDIRECTION, label: `Partenaires (${partenaires} %)` },
  ],
})

export const candidaturesParType = [
  candidaturesType("T1 2025", 299741, "299 741", 83, 10, 0),
  candidaturesType("T2 2025", 311520, "311 520", 46, 34, 2),
  candidaturesType("T3 2025", 337928, "337 928", 36, 48, 2),
  candidaturesType("T4 2025", 193024, "193 024", 49, 42, 1),
  candidaturesType("T1 2026", 319768, "319 768", 74, 17, 1),
  candidaturesType("T2 2026", 675719, "675 719", 72, 21, 7),
  candidaturesType("T3 2026", 707059, "707 059", 76, 19, 5, true),
]

export const topSecteursSpontanees = [
  { label: "Activités comptables", value: 35691, displayValue: "35 691 (6,7 %)" },
  { label: "Conseil en systèmes et logiciels informatiques", value: 25053, displayValue: "25 053 (4,7 %)" },
  { label: "Activités hospitalières", value: 10425, displayValue: "10 425 (1,9 %)" },
  { label: "Programmation informatique", value: 10282, displayValue: "10 282 (1,9 %)" },
  { label: "Ingénierie, études techniques", value: 9834, displayValue: "9 834 (1,8 %)" },
  { label: "Activités des agences de travail temporaire", value: 9157, displayValue: "9 157 (1,7 %)" },
  { label: "Travaux d’installation d’équipements thermiques et de climatisation", value: 9130, displayValue: "9 130 (1,7 %)" },
  { label: "Édition de logiciels applicatifs", value: 8772, displayValue: "8 772 (1,6 %)" },
  { label: "Agences immobilières", value: 8287, displayValue: "8 287 (1,5 %)" },
  { label: "Travaux d’installation électrique dans tous locaux", value: 8204, displayValue: "8 204 (1,5 %)" },
]
