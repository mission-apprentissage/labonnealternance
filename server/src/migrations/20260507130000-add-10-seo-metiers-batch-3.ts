// Migration : ajout de 10 nouvelles pages métier SEO (/alternance/metier/[metier]) — batch 3
//
// Métiers ajoutés (ordre alphabétique) :
//   - Aide-soignant (J1501)
//   - Auxiliaire vétérinaire (A1501)
//   - Coiffeur (D1202)
//   - Électricien (F1602)
//   - Esthéticien (D1208)
//   - Juriste (K1903)
//   - Manipulateur en radiologie (J1306)
//   - Notaire (K1901)
//   - Pâtissier (D1104)
//   - Plombier (F1603)
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
    metier: "Aide-soignant",
    slug: "aide-soignant",
    romes: ["J1501"],
    description:
      "L'aide-soignant accompagne les patients dans les gestes de la vie quotidienne et participe à leurs soins en collaboration avec l'équipe infirmière. Il assure leur confort, surveille leur état de santé et contribue au maintien de leur autonomie. En alternance, il développe des gestes techniques de soin tout en acquérant les qualités humaines indispensables au contact des personnes fragilisées.",
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
        title: "Soins d'hygiène et de confort",
        description: "Aide à la toilette, à l'habillage et aux changes selon les besoins du patient",
      },
      {
        title: "Aide aux repas",
        description: "Distribution, installation et accompagnement des patients pendant les repas",
      },
      {
        title: "Surveillance de l'état de santé",
        description: "Observation des signes cliniques et transmission des informations à l'équipe soignante",
      },
      {
        title: "Mobilisation des patients",
        description: "Aide aux déplacements, transferts et installation au lit ou au fauteuil",
      },
      {
        title: "Entretien de l'environnement",
        description: "Hygiène des chambres, du matériel et désinfection des surfaces",
      },
      {
        title: "Accompagnement relationnel",
        description: "Écoute, soutien moral et lien avec les familles des patients",
      },
    ],
    competences: [
      {
        title: "Gestes techniques de soin",
        description: "Maîtrise des protocoles d'hygiène, de mobilisation et de prévention des escarres",
      },
      {
        title: "Anatomie et pathologies",
        description: "Connaissance des bases médicales pour comprendre les pathologies courantes",
      },
      {
        title: "Hygiène hospitalière",
        description: "Application stricte des règles d'asepsie et de prévention des infections nosocomiales",
      },
      {
        title: "Relation au patient",
        description: "Bienveillance, écoute et adaptation à des publics parfois vulnérables",
      },
      {
        title: "Travail en équipe",
        description: "Coordination avec infirmiers, médecins, kinés et auxiliaires de vie",
      },
      {
        title: "Discrétion professionnelle",
        description: "Respect du secret médical et de la confidentialité des informations patients",
      },
    ],
  },
  {
    metier: "Auxiliaire vétérinaire",
    slug: "auxiliaire-veterinaire",
    romes: ["A1501"],
    description:
      "L'auxiliaire vétérinaire seconde le vétérinaire dans tous les actes de soins aux animaux et la gestion administrative de la clinique. Il assiste pendant les consultations, prépare le matériel, accueille les propriétaires et veille au confort des animaux hospitalisés. En alternance, il développe une expertise technique sur le soin animal tout en acquérant les compétences relationnelles indispensables au contact de la clientèle.",
    job_count: 0,
    company_count: 0,
    applicant_count: 0,
    salaire: {
      salaire_brut_moyen: 1170,
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
        title: "Assistance aux consultations",
        description: "Préparation du matériel, contention de l'animal et aide pendant les soins",
      },
      {
        title: "Accueil de la clientèle",
        description: "Réception des propriétaires, prise de rendez-vous et conseils de premier niveau",
      },
      {
        title: "Soins aux animaux hospitalisés",
        description: "Surveillance, alimentation, administration de traitements et nettoyage des box",
      },
      {
        title: "Stérilisation du matériel",
        description: "Préparation et désinfection des instruments selon les protocoles vétérinaires",
      },
      {
        title: "Gestion administrative",
        description: "Tenue des dossiers, facturation et gestion des stocks de médicaments",
      },
      {
        title: "Vente de produits",
        description: "Conseil et délivrance d'aliments, antiparasitaires et accessoires",
      },
    ],
    competences: [
      {
        title: "Soins vétérinaires de base",
        description: "Maîtrise des gestes de contention, prises de constantes et pansements",
      },
      {
        title: "Anatomie animale",
        description: "Connaissance des espèces domestiques et de leurs spécificités physiologiques",
      },
      {
        title: "Hygiène et asepsie",
        description: "Application des protocoles de stérilisation en environnement médical",
      },
      {
        title: "Relation client",
        description: "Écoute des propriétaires, pédagogie et gestion des situations émotionnelles",
      },
      {
        title: "Logiciels métiers",
        description: "Utilisation des logiciels de gestion de clinique vétérinaire",
      },
      {
        title: "Sang-froid et empathie",
        description: "Capacité à gérer des urgences et des situations parfois éprouvantes",
      },
    ],
  },
  {
    metier: "Coiffeur",
    slug: "coiffeur",
    romes: ["D1202"],
    description:
      "Le coiffeur réalise des coupes, colorations, brushings et soins capillaires adaptés à chaque client. Il conseille sur les coiffures et produits, en tenant compte du type de cheveux et des envies de chacun. En alternance, il développe une maîtrise technique des gestes du métier tout en acquérant le sens du conseil et de la relation client indispensable en salon.",
    job_count: 0,
    company_count: 0,
    applicant_count: 0,
    salaire: {
      salaire_brut_moyen: 1150,
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
        title: "Accueil et diagnostic capillaire",
        description: "Écoute des attentes du client et analyse de la nature de ses cheveux",
      },
      {
        title: "Réalisation de coupes",
        description: "Exécution de coupes femme, homme et enfant selon différentes techniques",
      },
      {
        title: "Coloration et mèches",
        description: "Application de couleurs, balayages et techniques de décoloration",
      },
      {
        title: "Coiffage et brushing",
        description: "Mise en forme des cheveux pour le quotidien ou des occasions spéciales",
      },
      {
        title: "Soins capillaires",
        description: "Réalisation de masques, traitements et soins adaptés à chaque type de cheveu",
      },
      {
        title: "Conseil et vente",
        description: "Recommandation de produits adaptés et fidélisation de la clientèle",
      },
    ],
    competences: [
      {
        title: "Techniques de coupe",
        description: "Maîtrise des coupes au ciseau, rasoir et tondeuse pour tous types de cheveux",
      },
      {
        title: "Colorimétrie",
        description: "Compréhension des dosages et résultats des produits de coloration",
      },
      {
        title: "Connaissance des produits",
        description: "Maîtrise des familles de soins, shampoings et traitements professionnels",
      },
      {
        title: "Sens artistique",
        description: "Créativité dans la conception de coupes et coiffures personnalisées",
      },
      {
        title: "Relation client",
        description: "Écoute, conseil et création d'une expérience personnalisée en salon",
      },
      {
        title: "Hygiène et sécurité",
        description: "Application des règles sanitaires et désinfection du matériel",
      },
    ],
  },
  {
    metier: "Électricien",
    slug: "electricien",
    romes: ["F1602"],
    description:
      "L'électricien installe, met en service et entretient les équipements électriques dans les bâtiments résidentiels, tertiaires ou industriels. Il pose les câblages, raccorde les tableaux électriques et veille au respect des normes de sécurité en vigueur. En alternance, il acquiert les gestes techniques du métier tout en se formant à la lecture de plans et aux exigences réglementaires.",
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
        title: "Lecture de plans",
        description: "Interprétation des schémas électriques et plans d'implantation",
      },
      {
        title: "Tirage de câbles",
        description: "Pose des gaines, chemins de câbles et passages techniques dans les bâtiments",
      },
      {
        title: "Raccordement des équipements",
        description: "Branchement des prises, interrupteurs, luminaires et tableaux électriques",
      },
      {
        title: "Mise en service",
        description: "Tests de continuité, contrôle des tensions et vérification du bon fonctionnement",
      },
      {
        title: "Maintenance et dépannage",
        description: "Diagnostic des pannes électriques et remise en état des installations",
      },
      {
        title: "Respect des normes",
        description: "Application stricte de la NF C 15-100 et des règles de sécurité électrique",
      },
    ],
    competences: [
      {
        title: "Bases en électricité",
        description: "Maîtrise des lois fondamentales et calculs de section de câbles",
      },
      {
        title: "Lecture de schémas",
        description: "Compréhension des plans, symboles et nomenclatures électriques",
      },
      {
        title: "Outillage spécialisé",
        description: "Utilisation des appareils de mesure, pinces et matériel de tirage de câbles",
      },
      {
        title: "Habilitation électrique",
        description: "Connaissance des règles de sécurité et préparation aux titres B0/B1V/B2V",
      },
      {
        title: "Précision et minutie",
        description: "Soin dans le câblage et le raccordement pour assurer fiabilité et durabilité",
      },
      {
        title: "Travail en équipe",
        description: "Coordination avec les autres corps de métier sur les chantiers",
      },
    ],
  },
  {
    metier: "Esthéticien",
    slug: "estheticien",
    romes: ["D1208"],
    description:
      "L'esthéticien réalise des soins du visage, du corps, des mains et des pieds pour le bien-être et la beauté de ses clients. Il conseille sur les produits adaptés, propose des protocoles personnalisés et accompagne chaque client dans une démarche de soin globale. En alternance, il développe son expertise technique tout en acquérant le sens du conseil et de l'accueil propre à l'univers de la beauté.",
    job_count: 0,
    company_count: 0,
    applicant_count: 0,
    salaire: {
      salaire_brut_moyen: 1150,
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
        title: "Soins du visage",
        description: "Nettoyage, gommage, masques et protocoles anti-âge ou hydratants personnalisés",
      },
      {
        title: "Épilations",
        description: "Réalisation d'épilations à la cire ou au sucre sur l'ensemble du corps",
      },
      {
        title: "Manucure et beauté des pieds",
        description: "Soins des ongles, pose de vernis et techniques de pédicure esthétique",
      },
      {
        title: "Modelages corporels",
        description: "Massages relaxants et soins du corps adaptés aux besoins du client",
      },
      {
        title: "Maquillage",
        description: "Réalisation de maquillages jour, soir ou pour des occasions spéciales",
      },
      {
        title: "Conseil et vente",
        description: "Recommandation de produits cosmétiques et accompagnement post-soin",
      },
    ],
    competences: [
      {
        title: "Techniques esthétiques",
        description: "Maîtrise des protocoles de soins, épilations et modelages du métier",
      },
      {
        title: "Connaissance des produits",
        description: "Compréhension des actifs cosmétiques et adaptation aux types de peau",
      },
      {
        title: "Anatomie cutanée",
        description: "Connaissance de la peau, de ses besoins et de ses réactions aux soins",
      },
      {
        title: "Sens du contact",
        description: "Écoute, discrétion et création d'une atmosphère de bien-être",
      },
      {
        title: "Hygiène et sécurité",
        description: "Application stricte des règles sanitaires et désinfection du matériel",
      },
      {
        title: "Vente-conseil",
        description: "Identification des besoins et recommandation de produits adaptés",
      },
    ],
  },
  {
    metier: "Juriste",
    slug: "juriste",
    romes: ["K1903"],
    description:
      "Le juriste conseille et défend les intérêts juridiques d'une entreprise, d'une association ou d'une administration. Il analyse les textes, rédige des contrats et accompagne ses interlocuteurs dans la prévention et la gestion des litiges. En alternance, il développe une expertise technique du droit tout en se confrontant aux problématiques concrètes du quotidien d'un service juridique.",
    job_count: 0,
    company_count: 0,
    applicant_count: 0,
    salaire: {
      salaire_brut_moyen: 1430,
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
        title: "Analyse juridique",
        description: "Étude de textes, jurisprudence et qualification juridique des situations rencontrées",
      },
      {
        title: "Rédaction de contrats",
        description: "Production et révision de contrats commerciaux, partenariats ou de travail",
      },
      {
        title: "Conseil aux opérationnels",
        description: "Accompagnement des équipes métiers sur les questions juridiques de leur activité",
      },
      {
        title: "Veille réglementaire",
        description: "Suivi des évolutions législatives et anticipation de leurs impacts",
      },
      {
        title: "Gestion des contentieux",
        description: "Préparation des dossiers, échanges avec les avocats et suivi des procédures",
      },
      {
        title: "Conformité et risques",
        description: "Identification des risques juridiques et mise en place d'outils de prévention",
      },
    ],
    competences: [
      {
        title: "Maîtrise du droit",
        description: "Connaissance approfondie du droit des contrats, du travail ou des affaires",
      },
      {
        title: "Recherche juridique",
        description: "Utilisation des bases documentaires Lexis, Dalloz, Légifrance et jurisprudence",
      },
      {
        title: "Rédaction juridique",
        description: "Production d'actes, notes et consultations claires et rigoureuses",
      },
      {
        title: "Esprit d'analyse",
        description: "Capacité à qualifier des situations complexes et à anticiper leurs conséquences",
      },
      {
        title: "Pédagogie",
        description: "Vulgarisation des règles juridiques auprès d'interlocuteurs non-juristes",
      },
      {
        title: "Discrétion et déontologie",
        description: "Respect strict de la confidentialité et des règles éthiques de la profession",
      },
    ],
  },
  {
    metier: "Manipulateur en radiologie",
    slug: "manipulateur-en-radiologie",
    romes: ["J1306"],
    description:
      "Le manipulateur en radiologie réalise des examens d'imagerie médicale (radiographie, scanner, IRM) sous la responsabilité du médecin radiologue. Il prépare le patient, paramètre les appareils et veille à la qualité des images obtenues. En alternance, il développe une expertise technique pointue tout en acquérant le sens du contact patient indispensable à l'exercice du métier.",
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
        title: "Accueil et préparation du patient",
        description: "Explication de l'examen, mise en confiance et installation sur la table",
      },
      {
        title: "Réalisation des examens",
        description: "Paramétrage des appareils et acquisition des images selon le protocole médical",
      },
      {
        title: "Contrôle qualité des images",
        description: "Vérification de la netteté et de la pertinence diagnostique des clichés",
      },
      {
        title: "Radioprotection",
        description: "Application des règles de protection contre les rayonnements ionisants",
      },
      {
        title: "Maintenance des équipements",
        description: "Vérifications quotidiennes et remontée des dysfonctionnements techniques",
      },
      {
        title: "Tenue du dossier patient",
        description: "Saisie informatique et transmission des images au médecin radiologue",
      },
    ],
    competences: [
      {
        title: "Imagerie médicale",
        description: "Maîtrise des techniques de radiographie, scanner, IRM et échographie",
      },
      {
        title: "Anatomie et pathologies",
        description: "Connaissance des structures anatomiques visualisées en imagerie",
      },
      {
        title: "Radioprotection",
        description: "Application rigoureuse des règles de sécurité face aux rayonnements",
      },
      {
        title: "Logiciels de PACS",
        description: "Utilisation des systèmes d'archivage et de transmission d'images médicales",
      },
      {
        title: "Relation patient",
        description: "Pédagogie, empathie et accompagnement de personnes parfois anxieuses",
      },
      {
        title: "Rigueur technique",
        description: "Précision dans le positionnement et le paramétrage des examens",
      },
    ],
  },
  {
    metier: "Notaire",
    slug: "notaire",
    romes: ["K1901"],
    description:
      "Le notaire authentifie les actes juridiques liés à l'immobilier, à la famille, aux successions et aux entreprises. Officier public, il conseille ses clients et garantit la sécurité juridique des opérations qu'il enregistre. En alternance, le futur notaire ou clerc de notaire développe une expertise technique du droit tout en se formant à la rigueur d'un métier réglementé.",
    job_count: 0,
    company_count: 0,
    applicant_count: 0,
    salaire: {
      salaire_brut_moyen: 1340,
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
        title: "Conseil aux clients",
        description: "Accompagnement des particuliers et professionnels sur les opérations juridiques",
      },
      {
        title: "Rédaction d'actes authentiques",
        description: "Préparation des compromis, ventes, donations, successions et contrats de mariage",
      },
      {
        title: "Recherches juridiques",
        description: "Vérification des titres de propriété, états civils et situations patrimoniales",
      },
      {
        title: "Authentification des actes",
        description: "Lecture, signature et conservation des actes engageant les parties",
      },
      {
        title: "Calcul des taxes et frais",
        description: "Détermination des droits d'enregistrement, taxes et émoluments dus",
      },
      {
        title: "Suivi administratif",
        description: "Publication au service de la publicité foncière et tenue du registre des actes",
      },
    ],
    competences: [
      {
        title: "Droit immobilier et patrimonial",
        description: "Maîtrise du droit des biens, successions, régimes matrimoniaux et fiscalité",
      },
      {
        title: "Rédaction juridique",
        description: "Production d'actes précis, conformes aux exigences formelles du notariat",
      },
      {
        title: "Logiciels notariaux",
        description: "Utilisation des logiciels métiers comme Genapi ou Fiducial Office",
      },
      {
        title: "Relation client",
        description: "Écoute, pédagogie et accompagnement dans des moments parfois sensibles",
      },
      {
        title: "Rigueur et précision",
        description: "Vigilance extrême dans la rédaction et la vérification des actes",
      },
      {
        title: "Discrétion et déontologie",
        description: "Respect strict du secret professionnel et des règles déontologiques notariales",
      },
    ],
  },
  {
    metier: "Pâtissier",
    slug: "patissier",
    romes: ["D1104"],
    description:
      "Le pâtissier conçoit et réalise des gâteaux, viennoiseries, entremets et créations sucrées dans une pâtisserie, un restaurant ou une boulangerie-pâtisserie. Il maîtrise les techniques de base et innove pour proposer des produits gourmands et esthétiques. En alternance, il acquiert les gestes du métier tout en développant la créativité et la rigueur indispensables à la profession.",
    job_count: 0,
    company_count: 0,
    applicant_count: 0,
    salaire: {
      salaire_brut_moyen: 1170,
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
        title: "Préparation des pâtes",
        description: "Réalisation des pâtes feuilletée, sablée, brisée, levée et autres bases",
      },
      {
        title: "Confection des entremets",
        description: "Production de gâteaux à étages, mousses, bavarois et desserts à l'assiette",
      },
      {
        title: "Cuisson et finitions",
        description: "Maîtrise des cuissons, glaçages, décors et présentations des produits",
      },
      {
        title: "Travail du chocolat",
        description: "Tempérage, moulage et création de pièces et bonbons en chocolat",
      },
      {
        title: "Gestion des stocks",
        description: "Réception, stockage et rotation des matières premières et ingrédients",
      },
      {
        title: "Hygiène et nettoyage",
        description: "Entretien du laboratoire et application stricte des règles HACCP",
      },
    ],
    competences: [
      {
        title: "Techniques de pâtisserie",
        description: "Maîtrise des recettes de base et des gestes fondamentaux du métier",
      },
      {
        title: "Connaissance des matières premières",
        description: "Compréhension des farines, beurres, chocolats et leurs utilisations",
      },
      {
        title: "Sens artistique",
        description: "Créativité dans le décor et la mise en valeur visuelle des produits",
      },
      {
        title: "Rigueur et précision",
        description: "Respect strict des dosages, températures et temps de repos",
      },
      {
        title: "Hygiène alimentaire",
        description: "Application des règles HACCP et de traçabilité des ingrédients",
      },
      {
        title: "Endurance physique",
        description: "Capacité à travailler debout, en horaires décalés et en cadence soutenue",
      },
    ],
  },
  {
    metier: "Plombier",
    slug: "plombier",
    romes: ["F1603"],
    description:
      "Le plombier installe, entretient et répare les réseaux d'eau, de gaz et les équipements sanitaires des bâtiments. Il intervient sur des chantiers neufs ou en rénovation, chez des particuliers comme dans le tertiaire et l'industrie. En alternance, il acquiert les gestes techniques du métier tout en se formant à la lecture de plans et aux normes de sécurité du bâtiment.",
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
        title: "Lecture de plans",
        description: "Interprétation des plans d'installation et schémas hydrauliques",
      },
      {
        title: "Pose des canalisations",
        description: "Découpe, soudure et raccordement des tuyauteries cuivre, PER ou multicouche",
      },
      {
        title: "Installation sanitaire",
        description: "Pose de lavabos, douches, WC et raccordement aux réseaux",
      },
      {
        title: "Mise en service",
        description: "Tests d'étanchéité, mise en pression et vérification du bon fonctionnement",
      },
      {
        title: "Maintenance et dépannage",
        description: "Diagnostic des fuites, débouchage et réparation des installations",
      },
      {
        title: "Conseil client",
        description: "Recommandation d'équipements et explication des interventions réalisées",
      },
    ],
    competences: [
      {
        title: "Techniques de pose",
        description: "Maîtrise du cintrage, du brasage et du sertissage des tuyauteries",
      },
      {
        title: "Lecture de plans",
        description: "Compréhension des schémas, symboles et nomenclatures hydrauliques",
      },
      {
        title: "Outillage spécialisé",
        description: "Utilisation des fers à souder, sertisseuses et appareils de détection",
      },
      {
        title: "Normes du bâtiment",
        description: "Application des DTU plomberie et règles de sécurité gaz",
      },
      {
        title: "Diagnostic technique",
        description: "Identification rapide des causes de panne et solutions adaptées",
      },
      {
        title: "Relation client",
        description: "Écoute, pédagogie et professionnalisme lors des interventions à domicile",
      },
    ],
  },
]

export const up = async () => {
  logger.info("Ajout de 10 nouveaux métiers SEO dans seo_metiers (batch 3)")

  const now = new Date()

  await getDbCollection("seo_metiers").insertMany(
    metierData.map((metier) => ({ ...metier, _id: new ObjectId(), created_at: now, updated_at: now })),
    { ordered: false, bypassDocumentValidation: true }
  )

  await updateSEO()

  logger.info("Ajout de 10 métiers SEO terminé (batch 3)")
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
