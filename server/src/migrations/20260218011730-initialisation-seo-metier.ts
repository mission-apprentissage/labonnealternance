import { ObjectId } from "mongodb"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { updateSEO } from "@/jobs/seo/updateSEO"

const metierData = [
  {
    metier: "Chargé de recrutement",
    slug: "charge-de-recrutement",
    romes: ["M1502"],
    description:
      "Le chargé de recrutement identifie et sélectionne les meilleurs candidats pour répondre aux besoins en personnel des entreprises. Il gère l'ensemble du processus de recrutement, de la rédaction d'annonces aux entretiens d'embauche. En alternance, il développe des compétences en ressources humaines tout en participant activement aux recrutements de l'entreprise.",
    job_count: 0,
    company_count: 0,
    applicant_count: 0,
    salaire: {
      salaire_brut_moyen: 1396,
      salaire_1ere_annee: 0,
      salaire_2eme_annee: 0,
      salaire_median: 0,
    },
    entreprises: [],
    formations: [],
    villes: [],
    cards: [],
    missions: [
      {
        title: "Rédaction et diffusion d'annonces",
        description: "Création d'offres d'emploi attractives et publication sur différents canaux",
      },
      {
        title: "Sourcing de candidats",
        description: "Recherche active de profils qualifiés sur les jobboards et réseaux sociaux",
      },
      {
        title: "Présélection de candidatures",
        description: "Analyse des CV et lettres de motivation selon les critères définis",
      },
      {
        title: "Conduite d'entretiens",
        description: "Organisation et réalisation d'entretiens de recrutement en présentiel ou visio",
      },
      {
        title: "Gestion de la relation candidat",
        description: "Accompagnement des candidats tout au long du processus de recrutement",
      },
      {
        title: "Reporting et suivi",
        description: "Mise à jour des tableaux de bord et indicateurs de recrutement",
      },
    ],
    competences: [
      {
        title: "Techniques d'entretien",
        description: "Maîtrise des méthodes d'évaluation et de questionnement des candidats",
      },
      {
        title: "Communication interpersonnelle",
        description: "Capacité à échanger efficacement avec candidats et managers",
      },
      {
        title: "Outils de recrutement",
        description: "Utilisation d'ATS, jobboards et réseaux sociaux professionnels comme LinkedIn",
      },
      {
        title: "Analyse de profils",
        description: "Évaluation des compétences et adéquation candidat-poste",
      },
      {
        title: "Organisation et rigueur",
        description: "Gestion simultanée de plusieurs processus de recrutement",
      },
      {
        title: "Droit du travail",
        description: "Connaissance des réglementations en matière de recrutement et d'embauche",
      },
    ],
  },
  {
    metier: "Assistant ressources humaines",
    slug: "assistant-ressources-humaines",
    romes: ["M1501"],
    description:
      "L'assistant ressources humaines accompagne le service RH dans la gestion administrative du personnel et le recrutement. Il participe à l'ensemble des processus RH, de l'intégration des nouveaux collaborateurs à la gestion des dossiers du personnel. En alternance, il développe des compétences opérationnelles en ressources humaines tout en préparant son diplôme.",
    job_count: 0,
    company_count: 0,
    applicant_count: 0,
    salaire: {
      salaire_brut_moyen: 1332,
      salaire_1ere_annee: 0,
      salaire_2eme_annee: 0,
      salaire_median: 0,
    },
    entreprises: [],
    formations: [],
    villes: [],
    cards: [],
    missions: [
      {
        title: "Gestion administrative du personnel",
        description: "Suivi des dossiers individuels, contrats de travail et documents administratifs",
      },
      {
        title: "Support au recrutement",
        description: "Publication d'offres, tri de CV et organisation des entretiens",
      },
      {
        title: "Onboarding des nouveaux salariés",
        description: "Préparation et animation des parcours d'intégration des arrivants",
      },
      {
        title: "Gestion de la formation",
        description: "Organisation des formations et suivi du plan de développement",
      },
      {
        title: "Administration de la paie",
        description: "Collecte et saisie des éléments variables de paie",
      },
      {
        title: "Communication interne RH",
        description: "Diffusion d'informations RH et mise à jour des supports",
      },
    ],
    competences: [
      {
        title: "Droit du travail",
        description: "Connaissance des règles juridiques encadrant les relations de travail",
      },
      {
        title: "Outils SIRH",
        description: "Maîtrise des logiciels de gestion des ressources humaines",
      },
      {
        title: "Communication interpersonnelle",
        description: "Écoute et dialogue avec les collaborateurs de tous niveaux",
      },
      {
        title: "Organisation et rigueur",
        description: "Gestion de multiples dossiers avec précision et confidentialité",
      },
      {
        title: "Techniques de recrutement",
        description: "Conduite d'entretiens et évaluation des candidatures",
      },
      {
        title: "Pack Office",
        description: "Utilisation avancée d'Excel, Word et PowerPoint pour les RH",
      },
    ],
  },
  {
    metier: "chargé de communication",
    slug: "charge-de-communication",
    romes: ["E1103"],
    description:
      "Le chargé de communication élabore et met en œuvre la stratégie de communication d'une entreprise ou d'une organisation. Il crée du contenu, gère les réseaux sociaux, organise des événements et assure la visibilité de sa structure. En alternance, il développe des compétences opérationnelles tout en apprenant les fondamentaux stratégiques de la communication.",
    job_count: 0,
    company_count: 0,
    applicant_count: 0,
    salaire: {
      salaire_brut_moyen: 1293,
      salaire_1ere_annee: 0,
      salaire_2eme_annee: 0,
      salaire_median: 0,
    },
    entreprises: [],
    formations: [],
    villes: [],
    cards: [],
    missions: [
      {
        title: "Création de contenus",
        description: "Rédaction d'articles, communiqués de presse et publications pour divers supports",
      },
      {
        title: "Gestion des réseaux sociaux",
        description: "Animation des communautés et publication de contenus sur les plateformes digitales",
      },
      {
        title: "Organisation d'événements",
        description: "Coordination de salons, conférences et opérations de communication",
      },
      {
        title: "Relations presse",
        description: "Gestion des contacts médias et diffusion d'informations aux journalistes",
      },
      {
        title: "Support graphique",
        description: "Création de visuels et mise en page de supports de communication",
      },
      {
        title: "Veille et reporting",
        description: "Surveillance de l'e-réputation et analyse des performances des actions menées",
      },
    ],
    competences: [
      {
        title: "Rédaction professionnelle",
        description: "Maîtrise de l'écriture adaptée à différents supports et audiences",
      },
      {
        title: "Outils digitaux",
        description: "Utilisation de logiciels de création graphique et de gestion de réseaux",
      },
      {
        title: "Stratégie de communication",
        description: "Conception et déploiement de plans de communication cohérents",
      },
      {
        title: "Gestion de projet",
        description: "Coordination d'actions multiples avec respect des délais et budgets",
      },
      {
        title: "Relationnel et networking",
        description: "Développement et entretien de relations avec partenaires et médias",
      },
      {
        title: "Analyse de données",
        description: "Interprétation des statistiques et mesure de l'impact des campagnes",
      },
    ],
  },
  {
    metier: "comptable",
    slug: "comptable",
    romes: ["M1203"],
    description:
      "Le comptable enregistre et gère l'ensemble des opérations financières d'une entreprise. Il assure le suivi des comptes, établit les documents comptables et fiscaux, et veille au respect des obligations légales. En alternance, il développe des compétences techniques solides tout en découvrant les réalités du métier en entreprise.",
    job_count: 0,
    company_count: 0,
    applicant_count: 0,
    salaire: {
      salaire_brut_moyen: 1307,
      salaire_1ere_annee: 0,
      salaire_2eme_annee: 0,
      salaire_median: 0,
    },
    entreprises: [],
    formations: [],
    villes: [],
    cards: [],
    missions: [
      {
        title: "Saisie des écritures comptables",
        description: "Enregistrement des factures, paiements et opérations financières quotidiennes",
      },
      {
        title: "Rapprochements bancaires",
        description: "Vérification de la concordance entre relevés bancaires et comptabilité",
      },
      {
        title: "Établissement des déclarations fiscales",
        description: "Préparation de la TVA et autres déclarations obligatoires",
      },
      {
        title: "Clôture des comptes",
        description: "Réalisation des bilans mensuels, trimestriels et annuels",
      },
      {
        title: "Gestion des fournisseurs",
        description: "Suivi des paiements et des relations avec les partenaires",
      },
      {
        title: "Contrôle de cohérence",
        description: "Vérification de la justesse des données et correction des anomalies",
      },
    ],
    competences: [
      {
        title: "Logiciels comptables",
        description: "Utilisation d'outils comme Sage, Cegid, QuickBooks ou EBP",
      },
      {
        title: "Rigueur et précision",
        description: "Attention aux détails pour éviter les erreurs de saisie",
      },
      {
        title: "Réglementation comptable",
        description: "Connaissance des normes comptables et fiscales françaises",
      },
      {
        title: "Maîtrise d'Excel",
        description: "Création de tableaux de bord et formules de calcul",
      },
      {
        title: "Organisation du travail",
        description: "Gestion des priorités et respect des échéances fiscales",
      },
      {
        title: "Communication professionnelle",
        description: "Échanges avec les clients, fournisseurs et administrations",
      },
    ],
  },
  {
    metier: "développeur web",
    slug: "developpeur-web",
    romes: ["M1805"],
    description:
      "Le développeur web conçoit et développe des sites internet et des applications web. Il maîtrise les langages de programmation, travaille en équipe et s'adapte constamment aux nouvelles technologies. En alternance, il acquiert une expérience professionnelle tout en suivant sa formation théorique.",
    job_count: 0,
    company_count: 0,
    applicant_count: 0,
    salaire: {
      salaire_brut_moyen: 1394,
      salaire_1ere_annee: 0,
      salaire_2eme_annee: 0,
      salaire_median: 0,
    },
    entreprises: [],
    formations: [],
    villes: [],
    cards: [],
    missions: [
      {
        title: "Développement front-end",
        description: "Création d'interfaces utilisateur avec HTML, CSS, JavaScript et frameworks modernes",
      },
      {
        title: "Développement back-end",
        description: "Programmation côté serveur avec PHP, Python, Node.js ou autres langages",
      },
      {
        title: "Intégration web",
        description: "Transformation des maquettes graphiques en pages web responsive et accessibles",
      },
      {
        title: "Tests et débogage",
        description: "Vérification du bon fonctionnement et correction des bugs des applications",
      },
      {
        title: "Maintenance et évolution",
        description: "Mise à jour, optimisation et amélioration des sites et applications existants",
      },
      {
        title: "Veille technologique",
        description: "Suivi des nouvelles technologies et bonnes pratiques du développement web",
      },
    ],
    competences: [
      {
        title: "Langages de programmation",
        description: "Maîtrise de HTML, CSS, JavaScript et frameworks comme React ou Vue.js",
      },
      {
        title: "Gestion de bases de données",
        description: "Manipulation et organisation de données avec SQL, MySQL, PostgreSQL ou MongoDB",
      },
      {
        title: "Résolution de problèmes",
        description: "Analyse logique et débogage de code pour résoudre des problèmes complexes",
      },
      {
        title: "Travail collaboratif",
        description: "Collaboration avec designers, chefs de projet et autres développeurs en équipe",
      },
      {
        title: "Gestion de versions",
        description: "Utilisation de Git et GitHub pour le versionnement et le travail collaboratif",
      },
      {
        title: "Méthodologies agiles",
        description: "Application des méthodes Scrum et Kanban dans les projets de développement",
      },
    ],
  },
  {
    metier: "assistant marketing",
    slug: "assistant-marketing",
    romes: ["M1705"],
    description:
      "L'assistant marketing soutient l'équipe marketing dans la mise en œuvre des stratégies de communication et de promotion. Il participe à la création de contenu, à l'organisation d'événements et à l'analyse des performances des campagnes. En alternance, il développe des compétences opérationnelles tout en découvrant les différents leviers du marketing digital et traditionnel.",
    job_count: 0,
    company_count: 0,
    applicant_count: 0,
    salaire: {
      salaire_brut_moyen: 1328,
      salaire_1ere_annee: 0,
      salaire_2eme_annee: 0,
      salaire_median: 0,
    },
    entreprises: [],
    formations: [],
    villes: [],
    cards: [],
    missions: [
      {
        title: "Gestion des réseaux sociaux",
        description: "Animation des comptes, création de publications et interaction avec la communauté",
      },
      {
        title: "Création de contenu",
        description: "Rédaction d'articles, newsletters et supports de communication marketing",
      },
      {
        title: "Analyse des performances",
        description: "Suivi des indicateurs et reporting des campagnes marketing",
      },
      {
        title: "Organisation d'événements",
        description: "Préparation et coordination de salons, webinaires et événements promotionnels",
      },
      {
        title: "Veille concurrentielle",
        description: "Surveillance des tendances du marché et des actions des concurrents",
      },
      {
        title: "Support aux campagnes",
        description: "Participation au déploiement des actions publicitaires et promotionnelles",
      },
    ],
    competences: [
      {
        title: "Outils marketing digitaux",
        description: "Maîtrise des plateformes comme Google Analytics, Mailchimp et réseaux sociaux",
      },
      {
        title: "Communication écrite",
        description: "Rédaction claire et percutante adaptée aux différents supports marketing",
      },
      {
        title: "Analyse de données",
        description: "Exploitation des métriques pour optimiser les performances des campagnes",
      },
      {
        title: "Créativité",
        description: "Développement d'idées innovantes pour capter l'attention des cibles",
      },
      {
        title: "Gestion de projet",
        description: "Organisation et coordination de multiples actions marketing simultanées",
      },
      {
        title: "Relationnel client",
        description: "Compréhension des besoins et adaptation du discours marketing",
      },
    ],
  },
  {
    metier: "contrôleur de gestion",
    slug: "controleur-de-gestion",
    romes: ["M1204"],
    description:
      "Le contrôleur de gestion analyse la performance financière de l'entreprise et aide à la prise de décision stratégique. Il élabore des budgets, suit les indicateurs de performance et conseille les managers pour optimiser les résultats. En alternance, il développe des compétences techniques en gestion et acquiert une vision concrète du pilotage d'entreprise.",
    job_count: 0,
    company_count: 0,
    applicant_count: 0,
    salaire: {
      salaire_brut_moyen: 1374,
      salaire_1ere_annee: 0,
      salaire_2eme_annee: 0,
      salaire_median: 0,
    },
    entreprises: [],
    formations: [],
    villes: [],
    cards: [],
    missions: [
      {
        title: "Élaboration des budgets",
        description: "Construction et suivi des budgets prévisionnels par service ou projet",
      },
      {
        title: "Analyse des écarts",
        description: "Comparaison entre les prévisions et les réalisations financières",
      },
      {
        title: "Reporting financier",
        description: "Production de tableaux de bord et rapports de performance mensuels",
      },
      {
        title: "Calcul des coûts",
        description: "Analyse de la rentabilité des produits, services ou projets",
      },
      {
        title: "Conseil et recommandations",
        description: "Accompagnement des opérationnels dans leurs décisions stratégiques et financières",
      },
      {
        title: "Amélioration des processus",
        description: "Optimisation des outils de pilotage et procédures de gestion",
      },
    ],
    competences: [
      {
        title: "Maîtrise d'Excel avancé",
        description: "Utilisation de tableaux croisés dynamiques, macros et formules complexes",
      },
      {
        title: "Outils de BI",
        description: "Manipulation de logiciels de business intelligence comme Power BI ou Tableau",
      },
      {
        title: "Analyse financière",
        description: "Interprétation des données comptables et calcul d'indicateurs de performance",
      },
      {
        title: "Communication managériale",
        description: "Présentation claire des résultats financiers aux différents services",
      },
      {
        title: "Rigueur et organisation",
        description: "Gestion de multiples dossiers avec précision et respect des délais",
      },
      {
        title: "Vision stratégique",
        description: "Compréhension des enjeux business et impact financier des décisions",
      },
    ],
  },
  {
    metier: "assistant administratif",
    slug: "assistant-administratif",
    romes: ["M1607"],
    description:
      "L'assistant administratif assure le bon fonctionnement quotidien d'un service ou d'une entreprise en gérant les tâches administratives essentielles. Il travaille dans tous types de structures, du cabinet médical à la grande entreprise, en passant par les administrations publiques. En alternance, il développe des compétences organisationnelles concrètes tout en se formant aux outils bureautiques modernes.",
    job_count: 0,
    company_count: 0,
    applicant_count: 0,
    salaire: {
      salaire_brut_moyen: 1160,
      salaire_1ere_annee: 0,
      salaire_2eme_annee: 0,
      salaire_median: 0,
    },
    entreprises: [],
    formations: [],
    villes: [],
    cards: [],
    missions: [
      {
        title: "Gestion du courrier",
        description: "Réception, tri, traitement et envoi des courriers et emails",
      },
      {
        title: "Accueil téléphonique",
        description: "Réception des appels, orientation des interlocuteurs et prise de messages",
      },
      {
        title: "Gestion administrative",
        description: "Classement de documents, création et mise à jour de dossiers",
      },
      {
        title: "Planification",
        description: "Organisation des réunions, gestion des agendas et des déplacements",
      },
      {
        title: "Rédaction de documents",
        description: "Production de courriers, comptes rendus, rapports et présentations",
      },
      {
        title: "Suivi administratif",
        description: "Traitement des commandes, factures et bons de livraison",
      },
    ],
    competences: [
      {
        title: "Maîtrise bureautique",
        description: "Utilisation experte de Word, Excel, PowerPoint et Outlook",
      },
      {
        title: "Organisation et rigueur",
        description: "Gestion des priorités et respect des délais administratifs",
      },
      {
        title: "Communication professionnelle",
        description: "Expression claire à l'oral et à l'écrit en milieu professionnel",
      },
      {
        title: "Discrétion et confidentialité",
        description: "Gestion d'informations sensibles avec professionnalisme et éthique",
      },
      {
        title: "Polyvalence",
        description: "Adaptation rapide à différentes tâches et situations variées",
      },
      {
        title: "Relation client",
        description: "Accueil et gestion des demandes avec courtoisie et efficacité",
      },
    ],
  },
  {
    metier: "data analyst",
    slug: "data-analyst",
    romes: ["M1403"],
    description:
      "Le data analyst collecte, analyse et interprète des données pour aider les entreprises à prendre de meilleures décisions. Il transforme des chiffres bruts en informations exploitables grâce à des outils statistiques et de visualisation. En alternance, il développe ses compétences techniques tout en comprenant les enjeux business des organisations.",
    job_count: 0,
    company_count: 0,
    applicant_count: 0,
    salaire: {
      salaire_brut_moyen: 1466,
      salaire_1ere_annee: 0,
      salaire_2eme_annee: 0,
      salaire_median: 0,
    },
    entreprises: [],
    formations: [],
    villes: [],
    cards: [],
    missions: [
      {
        title: "Collecte et nettoyage de données",
        description: "Extraction et préparation des données depuis différentes sources",
      },
      {
        title: "Analyse statistique",
        description: "Application de méthodes statistiques pour identifier tendances et patterns",
      },
      {
        title: "Création de tableaux de bord",
        description: "Conception de visualisations avec Power BI, Tableau ou Excel",
      },
      {
        title: "Requêtes SQL",
        description: "Interrogation des bases de données pour extraire l'information pertinente",
      },
      {
        title: "Reporting et présentation",
        description: "Communication des insights aux équipes métiers et décideurs",
      },
      {
        title: "Automatisation de processus",
        description: "Développement de scripts Python pour automatiser les analyses récurrentes",
      },
    ],
    competences: [
      {
        title: "Outils d'analyse de données",
        description: "Maîtrise d'Excel, SQL, Python et bibliothèques pandas, numpy",
      },
      {
        title: "Visualisation de données",
        description: "Création de dashboards efficaces avec Power BI ou Tableau",
      },
      {
        title: "Statistiques",
        description: "Application de méthodes statistiques descriptives et prédictives",
      },
      {
        title: "Esprit analytique",
        description: "Capacité à interpréter les données et identifier les insights",
      },
      {
        title: "Communication",
        description: "Vulgarisation de résultats complexes auprès de publics non-techniques",
      },
      {
        title: "Compréhension métier",
        description: "Analyse des besoins business pour proposer des solutions adaptées",
      },
    ],
  },
  {
    metier: "développeur cybersécurité",
    slug: "developpeur-cybersecurite",
    romes: ["M1802"],
    description:
      "Le développeur cybersécurité conçoit et développe des solutions pour protéger les systèmes informatiques contre les cyberattaques. Il analyse les vulnérabilités, implémente des protocoles de sécurité et assure la protection des données sensibles. En alternance, il développe son expertise technique tout en se formant aux dernières menaces et technologies de défense.",
    job_count: 0,
    company_count: 0,
    applicant_count: 0,
    salaire: {
      salaire_brut_moyen: 1422,
      salaire_1ere_annee: 0,
      salaire_2eme_annee: 0,
      salaire_median: 0,
    },
    entreprises: [],
    formations: [],
    villes: [],
    cards: [],
    missions: [
      {
        title: "Développement d'outils de sécurité",
        description: "Création de programmes pour détecter et prévenir les intrusions",
      },
      {
        title: "Audit de code",
        description: "Analyse du code source pour identifier les failles de sécurité",
      },
      {
        title: "Tests de pénétration",
        description: "Simulation d'attaques pour évaluer la résistance des systèmes",
      },
      {
        title: "Sécurisation des applications",
        description: "Implémentation de mécanismes d'authentification et de chiffrement robustes",
      },
      {
        title: "Gestion des incidents",
        description: "Intervention rapide lors de détection de menaces ou d'attaques",
      },
      {
        title: "Veille sur les menaces",
        description: "Surveillance des nouvelles vulnérabilités et techniques d'attaque",
      },
    ],
    competences: [
      {
        title: "Programmation sécurisée",
        description: "Maîtrise de Python, C/C++, Java avec focus sur la sécurité",
      },
      {
        title: "Cryptographie",
        description: "Application des techniques de chiffrement et de protection des données",
      },
      {
        title: "Systèmes et réseaux",
        description: "Compréhension approfondie des architectures et protocoles de communication",
      },
      {
        title: "Analyse de vulnérabilités",
        description: "Identification et correction des failles de sécurité potentielles",
      },
      {
        title: "Outils de sécurité",
        description: "Utilisation de frameworks et logiciels spécialisés en cybersécurité",
      },
      {
        title: "Conformité réglementaire",
        description: "Respect des normes RGPD, ISO 27001 et standards de sécurité",
      },
    ],
  },
]

export const up = async () => {
  logger.info("Initialisation de la collection seo_metiers")

  const now = new Date()

  await getDbCollection("seo_metiers").deleteMany({})

  await getDbCollection("seo_metiers").insertMany(
    metierData.map((metier) => ({ ...metier, _id: new ObjectId(), created_at: now, updated_at: now })),
    { ordered: false, bypassDocumentValidation: true }
  )

  await updateSEO()

  logger.info("Initialisation de la collection seo_villes terminée")
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
