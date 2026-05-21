// Migration : ajout de 10 nouvelles pages métier SEO (/alternance/metier/[metier])
//
// Métiers ajoutés (ordre alphabétique) :
//   - Ambulancier (J1305)
//   - Architecte d'intérieur (F1102)
//   - Assistant dentaire (J1312)
//   - Assistant social (K1201)
//   - Auxiliaire de puériculture (J1304)
//   - Éducateur spécialisé (K1207)
//   - Gestionnaire de paie (M1507)
//   - Moniteur-éducateur (K1207)
//   - Préparateur en pharmacie (J1307)
//   - Secrétaire médicale (M1609)
//
// À FAIRE POUR LE DÉPLOIEMENT :
//   1. Déposer ce fichier dans server/src/migrations/
//   2. Vérifier que ui/app/(editorial)/alternance/_components/metier_data.tsx contient bien les 10 nouvelles entrées (ordre alphabétique)
//   3. Lancer : yarn migrations:up
//
// Le up() ci-dessous :
//   - insère les 10 métiers dans seo_metiers (pas de deleteMany — migration additive)
//   - appelle updateSEO() qui remplit automatiquement job_count, company_count, applicant_count, entreprises, formations, villes, cards

import { ObjectId } from "mongodb"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { updateSEO } from "@/jobs/seo/updateSEO"

const metierData = [
  {
    metier: "Ambulancier",
    slug: "ambulancier",
    romes: ["J1305"],
    description:
      "L'ambulancier assure le transport sanitaire de personnes malades, blessées ou âgées vers les structures de soins. Il prend en charge le patient, surveille son état pendant le trajet et applique les premiers gestes d'urgence si nécessaire. En alternance, il développe des compétences techniques en conduite sanitaire tout en acquérant les qualités humaines indispensables au contact des patients.",
    job_count: 0,
    company_count: 0,
    applicant_count: 0,
    salaire: {
      salaire_brut_moyen: 1280,
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
        title: "Prise en charge des patients",
        description: "Accueil, mise en confiance et installation du patient dans le véhicule sanitaire",
      },
      {
        title: "Transport sanitaire",
        description: "Conduite adaptée du véhicule en respectant le confort et la sécurité du patient",
      },
      {
        title: "Surveillance médicale",
        description: "Contrôle des paramètres vitaux et observation de l'état du patient durant le trajet",
      },
      {
        title: "Gestes de premiers secours",
        description: "Intervention rapide en cas d'urgence ou d'aggravation de l'état du patient",
      },
      {
        title: "Entretien du véhicule",
        description: "Désinfection, nettoyage et vérification du matériel médical embarqué",
      },
      {
        title: "Gestion administrative",
        description: "Recueil des documents médicaux et transmission des informations aux services concernés",
      },
    ],
    competences: [
      {
        title: "Gestes d'urgence",
        description: "Maîtrise des techniques de réanimation, de bandage et des protocoles de premiers secours",
      },
      {
        title: "Conduite sanitaire",
        description: "Pilotage adapté du véhicule selon l'état du patient et les conditions de circulation",
      },
      {
        title: "Anatomie et pathologies",
        description: "Connaissance des bases médicales pour comprendre les pathologies courantes",
      },
      {
        title: "Relation au patient",
        description: "Écoute, empathie et communication adaptée aux personnes fragiles ou anxieuses",
      },
      {
        title: "Hygiène et sécurité",
        description: "Application stricte des protocoles de désinfection et de prévention des infections",
      },
      {
        title: "Réactivité",
        description: "Capacité à prendre des décisions rapides face à une situation imprévue",
      },
    ],
  },
  {
    metier: "Architecte d'intérieur",
    slug: "architecte-d-interieur",
    romes: ["F1102"],
    description:
      "L'architecte d'intérieur conçoit et aménage des espaces intérieurs en répondant aux besoins fonctionnels et esthétiques de ses clients. Il imagine des plans, choisit les matériaux et le mobilier, puis suit la réalisation du chantier jusqu'à la livraison. En alternance, il développe sa créativité tout en acquérant les compétences techniques de conduite de projet et de dessin assisté par ordinateur.",
    job_count: 0,
    company_count: 0,
    applicant_count: 0,
    salaire: {
      salaire_brut_moyen: 1310,
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
        title: "Analyse des besoins clients",
        description: "Compréhension des attentes, contraintes et budget pour cadrer le projet d'aménagement",
      },
      {
        title: "Conception des plans",
        description: "Réalisation de croquis, plans 2D et perspectives 3D des espaces à aménager",
      },
      {
        title: "Choix des matériaux et mobilier",
        description: "Sélection de revêtements, couleurs, luminaires et meubles adaptés au projet",
      },
      {
        title: "Établissement des devis",
        description: "Chiffrage du projet et négociation avec les fournisseurs et artisans",
      },
      {
        title: "Suivi de chantier",
        description: "Coordination des corps de métier et contrôle de la conformité des travaux",
      },
      {
        title: "Livraison du projet",
        description: "Vérification finale et présentation de l'espace aménagé au client",
      },
    ],
    competences: [
      {
        title: "Logiciels de CAO",
        description: "Maîtrise d'AutoCAD, SketchUp, Revit ou 3ds Max pour modéliser les projets",
      },
      {
        title: "Sens de l'espace",
        description: "Capacité à visualiser et organiser des volumes en trois dimensions",
      },
      {
        title: "Créativité",
        description: "Imagination de solutions originales adaptées aux contraintes du lieu",
      },
      {
        title: "Connaissance des matériaux",
        description: "Maîtrise des propriétés et possibilités des revêtements, textiles et mobiliers",
      },
      {
        title: "Gestion de projet",
        description: "Pilotage du planning, du budget et coordination des intervenants",
      },
      {
        title: "Relation client",
        description: "Écoute des attentes et présentation claire des propositions d'aménagement",
      },
    ],
  },
  {
    metier: "Assistant dentaire",
    slug: "assistant-dentaire",
    romes: ["J1312"],
    description:
      "L'assistant dentaire seconde le chirurgien-dentiste dans tous les actes cliniques et administratifs du cabinet. Il prépare les instruments, assiste le praticien pendant les soins, accueille les patients et gère le planning. En alternance, il développe un savoir-faire technique tout en acquérant les qualités relationnelles indispensables dans un environnement médical structuré.",
    job_count: 0,
    company_count: 0,
    applicant_count: 0,
    salaire: {
      salaire_brut_moyen: 1220,
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
        title: "Assistance au fauteuil",
        description: "Préparation des instruments et aide au praticien pendant les soins dentaires",
      },
      {
        title: "Accueil des patients",
        description: "Réception, mise en confiance et préparation du patient pour la consultation",
      },
      {
        title: "Stérilisation du matériel",
        description: "Décontamination et stérilisation des instruments selon les protocoles en vigueur",
      },
      {
        title: "Gestion du planning",
        description: "Prise de rendez-vous, organisation de l'agenda et relances des patients",
      },
      {
        title: "Suivi administratif",
        description: "Tenue des dossiers médicaux, télétransmission et facturation des actes",
      },
      {
        title: "Gestion des stocks",
        description: "Suivi et commande des consommables médicaux et fournitures du cabinet",
      },
    ],
    competences: [
      {
        title: "Hygiène et asepsie",
        description: "Application rigoureuse des protocoles de stérilisation et prévention des infections",
      },
      {
        title: "Anatomie dentaire",
        description: "Connaissance des structures buccales et des actes courants de soins",
      },
      {
        title: "Outils dentaires",
        description: "Maîtrise des instruments rotatifs, à ultrasons et du matériel d'imagerie",
      },
      {
        title: "Relation patient",
        description: "Écoute, pédagogie et accompagnement face à l'anxiété ou à la douleur",
      },
      {
        title: "Logiciels métiers",
        description: "Utilisation des logiciels dentaires de gestion de cabinet et de télétransmission",
      },
      {
        title: "Discrétion professionnelle",
        description: "Respect du secret médical et confidentialité des informations patients",
      },
    ],
  },
  {
    metier: "Assistant social",
    slug: "assistant-social",
    romes: ["K1201"],
    description:
      "L'assistant social accompagne des personnes ou des familles confrontées à des difficultés sociales, financières, professionnelles ou familiales. Il évalue leur situation, propose des solutions et les oriente vers les dispositifs d'aide adaptés. En alternance, il développe son sens de l'écoute, sa connaissance des dispositifs d'action sociale et sa capacité à intervenir dans des situations parfois complexes.",
    job_count: 0,
    company_count: 0,
    applicant_count: 0,
    salaire: {
      salaire_brut_moyen: 1240,
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
        title: "Accueil et écoute",
        description: "Réception des bénéficiaires et recueil de leur situation personnelle et sociale",
      },
      {
        title: "Évaluation des besoins",
        description: "Analyse globale de la situation pour identifier les leviers d'accompagnement",
      },
      {
        title: "Information et orientation",
        description: "Présentation des aides existantes et orientation vers les structures compétentes",
      },
      {
        title: "Constitution des dossiers",
        description: "Aide à la rédaction et au montage des demandes d'aides sociales et administratives",
      },
      {
        title: "Suivi des bénéficiaires",
        description: "Accompagnement dans la durée et ajustement du plan d'aide selon l'évolution",
      },
      {
        title: "Travail en réseau",
        description: "Coordination avec les partenaires associatifs, médicaux et institutionnels",
      },
    ],
    competences: [
      {
        title: "Connaissance des dispositifs sociaux",
        description: "Maîtrise des aides CAF, RSA, logement, insertion professionnelle et juridiques",
      },
      {
        title: "Écoute active",
        description: "Capacité à recueillir un récit difficile sans jugement et à instaurer la confiance",
      },
      {
        title: "Analyse de situation",
        description: "Identification des problématiques prioritaires et des ressources mobilisables",
      },
      {
        title: "Médiation",
        description: "Facilitation des échanges entre la personne, sa famille et les institutions",
      },
      {
        title: "Rédaction professionnelle",
        description: "Production de rapports sociaux, notes et courriers à destination des partenaires",
      },
      {
        title: "Discrétion et déontologie",
        description: "Respect du secret professionnel et application du cadre éthique du travail social",
      },
    ],
  },
  {
    metier: "Auxiliaire de puériculture",
    slug: "auxiliaire-de-puericulture",
    romes: ["J1304"],
    description:
      "L'auxiliaire de puériculture prend soin des bébés et des jeunes enfants au sein de structures comme les crèches, maternités ou services pédiatriques. Il assure les soins quotidiens, contribue à l'éveil et veille au bien-être physique et affectif des enfants. En alternance, il développe une expertise concrète du soin à l'enfant et un savoir-être indispensable au travail en équipe pluridisciplinaire.",
    job_count: 0,
    company_count: 0,
    applicant_count: 0,
    salaire: {
      salaire_brut_moyen: 1180,
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
        title: "Soins quotidiens",
        description: "Réalisation des changes, repas, bains et préparation des biberons",
      },
      {
        title: "Surveillance de l'enfant",
        description: "Observation du comportement et détection des signes d'inconfort ou de maladie",
      },
      {
        title: "Activités d'éveil",
        description: "Animation de jeux, lectures et activités sensorielles adaptées à chaque âge",
      },
      {
        title: "Accueil des familles",
        description: "Échange quotidien avec les parents sur le déroulement de la journée",
      },
      {
        title: "Hygiène des locaux",
        description: "Nettoyage et désinfection des espaces, du matériel et des jouets",
      },
      {
        title: "Travail en équipe",
        description: "Coordination avec les éducateurs, infirmiers et puéricultrices de la structure",
      },
    ],
    competences: [
      {
        title: "Soins du jeune enfant",
        description: "Maîtrise des gestes techniques de soin et d'hygiène adaptés à la petite enfance",
      },
      {
        title: "Développement de l'enfant",
        description: "Connaissance des étapes psychomotrices et affectives de 0 à 3 ans",
      },
      {
        title: "Sécurité et prévention",
        description: "Application des règles de sécurité et identification des risques pour l'enfant",
      },
      {
        title: "Patience et bienveillance",
        description: "Posture rassurante et adaptation au rythme de chaque enfant",
      },
      {
        title: "Communication avec les parents",
        description: "Transmission claire et bienveillante des informations sur la journée de l'enfant",
      },
      {
        title: "Hygiène professionnelle",
        description: "Respect strict des protocoles sanitaires en milieu d'accueil collectif",
      },
    ],
  },
  {
    metier: "Éducateur spécialisé",
    slug: "educateur-specialise",
    romes: ["K1207"],
    description:
      "L'éducateur spécialisé accompagne des enfants, adolescents ou adultes en situation de handicap, en difficulté sociale ou en souffrance psychique. Il met en place des actions éducatives pour favoriser leur autonomie, leur insertion sociale et leur épanouissement. En alternance, il acquiert une expérience de terrain riche et apprend à construire des projets éducatifs adaptés à chaque personne accompagnée.",
    job_count: 0,
    company_count: 0,
    applicant_count: 0,
    salaire: {
      salaire_brut_moyen: 1280,
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
        title: "Accompagnement éducatif",
        description: "Soutien quotidien des personnes accueillies dans leurs activités et apprentissages",
      },
      {
        title: "Élaboration de projets individualisés",
        description: "Construction de parcours éducatifs adaptés aux besoins de chaque bénéficiaire",
      },
      {
        title: "Animation d'activités",
        description: "Mise en place d'ateliers éducatifs, sportifs, culturels ou de socialisation",
      },
      {
        title: "Suivi du projet de vie",
        description: "Évaluation régulière de la progression et ajustement des objectifs",
      },
      {
        title: "Travail avec les familles",
        description: "Échanges réguliers avec les proches pour cohérence du parcours éducatif",
      },
      {
        title: "Coordination pluridisciplinaire",
        description: "Travail en équipe avec psychologues, médecins, assistants sociaux et enseignants",
      },
    ],
    competences: [
      {
        title: "Posture éducative",
        description: "Capacité à instaurer une relation de confiance dans le cadre d'un projet éducatif",
      },
      {
        title: "Connaissance des publics",
        description: "Compréhension des troubles, handicaps et problématiques sociales rencontrées",
      },
      {
        title: "Animation de groupe",
        description: "Conduite d'activités collectives stimulantes et inclusives",
      },
      {
        title: "Écoute et empathie",
        description: "Disponibilité à recueillir la parole et accompagner les émotions",
      },
      {
        title: "Rédaction d'écrits professionnels",
        description: "Production de bilans, projets personnalisés et notes éducatives structurées",
      },
      {
        title: "Travail en équipe",
        description: "Collaboration avec les différents intervenants du parcours de la personne",
      },
    ],
  },
  {
    metier: "Gestionnaire de paie",
    slug: "gestionnaire-de-paie",
    romes: ["M1507"],
    description:
      "Le gestionnaire de paie établit les bulletins de salaire des collaborateurs et assure le suivi administratif des éléments de rémunération. Il veille au respect du droit du travail, des conventions collectives et des obligations sociales et fiscales. En alternance, il maîtrise progressivement les logiciels de paie et développe une rigueur indispensable dans un domaine où chaque erreur a des conséquences.",
    job_count: 0,
    company_count: 0,
    applicant_count: 0,
    salaire: {
      salaire_brut_moyen: 1370,
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
        title: "Établissement des bulletins de paie",
        description: "Production mensuelle des fiches de paie de l'ensemble des collaborateurs",
      },
      {
        title: "Collecte des éléments variables",
        description: "Recueil des heures, primes, absences et notes de frais à intégrer en paie",
      },
      {
        title: "Déclarations sociales",
        description: "Production des DSN et déclarations aux organismes URSSAF, Pôle emploi et caisses de retraite",
      },
      {
        title: "Gestion administrative du personnel",
        description: "Suivi des contrats, avenants, soldes de tout compte et certificats de travail",
      },
      {
        title: "Veille réglementaire",
        description: "Suivi des évolutions du droit social et adaptation des pratiques de paie",
      },
      {
        title: "Réponse aux salariés",
        description: "Information des collaborateurs sur leur paie, congés et droits sociaux",
      },
    ],
    competences: [
      {
        title: "Logiciels de paie",
        description: "Maîtrise de Sage Paie, Silae, Cegid ou ADP pour produire les bulletins",
      },
      {
        title: "Droit social",
        description: "Connaissance approfondie du Code du travail et des conventions collectives",
      },
      {
        title: "Calculs de paie",
        description: "Maîtrise des cotisations sociales, abattements et nets fiscaux",
      },
      {
        title: "Rigueur et précision",
        description: "Attention extrême aux détails pour éviter toute erreur sur les bulletins",
      },
      {
        title: "Confidentialité",
        description: "Respect strict du secret professionnel sur les éléments de rémunération",
      },
      {
        title: "Maîtrise d'Excel",
        description: "Construction de tableaux de contrôle et croisement des données de paie",
      },
    ],
  },
  {
    metier: "Moniteur-éducateur",
    slug: "moniteur-educateur",
    romes: ["K1207"],
    description:
      "Le moniteur-éducateur accompagne au quotidien des personnes en difficulté sociale, en situation de handicap ou en perte d'autonomie. Il anime des activités éducatives et soutient les bénéficiaires dans les actes de la vie courante pour favoriser leur autonomie. En alternance, il développe sa pratique sur le terrain en travaillant aux côtés d'éducateurs spécialisés et d'autres professionnels du secteur médico-social.",
    job_count: 0,
    company_count: 0,
    applicant_count: 0,
    salaire: {
      salaire_brut_moyen: 1230,
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
        title: "Accompagnement quotidien",
        description: "Soutien des bénéficiaires dans les gestes de la vie courante et les apprentissages",
      },
      {
        title: "Animation d'activités éducatives",
        description: "Conception et conduite d'ateliers ludiques, sportifs ou de socialisation",
      },
      {
        title: "Observation des comportements",
        description: "Suivi attentif des évolutions et des besoins des personnes accompagnées",
      },
      {
        title: "Participation aux projets individuels",
        description: "Contribution à la construction et au suivi des projets personnalisés",
      },
      {
        title: "Travail en équipe pluridisciplinaire",
        description: "Coordination avec les éducateurs, soignants et psychologues de la structure",
      },
      {
        title: "Lien avec les familles",
        description: "Échanges réguliers avec les proches pour favoriser la continuité du parcours",
      },
    ],
    competences: [
      {
        title: "Animation de groupe",
        description: "Conduite d'activités collectives adaptées au public accompagné",
      },
      {
        title: "Posture éducative",
        description: "Adoption d'une attitude juste, bienveillante et structurante",
      },
      {
        title: "Écoute et patience",
        description: "Capacité à accompagner des personnes fragiles dans la durée",
      },
      {
        title: "Connaissance du secteur médico-social",
        description: "Compréhension des structures, dispositifs et publics du travail social",
      },
      {
        title: "Rédaction d'écrits professionnels",
        description: "Production de comptes rendus d'observation et de notes éducatives",
      },
      {
        title: "Adaptabilité",
        description: "Ajustement du comportement et des activités selon les situations rencontrées",
      },
    ],
  },
  {
    metier: "Préparateur en pharmacie",
    slug: "preparateur-en-pharmacie",
    romes: ["J1307"],
    description:
      "Le préparateur en pharmacie seconde le pharmacien dans la délivrance des médicaments et le conseil aux patients. Il prépare les ordonnances, gère les stocks et participe à la vente des produits parapharmaceutiques. En alternance, il développe une expertise scientifique sur les médicaments tout en cultivant un sens du service indispensable au contact quotidien de la patientèle.",
    job_count: 0,
    company_count: 0,
    applicant_count: 0,
    salaire: {
      salaire_brut_moyen: 1290,
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
        title: "Délivrance des ordonnances",
        description: "Vérification et préparation des médicaments prescrits par le médecin",
      },
      {
        title: "Conseil aux patients",
        description: "Information sur la posologie, les effets secondaires et les précautions d'emploi",
      },
      {
        title: "Préparations magistrales",
        description: "Réalisation de mélanges et préparations spécifiques à la demande du pharmacien",
      },
      {
        title: "Gestion des stocks",
        description: "Réception, contrôle et rangement des commandes de médicaments et parapharmacie",
      },
      {
        title: "Vente de parapharmacie",
        description: "Conseil sur les produits d'hygiène, dermocosmétique et compléments alimentaires",
      },
      {
        title: "Tenue de la caisse",
        description: "Encaissement des ventes et application du tiers payant pour les patients",
      },
    ],
    competences: [
      {
        title: "Pharmacologie",
        description: "Connaissance des familles de médicaments, posologies et interactions",
      },
      {
        title: "Lecture d'ordonnances",
        description: "Décryptage rapide et fiable des prescriptions médicales",
      },
      {
        title: "Logiciels officinaux",
        description: "Maîtrise des logiciels de gestion d'officine et de télétransmission",
      },
      {
        title: "Conseil et écoute",
        description: "Capacité à recueillir une demande et à orienter vers la solution adaptée",
      },
      {
        title: "Rigueur et vigilance",
        description: "Contrôle strict pour éviter toute erreur de délivrance de médicament",
      },
      {
        title: "Discrétion professionnelle",
        description: "Respect de la confidentialité des informations de santé des patients",
      },
    ],
  },
  {
    metier: "Secrétaire médicale",
    slug: "secretaire-medicale",
    romes: ["M1609"],
    description:
      "La secrétaire médicale assure l'accueil, la gestion administrative et la coordination d'un cabinet médical, d'un service hospitalier ou d'un laboratoire d'analyses. Elle prend les rendez-vous, gère les dossiers patients et facilite le travail des praticiens. En alternance, elle se forme au vocabulaire médical et acquiert les compétences administratives spécifiques au secteur de la santé.",
    job_count: 0,
    company_count: 0,
    applicant_count: 0,
    salaire: {
      salaire_brut_moyen: 1180,
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
        title: "Accueil des patients",
        description: "Réception physique et téléphonique avec écoute et orientation adaptée",
      },
      {
        title: "Gestion des rendez-vous",
        description: "Prise et organisation des consultations selon les disponibilités du praticien",
      },
      {
        title: "Tenue des dossiers médicaux",
        description: "Mise à jour, classement et archivage des informations patients",
      },
      {
        title: "Frappe de comptes rendus",
        description: "Saisie de comptes rendus médicaux dictés par le praticien",
      },
      {
        title: "Facturation et télétransmission",
        description: "Encaissement, application du tiers payant et envoi des feuilles de soins électroniques",
      },
      {
        title: "Coordination administrative",
        description: "Lien avec les laboratoires, hôpitaux, mutuelles et caisses d'assurance maladie",
      },
    ],
    competences: [
      {
        title: "Vocabulaire médical",
        description: "Maîtrise des termes anatomiques, pathologiques et pharmaceutiques courants",
      },
      {
        title: "Logiciels médicaux",
        description: "Utilisation des logiciels de gestion de cabinet et de télétransmission",
      },
      {
        title: "Maîtrise bureautique",
        description: "Pratique avancée de Word, Excel et des outils de messagerie professionnelle",
      },
      {
        title: "Discrétion et confidentialité",
        description: "Respect strict du secret médical et des données de santé des patients",
      },
      {
        title: "Relation patient",
        description: "Accueil bienveillant et gestion des situations parfois sensibles ou anxiogènes",
      },
      {
        title: "Organisation",
        description: "Gestion simultanée du planning, du téléphone et des tâches administratives",
      },
    ],
  },
]

export const up = async () => {
  logger.info("Ajout de 10 nouveaux métiers SEO dans seo_metiers")

  const now = new Date()

  await getDbCollection("seo_metiers").insertMany(
    metierData.map((metier) => ({ ...metier, _id: new ObjectId(), created_at: now, updated_at: now })),
    { ordered: false, bypassDocumentValidation: true }
  )

  await updateSEO()

  logger.info("Ajout de 10 métiers SEO terminé")
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
