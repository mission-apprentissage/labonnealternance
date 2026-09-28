import { ObjectId } from "mongodb"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { updateSeoDiplome } from "@/services/seo.service"

const CAP = "CERTIFICAT D'APTITUDE PROFESSIONNELLE"
const BAC_PRO = "BAC PROFESSIONNEL"

/**
 * Lot 1 des pages diplôme de niveau ≤ bac+2 (#5539) : 5 CAP, 4 bacs pro et le titre pro ADVF.
 *
 * Contenu vérifié affirmation par affirmation sur les sources officielles (RNCP, Légifrance, eduscol,
 * Onisep). `intituleLongFormation`, `diplomeFormation` et `romes` sont alignés sur le catalogue des
 * formations : `diplomeFormation` écarte du bloc « Écoles » les diplômes homonymes (bac pro et BP
 * « CUISINE », BTS « CYBERSECURITE, INFORMATIQUE ET RESEAUX, ELECTRONIQUE »…). Le titre pro ADVF n'a pas
 * d'homonyme au catalogue, d'où l'absence de filtre.
 *
 * Upsert par slug : les champs éditoriaux sont (ré)écrits, les champs calculés par updateSeoDiplome
 * (offres, entreprises, écoles, métiers, cartes) ne sont initialisés qu'à la création — la migration
 * est rejouable sans doublon ni perte des derniers calculs.
 */
const diplomesData = [
  {
    slug: "cap-esthetique",
    titre: "CAP Esthétique",
    sousTitre: "Esthétique Cosmétique Parfumerie",
    intituleLongFormation: "ESTHETIQUE COSMETIQUE PARFUMERIE",
    diplomeFormation: CAP,
    romes: ["D1208"],
    kpis: {
      duration: "1 à 2 ans",
      salaire: "504€ - 1 867€",
    },
    description: {
      text: "Le CAP Esthétique Cosmétique Parfumerie (ECP) est un diplôme national de niveau 3 (CAP) qui forme au métier d'esthéticien ou d'esthéticienne. Cette formation en alternance prépare à réaliser des soins du visage, des mains et des pieds, des maquillages et des épilations, ainsi qu'à conseiller la clientèle et à vendre des produits cosmétiques et de parfumerie. Les soins esthétiques étant une activité réglementée, ce diplôme atteste de la qualification professionnelle demandée pour les pratiquer. Il permet aussi de poursuivre vers le BP ou le bac pro Esthétique Cosmétique Parfumerie.",
      objectifs: [
        "Réaliser des soins esthétiques du visage, des mains et des pieds.",
        "Réaliser des maquillages du visage adaptés à chaque client.",
        "Réaliser des épilations, des colorations des cils et sourcils et des soins des ongles.",
        "Accueillir, conseiller la clientèle et vendre des produits et des prestations.",
        "Participer à la vie d'un institut de beauté et de bien-être.",
      ],
    },
    programme: {
      text: "Le programme du CAP Esthétique en alternance s'organise autour de trois pôles professionnels, complétés par des enseignements généraux, et alterne cours en centre de formation et pratique en institut de beauté ou en parfumerie.",
      sections: {
        enseignements_generaux: [
          "Français, histoire-géographie et enseignement moral et civique.",
          "Mathématiques et physique-chimie.",
          "Langue vivante étrangère.",
          "Éducation physique et sportive (EPS).",
        ],
        enseignements_professionnels: [
          "Techniques esthétiques du visage, des mains et des pieds : soins, maquillage et prestation UV.",
          "Techniques esthétiques liées aux phanères : épilations, cils, sourcils et ongles.",
          "Conduite d'un institut de beauté et de bien-être : accueil, conseil et vente.",
          "Biologie de la peau, produits cosmétiques et appareils de soins.",
          "Prévention santé environnement (PSE).",
        ],
        competences_developpees: [
          "Réalisation d'un soin du visage adapté au type de peau.",
          "Épilation à la cire et à la pince du visage et du corps.",
          "Pose de vernis classique ou semi-permanent sur les ongles.",
          "Conseil et vente de produits cosmétiques, de parfums et de prestations.",
          "Organisation du planning de rendez-vous et suivi de la clientèle.",
        ],
      },
    },
    metiers: {
      text: "Le CAP Esthétique ouvre les portes de nombreux métiers dans les instituts de beauté, les centres esthétiques, les parfumeries, les parapharmacies et la distribution de produits cosmétiques.",
    },
  },
  {
    slug: "cap-coiffure",
    titre: "CAP Coiffure",
    sousTitre: "Métiers de la Coiffure",
    intituleLongFormation: "METIERS DE LA COIFFURE",
    diplomeFormation: CAP,
    romes: ["D1202"],
    kpis: {
      duration: "1 à 2 ans",
      salaire: "504€ - 1 867€",
    },
    description: {
      text: "Le CAP Métiers de la coiffure est un diplôme national de niveau 3 (CAP) qui forme aux techniques de base de la coiffure pour une clientèle féminine et masculine. Cette formation en alternance prépare à réaliser les soins capillaires, les coupes, les colorations, les mises en forme et les coiffages, mais aussi à accueillir et conseiller les clients. Le diplômé travaille le plus souvent en salon de coiffure, indépendant ou en réseau, et peut poursuivre ses études en brevet professionnel (BP) coiffure, en bac pro Métiers de la coiffure ou en certificat de spécialisation (CS) coiffure coupe couleur.",
      objectifs: [
        "Réaliser un diagnostic du cuir chevelu et des cheveux avant chaque prestation.",
        "Mettre en œuvre les techniques d'hygiène et de soin capillaire.",
        "Réaliser des coupes femme et homme, des colorations et des mises en forme.",
        "Accueillir la clientèle, conseiller et vendre des services et des produits capillaires.",
        "Participer à l'activité du salon : prise de rendez-vous, stocks et espace de vente.",
      ],
    },
    programme: {
      text: "Le programme du CAP Métiers de la coiffure en alternance associe enseignements généraux et formation professionnelle autour de deux blocs : la réalisation de prestations de coiffure, et la relation avec la clientèle et la participation à l'activité de l'entreprise, mis en pratique au salon.",
      sections: {
        enseignements_generaux: [
          "Français, histoire-géographie et enseignement moral et civique.",
          "Mathématiques et physique-chimie.",
          "Éducation physique et sportive.",
          "Langue vivante étrangère.",
        ],
        enseignements_professionnels: [
          "Diagnostic, hygiène et soins capillaires.",
          "Techniques de coupe femme et homme.",
          "Techniques de couleur, de mise en forme temporaire ou durable et de coiffage.",
          "Relation clientèle, vente et participation à l'activité de l'entreprise.",
          "Biologie appliquée, technologie et prévention santé environnement (PSE).",
        ],
        competences_developpees: [
          "Réalisation d'un diagnostic capillaire avant chaque prestation.",
          "Shampooing et soins adaptés à la nature du cuir chevelu et des cheveux.",
          "Coupe aux ciseaux, au rasoir et à la tondeuse.",
          "Application de colorations et réalisation de brushings, mises en plis et coiffages.",
          "Accueil, prise de rendez-vous, encaissement et fidélisation de la clientèle.",
        ],
      },
    },
    metiers: {
      text: "Le CAP Métiers de la coiffure permet d'exercer le métier de coiffeur ou coiffeuse dans les salons de coiffure, la coiffure à domicile, les établissements de soins ou de bien-être et le secteur du spectacle et de la mode.",
    },
  },
  {
    slug: "cap-cuisine",
    titre: "CAP Cuisine",
    sousTitre: "Cuisine",
    intituleLongFormation: "CUISINE",
    diplomeFormation: CAP,
    romes: ["G1602"],
    kpis: {
      duration: "1 à 2 ans",
      salaire: "504€ - 1 867€",
    },
    description: {
      text: "Le CAP Cuisine est un diplôme national de niveau 3 (CAP) qui forme au métier de cuisinier dans tous les types de restauration. Cette formation en alternance prépare à réceptionner et stocker les marchandises, organiser sa production, réaliser les techniques culinaires de base, dresser les assiettes et participer à la distribution des plats, dans le respect des règles d'hygiène et de sécurité. Le diplôme permet de travailler comme commis de cuisine ou cuisinier en restaurant, en brasserie, en restauration collective ou chez un traiteur. Il est aussi possible de poursuivre ses études en certificat de spécialisation, en bac pro ou en brevet professionnel.",
      objectifs: [
        "Réceptionner, contrôler et stocker les marchandises.",
        "Organiser sa production à partir des consignes et des fiches techniques.",
        "Réaliser les techniques culinaires de base et cuisiner des plats.",
        "Dresser les assiettes et participer à la distribution des plats.",
        "Respecter les règles d'hygiène, de sécurité et de développement durable.",
      ],
    },
    programme: {
      text: "Le programme du CAP Cuisine en alternance associe des enseignements généraux et une culture professionnelle (cuisine, gestion appliquée et sciences appliquées), complétés par la pratique quotidienne en cuisine au sein de l'entreprise.",
      sections: {
        enseignements_generaux: [
          "Français, histoire-géographie et enseignement moral et civique.",
          "Mathématiques et physique-chimie.",
          "Langue vivante étrangère.",
          "Éducation physique et sportive et prévention santé environnement (PSE).",
        ],
        enseignements_professionnels: [
          "Organisation de la production de cuisine : réception, stockage et planification du travail.",
          "Préparation et distribution de la production de cuisine.",
          "Techniques culinaires de base, produits et spécialités régionales.",
          "Sciences appliquées à l'hygiène, à l'alimentation et à la sécurité.",
          "Gestion appliquée et environnement professionnel de la restauration.",
        ],
        competences_developpees: [
          "Réception des livraisons, contrôle et stockage des denrées.",
          "Mise en place et entretien de son poste de travail.",
          "Réalisation des techniques préliminaires et des cuissons.",
          "Dressage des assiettes et contrôle de la qualité des préparations.",
          "Communication avec l'équipe, le responsable et les clients.",
        ],
      },
    },
    metiers: {
      text: "Le CAP Cuisine ouvre les portes de nombreux métiers dans la restauration traditionnelle, commerciale ou collective, comme commis de cuisine ou cuisinier, avec une évolution possible vers des postes à responsabilité.",
    },
  },
  {
    slug: "cap-patissier",
    titre: "CAP Pâtissier",
    sousTitre: "Pâtissier",
    intituleLongFormation: "PATISSIER",
    diplomeFormation: CAP,
    romes: ["D1104"],
    kpis: {
      duration: "1 à 2 ans",
      salaire: "504€ - 1 867€",
    },
    description: {
      text: "Le CAP Pâtissier est un diplôme national de niveau 3 (CAP) qui forme à la fabrication de pâtisseries à partir de matières premières : petits fours, gâteaux de voyage, viennoiseries, entremets et petits gâteaux. Cette formation en alternance prépare à organiser son poste, à maîtriser les pâtes, les crèmes et les décors, dans le respect des règles d'hygiène et de traçabilité. Le titulaire travaille en pâtisserie, boulangerie, chocolaterie, grande surface ou restauration, et peut poursuivre ses études en certificat de spécialisation, en brevet professionnel ou en brevet technique des métiers.",
      objectifs: [
        "Réceptionner, contrôler et stocker les matières premières.",
        "Organiser son poste de travail en respectant les règles d'hygiène.",
        "Fabriquer des pâtes, des petits fours secs et moelleux et des gâteaux de voyage.",
        "Réaliser, monter et décorer des entremets et des petits gâteaux.",
        "Valoriser les pâtisseries et calculer le coût des produits fabriqués.",
      ],
    },
    programme: {
      text: "Le programme du CAP Pâtissier en alternance associe enseignements généraux et pratique professionnelle en entreprise autour de deux pôles : les pâtes, petits fours et gâteaux de voyage, puis les entremets et petits gâteaux.",
      sections: {
        enseignements_generaux: [
          "Français, histoire-géographie et enseignement moral et civique.",
          "Mathématiques et physique-chimie.",
          "Éducation physique et sportive et langue vivante étrangère.",
          "Prévention santé environnement (PSE).",
        ],
        enseignements_professionnels: [
          "Approvisionnement, stockage et organisation du poste de travail.",
          "Pâtes feuilletées, levées et friables, petits fours secs et moelleux, gâteaux de voyage.",
          "Crèmes, mousses, garnitures et fonds d'entremets.",
          "Montage, glaçage et décoration d'entremets et de petits gâteaux.",
          "Valorisation des produits et calcul du coût de fabrication.",
        ],
        competences_developpees: [
          "Réception, contrôle et rangement des livraisons de matières premières.",
          "Fabrication de pâtes feuilletées, levées feuilletées, brisées et sablées.",
          "Préparation de crèmes (pâtissière, anglaise, au beurre, ganache) et de mousses.",
          "Réalisation de décors en chocolat, pâte d'amandes, nougatine ou sucre.",
          "Application des règles d'hygiène, de traçabilité et de conservation des produits.",
        ],
      },
    },
    metiers: {
      text: "Le CAP Pâtissier ouvre les portes de nombreux métiers dans la pâtisserie artisanale, la boulangerie-pâtisserie, la chocolaterie, la grande distribution, la restauration et les salons de thé.",
    },
  },
  {
    slug: "cap-electricien",
    titre: "CAP Électricien",
    sousTitre: "Électricien",
    intituleLongFormation: "ELECTRICIEN",
    diplomeFormation: CAP,
    romes: ["F1602", "F1605"],
    kpis: {
      duration: "1 à 2 ans",
      salaire: "504€ - 1 867€",
    },
    description: {
      text: "Le CAP Électricien est un diplôme national de niveau 3 (CAP) qui prépare au métier d'électricien dans le bâtiment, l'industrie, les réseaux et les infrastructures. Cette formation en alternance apprend à installer, raccorder, mettre en service et entretenir des installations électriques et des réseaux de communication, dans le respect des normes et des règles de sécurité. Il remplace l'ancien CAP Préparation et réalisation d'ouvrages électriques. Le diplôme permet de travailler directement comme ouvrier électricien ou de poursuivre vers un bac professionnel ou le brevet professionnel (BP) Électricien.",
      objectifs: [
        "Préparer une intervention à partir du dossier technique et de la liste du matériel.",
        "Poser, câbler et raccorder les équipements d'une installation électrique.",
        "Réaliser les vérifications et les essais nécessaires à la mise en service.",
        "Effectuer la maintenance préventive et remplacer un matériel électrique.",
        "Expliquer le fonctionnement de l'installation au client et échanger avec l'équipe.",
      ],
    },
    programme: {
      text: "Le programme du CAP Électricien en alternance associe enseignements généraux et formation professionnelle, organisée autour de trois blocs : la réalisation, la mise en service et la maintenance d'une installation électrique.",
      sections: {
        enseignements_generaux: [
          "Français, histoire-géographie et enseignement moral et civique.",
          "Mathématiques et physique-chimie.",
          "Éducation physique et sportive.",
          "Prévention santé environnement (PSE).",
        ],
        enseignements_professionnels: [
          "Préparer les opérations : dossier technique, matériel et outillage.",
          "Réaliser une installation : implantation, pose, câblage et raccordement.",
          "Mettre en service une installation : contrôles, mesures, réglages et essais.",
          "Assurer la maintenance d'une installation électrique.",
          "Communiquer avec l'équipe et le client sur l'intervention.",
        ],
        competences_developpees: [
          "Lecture de schémas électriques et de plans d'installation.",
          "Installation des matériels de distribution, de protection, de commande et d'éclairage, y compris en domotique.",
          "Contrôle des grandeurs électriques avec des appareils de mesure.",
          "Application des règles de sécurité électrique et de prévention des risques.",
          "Utilisation d'outils numériques pour les schémas et les comptes rendus.",
        ],
      },
    },
    metiers: {
      text: "Le CAP Électricien ouvre les portes de nombreux métiers dans le bâtiment, l'industrie et les réseaux, comme installateur électricien, installateur domotique, câbleur ou monteur électricien.",
    },
  },
  {
    slug: "bac-pro-melec",
    titre: "Bac pro MELEC",
    sousTitre: "Métiers de l'Électricité et de ses Environnements Connectés",
    intituleLongFormation: "METIERS DE L'ELECTRICITE ET DE SES ENVIRONNEMENTS CONNECTES",
    diplomeFormation: BAC_PRO,
    romes: ["F1602", "I1309"],
    kpis: {
      duration: "2 à 3 ans",
      salaire: "504€ - 1 867€",
    },
    description: {
      text: "Le bac pro Métiers de l'électricité et de ses environnements connectés (MELEC) est un diplôme national de niveau 4 (bac) qui forme au métier d'électricien et d'électrotechnicien. Cette formation en alternance prépare à installer, mettre en service et entretenir des installations électriques et des réseaux de communication dans les bâtiments, l'industrie et les infrastructures. Son programme intègre la transition énergétique, la domotique et les bâtiments connectés. Le diplôme permet de travailler directement comme électricien ou, avec un bon dossier, de poursuivre en BTS, par exemple en électrotechnique.",
      objectifs: [
        "Préparer les opérations d'installation, de mise en service et de maintenance.",
        "Installer et raccorder des équipements électriques en respectant les règles de sécurité.",
        "Régler, paramétrer et contrôler une installation avant sa mise en service.",
        "Diagnostiquer une panne et remplacer un matériel électrique défectueux.",
        "Communiquer avec l'équipe, les autres intervenants et les clients.",
      ],
    },
    programme: {
      text: "Le programme du bac pro MELEC en alternance associe enseignements généraux et enseignements professionnels, avec une large part de pratique en entreprise sur des installations électriques et des réseaux de communication.",
      sections: {
        enseignements_generaux: [
          "Français, histoire-géographie et enseignement moral et civique.",
          "Mathématiques et physique-chimie.",
          "Langue vivante, arts appliqués et éducation physique et sportive.",
          "Prévention santé environnement (PSE) et économie-gestion.",
        ],
        enseignements_professionnels: [
          "Préparation des opérations : analyse du chantier, choix des matériels et documents techniques.",
          "Réalisation et mise en service d'une installation électrique.",
          "Maintenance d'une installation : diagnostic et dépannage.",
          "Chaîne d'énergie (production, distribution, protection) et chaîne d'information (réseaux, automatismes, capteurs).",
          "Qualité, sécurité et environnement, dont les règles liées aux habilitations électriques.",
        ],
        competences_developpees: [
          "Câblage et raccordement de tableaux et d'équipements électriques.",
          "Réglage et paramétrage de matériels connectés (domotique, éclairage, bornes de recharge).",
          "Contrôle des grandeurs électriques et essais avant mise en service.",
          "Recherche de panne et remplacement de matériel électrique.",
          "Explication du fonctionnement de l'installation au client et conseil sur des améliorations.",
        ],
      },
    },
    metiers: {
      text: "Le bac pro MELEC ouvre les portes de nombreux métiers dans l'électricité du bâtiment, l'industrie, les réseaux d'énergie et de communication, et les infrastructures comme l'éclairage public ou la recharge électrique.",
    },
  },
  {
    slug: "bac-pro-ciel",
    titre: "Bac pro CIEL",
    sousTitre: "Cybersécurité, Informatique et réseaux, Électronique",
    intituleLongFormation: "CYBERSECURITE, INFORMATIQUE ET RESEAUX, ELECTRONIQUE",
    diplomeFormation: BAC_PRO,
    romes: ["I1401", "I1305", "I1307", "H2605"],
    kpis: {
      duration: "2 à 3 ans",
      salaire: "504€ - 1 867€",
    },
    description: {
      text: "Le bac pro Cybersécurité, Informatique et réseaux, Électronique (CIEL) est un diplôme national de niveau 4 (bac) qui forme des techniciens de l'électronique et des réseaux informatiques. Cette formation en alternance prépare à réaliser et entretenir des produits électroniques, à installer et exploiter des réseaux informatiques et à traiter des données en tenant compte des enjeux de cybersécurité. Il remplace l'ancien bac pro Systèmes numériques (SN). Le diplôme permet d'entrer directement dans la vie active, dans des secteurs comme les télécommunications, la domotique ou l'industrie, ou de poursuivre en BTS, par exemple le BTS CIEL.",
      objectifs: [
        "Réaliser des maquettes et des prototypes de produits électroniques.",
        "Assurer la maintenance et la réparation de systèmes électroniques.",
        "Installer et exploiter un réseau informatique.",
        "Développer et tester des solutions logicielles.",
        "Prendre en compte la cybersécurité dans le traitement des données et des incidents.",
      ],
    },
    programme: {
      text: "Le programme du bac pro CIEL en alternance couvre l'électronique, les réseaux informatiques et la cybersécurité, en alliant enseignements généraux, enseignements professionnels et pratique en entreprise.",
      sections: {
        enseignements_generaux: [
          "Français, histoire-géographie et enseignement moral et civique.",
          "Mathématiques et physique-chimie.",
          "Économie-gestion et prévention santé environnement (PSE).",
          "Langue vivante, arts appliqués et éducation physique et sportive.",
        ],
        enseignements_professionnels: [
          "Réalisation et maintenance de produits électroniques.",
          "Mise en œuvre et maintenance de réseaux informatiques.",
          "Valorisation de la donnée et cybersécurité.",
          "Développement et test de solutions logicielles (programmation).",
          "Gestion des incidents et suivi des interventions.",
        ],
        competences_developpees: [
          "Assemblage et câblage de cartes et d'ensembles électroniques.",
          "Mesures et tests pour repérer une panne et la réparer.",
          "Installation, configuration et mise à jour d'équipements réseau.",
          "Accueil du client et explication du fonctionnement de son installation.",
          "Communication professionnelle en français et en anglais.",
        ],
      },
    },
    metiers: {
      text: "Le bac pro CIEL ouvre les portes de nombreux métiers dans l'électronique, les réseaux informatiques et les télécommunications, de l'installation au dépannage en passant par la maintenance informatique.",
    },
  },
  {
    slug: "bac-pro-mcv",
    titre: "Bac pro MCV",
    sousTitre: "Métiers du Commerce et de la Vente",
    intituleLongFormation: "METIERS DU COMMERCE ET DE LA VENTE",
    diplomeFormation: BAC_PRO,
    romes: ["D1403", "D1507", "D1214", "D1212", "D1106", "D1408"],
    kpis: {
      duration: "2 à 3 ans",
      salaire: "504€ - 1 867€",
    },
    description: {
      text: "Le bac pro Métiers du commerce et de la vente (MCV) est un diplôme national de niveau 4 (bac) qui forme aux métiers de la vente et de la relation client. Cette formation en alternance prépare à conseiller et vendre, en magasin comme à distance, à suivre les ventes et à fidéliser la clientèle. Deux options sont proposées : l'option A, animation et gestion de l'espace commercial, et l'option B, prospection clientèle et valorisation de l'offre commerciale. Le bac pro MCV remplace les anciens bacs pro Commerce et Vente et permet une insertion directe ou une poursuite d'études en BTS.",
      objectifs: [
        "Conseiller le client et réaliser la vente, en magasin comme à distance.",
        "Assurer le suivi des commandes, des retours et des réclamations.",
        "Fidéliser la clientèle et développer la relation client.",
        "Animer et gérer l'espace commercial (option A).",
        "Prospecter de nouveaux clients et valoriser l'offre commerciale (option B).",
      ],
    },
    programme: {
      text: "Le programme du bac pro MCV en alternance associe enseignements généraux et enseignements professionnels : trois blocs de compétences communs aux deux options, un bloc propre à l'option choisie et une mise en pratique en entreprise.",
      sections: {
        enseignements_generaux: [
          "Français, histoire-géographie et enseignement moral et civique.",
          "Mathématiques.",
          "Économie-droit, langue vivante A et langue vivante B.",
          "Arts appliqués, éducation physique et sportive et prévention santé environnement (PSE).",
        ],
        enseignements_professionnels: [
          "Conseiller et vendre : veille commerciale et vente en magasin ou à distance.",
          "Suivre les ventes : commandes, retours, réclamations et satisfaction du client.",
          "Fidéliser la clientèle et développer la relation client.",
          "Option A : animer et gérer l'espace commercial pour le rendre attractif et fonctionnel.",
          "Option B : prospecter de nouveaux clients et valoriser les produits ou services.",
        ],
        competences_developpees: [
          "Accueil, conseil et argumentation auprès des clients.",
          "Vente en face à face, au téléphone ou en ligne.",
          "Suivi des commandes et traitement des réclamations.",
          "Approvisionnement, mise en rayon et mise en valeur des produits (option A).",
          "Préparation et réalisation d'opérations de prospection (option B).",
        ],
      },
    },
    metiers: {
      text: "Le bac pro MCV ouvre les portes de nombreux métiers dans le commerce et la vente, en magasin, à distance ou sur le terrain auprès des clients.",
    },
  },
  {
    slug: "bac-pro-assp",
    titre: "Bac pro ASSP",
    sousTitre: "Accompagnement, Soins et Services à la Personne",
    intituleLongFormation: "ACCOMPAGNEMENT, SOINS ET SERVICES A LA PERSONNE",
    diplomeFormation: BAC_PRO,
    romes: ["K1302", "J1301"],
    kpis: {
      duration: "2 à 3 ans",
      salaire: "504€ - 1 867€",
    },
    description: {
      text: "Le bac pro Accompagnement, soins et services à la personne (ASSP) est un diplôme national de niveau 4 (baccalauréat) qui forme à l'accompagnement des personnes non autonomes, en particulier les personnes âgées ou en situation de handicap. Cette formation en alternance prépare à intervenir en établissement de santé, en structure médico-sociale ou à domicile : soins d'hygiène et de confort, aide aux repas et surveillance de l'état de santé. Il permet de travailler directement ou de préparer ensuite le diplôme d'État d'aide-soignant, d'auxiliaire de puériculture ou un BTS du secteur sanitaire et social.",
      objectifs: [
        "Accompagner la personne dans les activités de la vie quotidienne.",
        "Réaliser des soins d'hygiène, de confort et de sécurité.",
        "Participer à la mise en œuvre du projet individualisé de la personne.",
        "Travailler et communiquer au sein d'une équipe pluriprofessionnelle.",
        "Concevoir et conduire des actions d'éducation à la santé.",
      ],
    },
    programme: {
      text: "Le programme du Bac pro ASSP en alternance s'organise autour de quatre blocs de compétences professionnelles, complétés par des enseignements généraux et une pratique en établissement de santé, en structure médico-sociale ou à domicile.",
      sections: {
        enseignements_generaux: [
          "Français, histoire-géographie et enseignement moral et civique.",
          "Mathématiques et physique-chimie.",
          "Langue vivante étrangère, arts appliqués et cultures artistiques, éducation physique et sportive.",
          "Prévention santé environnement (PSE) et économie-gestion.",
        ],
        enseignements_professionnels: [
          "Accompagner la personne dans une approche globale et individualisée.",
          "Intervenir auprès de la personne lors des soins d'hygiène, de confort et de sécurité.",
          "Travailler et communiquer en équipe pluriprofessionnelle.",
          "Réaliser des actions d'éducation à la santé pour un public ciblé.",
          "Sciences médico-sociales, nutrition-alimentation, microbiologie et biologie-physiopathologie.",
        ],
        competences_developpees: [
          "Soins d'hygiène et de confort : toilette, habillage, accompagnement à la mobilité.",
          "Surveillance de l'état de santé et transmission des observations à l'équipe.",
          "Accompagnement de la personne lors des repas et des collations.",
          "Entretien des espaces de vie et coordination d'une équipe de bionettoyage.",
          "Accompagnement à l'utilisation des outils numériques et de la domotique.",
        ],
      },
    },
    metiers: {
      text: "Le Bac pro ASSP ouvre les portes de nombreux métiers dans les secteurs sanitaire, médico-social et de l'aide à domicile, auprès des personnes âgées, en situation de handicap ou en perte d'autonomie.",
    },
  },
  {
    slug: "titre-pro-advf",
    titre: "Titre Pro ADVF",
    sousTitre: "Assistant de Vie aux Familles",
    intituleLongFormation: "ASSISTANT DE VIE AUX FAMILLES",
    romes: ["K1302", "K1304", "K1303"],
    kpis: {
      duration: "12 mois",
      salaire: "504€ - 1 867€",
    },
    description: {
      text: "Le titre professionnel Assistant de vie aux familles (ADVF) est une certification de niveau 3 (équivalent CAP) délivrée par le ministère du Travail. Cette formation en alternance prépare à aider au quotidien, à leur domicile, des personnes âgées, malades ou en situation de handicap, ainsi que des familles avec de jeunes enfants. L'ADVF entretient le logement et le linge, accompagne la personne dans les gestes de la vie courante et assure la garde d'enfants à domicile. Le titre donne accès aux métiers d'auxiliaire de vie, d'assistant de vie, d'agent à domicile ou de garde d'enfant à domicile.",
      objectifs: [
        "Entretenir le logement et le linge d'un particulier avec les bons gestes professionnels.",
        "Aider la personne à faire sa toilette, à s'habiller et à se déplacer.",
        "Accompagner la personne lors des courses, de la préparation et de la prise des repas.",
        "Aider la personne à réaliser ses projets et à garder un lien social.",
        "Assurer la garde d'enfants à domicile en relais des parents.",
      ],
    },
    programme: {
      text: "Le programme du titre pro ADVF en alternance s'organise autour de trois blocs de compétences (CCP), qui peuvent être validés séparément, et alterne cours en centre de formation et interventions sur le terrain auprès des personnes aidées.",
      sections: {
        enseignements_generaux: [
          "Certificat Sauveteur secouriste du travail (SST) ou Acteur prévention secours du secteur de l'aide et du soin à domicile (APS-ASD), exigé pour obtenir le titre.",
          "Communication avec la personne aidée, son entourage et l'équipe.",
          "Organisation de son intervention et gestion de son temps.",
          "Hygiène, prévention des risques professionnels et écogestes.",
        ],
        enseignements_professionnels: [
          "Entretien du logement et du linge d'un particulier (CCP 1).",
          "Accompagnement de la personne dans ses activités essentielles du quotidien et dans ses projets (CCP 2).",
          "Aide aux projets de la personne et maintien du lien social.",
          "Adaptation de l'intervention aux personnes en situation de handicap.",
          "Garde de l'enfant à domicile en relais des parents (CCP 3).",
        ],
        competences_developpees: [
          "Nettoyage des pièces du logement, lavage et repassage du linge.",
          "Aide à la toilette, à l'habillage et aux déplacements de la personne.",
          "Préparation de repas simples et équilibrés, adaptés aux goûts de la personne et aux régimes prescrits.",
          "Repérage des situations d'urgence et application des gestes de premiers secours.",
          "Gestes du quotidien auprès de l'enfant (lever, coucher, toilette, habillage, repas) et accompagnement dans ses apprentissages et ses activités.",
        ],
      },
    },
    metiers: {
      text: "Le titre pro ADVF ouvre les portes de nombreux métiers de l'aide à domicile, auprès des personnes âgées ou en situation de handicap comme des familles avec de jeunes enfants.",
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

  // Le 1er code ROME pilotait vers l'assistanat commercial (D1401) : métiers affichés et lien « Voir les
  // offres » hors sujet. M1609 = Secrétaire médical / Secrétaire médicale.
  await collection.updateOne({ slug: "titre-pro-secretaire-medicale" }, { $set: { romes: ["M1609"], updated_at: now } })

  await updateSeoDiplome()
  logger.info(`seo-diplomes-lot1 : ${diplomesData.length} pages diplôme créées ou mises à jour`)
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
