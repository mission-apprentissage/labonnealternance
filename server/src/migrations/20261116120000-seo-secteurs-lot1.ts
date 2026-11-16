import { ObjectId } from "mongodb"
import { SEO_METIER_FORMATION_NIVEAUX } from "shared/models/seo-metier.model"
import type { ISeoSecteur } from "shared/models/seo-secteur.model"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { updateSeoSecteurs } from "@/services/seo.service"

/**
 * Pages /alternance/secteur, lot 1 : informatique (cf. docs/superpowers/specs/2026-11-16-pages-secteurs-design.md).
 *
 * Les libellés de métiers reprennent les mots tapés par les étudiants (GSC). Les codes ROME v4 viennent des
 * groupes métier de la recherche LBA (`/api/rome`), vérifiés un à un sur `/api/rome/detail/:rome`.
 * Cybersécurité et data analyst ne renvoient pas vers leur page métier : celle-ci compte sur M1802 et M1403,
 * hors du périmètre de la carte (le compteur affiché différerait).
 * `marche` reste à null tant que les chiffres BMO de l'année ne sont pas sourcés.
 *
 * Upsert par slug : les champs éditoriaux sont réécrits, les champs calculés sont laissés à updateSeoSecteurs().
 */
type ISecteurData = Omit<
  ISeoSecteur,
  | "_id"
  | "romes"
  | "created_at"
  | "updated_at"
  | "job_count"
  | "company_count"
  | "algo_company_count"
  | "applicant_count"
  | "metiers_counts"
  | "entreprises"
  | "villes"
  | "formations"
  | "cards"
>

export const secteursData: ISecteurData[] = [
  {
    slug: "informatique",
    secteur: "informatique",
    secteur_complement: "de l'informatique",
    titre: "Alternance informatique",
    accroche: "Développement, support, réseaux, cybersécurité, data : trouvez votre contrat d'apprentissage ou de professionnalisation dans l'informatique.",
    meta_description:
      "Trouvez votre alternance en informatique : développeur, technicien support, administrateur réseau, cybersécurité, data. Offres, entreprises qui recrutent, salaires et formations du bac au bac+5.",
    q_recherche: "informatique",
    description: [
      "L'informatique regroupe les métiers qui conçoivent, font fonctionner et protègent les outils numériques des entreprises : sites et applications, réseaux, serveurs, postes de travail et données. On y trouve des postes dans les entreprises de services numériques (ESN), les éditeurs de logiciels et les start-up, mais aussi dans les services informatiques de toutes les grandes organisations : banques, industrie, commerce, administrations, hôpitaux.",
      "En alternance, vous travaillez sur des projets réels dès le premier mois : répondre aux demandes des utilisateurs, déployer un poste, développer une fonctionnalité, surveiller un réseau. L'informatique accueille des apprentis à tous les niveaux, du bac pro au diplôme d'ingénieur. Le niveau bac+2 (BTS SIO) et le niveau bac+3 (BUT informatique, bachelors) sont les portes d'entrée les plus courantes.",
    ],
    chiffres_cles: [],
    metiers: [
      {
        libelle: "Développeur web",
        romes: ["M1805", "M1855", "M1861", "M1834"],
        description: "Conçoit et code des sites et des applications.",
        niveau_acces: "Bac+2 à bac+5",
        metier_slug: "developpeur-web",
      },
      {
        libelle: "Technicien support informatique",
        romes: ["I1401", "I1403", "I1404", "I1406", "M1810", "M1869", "M1874"],
        description: "Installe les postes et dépanne les utilisateurs, sur place ou à distance.",
        niveau_acces: "Bac à bac+2",
        metier_slug: null,
      },
      {
        libelle: "Administrateur systèmes et réseaux",
        romes: ["M1801", "M1802", "M1816", "M1822", "M1827", "M1830", "M1843", "M1854", "M1876", "M1879"],
        description: "Installe et maintient les serveurs, le cloud et les réseaux de l'entreprise.",
        niveau_acces: "Bac+2 à bac+5",
        metier_slug: null,
      },
      {
        libelle: "Cybersécurité",
        romes: ["M1812", "M1817", "M1819", "M1833", "M1844", "M1856", "M1866", "M1882", "M1883", "M1884"],
        description: "Protège les systèmes contre les attaques et gère les incidents de sécurité.",
        niveau_acces: "Bac+3 à bac+5",
        metier_slug: null,
      },
      {
        libelle: "Data analyst",
        romes: ["M1811", "M1824", "M1851", "M1868", "M1872", "M1889", "M1894"],
        description: "Collecte et analyse les données pour aider l'entreprise à prendre des décisions.",
        niveau_acces: "Bac+3 à bac+5",
        metier_slug: null,
      },
      {
        libelle: "Chef de projet informatique",
        romes: ["M1806", "M1814", "M1828", "M1853", "M1859", "M1864", "M1881", "M1886"],
        description: "Recueille les besoins des utilisateurs et pilote les projets informatiques.",
        niveau_acces: "Bac+3 à bac+5",
        metier_slug: null,
      },
    ],
    marche: null,
    formations_niveaux: [
      { niveau: SEO_METIER_FORMATION_NIVEAUX["4 (BAC...)"], diplomes: "Bac pro CIEL", diplome_slug: "bac-pro-ciel" },
      { niveau: SEO_METIER_FORMATION_NIVEAUX["5 (BTS, DEUST...)"], diplomes: "BTS SIO (options SISR et SLAM), BTS CIEL", diplome_slug: "bts-sio" },
      {
        niveau: SEO_METIER_FORMATION_NIVEAUX["6 (Licence, BUT...)"],
        diplomes: "BUT informatique, BUT réseaux et télécommunications, licences professionnelles, bachelors",
        diplome_slug: null,
      },
      { niveau: SEO_METIER_FORMATION_NIVEAUX["7 (Master, titre ingénieur...)"], diplomes: "Masters, diplômes d'ingénieur, titres RNCP de niveau 7", diplome_slug: null },
    ],
    faq: [
      {
        question: "Quel diplôme préparer pour une alternance en informatique ?",
        reponse:
          "Après le bac, le BTS SIO (bac+2) est le diplôme le plus courant en alternance. Il prépare au support et aux réseaux (option SISR) ou au développement (option SLAM). Vous pouvez ensuite poursuivre en BUT, en licence professionnelle ou en bachelor (bac+3), puis en master ou en école d'ingénieur (bac+5).",
      },
      {
        question: "Peut-on trouver une alternance en informatique sans école ?",
        reponse:
          "Oui. L'entreprise et l'école se cherchent en parallèle, et beaucoup d'écoles aident leurs candidats à trouver une entreprise. Sur La bonne alternance, vous pouvez chercher les offres et les formations au même endroit.",
      },
      {
        question: "Quand chercher une alternance en informatique ?",
        reponse:
          "La plupart des contrats démarrent entre septembre et novembre, et les entreprises commencent à recruter dès le printemps. Commencez vos recherches plusieurs mois avant la rentrée.",
      },
      {
        question: "Quel salaire pour un alternant en informatique ?",
        reponse:
          "Le salaire minimum d'un apprenti dépend de son âge et de son année de contrat. Il est fixé en pourcentage du Smic. Une entreprise peut payer plus que ce minimum.",
      },
      {
        question: "Apprentissage ou contrat de professionnalisation ?",
        reponse:
          "Les deux alternent formation et entreprise. Le contrat d'apprentissage prépare à un diplôme ou à un titre reconnu, et c'est le plus répandu. Le contrat de professionnalisation vise une qualification et il est plus souvent proposé aux personnes en reconversion. La bonne alternance publie les offres des deux types.",
      },
    ],
  },
]

export const up = async () => {
  const now = new Date()
  const collection = getDbCollection("seo_secteurs")

  for (const secteur of secteursData) {
    const romes = [...new Set(secteur.metiers.flatMap((metier) => metier.romes))]
    await collection.updateOne(
      { slug: secteur.slug },
      {
        $set: { ...secteur, romes, updated_at: now },
        $setOnInsert: { _id: new ObjectId(), created_at: now },
      },
      { upsert: true }
    )
  }

  await updateSeoSecteurs()
  logger.info(`seo-secteurs-lot1 : ${secteursData.length} pages secteur créées ou mises à jour`)
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
