import { ObjectId } from "mongodb"
import { getDbCollection } from "@/common/utils/mongodbUtils"

const diplomesData = [
  {
    slug: "bts-cg",
    titre: "BTS CG",
    sousTitre: "Comptabilité et Gestion",
    intituleLongFormation: "COMPTABILITE ET GESTION",
    romes: ["M1203"],
    kpis: { duration: "2 ans", entreprise: 0, salaire: "1120€-1300€" },
    description: {
      text: "Le BTS Comptabilité et Gestion (BTS CG) est un diplôme d'État de niveau Bac+2 qui forme des techniciens supérieurs capables de prendre en charge les activités comptables et de gestion d'une entreprise ou d'un cabinet d'expertise comptable. Cette formation en alternance permet d'acquérir des compétences opérationnelles en comptabilité, fiscalité, gestion sociale et analyse financière, tout en développant une expérience professionnelle concrète. Le BTS CG en alternance est particulièrement apprécié des recruteurs pour la polyvalence et l'autonomie immédiate des diplômés.",
      objectifs: [
        "Maîtriser le traitement comptable des opérations commerciales et financières.",
        "Gérer les obligations fiscales et sociales de l'entreprise.",
        "Produire et analyser l'information financière.",
        "Réaliser l'analyse et la prévision de l'activité.",
        "Utiliser les outils numériques et les systèmes d'information comptables.",
      ],
    },
    programme: {
      text: "Le programme du BTS CG en alternance est structuré autour de 7 processus professionnels couvrant l'ensemble des activités comptables et financières, complétés par des enseignements généraux.",
      sections: {
        enseignements_generaux: ["Culture générale et expression.", "Anglais obligatoire.", "Mathématiques appliquées.", "Économie, droit et management des entreprises."],
        enseignements_professionnels: [
          "Contrôle et traitement comptable des opérations commerciales (P1).",
          "Contrôle et production de l'information financière (P2).",
          "Gestion des obligations fiscales (P3).",
          "Gestion des relations sociales (P4).",
          "Analyse et prévision de l'activité (P5).",
          "Analyse de la situation financière (P6).",
        ],
        competences_developpees: [
          "Maîtrise des logiciels comptables et des tableurs.",
          "Établissement des déclarations fiscales et sociales.",
          "Analyse des documents de synthèse (bilan, compte de résultat).",
          "Contrôle de gestion et élaboration de tableaux de bord.",
          "Communication professionnelle et travail collaboratif.",
        ],
      },
    },
    ecoles: [],
    salaire: [
      { age: "16-17 ans", premiereAnnee: "471€", deuxiemeAnnee: "689€" },
      { age: "18-20 ans", premiereAnnee: "751€", deuxiemeAnnee: "891€" },
      { age: "21-25 ans", premiereAnnee: "849€", deuxiemeAnnee: "980€" },
      { age: "26 ans et +", premiereAnnee: "1 767€", deuxiemeAnnee: "1 767€" },
    ],
    metiers: {
      text: "Le BTS Comptabilité et Gestion ouvre les portes de nombreux métiers dans la comptabilité, la finance et la gestion d'entreprise.",
      liste: [],
    },
    cards: [],
  },
  {
    slug: "bts-communication",
    titre: "BTS Communication",
    sousTitre: "Communication",
    intituleLongFormation: "COMMUNICATION",
    romes: ["E1103"],
    kpis: { duration: "2 ans", entreprise: 0, salaire: "849€-980€" },
    description: {
      text: "Le BTS Communication forme des professionnels capables de concevoir et mettre en œuvre des opérations de communication. Cette formation en alternance de niveau Bac+2 prépare aux métiers de la communication d'entreprise, de la publicité, des relations presse et du digital. En alternance, les étudiants développent une expertise concrète en création de supports, gestion de projets et relations clients, ce qui constitue un véritable atout sur le marché de l'emploi.",
      objectifs: [
        "Contribuer à l'élaboration et au pilotage de la stratégie de communication.",
        "Concevoir et réaliser des supports de communication (print et digital).",
        "Organiser et gérer des événements de communication.",
        "Gérer la relation avec les prestataires et les partenaires.",
        "Veiller à la cohérence de l'image de l'organisation.",
      ],
    },
    programme: {
      text: "Le programme du BTS Communication en alternance couvre un large éventail de compétences en communication, alliant enseignements théoriques et pratique professionnelle en entreprise.",
      sections: {
        enseignements_generaux: [
          "Cultures de la communication.",
          "Langue vivante étrangère (anglais).",
          "Culture économique, juridique et managériale.",
          "Expression et culture générale.",
        ],
        enseignements_professionnels: [
          "Contribution à l'élaboration et au pilotage de la stratégie de communication.",
          "Conception et mise en œuvre de solutions de communication.",
          "Accompagnement du développement de solutions media et digitales.",
          "Veille opérationnelle et études de marché.",
        ],
        competences_developpees: [
          "Maîtrise des outils de PAO et de création graphique.",
          "Gestion de projet événementiel et communication digitale.",
          "Rédaction de contenus et storytelling.",
          "Relations presse et relations publiques.",
          "Pilotage de campagnes sur les réseaux sociaux.",
        ],
      },
    },
    ecoles: [],
    salaire: [
      { age: "16-17 ans", premiereAnnee: "471€", deuxiemeAnnee: "689€" },
      { age: "18-20 ans", premiereAnnee: "751€", deuxiemeAnnee: "891€" },
      { age: "21-25 ans", premiereAnnee: "849€", deuxiemeAnnee: "980€" },
      { age: "26 ans et +", premiereAnnee: "1 767€", deuxiemeAnnee: "1 767€" },
    ],
    metiers: {
      text: "Le BTS Communication ouvre les portes de nombreux métiers dans la communication d'entreprise, la publicité et le digital.",
      liste: [],
    },
    cards: [],
  },
  {
    slug: "bts-gpme",
    titre: "BTS GPME",
    sousTitre: "Gestion de la PME",
    intituleLongFormation: "GESTION DE LA PME",
    romes: ["M1203", "M1501", "M1604"],
    kpis: { duration: "2 ans", entreprise: 0, salaire: "1120€-1300€" },
    description: {
      text: "Le BTS Gestion de la PME forme des collaborateurs polyvalents capables d'assister le dirigeant d'une petite ou moyenne entreprise dans l'ensemble de ses activités. Cette formation en alternance permet d'acquérir des compétences en gestion administrative, relation clients et fournisseurs, gestion du personnel et communication. Le BTS GPME en alternance est particulièrement adapté aux profils organisés et rigoureux souhaitant évoluer dans un environnement professionnel varié au sein de PME.",
      objectifs: [
        "Gérer la relation avec les clients et les fournisseurs de la PME.",
        "Participer à la gestion des risques de la PME.",
        "Gérer le personnel et contribuer à la gestion des ressources humaines.",
        "Soutenir le fonctionnement et le développement de la PME.",
      ],
    },
    programme: {
      text: "Le programme du BTS GPME en alternance couvre un large éventail de compétences administratives et de gestion, alliant enseignements théoriques et pratique professionnelle en entreprise.",
      sections: {
        enseignements_generaux: ["Culture générale et expression.", "Langue vivante étrangère.", "Culture économique, juridique et managériale."],
        enseignements_professionnels: [
          "Gérer la relation avec les clients et les fournisseurs de la PME.",
          "Participer à la gestion des risques de la PME.",
          "Gérer le personnel et contribuer à la gestion des ressources humaines.",
          "Soutenir le fonctionnement et le développement de la PME.",
        ],
        competences_developpees: [
          "Gestion administrative et organisationnelle.",
          "Communication interne et externe.",
          "Comptabilité courante et suivi de trésorerie.",
          "Gestion du personnel et paie.",
          "Analyse de l'activité de l'entreprise.",
        ],
      },
    },
    ecoles: [],
    salaire: [
      { age: "16-17 ans", premiereAnnee: "471€", deuxiemeAnnee: "689€" },
      { age: "18-20 ans", premiereAnnee: "751€", deuxiemeAnnee: "891€" },
      { age: "21-25 ans", premiereAnnee: "849€", deuxiemeAnnee: "980€" },
      { age: "26 ans et +", premiereAnnee: "1 767€", deuxiemeAnnee: "1 767€" },
    ],
    metiers: {
      text: "Le BTS GPME ouvre les portes de nombreux métiers dans la gestion, l'administration et les ressources humaines au sein des PME.",
      liste: [],
    },
    cards: [],
  },
  {
    slug: "bts-mco",
    titre: "BTS MCO",
    sousTitre: "Management Commercial Opérationnel",
    intituleLongFormation: "MANAGEMENT COMMERCIAL OPERATIONNEL",
    romes: ["D1401", "D1501", "D1506", "M1704", "M1705"],
    kpis: { duration: "2 ans", entreprise: 0, salaire: "471€ - 1 767€" },
    description: {
      text: "Le BTS Management Commercial Opérationnel (MCO) est un diplôme national de niveau 5 (Bac+2) qui forme des professionnels capables de prendre la responsabilité opérationnelle de tout ou partie d'une unité commerciale. En alternance, cette formation permet d'acquérir une solide expérience terrain en gestion, animation et dynamisation de l'offre commerciale, tout en développant la relation client et le management d'équipe. Le BTS MCO en alternance est particulièrement prisé dans les secteurs de la grande distribution, de la banque-assurance, de l'immobilier et du e-commerce.",
      objectifs: [
        "Maîtriser la gestion opérationnelle d'une unité commerciale (stocks, approvisionnements, budgets).",
        "Développer la relation client et assurer la vente conseil.",
        "Animer et dynamiser l'offre commerciale par le merchandising et les actions promotionnelles.",
        "Manager une équipe commerciale : organisation, motivation et supervision.",
        "Analyser les performances commerciales et proposer des actions correctives.",
      ],
    },
    programme: {
      text: "Le programme du BTS MCO en alternance couvre un large éventail de compétences commerciales et managériales, réparties en enseignements généraux et professionnels sur deux années de formation.",
      sections: {
        enseignements_generaux: ["Culture générale et expression.", "Langue vivante étrangère (anglais).", "Culture économique, juridique et managériale (CEJM)."],
        enseignements_professionnels: [
          "Développement de la relation client et vente conseil.",
          "Animation et dynamisation de l'offre commerciale.",
          "Gestion opérationnelle (analyse des stocks, marges, budgets).",
          "Management de l'équipe commerciale.",
        ],
        competences_developpees: [
          "Techniques de vente, négociation et merchandising.",
          "Gestion des stocks et des approvisionnements.",
          "Management d'équipe et leadership.",
          "Analyse de données commerciales et pilotage de la performance.",
          "Communication professionnelle écrite et orale.",
        ],
      },
    },
    ecoles: [],
    salaire: [
      { age: "16-17 ans", premiereAnnee: "471€", deuxiemeAnnee: "689€" },
      { age: "18-20 ans", premiereAnnee: "751€", deuxiemeAnnee: "891€" },
      { age: "21-25 ans", premiereAnnee: "849€", deuxiemeAnnee: "980€" },
      { age: "26 ans et +", premiereAnnee: "1 767€", deuxiemeAnnee: "1 767€" },
    ],
    metiers: {
      text: "Le BTS MCO ouvre les portes de nombreux métiers dans le commerce, la distribution, la banque-assurance et les services.",
      liste: [],
    },
    cards: [],
  },
  {
    slug: "bts-ndrc",
    titre: "BTS NDRC",
    sousTitre: "Négociation et Digitalisation de la Relation Client",
    intituleLongFormation: "NEGOCIATION ET DIGITALISATION DE LA RELATION CLIENT",
    romes: ["D1401", "D1406", "D1501", "M1703", "M1704"],
    kpis: { duration: "2 ans", entreprise: 0, salaire: "1120€-1300€" },
    description: {
      text: "Le BTS Négociation et Digitalisation de la Relation Client (NDRC) forme des professionnels de la vente et de la relation client, capables d'intervenir sur l'ensemble du cycle commercial : prospection, négociation, fidélisation et digitalisation de la relation client. Cette formation en alternance de niveau Bac+2 prépare à gérer la relation client sous toutes ses formes (en présentiel, à distance et en e-commerce) tout en maîtrisant les outils numériques. Le BTS NDRC en alternance est particulièrement recherché par les entreprises car il allie compétences commerciales terrain et maîtrise des canaux digitaux.",
      objectifs: [
        "Maîtriser les techniques de négociation et de vente en face-à-face.",
        "Gérer la relation client à distance via les outils numériques (CRM, réseaux sociaux, e-mailing).",
        "Prospecter et développer un portefeuille client en utilisant les canaux digitaux.",
        "Animer un réseau de distributeurs ou de partenaires.",
        "Piloter et optimiser la stratégie commerciale digitale.",
      ],
    },
    programme: {
      text: "Le programme du BTS NDRC en alternance couvre l'ensemble des compétences nécessaires à la gestion de la relation client, de la négociation terrain à la digitalisation des processus commerciaux.",
      sections: {
        enseignements_generaux: ["Culture générale et expression.", "Langue vivante étrangère.", "Culture économique, juridique et managériale (CEJM)."],
        enseignements_professionnels: [
          "Relation client et négociation-vente.",
          "Relation client à distance et digitalisation.",
          "Relation client et animation de réseaux.",
          "Ateliers de professionnalisation et culture numérique.",
        ],
        competences_developpees: [
          "Techniques de prospection et de négociation commerciale.",
          "Utilisation des outils CRM et marketing digital.",
          "Communication commerciale écrite et orale.",
          "Gestion et animation d'un réseau de partenaires.",
          "Analyse de la performance commerciale.",
        ],
      },
    },
    ecoles: [],
    salaire: [
      { age: "16-17 ans", premiereAnnee: "471€", deuxiemeAnnee: "689€" },
      { age: "18-20 ans", premiereAnnee: "751€", deuxiemeAnnee: "891€" },
      { age: "21-25 ans", premiereAnnee: "849€", deuxiemeAnnee: "980€" },
      { age: "26 ans et +", premiereAnnee: "1 767€", deuxiemeAnnee: "1 767€" },
    ],
    metiers: {
      text: "Le BTS NDRC ouvre les portes de nombreux métiers dans la vente, la négociation commerciale et la relation client digitale.",
      liste: [],
    },
    cards: [],
  },
  {
    slug: "bts-sam",
    titre: "BTS SAM",
    sousTitre: "Support à l'Action Managériale",
    intituleLongFormation: "SUPPORT A L'ACTION MANAGERIALE",
    romes: ["M1604"],
    kpis: { duration: "2 ans", entreprise: 0, salaire: "849€-980€" },
    description: {
      text: "Le BTS Support à l'Action Managériale forme des professionnels polyvalents capables d'assister un dirigeant, un cadre ou une équipe dans leurs missions quotidiennes. Cette formation en alternance permet d'acquérir des compétences en gestion administrative, organisation de projets, collaboration aux ressources humaines et communication en plusieurs langues. Le BTS SAM en alternance est un diplôme de niveau 5 (Bac+2) reconnu par l'État, idéal pour intégrer rapidement le monde de l'entreprise tout en se formant.",
      objectifs: [
        "Optimiser les processus administratifs au sein d'une organisation.",
        "Gérer et coordonner des projets en appui à l'action managériale.",
        "Collaborer à la gestion des ressources humaines.",
        "Communiquer efficacement en français et dans deux langues vivantes étrangères.",
        "Maîtriser les outils numériques et bureautiques professionnels.",
      ],
    },
    programme: {
      text: "Le programme du BTS SAM en alternance couvre un large éventail de compétences administratives et managériales, alliant enseignements théoriques et pratique professionnelle en entreprise.",
      sections: {
        enseignements_generaux: [
          "Culture générale et expression.",
          "Langue vivante étrangère A (anglais).",
          "Langue vivante étrangère B.",
          "Culture économique, juridique et managériale.",
        ],
        enseignements_professionnels: [
          "Optimisation des processus administratifs.",
          "Gestion de projet.",
          "Collaboration à la gestion des ressources humaines.",
          "Ateliers de professionnalisation et de culture économique, juridique et managériale appliquée.",
        ],
        competences_developpees: [
          "Organisation et gestion administrative.",
          "Communication professionnelle en français et en langues étrangères.",
          "Conduite et suivi de projet.",
          "Gestion des dossiers du personnel et processus RH.",
          "Maîtrise des outils collaboratifs et numériques.",
        ],
      },
    },
    ecoles: [],
    salaire: [
      { age: "16-17 ans", premiereAnnee: "471€", deuxiemeAnnee: "689€" },
      { age: "18-20 ans", premiereAnnee: "751€", deuxiemeAnnee: "891€" },
      { age: "21-25 ans", premiereAnnee: "849€", deuxiemeAnnee: "980€" },
      { age: "26 ans et +", premiereAnnee: "1 767€", deuxiemeAnnee: "1 767€" },
    ],
    metiers: {
      text: "Le BTS SAM ouvre les portes de nombreux métiers dans le support administratif, l'assistanat de direction et la gestion des ressources humaines.",
      liste: [],
    },
    cards: [],
  },
  {
    slug: "bts-sio",
    titre: "BTS SIO",
    sousTitre: "Services Informatiques aux Organisations",
    intituleLongFormation: "SERVICES INFORMATIQUES AUX ORGANISATIONS",
    romes: ["M1801", "M1805", "M1810"],
    kpis: { duration: "2 ans", entreprise: 0, salaire: "1120€-1300€" },
    description: {
      text: "Le BTS Services Informatiques aux Organisations (SIO) est un diplôme d'État de niveau Bac+2 qui forme des professionnels capables de répondre aux besoins informatiques des entreprises. Cette formation en alternance propose deux spécialisations : l'option SISR (Solutions d'Infrastructure, Systèmes et Réseaux) orientée vers l'administration réseau et la cybersécurité, et l'option SLAM (Solutions Logicielles et Applications Métiers) orientée vers le développement d'applications. Le BTS SIO en alternance permet d'acquérir une expérience professionnelle concrète dans le secteur du numérique tout en préparant un diplôme reconnu par l'État.",
      objectifs: [
        "Participer à la production et à la fourniture de services informatiques aux organisations.",
        "Installer, configurer et administrer des équipements et des services informatiques (option SISR).",
        "Concevoir, développer et maintenir des solutions applicatives (option SLAM).",
        "Assurer la cybersécurité des infrastructures et des données de l'organisation.",
        "Accompagner les utilisateurs dans l'appropriation des outils numériques.",
      ],
    },
    programme: {
      text: "Le programme du BTS SIO en alternance associe un tronc commun d'enseignements généraux et informatiques à une spécialisation SISR ou SLAM choisie dès le premier semestre. La formation délivre 120 crédits ECTS.",
      sections: {
        enseignements_generaux: [
          "Culture générale et expression.",
          "Expression et communication en anglais.",
          "Mathématiques pour l'informatique.",
          "Culture économique, juridique et managériale appliquée à l'informatique.",
        ],
        enseignements_professionnels: [
          "Support et mise à disposition de services informatiques (tronc commun).",
          "Option SISR : administration des systèmes et des réseaux, supervision, sécurisation de l'infrastructure.",
          "Option SLAM : conception et développement d'applications, gestion de bases de données, tests et déploiement.",
          "Cybersécurité : protection des données, gestion des risques, conformité RGPD.",
        ],
        competences_developpees: [
          "Administration système et réseau (Linux, Windows Server).",
          "Développement web et logiciel (PHP, Java, Python, SQL).",
          "Gestion de projets informatiques et travail en équipe.",
          "Veille technologique et adaptation aux évolutions du numérique.",
          "Communication professionnelle en français et en anglais.",
        ],
      },
    },
    ecoles: [],
    salaire: [
      { age: "16-17 ans", premiereAnnee: "471€", deuxiemeAnnee: "689€" },
      { age: "18-20 ans", premiereAnnee: "751€", deuxiemeAnnee: "891€" },
      { age: "21-25 ans", premiereAnnee: "849€", deuxiemeAnnee: "980€" },
      { age: "26 ans et +", premiereAnnee: "1 767€", deuxiemeAnnee: "1 767€" },
    ],
    metiers: {
      text: "Le BTS SIO ouvre les portes de nombreux métiers dans le secteur du numérique et de l'informatique, que ce soit en infrastructure ou en développement.",
      liste: [],
    },
    cards: [],
  },
  {
    slug: "cap-aepe",
    titre: "CAP AEPE",
    sousTitre: "Accompagnant Éducatif Petite Enfance",
    intituleLongFormation: "ACCOMPAGNANT EDUCATIF PETITE ENFANCE",
    romes: ["K1303"],
    kpis: { duration: "1 à 2 ans", entreprise: 0, salaire: "471€-980€" },
    description: {
      text: "Le CAP Accompagnant Éducatif Petite Enfance (AEPE) est le diplôme de référence pour travailler auprès des enfants de 0 à 6 ans. Cette formation en alternance prépare à l'accueil, la garde et l'accompagnement du développement des jeunes enfants dans différents contextes : crèches, écoles maternelles ou à domicile. Le CAP AEPE remplace l'ancien CAP Petite Enfance et offre un programme enrichi, adapté aux exigences actuelles du secteur de la petite enfance.",
      objectifs: [
        "Accompagner le développement du jeune enfant dans ses apprentissages quotidiens.",
        "Exercer son activité en accueil collectif (crèche, halte-garderie, multi-accueil).",
        "Exercer son activité en accueil individuel (à domicile ou chez les parents).",
        "Assurer les soins d'hygiène, de confort et de sécurité de l'enfant.",
        "Mettre en place des activités d'éveil et d'éducation adaptées.",
      ],
    },
    programme: {
      text: "Le programme du CAP AEPE en alternance couvre l'ensemble des compétences nécessaires à l'accompagnement éducatif des jeunes enfants, alliant enseignements théoriques et pratique professionnelle en structure d'accueil.",
      sections: {
        enseignements_generaux: [
          "Français, histoire-géographie et enseignement moral et civique.",
          "Mathématiques et physique-chimie.",
          "Éducation physique et sportive.",
          "Prévention santé environnement (PSE).",
        ],
        enseignements_professionnels: [
          "Accompagner le développement du jeune enfant.",
          "Exercer son activité en accueil collectif.",
          "Exercer son activité en accueil individuel.",
          "Sciences médico-sociales et biologie appliquée.",
          "Techniques d'animation et d'éveil de l'enfant.",
        ],
        competences_developpees: [
          "Soins d'hygiène et de confort du jeune enfant.",
          "Préparation et service des repas en respectant les règles nutritionnelles.",
          "Animation d'activités d'éveil et de loisirs.",
          "Communication professionnelle avec les familles et l'équipe éducative.",
          "Application des protocoles de sécurité et de premiers secours.",
        ],
      },
    },
    ecoles: [],
    salaire: [
      { age: "16-17 ans", premiereAnnee: "471€", deuxiemeAnnee: "689€" },
      { age: "18-20 ans", premiereAnnee: "751€", deuxiemeAnnee: "891€" },
      { age: "21-25 ans", premiereAnnee: "849€", deuxiemeAnnee: "980€" },
      { age: "26 ans et +", premiereAnnee: "1 767€", deuxiemeAnnee: "1 767€" },
    ],
    metiers: {
      text: "Le CAP AEPE ouvre les portes de nombreux métiers dans le secteur de la petite enfance, en accueil collectif comme individuel.",
      liste: [],
    },
    cards: [],
  },
  {
    slug: "licence-pro-rh",
    titre: "Licence Pro RH",
    sousTitre: "Ressources Humaines",
    intituleLongFormation: "RESSOURCES HUMAINES",
    romes: ["K1801", "K2101", "K2111", "M1203", "M1402", "M1403", "M1501", "M1502", "M1503", "M1604", "M1806"],
    kpis: { duration: "1 an", entreprise: 0, salaire: "1120€-1300€" },
    description: {
      text: "La Licence Professionnelle Métiers de la Gestion des Ressources Humaines forme des professionnels opérationnels capables d'assister les responsables RH dans l'ensemble de leurs missions : recrutement, gestion administrative du personnel, paie, formation et développement des compétences. Cette formation en alternance de niveau Bac+3 (niveau 6) permet d'acquérir en un an après un Bac+2 une expertise polyvalente en ressources humaines, très recherchée par les entreprises. La Licence Pro RH en alternance allie enseignements universitaires et immersion professionnelle pour une insertion rapide sur le marché du travail.",
      objectifs: [
        "Maîtriser la gestion administrative du personnel et la paie.",
        "Participer au processus de recrutement et à l'intégration des collaborateurs.",
        "Contribuer à l'élaboration et au suivi du plan de développement des compétences.",
        "Assurer le suivi des relations sociales et du dialogue social en entreprise.",
        "Utiliser les outils SIRH et les logiciels de gestion RH.",
        "Appliquer le droit du travail individuel et collectif dans les situations courantes.",
      ],
    },
    programme: {
      text: "Le programme de la Licence Pro RH en alternance couvre l'ensemble des fonctions ressources humaines, alliant enseignements théoriques en droit social et management à une forte dimension pratique grâce à l'alternance en entreprise.",
      sections: {
        enseignements_generaux: [
          "Anglais professionnel et communication interculturelle.",
          "Management et leadership.",
          "Outils numériques et bureautique avancée.",
          "Méthodologie de projet et mémoire professionnel.",
        ],
        enseignements_professionnels: [
          "Droit du travail individuel et collectif.",
          "Gestion administrative du personnel et paie.",
          "Recrutement, intégration et marque employeur.",
          "Gestion prévisionnelle des emplois et des compétences (GPEC).",
          "Formation professionnelle et développement des compétences.",
          "Relations sociales, santé au travail et qualité de vie au travail (QVT).",
        ],
        competences_developpees: [
          "Maîtrise des logiciels de paie et SIRH.",
          "Conduite d'entretiens de recrutement.",
          "Élaboration de tableaux de bord RH et reporting social.",
          "Rédaction de contrats de travail et documents RH.",
          "Gestion du dialogue social et des instances représentatives du personnel.",
        ],
      },
    },
    ecoles: [],
    salaire: [
      { age: "16-17 ans", premiereAnnee: "471€", deuxiemeAnnee: "689€" },
      { age: "18-20 ans", premiereAnnee: "751€", deuxiemeAnnee: "891€" },
      { age: "21-25 ans", premiereAnnee: "849€", deuxiemeAnnee: "980€" },
      { age: "26 ans et +", premiereAnnee: "1 767€", deuxiemeAnnee: "1 767€" },
    ],
    metiers: {
      text: "La Licence Professionnelle Ressources Humaines ouvre les portes de nombreux métiers dans la gestion du personnel, le recrutement et l'administration RH.",
      liste: [],
    },
    cards: [],
  },
  {
    slug: "titre-pro-secretaire-medicale",
    titre: "Titre Pro Secrétaire Médicale",
    sousTitre: "Secrétaire Assistant Médico-Social",
    intituleLongFormation: "SECRETAIRE MEDICAL ET MEDICO-SOCIAL",
    romes: ["D1401", "M1609"],
    kpis: { duration: "12 mois", entreprise: 0, salaire: "751€-980€" },
    description: {
      text: "Le Titre Professionnel Secrétaire Assistant Médico-Social (TP SAMS) est une certification de niveau 4 (Bac) délivrée par le Ministère du Travail et enregistrée au RNCP (RNCP36805). Cette formation en alternance prépare des professionnels capables d'assurer l'accueil et la prise en charge administrative des patients et usagers dans les structures sanitaires, médico-sociales et sociales. Le secrétaire assistant médico-social gère la planification des activités du service, le traitement et le suivi administratif des dossiers, ainsi que la coordination des opérations liées au parcours du patient ou de l'usager.",
      objectifs: [
        "Assister une équipe dans la communication des informations et l'organisation des activités.",
        "Assurer l'accueil et la prise en charge administrative du patient ou de l'usager.",
        "Traiter les dossiers et coordonner les opérations liées au parcours du patient ou de l'usager.",
        "Maîtriser la terminologie médicale et les règles de confidentialité (secret médical).",
        "Utiliser les outils numériques et les logiciels métiers du secteur médico-social.",
      ],
    },
    programme: {
      text: "Le programme du Titre Pro Secrétaire Médicale en alternance est organisé autour de trois blocs de compétences professionnelles (CCP), couvrant l'ensemble des activités du secrétariat médico-social.",
      sections: {
        enseignements_generaux: [
          "Produire des documents professionnels courants (courriers, comptes rendus, tableaux).",
          "Communiquer des informations par écrit et à l'oral.",
          "Assurer la traçabilité et la conservation des informations.",
          "Accueillir un visiteur et transmettre des informations oralement.",
          "Planifier et organiser les activités de l'équipe.",
        ],
        enseignements_professionnels: [
          "Renseigner et orienter le public dans un service sanitaire, médico-social ou social.",
          "Planifier et gérer les rendez-vous de patients ou d'usagers.",
          "Assurer la prise en charge médico-administrative et sociale du patient ou de l'usager.",
          "Contrôler les données administratives du patient ou de l'usager.",
        ],
        competences_developpees: [
          "Retranscrire des informations à caractère médical ou social.",
          "Assurer le suivi et la mise à jour des dossiers de patients ou d'usagers.",
          "Coordonner les opérations liées au parcours du patient ou de l'usager.",
          "Élaborer et actualiser des tableaux de suivi dans un service sanitaire ou médico-social.",
        ],
      },
    },
    ecoles: [],
    salaire: [
      { age: "16-17 ans", premiereAnnee: "471€", deuxiemeAnnee: "689€" },
      { age: "18-20 ans", premiereAnnee: "751€", deuxiemeAnnee: "891€" },
      { age: "21-25 ans", premiereAnnee: "849€", deuxiemeAnnee: "980€" },
      { age: "26 ans et +", premiereAnnee: "1 767€", deuxiemeAnnee: "1 767€" },
    ],
    metiers: {
      text: "Le Titre Pro Secrétaire Assistant Médico-Social ouvre les portes de nombreux métiers dans le secteur sanitaire et médico-social.",
      liste: [],
    },
    cards: [],
  },
]

export const up = async () => {
  const now = new Date()
  const collection = getDbCollection("seo_diplomes")
  await collection.deleteMany({})
  await collection.insertMany(diplomesData.map((d) => ({ ...d, _id: new ObjectId(), created_at: now, updated_at: now })))
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = true
