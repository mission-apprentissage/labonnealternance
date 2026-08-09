import { fr } from "@codegouvfr/react-dsfr"

export const PUBLISHED_DATE = "2026-05-13"

const COLOR_OFFRES = fr.colors.decisions.background.actionHigh.blueFrance.default
const COLOR_CANDIDATURES = fr.colors.decisions.background.actionHigh.greenBourgeon.default
// Palette daltonien-safe pour le graphe empilé (bleu foncé / orange / gris) :
// le couple bleu+orange est distinguable par tous les types de daltonisme, le gris se détache par sa luminosité.
const COLOR_SPONTANEES = fr.colors.decisions.background.actionHigh.blueFrance.default
const COLOR_REPONSE = fr.colors.decisions.background.actionHigh.orangeTerreBattue.default
const COLOR_REDIRECTION = fr.colors.decisions.background.actionHigh.grey.default

export const BAROMETRE_FAQ = [
  {
    question: "Quels sont les métiers les plus recherchés par les recruteurs en alternance au premier trimestre 2026 ?",
    answer:
      "Au T1 2026 sur La bonne alternance, les métiers les plus recherchés par les recruteurs sont l’agent de cuisine (3 094 offres), l’employé(e) polyvalent(e) de restauration (1 850), serveur / serveuse (1 790), commercial(e) (1 527) et assistant(e) administratif(ve) (1 039).",
  },
  {
    question: "Quels secteurs recrutent le plus en alternance au premier trimestre 2026 ?",
    answer:
      "Les secteurs qui publient le plus d’offres d’alternance sur La bonne alternance au T1 2026 sont la restauration traditionnelle (9 648 offres), la restauration rapide (4 583), la formation continue d’adultes (3 968), la boulangerie-pâtisserie (3 475) et le commerce de détail de meubles (2 383).",
  },
  {
    question: "Quelle est la part des candidatures spontanées sur La bonne alternance au T1 2026 ?",
    answer:
      "Au premier trimestre 2026, 74 % des candidatures envoyées sur La bonne alternance sont des candidatures spontanées, soit près de 8 sur 10. Ce levier permet aux candidats d’accéder au marché caché des entreprises qui recrutent sans publier d’offres.",
  },
  {
    question: "Comment évolue le marché de l’alternance au premier trimestre 2026 ?",
    answer:
      "Pour la première fois depuis 2018, les entrées en apprentissage reculent en France (-4,8 % en 2025 sur un an, source DARES). Sur La bonne alternance, les offres déposées par les recruteurs se maintiennent (+1 % vs T1 2025) et les candidatures progressent fortement (+58 % en mars 2026 vs mars 2025).",
  },
  {
    question: "Quelle région concentre le plus d’offres d’alternance sur La bonne alternance au T1 2026 ?",
    answer:
      "L’Île-de-France concentre 27,5 % des offres d’alternance déposées sur La bonne alternance au T1 2026, devant le Grand Est (11,7 %) et Auvergne-Rhône-Alpes (10,3 %). Ces trois régions représentent près d’une offre sur deux.",
  },
  {
    question: "Quels métiers sont les plus sous tension en alternance au T1 2026 ?",
    answer:
      "Les métiers les plus sous tension (plus de candidats que d’offres) sur La bonne alternance au T1 2026 sont le développement web, le data analyst, l’administration de systèmes d’information, le graphisme et le contrôle budgétaire. À l’inverse, les métiers du BTP (maçon, couvreur, mécanicien d’engins de chantier) restent peu concurrentiels.",
  },
]

export const BAROMETRE_KEYWORDS = [
  "baromètre alternance",
  "marché de l’alternance",
  "alternance T1 2026",
  "candidatures alternance",
  "offres apprentissage",
  "métiers en alternance",
  "secteurs qui recrutent en alternance",
  "tensions alternance par région",
  "La bonne alternance",
]

export const offresParTrimestre = [
  { label: "T1 2025", segments: [{ value: 5840, color: COLOR_OFFRES, label: "Offres" }] },
  { label: "T2 2025", segments: [{ value: 8920, color: COLOR_OFFRES, label: "Offres" }] },
  { label: "T3 2025", segments: [{ value: 6980, color: COLOR_OFFRES, label: "Offres" }] },
  { label: "T4 2025", segments: [{ value: 3420, color: COLOR_OFFRES, label: "Offres" }] },
  { label: "T1 2026", segments: [{ value: 5950, color: COLOR_OFFRES, label: "Offres" }], annotation: "+1 %", highlighted: true },
]

export const topMetiersRecruteurs = [
  { label: "Agent de cuisine", value: 3094 },
  { label: "Employé(e) polyvalent(e) de restauration", value: 1850 },
  { label: "Serveur / Serveuse", value: 1790 },
  { label: "Commercial(e)", value: 1527 },
  { label: "Assistant(e) administratif(ve)", value: 1039 },
  { label: "Vendeur(se) en boulangerie-pâtisserie", value: 784 },
  { label: "Employé(e) polyvalent(e) de libre-service", value: 719 },
  { label: "Esthéticien(ne) praticien(ne)", value: 617 },
  { label: "Assistant(e) comptable", value: 531 },
  { label: "Aide-boulanger / Aide-boulangère", value: 463 },
]

export const topSecteursRecruteurs = [
  { label: "Restauration traditionnelle", value: 9648 },
  { label: "Restauration de type rapide", value: 4583 },
  { label: "Formation continue d’adultes", value: 3968 },
  { label: "Boulangerie et boulangerie-pâtisserie", value: 3475 },
  { label: "Commerce de détail de meubles", value: 2383 },
  { label: "Conseil pour les affaires et autres conseils de gestion", value: 1788 },
  { label: "Services des traiteurs", value: 1671 },
  { label: "Édition de livres", value: 1656 },
  { label: "Activités des sièges sociaux", value: 1649 },
  { label: "Hôtels et hébergement similaire", value: 1455 },
]

export const candidaturesParMois = [
  { label: "Janvier 2025", shortLabel: "Jan. 25", segments: [{ value: 89000, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
  { label: "Février 2025", shortLabel: "Fév. 25", segments: [{ value: 105000, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
  { label: "Mars 2025", shortLabel: "Mars 25", segments: [{ value: 105500, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
  { label: "Avril 2025", shortLabel: "Avr. 25", segments: [{ value: 82000, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
  { label: "Mai 2025", shortLabel: "Mai 25", segments: [{ value: 108000, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
  { label: "Juin 2025", shortLabel: "Juin 25", segments: [{ value: 121000, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
  { label: "Juillet 2025", shortLabel: "Juil. 25", segments: [{ value: 115000, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
  { label: "Août 2025", shortLabel: "Août 25", segments: [{ value: 89000, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
  { label: "Septembre 2025", shortLabel: "Sept. 25", segments: [{ value: 123000, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
  { label: "Octobre 2025", shortLabel: "Oct. 25", segments: [{ value: 78000, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
  { label: "Novembre 2025", shortLabel: "Nov. 25", segments: [{ value: 64000, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
  { label: "Décembre 2025", shortLabel: "Déc. 25", segments: [{ value: 52000, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
  { label: "Janvier 2026", shortLabel: "Jan. 26", segments: [{ value: 67000, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
  { label: "Février 2026", shortLabel: "Fév. 26", segments: [{ value: 86000, color: COLOR_CANDIDATURES, label: "Candidatures" }] },
  {
    label: "Mars 2026",
    shortLabel: "Mars 26",
    segments: [{ value: 166000, color: COLOR_CANDIDATURES, label: "Candidatures" }],
    annotation: "+58 %",
    highlighted: true,
  },
]

export const offresParRegion = [
  { label: "Île-de-France", value: 27.5, displayValue: "27,5 %" },
  { label: "Grand Est", value: 11.7, displayValue: "11,7 %" },
  { label: "Auvergne-Rhône-Alpes", value: 10.3, displayValue: "10,3 %" },
  { label: "Provence-Alpes-Côte d’Azur", value: 7.8, displayValue: "7,8 %" },
  { label: "Pays de la Loire", value: 7.2, displayValue: "7,2 %" },
  { label: "Hauts-de-France", value: 5.7, displayValue: "5,7 %" },
  { label: "Nouvelle-Aquitaine", value: 5.5, displayValue: "5,5 %" },
  { label: "Occitanie", value: 5.2, displayValue: "5,2 %" },
  { label: "Bretagne", value: 4.7, displayValue: "4,7 %" },
  { label: "Bourgogne-Franche-Comté", value: 4.6, displayValue: "4,6 %" },
  { label: "Normandie", value: 3.9, displayValue: "3,9 %" },
  { label: "Centre-Val de Loire", value: 3.0, displayValue: "3,0 %" },
  { label: "Corse", value: 0.5, displayValue: "0,5 %" },
]

export const topMetiersCandidats = [
  { label: "Comptable", value: 3100 },
  { label: "Assistant(e) RH", value: 2400 },
  { label: "Assistant(e) commercial(e)", value: 2100 },
  { label: "Secrétaire", value: 1900 },
  { label: "Chargé(e) de communication", value: 1700 },
  { label: "Attaché(e) commercial(e)", value: 1500 },
  { label: "Chargé(e) de recrutement", value: 1300 },
  { label: "Préparateur(trice) en pharmacie", value: 1200 },
  { label: "Responsable marketing", value: 1100 },
  { label: "Secrétaire médical(e)", value: 1000 },
]

export const flopMetiersCandidats = [
  { label: "Cariste", value: 1 },
  { label: "Bobinier(ère) en électricité", value: 1 },
  { label: "Assistant(e) familial(e)", value: 1 },
  { label: "Animateur(trice) nature environnement", value: 1 },
  { label: "Ajusteur(se) - monteur(se)", value: 1 },
  { label: "Aide agricole en production végétale", value: 1 },
  { label: "Agent(e) de talent", value: 1 },
  { label: "Agent(e) de stérilisation de service hospitalier", value: 1 },
  { label: "Agent(e) de conditionnement", value: 1 },
  { label: "Accompagnant(e) des élèves en situation de handicap (AESH)", value: 1 },
]

export const metiersSousTension = [
  { label: "Graphiste (3 offres / 173 cand.)", value: 0.02, displayValue: "0,02" },
  { label: "Responsable de magasin (20 offres / 235 cand.)", value: 0.02, displayValue: "0,02" },
  { label: "Assistant(e) de contrôle budgétaire (11 offres / 540 cand.)", value: 0.02, displayValue: "0,02" },
  { label: "Data analyst (10 offres / 597 cand.)", value: 0.02, displayValue: "0,02" },
  { label: "Chargé(e) des relations publiques (13 offres / 669 cand.)", value: 0.02, displayValue: "0,02" },
  { label: "Développeur(se) logiciel ou d’application (13 offres / 669 cand.)", value: 0.02, displayValue: "0,02" },
  { label: "Développeur(se) web (21 offres / 1 038 cand.)", value: 0.02, displayValue: "0,02" },
  { label: "Responsable en organisation en entreprise (1 offre / 122 cand.)", value: 0.01, displayValue: "0,01" },
  { label: "Secrétaire facturier(ère) (2 offres / 159 cand.)", value: 0.01, displayValue: "0,01" },
  { label: "Administrateur(trice) de systèmes d’information (15 offres / 1 004 cand.)", value: 0.01, displayValue: "0,01" },
]

export const metiersMoinsSousTension = [
  { label: "Maçon / Maçonne (22 offres / 28 cand.)", value: 0.79, displayValue: "0,79" },
  { label: "Couvreur / Couvreuse (20 offres / 30 cand.)", value: 0.67, displayValue: "0,67" },
  { label: "Gestionnaire en assurances (19 offres / 32 cand.)", value: 0.59, displayValue: "0,59" },
  { label: "Mécanicien d’engins de chantier et de TP (15 offres / 26 cand.)", value: 0.58, displayValue: "0,58" },
  { label: "Mécanicien réparateur de matériels agricoles (10 offres / 18 cand.)", value: 0.56, displayValue: "0,56" },
  { label: "Poseur(se) en fermetures du bâtiment (14 offres / 27 cand.)", value: 0.52, displayValue: "0,52" },
  { label: "Boucher / Bouchère (29 offres / 56 cand.)", value: 0.52, displayValue: "0,52" },
  { label: "Fleuriste (15 offres / 32 cand.)", value: 0.47, displayValue: "0,47" },
  { label: "Jardinier(ère) paysagiste (38 offres / 96 cand.)", value: 0.4, displayValue: "0,40" },
]

export const niveauDiplome = [
  { label: "BTS, DEUST (Bac+2)", value: 28, displayValue: "28 %" },
  { label: "Indifférent", value: 25, displayValue: "25 %" },
  { label: "CAP, BEP (Infrabac)", value: 15, displayValue: "15 %" },
  { label: "Bac, Bac Pro, BP (Bac)", value: 12, displayValue: "12 %" },
  { label: "Licence, BUT, Licence Pro (Bac+3)", value: 11, displayValue: "11 %" },
  { label: "Master, titre ingénieur, grande école (Bac+5)", value: 8, displayValue: "8 %" },
]

export const candidaturesParTypeLegend = [
  { label: "Candidatures spontanées", color: COLOR_SPONTANEES },
  { label: "Candidatures en réponse à une offre sur La bonne alternance", color: COLOR_REPONSE },
  { label: "Candidatures via redirection chez nos partenaires", color: COLOR_REDIRECTION },
]

export const candidaturesParType = [
  {
    label: "T1 2025",
    totalDisplay: "299 741",
    segments: [
      { value: 248785, color: COLOR_SPONTANEES, label: "Spontanées (83 %)" },
      { value: 30000, color: COLOR_REPONSE, label: "Sur offre" },
      { value: 20956, color: COLOR_REDIRECTION, label: "Redirection" },
    ],
  },
  {
    label: "T2 2025",
    totalDisplay: "311 520",
    segments: [
      { value: 143299, color: COLOR_SPONTANEES, label: "Spontanées (46 %)" },
      { value: 110000, color: COLOR_REPONSE, label: "Sur offre" },
      { value: 58221, color: COLOR_REDIRECTION, label: "Redirection" },
    ],
  },
  {
    label: "T3 2025",
    totalDisplay: "337 929",
    segments: [
      { value: 121654, color: COLOR_SPONTANEES, label: "Spontanées (36 %)" },
      { value: 140000, color: COLOR_REPONSE, label: "Sur offre" },
      { value: 76275, color: COLOR_REDIRECTION, label: "Redirection" },
    ],
  },
  {
    label: "T4 2025",
    totalDisplay: "193 024",
    segments: [
      { value: 94582, color: COLOR_SPONTANEES, label: "Spontanées (49 %)" },
      { value: 75000, color: COLOR_REPONSE, label: "Sur offre" },
      { value: 23442, color: COLOR_REDIRECTION, label: "Redirection" },
    ],
  },
  {
    label: "T1 2026",
    totalDisplay: "319 768",
    highlighted: true,
    segments: [
      { value: 236628, color: COLOR_SPONTANEES, label: "Spontanées (74 %)" },
      { value: 60000, color: COLOR_REPONSE, label: "Sur offre" },
      { value: 23140, color: COLOR_REDIRECTION, label: "Redirection" },
    ],
  },
]

export const topSecteursSpontanees = [
  { label: "Commerce de détail de produits pharmaceutiques en magasin spécialisé", value: 9060, displayValue: "9 060 (3,8 %)" },
  { label: "Accueil de jeunes enfants", value: 8375, displayValue: "8 375 (3,5 %)" },
  { label: "Activités comptables", value: 7857, displayValue: "7 857 (3,3 %)" },
  { label: "Action sociale sans hébergement n.c.a.", value: 7813, displayValue: "7 813 (3,3 %)" },
  { label: "Activités hospitalières", value: 6439, displayValue: "6 439 (2,7 %)" },
  { label: "Pratique dentaire", value: 6062, displayValue: "6 062 (2,6 %)" },
  { label: "Agences immobilières", value: 5632, displayValue: "5 632 (2,4 %)" },
  { label: "Conseil en systèmes et logiciels informatiques", value: 4763, displayValue: "4 763 (2,0 %)" },
  { label: "Administration publique générale", value: 3763, displayValue: "3 763 (1,6 %)" },
  { label: "Activités juridiques", value: 3658, displayValue: "3 658 (1,5 %)" },
]
