import { ObjectId } from "mongodb"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { updateSeoDiplome } from "@/services/seo.service"

const CAP = "CERTIFICAT D'APTITUDE PROFESSIONNELLE"
const CAPA = "CERTIFICAT D'APTITUDE PROFESSIONNELLE AGRICOLE"
const BAC_PRO = "BAC PROFESSIONNEL"

/**
 * Lot 2 des pages diplôme de niveau ≤ bac+2 (#5604) : 7 CAP (dont le CAP agricole Jardinier paysagiste)
 * et 3 bacs pro, priorisés sur la demande Search Console et l'offre de formation du catalogue.
 *
 * Contenu vérifié affirmation par affirmation sur les sources officielles (RNCP, Légifrance, eduscol,
 * chlorofil, Onisep). `intituleLongFormation`, `diplomeFormation` et `romes` sont alignés sur le catalogue
 * des formations : `diplomeFormation` écarte du bloc « Écoles » les diplômes homonymes (BP Boucher,
 * BP Boulanger, BP Fleuriste…). Chaque page garde au moins 142 formations publiées après les deux filtres.
 *
 * Upsert par slug : les champs éditoriaux sont (ré)écrits et les champs calculés (offres, entreprises,
 * écoles, métiers, cartes) initialisés à vide à la création — la migration est rejouable sans doublon.
 * updateSeoDiplome() recalcule ensuite ces champs sur toutes les pages de seo_diplomes, pas seulement
 * sur celles du lot : les écoles étant tirées par $sample, les pages existantes changent d'écoles, comme
 * à chaque passage du cron hebdomadaire.
 */
export const diplomesData = [
  {
    slug: "cap-boucher",
    titre: "CAP Boucher",
    sousTitre: "Boucher",
    intituleLongFormation: "BOUCHER",
    diplomeFormation: CAP,
    romes: ["D1101"],
    kpis: {
      duration: "1 à 2 ans",
      salaire: "504€ - 1 867€",
    },
    description: {
      text: "Le CAP Boucher est un diplôme national de niveau 3 (CAP) qui forme à la découpe et à la transformation des viandes en boucherie artisanale ou en rayon boucherie. Cette formation en alternance prépare à réceptionner et stocker les viandes, réaliser des coupes de gros, désosser, parer et ficeler les morceaux, puis élaborer des préparations bouchères crues prêtes à la vente, dans le respect des règles d'hygiène et de traçabilité. Le diplôme permet de travailler comme boucher préparateur ou ouvrier qualifié en rayon boucherie, et de poursuivre ses études en certificat de spécialisation, en brevet professionnel ou en bac pro.",
      objectifs: [
        "Réceptionner, contrôler et stocker les viandes livrées.",
        "Réaliser des coupes de gros sur une carcasse de gros bovin.",
        "Désosser, parer, ficeler et barder les morceaux de viande.",
        "Élaborer des préparations bouchères crues, y compris à partir de volaille.",
        "Étiqueter les produits, garnir les vitrines et respecter les règles d'hygiène.",
      ],
    },
    programme: {
      text: "Le programme du CAP Boucher en alternance associe enseignements généraux et pratique en entreprise autour de deux pôles : l'approvisionnement, l'organisation et la transformation des viandes, puis la préparation à la commercialisation.",
      sections: {
        enseignements_generaux: [
          "Français, histoire-géographie et enseignement moral et civique.",
          "Mathématiques et physique-chimie.",
          "Éducation physique et sportive et langue vivante étrangère.",
          "Prévention santé environnement (PSE).",
        ],
        enseignements_professionnels: [
          "Réception, contrôle et stockage des viandes, suivi des stocks.",
          "Coupe de gros sur gros bovin, désossage et transformation des morceaux de bovin, d'ovin et de porc.",
          "Parage, épluchage, bardage et ficelage des pièces de viande.",
          "Préparations de viandes crues et transformation des volailles.",
          "Étiquetage, sécurité alimentaire, nettoyage et désinfection de l'atelier.",
        ],
        competences_developpees: [
          "Contrôle des températures, des dates limites et de la traçabilité à la livraison.",
          "Entretien et mise en état des couteaux et des outils.",
          "Repérage anatomique et découpe des pièces avec l'outillage adapté.",
          "Hachage, farce, façonnage et conditionnement des préparations bouchères.",
          "Mise en valeur des produits en vitrine et identification des allergènes.",
        ],
      },
    },
    metiers: {
      text: "Le CAP Boucher ouvre les portes de nombreux métiers dans la boucherie artisanale, les rayons boucherie de la grande distribution et les ateliers de découpe et de transformation des viandes.",
    },
  },
  {
    slug: "cap-monteur-installations-sanitaires",
    titre: "CAP MIS (plombier)",
    sousTitre: "Monteur en Installations Sanitaires",
    intituleLongFormation: "MONTEUR EN INSTALLATIONS SANITAIRES",
    diplomeFormation: CAP,
    romes: ["F1603"],
    kpis: {
      duration: "1 à 2 ans",
      salaire: "504€ - 1 867€",
    },
    description: {
      text: "Le CAP Monteur en installations sanitaires (MIS) est un diplôme national de niveau 3 (CAP) qui forme au métier de plombier. Cette formation en alternance prépare à installer les appareils sanitaires, les chauffe-eau et les réseaux d'eau, de gaz et d'évacuation, puis à les mettre en service et à les entretenir, dans les logements, les bureaux ou les bâtiments industriels et agricoles. Il remplace l'ancien CAP Installateur sanitaire. Le diplôme permet de travailler comme plombier ou installateur sanitaire, ou de poursuivre vers le bac pro Installateur en chauffage, climatisation et énergies renouvelables ou le BP Monteur en installations du génie climatique et sanitaire.",
      objectifs: [
        "Préparer une intervention à partir du dossier technique et choisir le matériel et l'outillage.",
        "Implanter et fixer les appareils sanitaires, leurs accessoires et les supports des réseaux.",
        "Façonner, poser et raccorder les réseaux d'alimentation en eau et d'évacuation.",
        "Contrôler le travail réalisé, puis mettre en service et régler l'installation.",
        "Assurer l'entretien et les réparations simples d'une installation sanitaire.",
      ],
    },
    programme: {
      text: "Le programme du CAP MIS en alternance associe enseignements généraux et formation professionnelle, organisée autour de trois blocs : l'étude et la préparation d'une intervention, la réalisation d'un ouvrage courant et la réalisation de travaux de mise en service et de maintenance.",
      sections: {
        enseignements_generaux: [
          "Français, histoire-géographie et enseignement moral et civique.",
          "Mathématiques et physique-chimie.",
          "Éducation physique et sportive (EPS).",
          "Langue vivante étrangère : anglais.",
        ],
        enseignements_professionnels: [
          "Étude et préparation d'une intervention : dossier technique, commande, matériel et outillage.",
          "Réalisation d'un ouvrage courant : implantation, pose et raccordement des appareils et des réseaux.",
          "Réalisation de travaux spécifiques : mise en service et maintenance d'une installation.",
          "Technologie des installations sanitaires : réseaux, appareils, production d'eau chaude et ventilation.",
          "Prévention santé environnement (PSE) et prévention des risques professionnels.",
        ],
        competences_developpees: [
          "Lecture de plans, de schémas et de dossiers techniques d'installation.",
          "Façonnage et assemblage de tubes en cuivre, en multicouche, en PER ou en PVC.",
          "Pose et raccordement des appareils sanitaires d'une salle de bains et des chauffe-eau.",
          "Mise en pression, contrôle, purge et réglage d'une installation sanitaire.",
          "Respect des règles de sécurité sur le chantier et compte rendu oral au client et à sa hiérarchie.",
        ],
      },
    },
    metiers: {
      text: "Le CAP MIS ouvre les portes de nombreux métiers dans le second œuvre du bâtiment, en construction neuve comme en rénovation, comme plombier, installateur sanitaire ou monteur en installations sanitaires.",
    },
  },
  {
    slug: "capa-jardinier-paysagiste",
    titre: "CAP agricole Jardinier Paysagiste",
    sousTitre: "Jardinier Paysagiste",
    intituleLongFormation: "JARDINIER PAYSAGISTE",
    diplomeFormation: CAPA,
    romes: ["A1208", "A1203", "A1202"],
    kpis: {
      duration: "1 à 2 ans",
      salaire: "504€ - 1 867€",
    },
    description: {
      text: "Le CAP agricole (CAPa) Jardinier paysagiste est un diplôme national de niveau 3 délivré par le ministère de l'Agriculture, qui forme à l'aménagement et à l'entretien des jardins privés et des espaces verts publics. Cette formation en alternance prépare à planter des végétaux, semer des gazons, installer l'arrosage ou de petits ouvrages, entretenir les espaces paysagers et assurer l'entretien courant du matériel, en toute sécurité. Le titulaire travaille le plus souvent dans une entreprise du paysage ou au service espaces verts d'une collectivité. Il peut aussi, sous certaines conditions, poursuivre ses études en certificat de spécialisation, en brevet professionnel ou en bac pro Aménagements paysagers.",
      objectifs: [
        "Participer à la préparation et à l'organisation des chantiers.",
        "Réaliser des travaux de plantation, de semis et d'engazonnement.",
        "Mettre en place des installations et de petits ouvrages paysagers.",
        "Entretenir la végétation, les installations et les espaces paysagers.",
        "Régler, entretenir et réparer le matériel et les équipements.",
      ],
    },
    programme: {
      text: "Le programme du CAPa Jardinier paysagiste en alternance associe trois modules d'enseignement général et des modules professionnels consacrés à l'aménagement, à l'entretien paysager et au matériel, mis en pratique sur les chantiers de l'entreprise.",
      sections: {
        enseignements_generaux: [
          "Français, histoire-géographie et éducation socioculturelle.",
          "Mathématiques et technologies de l'informatique et du multimédia.",
          "Langue vivante étrangère et sciences économiques, sociales et de gestion.",
          "Éducation physique et sportive et biologie-écologie.",
        ],
        enseignements_professionnels: [
          "Insertion du salarié dans l'entreprise : cadre social, juridique et réglementaire du travail.",
          "Maintenance des matériels et des équipements utilisés sur les chantiers.",
          "Mise en place d'aménagements paysagers : préparation du sol, plantations, engazonnement et ouvrages.",
          "Travaux d'entretien paysager : végétation, gazons, installations et infrastructures.",
          "Module d'initiative professionnelle, adapté aux enjeux professionnels du territoire.",
        ],
        competences_developpees: [
          "Préparation du sol, plantation de végétaux et pose de paillage.",
          "Engazonnement par semis ou par pose de gazon en plaques.",
          "Taille des arbres, arbustes et haies, tonte, fauchage et débroussaillage.",
          "Construction de petits ouvrages paysagers (dallages, murets) et pose de clôtures.",
          "Affûtage des outils et entretien courant des matériels à moteur.",
        ],
      },
    },
    metiers: {
      text: "Le CAPa Jardinier paysagiste ouvre les portes de nombreux métiers dans les entreprises du paysage et les services espaces verts des collectivités, comme jardinier paysagiste, ouvrier du paysage ou agent d'entretien des espaces verts.",
    },
  },
  {
    slug: "cap-psr",
    titre: "CAP PSR",
    sousTitre: "Production et Service en Restaurations (Rapide, Collective, Cafétéria)",
    intituleLongFormation: "PRODUCTION ET SERVICE EN RESTAURATIONS",
    diplomeFormation: CAP,
    romes: ["G1603", "G1607", "G1803"],
    kpis: {
      duration: "1 à 2 ans",
      salaire: "504€ - 1 867€",
    },
    description: {
      text: "Le CAP Production et service en restaurations (PSR) est un diplôme national de niveau 3 (CAP) qui forme aux métiers de la restauration rapide, de la restauration collective et des cafétérias. Cette formation en alternance prépare à réaliser des préparations alimentaires simples, à approvisionner les espaces de vente, à accueillir, servir et encaisser les clients, et à entretenir les locaux dans le respect des règles d'hygiène. Il a remplacé le CAP Agent polyvalent de restauration. Le titulaire travaille en restauration rapide, en cafétéria ou en cantine, et peut, sous certaines conditions, poursuivre ses études en certificat de spécialisation ou en bac pro.",
      objectifs: [
        "Réceptionner et stocker les produits alimentaires et non alimentaires.",
        "Réaliser des préparations et des cuissons simples, puis les dresser ou les conditionner.",
        "Mettre en place et réapprovisionner les espaces de distribution et de vente.",
        "Accueillir, conseiller et servir les clients ou les convives, puis encaisser.",
        "Entretenir les locaux, les équipements et le matériel.",
      ],
    },
    programme: {
      text: "Le programme du CAP PSR en alternance associe des enseignements généraux et deux blocs professionnels, la production alimentaire et le service en restauration, mis en pratique au quotidien dans l'entreprise.",
      sections: {
        enseignements_generaux: [
          "Français, histoire-géographie et enseignement moral et civique.",
          "Mathématiques et physique-chimie.",
          "Langue vivante étrangère et éducation physique et sportive.",
          "Prévention santé environnement (PSE).",
        ],
        enseignements_professionnels: [
          "Production alimentaire : réception, stockage, préparations et cuissons simples.",
          "Service en restauration : mise en place, accueil, service et encaissement.",
          "Entretien manuel et mécanisé des espaces de production, de vente et de consommation.",
          "Sciences de l'alimentation et hygiène professionnelle.",
          "Environnement professionnel : secteurs de la restauration, qualité, gaspillage et tri des déchets.",
        ],
        competences_developpees: [
          "Opérations préliminaires sur les produits : décongélation, lavage, épluchage, taillage.",
          "Préparation de plats simples froids ou chauds : salades, sandwichs, pizzas, desserts.",
          "Assemblage, dressage et conditionnement des préparations à consommer sur place ou à emporter.",
          "Prise de commande, conseil au client, vente additionnelle et encaissement.",
          "Nettoyage des locaux, des équipements et de la vaisselle.",
        ],
      },
    },
    metiers: {
      text: "Le CAP PSR ouvre les portes de nombreux métiers dans la restauration rapide, les cafétérias et la restauration collective des écoles, des hôpitaux ou des établissements pour personnes âgées.",
    },
  },
  {
    slug: "cap-boulanger",
    titre: "CAP Boulanger",
    sousTitre: "Boulanger",
    intituleLongFormation: "BOULANGER",
    diplomeFormation: CAP,
    romes: ["D1102"],
    kpis: {
      duration: "1 à 2 ans",
      salaire: "504€ - 1 867€",
    },
    description: {
      text: "Le CAP Boulanger est un diplôme national de niveau 3 (CAP) qui forme à la fabrication des pains courants, des pains de tradition française, des viennoiseries et de produits simples de restauration boulangère. Cette formation en alternance prépare à réceptionner et stocker les matières premières, peser, pétrir, façonner et cuire, puis présenter les produits au personnel de vente, dans le respect des règles d'hygiène et de sécurité. Le titulaire travaille en boulangerie artisanale, en grande surface ou dans l'industrie agroalimentaire, et peut poursuivre ses études en certificat de spécialisation, en brevet professionnel ou en bac pro.",
      objectifs: [
        "Réceptionner, contrôler et stocker les marchandises livrées.",
        "Organiser son poste de travail et effectuer les calculs de production.",
        "Fabriquer des pains courants, des pains de tradition française et d'autres pains.",
        "Réaliser des viennoiseries en pâte levée feuilletée et en pâte briochée.",
        "Présenter les produits au personnel de vente et signaler les anomalies.",
      ],
    },
    programme: {
      text: "Le programme du CAP Boulanger en alternance associe enseignements généraux, technologie professionnelle, sciences appliquées et gestion appliquée, complétés par la pratique de la fabrication en boulangerie au sein de l'entreprise.",
      sections: {
        enseignements_generaux: [
          "Français, histoire-géographie et enseignement moral et civique.",
          "Mathématiques et physique-chimie.",
          "Langue vivante étrangère.",
          "Éducation physique et sportive et prévention santé environnement (PSE).",
        ],
        enseignements_professionnels: [
          "Approvisionnement : réception, contrôle et stockage des matières premières.",
          "Technologie professionnelle : filière blé-farine-pain, matières premières, pétrissage et fermentation.",
          "Fabrication des pains, des viennoiseries et de produits de restauration boulangère.",
          "Sciences appliquées à l'alimentation, à l'hygiène et à l'environnement professionnel.",
          "Gestion appliquée, qualité et communication avec le personnel de vente.",
        ],
        competences_developpees: [
          "Pesée des ingrédients et calcul des quantités à produire.",
          "Pétrissage, fermentation, façonnage et cuisson des pains.",
          "Fabrication de croissants, pains au chocolat, pains aux raisins et brioches.",
          "Réalisation de sandwichs, de tartines et de décors simples en pâte morte.",
          "Conditionnement des produits et application des règles d'hygiène et de traçabilité.",
        ],
      },
    },
    metiers: {
      text: "Le CAP Boulanger ouvre les portes de nombreux métiers dans la boulangerie artisanale, les grandes et moyennes surfaces, l'industrie agroalimentaire et les entreprises de la filière blé-farine-pain.",
    },
  },
  {
    slug: "bac-pro-agora",
    titre: "Bac pro AGOrA",
    sousTitre: "Assistance à la Gestion des Organisations et de leurs Activités",
    intituleLongFormation: "ASSISTANCE A LA GESTION DES ORGANISATIONS ET DE LEURS ACTIVITES",
    diplomeFormation: BAC_PRO,
    romes: ["M1602", "M1607", "D1401", "M1501"],
    kpis: {
      duration: "2 à 3 ans",
      salaire: "504€ - 1 867€",
    },
    description: {
      text: "Le bac pro Assistance à la gestion des organisations et de leurs activités (AGOrA) est un diplôme national de niveau 4 (bac) qui forme aux métiers de la gestion administrative. Cette formation en alternance prépare à gérer les relations avec les clients, les usagers ou les adhérents, à suivre les stocks et la trésorerie, et à assurer l'administration du personnel. Le bac pro AGOrA a remplacé le bac pro Gestion-Administration. Il permet de travailler dans une PME, un commerce, une association, une collectivité ou une administration, ou de poursuivre ses études en BTS.",
      objectifs: [
        "Traiter les demandes des clients, des usagers ou des adhérents et assurer leur suivi administratif.",
        "Produire des documents et des supports de communication, notamment numériques.",
        "Suivre les approvisionnements, les stocks et la trésorerie de l'organisation.",
        "Gérer l'administration du personnel : arrivées, départs, formations et plannings.",
        "Préparer les éléments nécessaires à l'établissement des bulletins de paie.",
      ],
    },
    programme: {
      text: "Le programme du bac pro AGOrA en alternance associe des enseignements généraux et trois blocs de compétences professionnelles (relations avec les clients, suivi de l'activité, administration du personnel), mis en pratique dans l'organisation d'accueil.",
      sections: {
        enseignements_generaux: [
          "Français, histoire-géographie et enseignement moral et civique.",
          "Mathématiques et économie-droit.",
          "Langue vivante A et langue vivante B.",
          "Arts appliqués et cultures artistiques, éducation physique et sportive et prévention santé environnement (PSE).",
        ],
        enseignements_professionnels: [
          "Gérer les relations avec les clients, les usagers et les adhérents : demandes, factures de vente, encaissements et relances.",
          "Assurer la communication de l'organisation : supports numériques, site web et réseaux sociaux.",
          "Organiser et suivre l'activité de production : approvisionnements, stocks et bases de données.",
          "Suivre la trésorerie et rendre compte de la situation financière de l'organisation.",
          "Administrer le personnel : entrées et sorties, formations, plannings, déplacements et éléments de paie.",
        ],
        competences_developpees: [
          "Traitement des demandes des clients, des usagers ou des adhérents.",
          "Suivi des factures de vente et relance des clients.",
          "Mise à jour des bases de données et suivi des stocks.",
          "Organisation des plannings et des déplacements, contrôle des états de frais du personnel.",
          "Utilisation des outils numériques de gestion et de communication.",
        ],
      },
    },
    metiers: {
      text: "Le bac pro AGOrA ouvre les portes de nombreux métiers dans la gestion administrative, comme agent administratif, secrétaire administratif ou assistant de gestion, dans tous les secteurs d'activité.",
    },
  },
  {
    slug: "cap-fleuriste",
    titre: "CAP Fleuriste",
    sousTitre: "Fleuriste",
    intituleLongFormation: "FLEURISTE",
    diplomeFormation: CAP,
    romes: ["D1209"],
    kpis: {
      duration: "1 à 2 ans",
      salaire: "504€ - 1 867€",
    },
    description: {
      text: "Le CAP Fleuriste est un diplôme national de niveau 3 (CAP) qui forme au métier de fleuriste, une activité à la fois artisanale et artistique. Cette formation en alternance prépare à réceptionner, préparer et entretenir les fleurs et les plantes, à réaliser des bouquets et des compositions florales, puis à accueillir, conseiller et fidéliser la clientèle. Le titulaire travaille en boutique de fleurs, en rayon spécialisé d'une grande surface ou d'une jardinerie, ou dans une entreprise de décoration. Il peut poursuivre vers le brevet professionnel (BP) Fleuriste, diplôme national, ou vers le brevet technique des métiers (BTM) Fleuriste, titre des chambres de métiers et de l'artisanat.",
      objectifs: [
        "Réceptionner, contrôler et stocker les fleurs, les plantes et les produits.",
        "Entretenir les végétaux, les lieux de stockage, l'atelier et l'espace de vente.",
        "Réaliser des bouquets, des compositions piquées et des assemblages de plantes.",
        "Accueillir le client, le conseiller et conclure la vente.",
        "Mettre en valeur les produits en magasin et participer aux vitrines et aux événements.",
      ],
    },
    programme: {
      text: "Le programme du CAP Fleuriste en alternance associe enseignements généraux et formation professionnelle autour de deux pôles : la préparation et la confection de compositions florales, puis la vente, le conseil et la mise en valeur de l'offre.",
      sections: {
        enseignements_generaux: [
          "Français, histoire-géographie et enseignement moral et civique.",
          "Mathématiques et physique-chimie.",
          "Éducation physique et sportive (EPS).",
          "Langue vivante étrangère.",
        ],
        enseignements_professionnels: [
          "Botanique appliquée : organes, cycle de vie et entretien des végétaux.",
          "Technologie professionnelle : matériel, conservation et techniques de fleuristerie.",
          "Arts appliqués : formes, volumes et couleurs au service des compositions.",
          "Vente, conseil et mise en valeur de l'offre.",
          "Environnement économique, juridique et social, et prévention santé environnement (PSE).",
        ],
        competences_developpees: [
          "Préparation des fleurs coupées et des plantes avant la vente ou la confection.",
          "Confection de bouquets liés à la main et d'arrangements piqués.",
          "Réalisation d'emballages adaptés à chaque produit.",
          "Prise de commande, encaissement et participation à la mise à jour du fichier clients.",
          "Étiquetage, présentation des végétaux et participation à la réalisation d'une vitrine.",
        ],
      },
    },
    metiers: {
      text: "Le CAP Fleuriste ouvre les portes de nombreux métiers dans les boutiques de fleurs, les rayons spécialisés des grandes surfaces et des jardineries, les ateliers d'art floral et les entreprises de décoration.",
    },
  },
  {
    slug: "bac-pro-tci",
    titre: "Bac pro TCI (chaudronnerie)",
    sousTitre: "Technicien en Chaudronnerie Industrielle",
    intituleLongFormation: "TECHNICIEN EN CHAUDRONNERIE INDUSTRIELLE",
    diplomeFormation: BAC_PRO,
    romes: ["H2902", "H2913", "H2914"],
    kpis: {
      duration: "2 à 3 ans",
      salaire: "504€ - 1 867€",
    },
    description: {
      text: "Le bac pro Technicien en chaudronnerie industrielle (TCI) est un diplôme national de niveau 4 (bac) qui forme des spécialistes de la transformation du métal. Cette formation en alternance prépare à fabriquer des ensembles chaudronnés, des pièces de tôlerie, des tuyauteries industrielles et des structures métalliques, surtout en atelier mais aussi sur chantier. Le technicien lit les plans, prépare la fabrication avec des outils numériques, découpe, met en forme, assemble et contrôle les pièces. Le diplôme permet de travailler dans l'aéronautique, le naval, le ferroviaire ou l'énergie, ou, avec un bon dossier, de poursuivre en BTS, par exemple le BTS Conception et réalisation en chaudronnerie industrielle.",
      objectifs: [
        "Lire et exploiter les plans et les documents techniques d'un ouvrage.",
        "Préparer la fabrication d'un élément à l'aide d'outils numériques.",
        "Fabriquer et assembler tout ou partie d'un ensemble chaudronné.",
        "Contrôler la réalisation et proposer des améliorations du poste de travail.",
        "Intervenir sur chantier pour remettre en état un ouvrage en respectant la sécurité et l'environnement.",
      ],
    },
    programme: {
      text: "Le programme du bac pro TCI en alternance associe enseignements généraux et enseignements professionnels, avec une large part de pratique en atelier et sur chantier pour apprendre à fabriquer et assembler des ouvrages en métal.",
      sections: {
        enseignements_generaux: [
          "Français, histoire-géographie et enseignement moral et civique.",
          "Mathématiques et physique-chimie.",
          "Langue vivante, arts appliqués et éducation physique et sportive.",
          "Prévention santé environnement (PSE) et économie-gestion.",
        ],
        enseignements_professionnels: [
          "Analyse et exploitation des données techniques : dessin industriel, plans et cotations.",
          "Préparation de la fabrication avec assistance numérique (CFAO, machines à commande numérique).",
          "Fabrication d'un ensemble chaudronné : traçage, découpage, pliage, roulage et soudage.",
          "Réhabilitation sur chantier d'un ou plusieurs ensembles chaudronnés.",
          "Technologie, résistance des matériaux, contrôle qualité et prévention des risques.",
        ],
        competences_developpees: [
          "Réglage des postes de travail et des machines de découpe, de pliage et de roulage.",
          "Assemblage des pièces par soudage, rivetage ou boulonnage.",
          "Contrôle de la conformité des pièces et des ensembles réalisés.",
          "Organisation de son travail à partir d'un planning de fabrication.",
          "Compte rendu écrit et oral de son travail et échanges avec les autres membres de l'équipe.",
        ],
      },
    },
    metiers: {
      text: "Le bac pro TCI ouvre les portes de nombreux métiers dans la chaudronnerie, la tôlerie, la tuyauterie industrielle et les structures métalliques, pour des secteurs comme l'aéronautique, le naval, le ferroviaire ou l'énergie.",
    },
  },
  {
    slug: "cap-epc",
    titre: "CAP Équipier polyvalent du commerce",
    sousTitre: "Équipier Polyvalent du Commerce",
    intituleLongFormation: "EQUIPIER POLYVALENT DU COMMERCE",
    diplomeFormation: CAP,
    romes: ["D1507", "D1505", "D1106", "D1214", "D1107"],
    kpis: {
      duration: "1 à 2 ans",
      salaire: "504€ - 1 867€",
    },
    description: {
      text: "Le CAP Équipier polyvalent du commerce (EPC) est un diplôme national de niveau 3 (CAP) qui forme aux métiers d'employé de commerce et de vendeur en magasin. Cette formation en alternance prépare à réceptionner et stocker les marchandises, approvisionner les rayons, mettre en valeur les produits, accueillir et conseiller les clients, encaisser leurs achats et leur remettre les commandes passées en ligne. Le CAP EPC a remplacé les anciens CAP Employé de commerce multi-spécialités, Employé de vente spécialisé et Vendeur-magasinier en pièces de rechange et équipements automobiles. Il permet de travailler en supermarché, en commerce de proximité ou chez un grossiste, ou de poursuivre ses études en bac pro.",
      objectifs: [
        "Participer aux commandes auprès des fournisseurs et réceptionner les marchandises.",
        "Stocker les produits et préparer les commandes des clients.",
        "Approvisionner les rayons et mettre en valeur les produits et l'espace de vente.",
        "Accueillir, informer et conseiller les clients dans leur parcours d'achat.",
        "Encaisser les achats et recevoir les réclamations courantes.",
      ],
    },
    programme: {
      text: "Le programme du CAP EPC en alternance associe des enseignements généraux et trois blocs de compétences professionnelles (commandes, mise en valeur des produits, conseil au client), mis en pratique au quotidien dans le magasin.",
      sections: {
        enseignements_generaux: [
          "Français, histoire-géographie et enseignement moral et civique.",
          "Mathématiques et physique-chimie.",
          "Langue vivante étrangère.",
          "Éducation physique et sportive et prévention santé environnement (PSE).",
        ],
        enseignements_professionnels: [
          "Recevoir et suivre les commandes : commandes aux fournisseurs, réception et stockage des marchandises.",
          "Préparer les commandes des clients.",
          "Mettre en valeur et approvisionner : mise en rayon, conditionnement, signalétique et inventaires.",
          "Conseiller et accompagner le client tout au long de son parcours d'achat, en magasin comme pour ses commandes en ligne.",
          "Finaliser la prise en charge du client : encaissement et réclamations courantes.",
        ],
        competences_developpees: [
          "Contrôle des livraisons en quantité et en qualité.",
          "Mise en rayon, étiquetage et installation de la signalétique.",
          "Accueil, information et conseil des clients sur les produits et les services.",
          "Prise de commande et encaissement des achats.",
          "Participation aux inventaires et à la lutte contre la démarque (pertes, casse, vols).",
        ],
      },
    },
    metiers: {
      text: "Le CAP EPC ouvre les portes de nombreux métiers dans le commerce et la distribution, comme employé de libre-service, équipier de caisse ou vendeur en magasin, en alimentaire comme en non alimentaire.",
    },
  },
  {
    slug: "bac-pro-mspc",
    titre: "Bac pro MSPC",
    sousTitre: "Maintenance des Systèmes de Production Connectés",
    intituleLongFormation: "MAINTENANCE DES SYSTEMES DE PRODUCTION CONNECTES",
    diplomeFormation: BAC_PRO,
    romes: ["I1304", "I1310"],
    kpis: {
      duration: "2 à 3 ans",
      salaire: "504€ - 1 867€",
    },
    description: {
      text: "Le bac pro Maintenance des systèmes de production connectés (MSPC) est un diplôme national de niveau 4 (bac) qui forme des techniciens de maintenance industrielle. Cette formation en alternance prépare à surveiller, dépanner et améliorer des équipements de production qui associent mécanique, électricité, pneumatique et hydraulique, en s'appuyant sur les outils numériques et les données des machines. Il remplace l'ancien bac pro Maintenance des équipements industriels (MEI). Le diplôme permet de travailler comme technicien ou agent de maintenance dans l'industrie, ou, avec un bon dossier, de poursuivre en BTS, par exemple le BTS Maintenance des systèmes.",
      objectifs: [
        "Préparer une intervention de maintenance en analysant le fonctionnement du système.",
        "Réaliser des opérations de surveillance et de maintenance préventive.",
        "Diagnostiquer une panne et réparer ou remplacer un composant.",
        "Participer à des travaux d'amélioration et de modernisation des équipements.",
        "Rendre compte de son intervention et conseiller l'utilisateur de l'équipement.",
      ],
    },
    programme: {
      text: "Le programme du bac pro MSPC en alternance associe enseignements généraux et enseignements professionnels, avec une large part de pratique en entreprise sur des équipements de production réels, de la prévention des pannes au dépannage.",
      sections: {
        enseignements_generaux: [
          "Français, histoire-géographie et enseignement moral et civique.",
          "Mathématiques et physique-chimie.",
          "Langue vivante, arts appliqués et éducation physique et sportive.",
          "Prévention santé environnement (PSE) et économie-gestion.",
        ],
        enseignements_professionnels: [
          "Préparation d'une intervention de maintenance : analyse du système, de sa chaîne d'énergie et de sa chaîne d'information.",
          "Maintenance préventive : surveillance, inspection et interventions planifiées ou déclenchées par l'état de l'équipement.",
          "Maintenance corrective d'un système pluritechnologique : diagnostic et dépannage.",
          "Projet d'amélioration continue : modification et modernisation des équipements.",
          "Sécurité des biens et des personnes et respect des règles environnementales.",
        ],
        competences_developpees: [
          "Mise à l'arrêt et remise en service d'une machine en respectant les procédures de sécurité.",
          "Recherche de panne sur des éléments mécaniques, électriques, pneumatiques et hydrauliques.",
          "Réparation ou remplacement de composants défectueux.",
          "Exploitation des données des équipements pour anticiper les pannes.",
          "Rédaction de comptes rendus d'intervention et échanges avec les équipes de production.",
        ],
      },
    },
    metiers: {
      text: "Le bac pro MSPC ouvre les portes de nombreux métiers dans la maintenance industrielle, pour des secteurs comme l'automobile, l'aéronautique, l'agroalimentaire, la chimie, la pharmacie ou la production d'énergie.",
    },
  },
]

export const up = async () => {
  const now = new Date()
  const collection = getDbCollection("seo_diplomes")

  for (const { kpis, metiers, ...diplome } of diplomesData) {
    await collection.updateOne(
      { slug: diplome.slug },
      {
        $set: { ...diplome, "kpis.duration": kpis.duration, "kpis.salaire": kpis.salaire, "metiers.text": metiers.text, updated_at: now },
        $setOnInsert: { _id: new ObjectId(), "kpis.entreprises": 0, "kpis.offres": 0, "metiers.liste": [], ecoles: [], cards: [], created_at: now },
      },
      { upsert: true }
    )
  }

  await updateSeoDiplome()
  logger.info(`seo-diplomes-lot2 : ${diplomesData.length} pages diplôme créées ou mises à jour`)
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
