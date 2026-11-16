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
 * Chiffres clés, indicateurs de marché et FAQ : chaque chiffre cite sa source (vérifiées le 16 novembre 2026).
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
    description: {
      intro:
        "L'informatique regroupe les métiers qui **conçoivent, font fonctionner et protègent les outils numériques** des entreprises : sites et applications, réseaux, serveurs, postes de travail et données.",
      points: [
        "**Qui recrute ?** Les entreprises de services numériques (ESN), les éditeurs de logiciels et les start-up, mais aussi **les services informatiques des banques, de l'industrie, du commerce, des collectivités et des hôpitaux**.",
        "**Votre quotidien** : dès les premières semaines, vous dépannez les utilisateurs, déployez des postes, développez une fonctionnalité ou surveillez un réseau, **accompagné par un maître d'apprentissage**.",
        "**Le rythme** : au moins 25 % du contrat d'apprentissage se passe en formation. Selon l'école, **quelques jours par semaine, une semaine sur deux ou plusieurs semaines d'affilée**.",
        "**À quel niveau commencer ?** Dès le bac pro CIEL, le plus souvent en **BTS SIO (bac+2)**, puis en BUT, licence pro ou bachelor. Cybersécurité, data et gestion de projet visent plutôt **bac+3 à bac+5**.",
      ],
      conclusion:
        "Dans une petite entreprise, vos missions sont variées ; dans un grand groupe, elles sont plus cadrées. Dans tous les cas, **lisez les missions décrites dans l'offre** plutôt que le seul intitulé du poste, qui change d'une entreprise à l'autre.",
    },
    chiffres_cles: [
      {
        valeur: "46",
        libelle: "fiches métiers ROME couvertes par cette page",
        source_libelle: "Référentiel ROME 4.0, France Travail",
        source_url: "https://www.data.gouv.fr/datasets/repertoire-operationnel-des-metiers-et-des-emplois-rome",
        annee: 2026,
      },
      {
        valeur: "670 000",
        libelle: "personnes employées par les entreprises du numérique en France",
        source_libelle: "Numeum, communiqué du 18 décembre 2025",
        source_url: "https://numeum.fr/wp-content/uploads/2025/12/Numeum_Communique-de-presse-S2-2025-2026.pdf",
        annee: 2025,
      },
      {
        valeur: "27 510",
        libelle: "projets de recrutement d'ingénieurs de l'informatique en 2026",
        source_libelle: "France Travail, enquête BMO 2026",
        source_url: "https://statistiques.francetravail.org/bmo/bmo?ld=0&pp=2026",
        annee: 2026,
      },
      {
        valeur: "65 %",
        libelle: "des apprentis sortis d'un BTS en emploi salarié 6 mois après",
        source_libelle: "DEPP et Dares, InserJeunes, Note d'information n° 25.69",
        source_url: "https://www.education.gouv.fr/sites/default/files/document/Education_nationale_DEPP_NI%20IJ%20apprentis%2025-69.pdf-476813.pdf",
        annee: 2025,
      },
    ],
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
    marche: {
      comparaison: {
        titre: "Part des recrutements jugés difficiles par les employeurs en 2026",
        barres: [
          {
            libelle: "Ingénieurs de l'informatique",
            valeur: 53.2,
            affichage: "53,2 %",
          },
          {
            libelle: "Techniciens de l'informatique",
            valeur: 45.8,
            affichage: "45,8 %",
          },
          {
            libelle: "Ensemble des métiers",
            valeur: 43.8,
            affichage: "43,8 %",
          },
        ],
        source_libelle: "France Travail, enquête Besoins en main-d'œuvre 2026",
        source_url: "https://statistiques.francetravail.org/bmo/bmo?ld=0&pp=2026",
        annee: 2026,
      },
      faits: [
        {
          valeur: "1,1",
          texte: "indicateur de tension des ingénieurs de l'informatique, contre 0,6 pour l'ensemble des métiers",
          source_libelle: "Insee Références, données Dares et France Travail",
          source_url: "https://www.insee.fr/fr/statistiques/8616805",
          annee: 2023,
        },
        {
          valeur: "3,1 %",
          texte: "de recrutements saisonniers chez les techniciens de l'informatique, contre 32,2 % tous métiers confondus",
          source_libelle: "France Travail, enquête BMO 2026",
          source_url: "https://statistiques.francetravail.org/bmo/bmo?ld=0&pp=2026",
          annee: 2026,
        },
      ],
      interpretation:
        "Les employeurs ont plus de mal à recruter des ingénieurs de l'informatique que la moyenne des métiers : il manque de candidats qualifiés, mais l'embauche n'est pas assurée pour autant. Pour les techniciens, l'écart est faible. Dans les deux cas, les recrutements se font toute l'année.",
    },
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
          "Tout dépend de votre niveau et du métier visé. Après la 3e, le bac pro CIEL prépare au support et aux réseaux. Après le bac, le BTS SIO (bac+2) est le diplôme le plus courant en alternance : l'option SISR mène au support, aux systèmes et aux réseaux, l'option SLAM au développement. Vous pouvez poursuivre en BUT, en licence professionnelle ou en bachelor (bac+3), puis en master ou en école d'ingénieur (bac+5). Pour la cybersécurité, la data ou la gestion de projet, les entreprises demandent le plus souvent un niveau bac+3 à bac+5.",
      },
      {
        question: "Peut-on commencer une formation en alternance sans avoir trouvé d'entreprise ?",
        reponse:
          "Oui, sous conditions. Le Code du travail (article L6222-12-1) permet à une personne de 16 à 29 ans révolus de commencer une formation en apprentissage sans employeur, pendant trois mois au maximum. Elle a alors le statut de stagiaire de la formation professionnelle et le CFA l'aide à trouver une entreprise. Si un contrat est signé ensuite, sa durée est réduite des mois déjà passés en formation. Renseignez-vous auprès de l'école, car toutes ne le proposent pas. Sur La bonne alternance, vous pouvez chercher les formations et les offres au même endroit.",
      },
      {
        question: "Quand et comment chercher une entreprise en informatique ?",
        reponse:
          "La plupart des formations démarrent à la rentrée, et beaucoup d'entreprises recrutent leurs alternants dès le printemps : commencez plusieurs mois à l'avance. Selon service-public.fr, l'apprenti doit entrer en formation dans les 3 mois qui suivent le début de son contrat. Ne vous limitez pas aux offres publiées : de nombreuses entreprises recrutent sans diffuser d'annonce. Sur La bonne alternance, vous pouvez repérer des entreprises susceptibles de recruter près de chez vous et leur envoyer une candidature spontanée. Adaptez votre message à chaque entreprise et mentionnez vos projets personnels : site, application, serveur installé chez vous.",
      },
      {
        question: "Quel salaire pour un alternant en informatique ?",
        reponse:
          "En apprentissage, le salaire minimum dépend de votre âge et de l'année de contrat. Selon service-public.fr, il est de 27 %, 39 % puis 55 % du Smic entre 16 et 17 ans, de 43 %, 51 % puis 67 % entre 18 et 20 ans, et de 53 %, 61 % puis 78 % entre 21 et 25 ans, en 1re, 2e et 3e année. À partir de 26 ans, c'est au moins le Smic. Entre 21 et 25 ans, le salaire minimum conventionnel s'applique s'il est plus favorable. L'entreprise peut toujours payer plus que ce minimum.",
      },
      {
        question: "Apprentissage ou contrat de professionnalisation ?",
        reponse:
          "Les deux contrats alternent formation et travail en entreprise. Le contrat d'apprentissage prépare à un diplôme ou à un titre professionnel ; selon service-public.fr, il s'adresse aux jeunes de 16 à 29 ans révolus, avec des exceptions. Le contrat de professionnalisation est ouvert aux jeunes de 16 à 25 ans révolus et aux demandeurs d'emploi d'au moins 26 ans, ce qui en fait une voie fréquente en reconversion. Sa rémunération minimale est de 55 % du Smic avant 21 ans, 70 % de 21 à 25 ans, et le Smic à partir de 26 ans, avec une majoration selon votre niveau de diplôme. La bonne alternance publie les offres des deux types.",
      },
      {
        question: "Peut-on faire une alternance en informatique après un bac général ou en reconversion ?",
        reponse:
          "Oui. Le BTS SIO, le BUT informatique et de nombreux bachelors recrutent des bacheliers généraux, sur dossier et parfois après un entretien. Les entreprises regardent aussi vos projets personnels : un site, un script, un serveur monté chez vous montrent votre motivation. En reconversion, l'apprentissage reste possible jusqu'à 29 ans révolus, et au-delà dans certains cas prévus par la loi. Après 26 ans, le contrat de professionnalisation est ouvert aux demandeurs d'emploi. Des titres professionnels inscrits au RNCP se préparent aussi en alternance.",
      },
      {
        question: "Est-on embauché après une alternance en informatique ?",
        reponse:
          "Ce n'est pas automatique, mais l'alternance donne une expérience que les recruteurs regardent. Selon la DEPP et la Dares (InserJeunes), 65 % des apprentis sortis d'un BTS en 2024 sans poursuivre d'études avaient un emploi salarié six mois plus tard, toutes spécialités confondues. Tous niveaux du CAP au BTS, 25 % travaillaient chez l'employeur de leur apprentissage et 37 % chez un autre employeur. Côté recruteurs, l'enquête BMO 2026 de France Travail compte 27 510 projets de recrutement d'ingénieurs de l'informatique, dont 53,2 % jugés difficiles.",
      },
      {
        question: "Quel est le rythme entre l'école et l'entreprise ?",
        reponse:
          "Le rythme est fixé par l'école et figure dans le calendrier remis à l'entreprise. Les plus courants sont deux ou trois jours en formation par semaine, une semaine sur deux, ou plusieurs semaines d'affilée en entreprise puis en formation. Selon service-public.fr, la formation en CFA doit représenter au moins 25 % de la durée totale du contrat d'apprentissage. Avant de vous inscrire, vérifiez que le rythme proposé convient aux entreprises que vous visez : certaines préfèrent des périodes longues pour suivre un projet.",
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
