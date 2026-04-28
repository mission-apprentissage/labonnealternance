import type { IDiplomeSeoData } from "shared/models/seoDiplome.model"

export const diplomesData: IDiplomeSeoData[] = [
  {
    slug: "bts-cg",
    titre: "BTS CG",
    sousTitre: "Comptabilité et Gestion",
    intituleLongFormation: "COMPTABILITE ET GESTION",
    kpis: { duration: "2 ans", entreprise: "XX", salaire: "1120€-1300€", insertion: "XX%" },
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
    /*
    entreprises: {
      title: "Entreprises qui recrutent en alternance",
      text: "Découvrez les XX entreprises qui recrutent activement des alternants en BTS CG :",
      liste: [
        { name: "KPMG", postes: 12 },
        { name: "Deloitte", postes: 10 },
        { name: "Ernst & Young", postes: 8 },
        { name: "Mazars", postes: 7 },
        { name: "Fiducial", postes: 5 },
        { name: "Cerfrance", postes: 4 },
      ],
    },
    */
    /*
    formations: {
      title: "Les formations",
      niveaux: [
        {
          title: "BTS CG",
          formations: 220,
          duree: "2 ans",
          niveau: "Bac+2",
          specialisation: "Comptabilité et Gestion",
          competences: "Comptabilité, fiscalité, gestion sociale, analyse financière",
        },
        {
          title: "DCG",
          formations: 95,
          duree: "3 ans",
          niveau: "Bac+3",
          specialisation: "Diplôme de Comptabilité et de Gestion",
          competences: "Comptabilité approfondie, finance, audit, contrôle de gestion",
        },
        {
          title: "DSCG",
          formations: 40,
          duree: "2 ans",
          niveau: "Bac+5",
          specialisation: "Diplôme Supérieur de Comptabilité et de Gestion",
          competences: "Expertise comptable, audit, conseil, management stratégique",
        },
      ],
    },
    */
    /*
    localisation: {
      title: "Où trouver une alternance BTS CG ?",
      text: "Les offres par ville :",
      villes: [
        { name: "Paris", offres: 380, href: "/recherche-emploi" },
        { name: "Lyon", offres: 165, href: "/recherche-emploi" },
        { name: "Marseille", offres: 112, href: "/recherche-emploi" },
        { name: "Toulouse", offres: 85, href: "/recherche-emploi" },
        { name: "Bordeaux", offres: 74, href: "/recherche-emploi" },
        { name: "Nantes", offres: 63, href: "/recherche-emploi" },
      ],
    },
    */
    /*
    perspectives: {
      title: "Perspectives d'emploi après une alternance",
      kpis: [
        { icon: "fr-icon-map-pin-2-line", value: "85%", label: "Taux de placement à 6 mois" },
        { icon: "fr-icon-file-text-line", value: "72%", label: "Embauchés en CDI" },
        { icon: "fr-icon-line-chart-line", value: "+30%", label: "Évolution salariale moyenne" },
      ],
      carrieres: [
        { periode: "Années 1-2", titre: "Assistant comptable", salaire: "1 800-2 200€", missions: "Saisie comptable, lettrage, rapprochements bancaires" },
        {
          periode: "Années 3-5",
          titre: "Comptable / Collaborateur comptable",
          salaire: "2 400-3 200€",
          missions: "Tenue de comptabilité, déclarations fiscales, révision des comptes",
        },
        { periode: "5+ années", titre: "Responsable comptable", salaire: "3 500-4 500€", missions: "Supervision d'équipe, clôture des comptes, reporting financier" },
      ],
    },
    */
    ecoles: [
      { formationTitle: "BTS COMPTABILITÉ ET GESTION", etablissement: "ENOES (PARIS)", lieu: "75009 Paris", href: "/recherche-formation" },
      { formationTitle: "BTS COMPTABILITÉ ET GESTION", etablissement: "PIGIER PERFORMANCE (LYON)", lieu: "69002 Lyon", href: "/recherche-formation" },
      { formationTitle: "BTS COMPTABILITÉ ET GESTION", etablissement: "ESG FINANCE (PARIS)", lieu: "75011 Paris", href: "/recherche-formation" },
      { formationTitle: "BTS COMPTABILITÉ ET GESTION", etablissement: "ESCG (LILLE)", lieu: "59000 Lille", href: "/recherche-formation" },
      { formationTitle: "BTS COMPTABILITÉ ET GESTION", etablissement: "IFCE (STRASBOURG)", lieu: "67000 Strasbourg", href: "/recherche-formation" },
      { formationTitle: "BTS COMPTABILITÉ ET GESTION", etablissement: "SUP EXPERTISE (PARIS)", lieu: "75013 Paris", href: "/recherche-formation" },
      { formationTitle: "BTS COMPTABILITÉ ET GESTION", etablissement: "GROUPE ALTERNANCE (BORDEAUX)", lieu: "33000 Bordeaux", href: "/recherche-formation" },
      { formationTitle: "BTS COMPTABILITÉ ET GESTION", etablissement: "INSEEC (PARIS)", lieu: "75016 Paris", href: "/recherche-formation" },
      { formationTitle: "BTS COMPTABILITÉ ET GESTION", etablissement: "CFA DESCARTES (MARNE-LA-VALLÉE)", lieu: "77420 Champs-sur-Marne", href: "/recherche-formation" },
    ],
    salaire: [
      { age: "16-17 ans", premiereAnnee: "471€", deuxiemeAnnee: "689€" },
      { age: "18-20 ans", premiereAnnee: "751€", deuxiemeAnnee: "891€" },
      { age: "21-25 ans", premiereAnnee: "849€", deuxiemeAnnee: "980€" },
      { age: "26 ans et +", premiereAnnee: "1 767€", deuxiemeAnnee: "1 767€" },
    ],
    metiers: {
      title: "Quels métiers exercer avec un diplôme BTS CG ?",
      text: "Le BTS Comptabilité et Gestion ouvre les portes de nombreux métiers dans la comptabilité, la finance et la gestion d'entreprise.",
      liste: [
        { icon: "fr-icon-briefcase-line", title: "Assistant comptable", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Gestionnaire de paie", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Collaborateur comptable en cabinet", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Assistant contrôleur de gestion", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Comptable unique en PME", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
      ],
    },
    autresDiplomes: [
      { icon: "fr-icon-store-3-line", title: "BTS MCO", sousTitre: "Management Commercial Opérationnel", href: "/alternance/diplome/bts-mco" },
      { icon: "fr-icon-file-text-line", title: "BTS NDRC", sousTitre: "Négociation et Digitalisation de la Relation Client", href: "/alternance/diplome/bts-ndrc" },
      { icon: "fr-icon-discuss-line", title: "BTS Communication", href: "/alternance/diplome/bts-communication" },
      { icon: "fr-icon-team-line", title: "BTS SAM", sousTitre: "Support à l'Action Managériale", href: "/alternance/diplome/bts-sam" },
      { icon: "fr-icon-building-line", title: "BTS GPME", sousTitre: "Gestion de la PME", href: "/alternance/diplome/bts-gpme" },
      { icon: "fr-icon-code-s-slash-line", title: "BTS SIO", sousTitre: "Services Informatiques aux Organisations", href: "/alternance/diplome/bts-sio" },
      { icon: "fr-icon-user-heart-line", title: "Licence Pro RH", sousTitre: "Ressources Humaines", href: "/alternance/diplome/licence-pro-rh" },
      { icon: "fr-icon-heart-pulse-line", title: "CAP AEPE", sousTitre: "Accompagnant Éducatif Petite Enfance", href: "/alternance/diplome/cap-aepe" },
      { icon: "fr-icon-clipboard-line", title: "Titre Pro Secrétaire Médicale", href: "/alternance/diplome/titre-pro-secretaire-medicale" },
    ],
  },
  {
    slug: "bts-communication",
    titre: "BTS Communication",
    sousTitre: "Communication",
    intituleLongFormation: "COMMUNICATION",
    kpis: { duration: "2 ans", entreprise: "XX", salaire: "849€-980€", insertion: "XX%" },
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
    /*
    entreprises: {
      title: "Entreprises qui recrutent en alternance",
      text: "Découvrez les XX entreprises qui recrutent activement des alternants en BTS Communication :",
      liste: [
        { name: "Publicis Groupe", postes: 12 },
        { name: "Havas", postes: 9 },
        { name: "BETC", postes: 6 },
        { name: "Orange", postes: 5 },
        { name: "SNCF", postes: 4 },
        { name: "L'Oréal", postes: 3 },
      ],
    },
    */
    /*
    formations: {
      title: "Les formations",
      niveaux: [
        {
          title: "BTS Communication",
          formations: 245,
          duree: "2 ans",
          niveau: "Bac+2",
          specialisation: "Communication",
          competences: "Stratégie de communication, PAO, gestion de projet, relations presse",
        },
        {
          title: "Licence Pro Communication",
          formations: 58,
          duree: "1 an",
          niveau: "Bac+3",
          specialisation: "Communication digitale ou événementielle",
          competences: "Stratégie digitale, marketing de contenu, gestion de communauté",
        },
        {
          title: "Master Communication",
          formations: 34,
          duree: "2 ans",
          niveau: "Bac+5",
          specialisation: "Communication d'entreprise ou institutionnelle",
          competences: "Direction de la communication, stratégie de marque, communication de crise",
        },
      ],
    },
    */
    /*
    localisation: {
      title: "Où trouver une alternance BTS Communication ?",
      text: "Les offres par ville :",
      villes: [
        { name: "Paris", offres: 437, href: "/recherche-emploi" },
        { name: "Lyon", offres: 134, href: "/recherche-emploi" },
        { name: "Marseille", offres: 89, href: "/recherche-emploi" },
        { name: "Toulouse", offres: 67, href: "/recherche-emploi" },
        { name: "Bordeaux", offres: 58, href: "/recherche-emploi" },
        { name: "Nantes", offres: 45, href: "/recherche-emploi" },
      ],
    },
    */
    /*
    perspectives: {
      title: "Perspectives d'emploi après une alternance",
      kpis: [
        { icon: "fr-icon-map-pin-2-line", value: "XX%", label: "Taux de placement à 6 mois" },
        { icon: "fr-icon-file-text-line", value: "XX%", label: "Embauchés en CDI" },
        { icon: "fr-icon-line-chart-line", value: "+XX%", label: "Évolution salariale moyenne" },
      ],
      carrieres: [
        { periode: "Années 1-2", titre: "Assistant communication", salaire: "1 800-2 200€", missions: "Création de supports, gestion des réseaux sociaux, relations presse" },
        { periode: "Années 3-5", titre: "Chargé de communication", salaire: "2 500-3 200€", missions: "Pilotage de campagnes, stratégie digitale, événementiel" },
        { periode: "5+ années", titre: "Responsable communication", salaire: "3 500-4 500€", missions: "Direction de la communication, stratégie de marque, management d'équipe" },
      ],
    },
    */
    ecoles: [
      { formationTitle: "BTS COMMUNICATION", etablissement: "NARRATIIV (PARIS)", lieu: "75010 Paris", href: "/recherche-formation" },
      { formationTitle: "BTS COMMUNICATION", etablissement: "LYCEE POLYVALENT JEAN LURCAT (PARIS)", lieu: "75013 Paris", href: "/recherche-formation" },
      { formationTitle: "BTS COMMUNICATION", etablissement: "INSTITUT DE COMMUNICATION (LYON)", lieu: "69002 Lyon", href: "/recherche-formation" },
      { formationTitle: "BTS COMMUNICATION", etablissement: "ESPL (ANGERS)", lieu: "49000 Angers", href: "/recherche-formation" },
      { formationTitle: "BTS COMMUNICATION", etablissement: "PIGIER PERFORMANCE (TOULOUSE)", lieu: "31000 Toulouse", href: "/recherche-formation" },
      { formationTitle: "BTS COMMUNICATION", etablissement: "GROUPE ALTERNANCE (BORDEAUX)", lieu: "33000 Bordeaux", href: "/recherche-formation" },
      { formationTitle: "BTS COMMUNICATION", etablissement: "H3 CAMPUS (POISSY)", lieu: "78300 Poissy", href: "/recherche-formation" },
      { formationTitle: "BTS COMMUNICATION", etablissement: "EPB PARIS", lieu: "75009 Paris", href: "/recherche-formation" },
      { formationTitle: "BTS COMMUNICATION", etablissement: "IESCA (MONTPELLIER)", lieu: "34000 Montpellier", href: "/recherche-formation" },
    ],
    salaire: [
      { age: "16-17 ans", premiereAnnee: "471€", deuxiemeAnnee: "689€" },
      { age: "18-20 ans", premiereAnnee: "751€", deuxiemeAnnee: "891€" },
      { age: "21-25 ans", premiereAnnee: "849€", deuxiemeAnnee: "980€" },
      { age: "26 ans et +", premiereAnnee: "1 767€", deuxiemeAnnee: "1 767€" },
    ],
    metiers: {
      title: "Quels métiers exercer avec un diplôme BTS Communication ?",
      text: "Le BTS Communication ouvre les portes de nombreux métiers dans la communication d'entreprise, la publicité et le digital.",
      liste: [
        { icon: "fr-icon-briefcase-line", title: "Chargé(e) de communication", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Community manager", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Assistant(e) chef de publicité", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Chargé(e) de relations presse", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Chargé(e) de communication digitale", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
      ],
    },
    autresDiplomes: [
      { icon: "fr-icon-shopping-cart-line", title: "BTS MCO", sousTitre: "Management Commercial Opérationnel", href: "/alternance/diplome/bts-mco" },
      { icon: "fr-icon-file-text-line", title: "BTS NDRC", sousTitre: "Négociation et Digitalisation de la Relation Client", href: "/alternance/diplome/bts-ndrc" },
      { icon: "fr-icon-money-euro-circle-line", title: "BTS CG", sousTitre: "Comptabilité et Gestion", href: "/alternance/diplome/bts-cg" },
      { icon: "fr-icon-team-line", title: "BTS SAM", sousTitre: "Support à l'Action Managériale", href: "/alternance/diplome/bts-sam" },
      { icon: "fr-icon-building-line", title: "BTS GPME", sousTitre: "Gestion de la PME", href: "/alternance/diplome/bts-gpme" },
      { icon: "fr-icon-code-s-slash-line", title: "BTS SIO", sousTitre: "Services Informatiques aux Organisations", href: "/alternance/diplome/bts-sio" },
      { icon: "fr-icon-user-heart-line", title: "Licence Pro RH", sousTitre: "Ressources Humaines", href: "/alternance/diplome/licence-pro-rh" },
      { icon: "fr-icon-heart-pulse-line", title: "CAP AEPE", sousTitre: "Accompagnant Éducatif Petite Enfance", href: "/alternance/diplome/cap-aepe" },
      {
        icon: "fr-icon-clipboard-line",
        title: "Titre Pro Secrétaire Médicale",
        sousTitre: "Secrétaire Assistant Médico-Social",
        href: "/alternance/diplome/titre-pro-secretaire-medicale",
      },
    ],
  },
  {
    slug: "bts-gpme",
    titre: "BTS GPME",
    sousTitre: "Gestion de la PME",
    intituleLongFormation: "GESTION DE LA PME",
    kpis: { duration: "2 ans", entreprise: "XX", salaire: "1120€-1300€", insertion: "XX%" },
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
    /*
    entreprises: {
      title: "Entreprises qui recrutent en alternance",
      text: "Découvrez les XX entreprises qui recrutent activement des alternants en BTS GPME :",
      liste: [
        { name: "Crédit Agricole", postes: 10 },
        { name: "Groupama", postes: 8 },
        { name: "Bouygues", postes: 6 },
        { name: "Vinci", postes: 5 },
        { name: "Colas", postes: 4 },
        { name: "Eiffage", postes: 3 },
      ],
    },
    */
    /*
    formations: {
      title: "Les formations",
      niveaux: [
        {
          title: "BTS GPME",
          formations: 210,
          duree: "2 ans",
          niveau: "Bac+2",
          specialisation: "Gestion de la PME",
          competences: "Administration, gestion RH, relation clients-fournisseurs, communication",
        },
        {
          title: "Licence Pro Gestion des PME",
          formations: 45,
          duree: "1 an",
          niveau: "Bac+3",
          specialisation: "Management des organisations",
          competences: "Pilotage d'activité, gestion de projet, management opérationnel",
        },
        {
          title: "Master Management des PME",
          formations: 18,
          duree: "2 ans",
          niveau: "Bac+5",
          specialisation: "Direction et gestion d'entreprise",
          competences: "Stratégie d'entreprise, direction financière, management",
        },
      ],
    },
    */
    /*
    localisation: {
      title: "Où trouver une alternance BTS GPME ?",
      text: "Les offres par ville :",
      villes: [
        { name: "Paris", offres: 320, href: "/recherche-emploi" },
        { name: "Lyon", offres: 145, href: "/recherche-emploi" },
        { name: "Marseille", offres: 98, href: "/recherche-emploi" },
        { name: "Toulouse", offres: 76, href: "/recherche-emploi" },
        { name: "Bordeaux", offres: 65, href: "/recherche-emploi" },
        { name: "Nantes", offres: 58, href: "/recherche-emploi" },
      ],
    },
    */
    /*
    perspectives: {
      title: "Perspectives d'emploi après une alternance",
      kpis: [
        { icon: "fr-icon-map-pin-2-line", value: "XX%", label: "Taux de placement à 6 mois" },
        { icon: "fr-icon-file-text-line", value: "XX%", label: "Embauchés en CDI" },
        { icon: "fr-icon-line-chart-line", value: "+XX%", label: "Évolution salariale moyenne" },
      ],
      carrieres: [
        { periode: "Années 1-2", titre: "Assistant de gestion PME", salaire: "1 700-2 200€", missions: "Administration, gestion courante, relation clients-fournisseurs" },
        { periode: "Années 3-5", titre: "Assistant de direction", salaire: "2 300-2 800€", missions: "Organisation, coordination, gestion RH, suivi budgétaire" },
        { periode: "5+ années", titre: "Responsable administratif", salaire: "2 800-3 500€", missions: "Pilotage administratif, gestion d'équipe, reporting direction" },
      ],
    },
    */
    ecoles: [
      { formationTitle: "BTS GESTION DE LA PME", etablissement: "GROUPE ALTERNANCE PARIS", lieu: "75010 Paris", href: "/recherche-formation" },
      { formationTitle: "BTS GESTION DE LA PME", etablissement: "CFA CODIS (PARIS)", lieu: "75010 Paris", href: "/recherche-formation" },
      { formationTitle: "BTS GESTION DE LA PME", etablissement: "IDRAC BUSINESS SCHOOL (LYON)", lieu: "69002 Lyon", href: "/recherche-formation" },
      { formationTitle: "BTS GESTION DE LA PME", etablissement: "ESARC EVOLUTION (BORDEAUX)", lieu: "33000 Bordeaux", href: "/recherche-formation" },
      { formationTitle: "BTS GESTION DE LA PME", etablissement: "ISME NANTES", lieu: "44000 Nantes", href: "/recherche-formation" },
      { formationTitle: "BTS GESTION DE LA PME", etablissement: "H3 CAMPUS (POISSY)", lieu: "78300 Poissy", href: "/recherche-formation" },
      { formationTitle: "BTS GESTION DE LA PME", etablissement: "PIGIER PERFORMANCE (MARSEILLE)", lieu: "13006 Marseille", href: "/recherche-formation" },
      { formationTitle: "BTS GESTION DE LA PME", etablissement: "GROUPE ALTERNANCE TOULOUSE", lieu: "31000 Toulouse", href: "/recherche-formation" },
      { formationTitle: "BTS GESTION DE LA PME", etablissement: "CBS SCHOOL (STRASBOURG)", lieu: "67000 Strasbourg", href: "/recherche-formation" },
    ],
    salaire: [
      { age: "16-17 ans", premiereAnnee: "471€", deuxiemeAnnee: "689€" },
      { age: "18-20 ans", premiereAnnee: "751€", deuxiemeAnnee: "891€" },
      { age: "21-25 ans", premiereAnnee: "849€", deuxiemeAnnee: "980€" },
      { age: "26 ans et +", premiereAnnee: "1 767€", deuxiemeAnnee: "1 767€" },
    ],
    metiers: {
      title: "Quels métiers exercer avec un diplôme BTS GPME ?",
      text: "Le BTS GPME ouvre les portes de nombreux métiers dans la gestion, l'administration et les ressources humaines au sein des PME.",
      liste: [
        { icon: "fr-icon-briefcase-line", title: "Assistant de gestion PME-PMI", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Assistant de direction", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Assistant administratif et comptable", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Assistant ressources humaines", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Chargé de clientèle", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
      ],
    },
    autresDiplomes: [
      { icon: "fr-icon-shopping-cart-2-line", title: "BTS MCO", sousTitre: "Management Commercial Opérationnel", href: "/alternance/diplome/bts-mco" },
      { icon: "fr-icon-file-text-line", title: "BTS NDRC", sousTitre: "Négociation et Digitalisation de la Relation Client", href: "/alternance/diplome/bts-ndrc" },
      { icon: "fr-icon-discuss-line", title: "BTS Communication", href: "/alternance/diplome/bts-communication" },
      { icon: "fr-icon-money-euro-circle-line", title: "BTS CG", sousTitre: "Comptabilité et Gestion", href: "/alternance/diplome/bts-cg" },
      { icon: "fr-icon-team-line", title: "BTS SAM", sousTitre: "Support à l'Action Managériale", href: "/alternance/diplome/bts-sam" },
      { icon: "fr-icon-code-s-slash-line", title: "BTS SIO", sousTitre: "Services Informatiques aux Organisations", href: "/alternance/diplome/bts-sio" },
      { icon: "fr-icon-user-heart-line", title: "Licence Pro RH", sousTitre: "Ressources Humaines", href: "/alternance/diplome/licence-pro-rh" },
      { icon: "fr-icon-heart-pulse-line", title: "CAP AEPE", sousTitre: "Accompagnant Éducatif Petite Enfance", href: "/alternance/diplome/cap-aepe" },
      { icon: "fr-icon-stethoscope-line", title: "Titre Pro Secrétaire Médicale", href: "/alternance/diplome/titre-pro-secretaire-medicale" },
    ],
  },
  {
    slug: "bts-mco",
    titre: "BTS MCO",
    sousTitre: "Management Commercial Opérationnel",
    intituleLongFormation: "MANAGEMENT COMMERCIAL OPERATIONNEL",
    kpis: { duration: "2 ans", entreprise: "XX", salaire: "471€ - 1 767€", insertion: "XX%" },
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
    /*
    entreprises: {
      title: "Entreprises qui recrutent en alternance",
      text: "Découvrez les XX entreprises qui recrutent activement des alternants en BTS MCO :",
      liste: [
        { name: "Carrefour", postes: 15 },
        { name: "Décathlon", postes: 12 },
        { name: "Fnac Darty", postes: 8 },
        { name: "Leroy Merlin", postes: 6 },
        { name: "Crédit Agricole", postes: 4 },
        { name: "BNP Paribas", postes: 3 },
      ],
    },
    */
    /*
    formations: {
      title: "Les formations",
      niveaux: [
        {
          title: "BTS MCO",
          formations: 245,
          duree: "2 ans",
          niveau: "Bac+2",
          specialisation: "Management Commercial Opérationnel",
          competences: "Vente, gestion, management d'équipe, merchandising",
        },
        {
          title: "Licence Pro Commerce",
          formations: 67,
          duree: "1 an",
          niveau: "Bac+3",
          specialisation: "Distribution et management",
          competences: "Stratégie commerciale, marketing digital, gestion de projet",
        },
        {
          title: "Master Commerce",
          formations: 23,
          duree: "2 ans",
          niveau: "Bac+5",
          specialisation: "Management et stratégie",
          competences: "Direction commerciale, stratégie d'entreprise, management",
        },
      ],
    },
    */
    /*
    localisation: {
      title: "Où trouver une alternance BTS MCO ?",
      text: "Les offres par ville :",
      villes: [
        { name: "Paris", offres: 437, href: "/recherche-emploi" },
        { name: "Lyon", offres: 189, href: "/recherche-emploi" },
        { name: "Marseille", offres: 134, href: "/recherche-emploi" },
        { name: "Toulouse", offres: 98, href: "/recherche-emploi" },
        { name: "Bordeaux", offres: 87, href: "/recherche-emploi" },
        { name: "Nantes", offres: 76, href: "/recherche-emploi" },
      ],
    },
    */
    /*
    perspectives: {
      title: "Perspectives d'emploi après une alternance",
      kpis: [
        { icon: "fr-icon-map-pin-2-line", value: "89%", label: "Taux de placement à 6 mois" },
        { icon: "fr-icon-file-text-line", value: "76%", label: "Embauchés en CDI" },
        { icon: "fr-icon-line-chart-line", value: "+25%", label: "Évolution salariale moyenne" },
      ],
      carrieres: [
        { periode: "Années 1-2", titre: "Conseiller commercial", salaire: "1 800-2 200€", missions: "Vente, conseil client, fidélisation" },
        { periode: "Années 3-5", titre: "Responsable de rayon", salaire: "2 400-3 000€", missions: "Management d'équipe, gestion de rayon, merchandising" },
        { periode: "5+ années", titre: "Directeur de magasin", salaire: "3 200-4 500€", missions: "Direction, stratégie commerciale, gestion P&L" },
      ],
    },
    */
    ecoles: [
      { formationTitle: "ASSISTANT COMMERCIAL (TP)", etablissement: "FORM HIGH TECH (METZ)", lieu: "57000 Metz", href: "/recherche-formation" },
      { formationTitle: "ASSISTANT COMMERCIAL (TP)", etablissement: "LYCEE POLYVALENT REGIONAL AUDIBERTI (ANTIBES)", lieu: "06600 Antibes", href: "/recherche-formation" },
      { formationTitle: "ASSISTANT COMMERCIAL (TP)", etablissement: "INSTITUT DE MANAGEMENT COMMERCIAL (METZ)", lieu: "57000 Metz", href: "/recherche-formation" },
      { formationTitle: "BOULANGER (CAP)", etablissement: "CFA COMMERCE PARIS", lieu: "75003 Paris", href: "/recherche-formation" },
      { formationTitle: "VENDEUR CONSEIL (TP)", etablissement: "AFIPE ILE-DE-FRANCE", lieu: "92100 Boulogne-Billancourt", href: "/recherche-formation" },
      { formationTitle: "MANAGER D'UNITE MARCHANDE (TP)", etablissement: "PIGIER PERFORMANCE", lieu: "69002 Lyon", href: "/recherche-formation" },
      { formationTitle: "CONSEILLER DE VENTE (TP)", etablissement: "TALIS BUSINESS SCHOOL", lieu: "33000 Bordeaux", href: "/recherche-formation" },
      { formationTitle: "ASSISTANT COMMERCIAL (TP)", etablissement: "ESUP RENNES", lieu: "35000 Rennes", href: "/recherche-formation" },
      { formationTitle: "RESPONSABLE DE RAYON (TP)", etablissement: "GROUPE IGS", lieu: "75010 Paris", href: "/recherche-formation" },
    ],
    salaire: [
      { age: "16-17 ans", premiereAnnee: "471€", deuxiemeAnnee: "689€" },
      { age: "18-20 ans", premiereAnnee: "751€", deuxiemeAnnee: "891€" },
      { age: "21-25 ans", premiereAnnee: "849€", deuxiemeAnnee: "980€" },
      { age: "26 ans et +", premiereAnnee: "1 767€", deuxiemeAnnee: "1 767€" },
    ],
    metiers: {
      title: "Quels métiers exercer avec un diplôme BTS MCO ?",
      text: "Le BTS MCO ouvre les portes de nombreux métiers dans le commerce, la distribution, la banque-assurance et les services.",
      liste: [
        { icon: "fr-icon-briefcase-line", title: "Conseiller de vente", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Chargé de clientèle", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Chef de rayon", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Assistant commercial", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Responsable de point de vente", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
      ],
    },
    autresDiplomes: [
      { icon: "fr-icon-file-text-line", title: "BTS NDRC", sousTitre: "Négociation et Digitalisation de la Relation Client", href: "/alternance/diplome/bts-ndrc" },
      { icon: "fr-icon-discuss-line", title: "BTS Communication", href: "/alternance/diplome/bts-communication" },
      { icon: "fr-icon-money-euro-circle-line", title: "BTS CG", sousTitre: "Comptabilité et Gestion", href: "/alternance/diplome/bts-cg" },
      { icon: "fr-icon-team-line", title: "BTS SAM", sousTitre: "Support à l'Action Managériale", href: "/alternance/diplome/bts-sam" },
      { icon: "fr-icon-building-line", title: "BTS GPME", sousTitre: "Gestion de la PME", href: "/alternance/diplome/bts-gpme" },
      { icon: "fr-icon-code-s-slash-line", title: "BTS SIO", sousTitre: "Services Informatiques aux Organisations", href: "/alternance/diplome/bts-sio" },
      { icon: "fr-icon-user-heart-line", title: "Licence Pro RH", sousTitre: "Ressources Humaines", href: "/alternance/diplome/licence-pro-rh" },
      { icon: "fr-icon-heart-pulse-line", title: "CAP AEPE", sousTitre: "Accompagnant Éducatif Petite Enfance", href: "/alternance/diplome/cap-aepe" },
      {
        icon: "fr-icon-clipboard-line",
        title: "Titre Pro Secrétaire Médicale",
        sousTitre: "Secrétaire Assistant Médico-Social",
        href: "/alternance/diplome/titre-pro-secretaire-medicale",
      },
    ],
  },
  {
    slug: "bts-ndrc",
    titre: "BTS NDRC",
    sousTitre: "Négociation et Digitalisation de la Relation Client",
    intituleLongFormation: "NEGOCIATION ET DIGITALISATION DE LA RELATION CLIENT",
    kpis: { duration: "2 ans", entreprise: "XX", salaire: "1120€-1300€", insertion: "XX%" },
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
    /*
    entreprises: {
      title: "Entreprises qui recrutent en alternance",
      text: "Découvrez les XX entreprises qui recrutent activement des alternants en BTS NDRC :",
      liste: [
        { name: "Orange", postes: 15 },
        { name: "SFR", postes: 12 },
        { name: "Bouygues Telecom", postes: 8 },
        { name: "Crédit Agricole", postes: 6 },
        { name: "AXA", postes: 4 },
        { name: "BNP Paribas", postes: 3 },
      ],
    },
    */
    /*
    formations: {
      title: "Les formations",
      niveaux: [
        {
          title: "BTS NDRC",
          formations: 245,
          duree: "2 ans",
          niveau: "Bac+2",
          specialisation: "Négociation et Digitalisation de la Relation Client",
          competences: "Négociation, prospection, relation client digitale, animation de réseaux",
        },
        {
          title: "Licence Pro Commerce",
          formations: 67,
          duree: "1 an",
          niveau: "Bac+3",
          specialisation: "Commerce et distribution",
          competences: "Stratégie commerciale, marketing digital, gestion de projet",
        },
        {
          title: "Master Commerce",
          formations: 23,
          duree: "2 ans",
          niveau: "Bac+5",
          specialisation: "Management et stratégie commerciale",
          competences: "Direction commerciale, stratégie d'entreprise, management",
        },
      ],
    },
    */
    /*
    localisation: {
      title: "Où trouver une alternance BTS NDRC ?",
      text: "Les offres par ville :",
      villes: [
        { name: "Paris", offres: 437, href: "/recherche-emploi" },
        { name: "Lyon", offres: 189, href: "/recherche-emploi" },
        { name: "Marseille", offres: 134, href: "/recherche-emploi" },
        { name: "Toulouse", offres: 98, href: "/recherche-emploi" },
        { name: "Bordeaux", offres: 87, href: "/recherche-emploi" },
        { name: "Nantes", offres: 76, href: "/recherche-emploi" },
      ],
    },
    */
    /*
    perspectives: {
      title: "Perspectives d'emploi après une alternance",
      kpis: [
        { icon: "fr-icon-map-pin-2-line", value: "89%", label: "Taux de placement à 6 mois" },
        { icon: "fr-icon-file-text-line", value: "76%", label: "Embauchés en CDI" },
        { icon: "fr-icon-line-chart-line", value: "+25%", label: "Évolution salariale moyenne" },
      ],
      carrieres: [
        { periode: "Années 1-2", titre: "Commercial sédentaire", salaire: "1 700-2 100€", missions: "Prospection, vente, gestion de portefeuille client" },
        { periode: "Années 3-5", titre: "Chargé d'affaires", salaire: "2 500-3 200€", missions: "Négociation grands comptes, développement commercial, fidélisation" },
        { periode: "5+ années", titre: "Responsable commercial", salaire: "3 500-4 800€", missions: "Stratégie commerciale, management d'équipe, pilotage des objectifs" },
      ],
    },
    */
    ecoles: [
      { formationTitle: "BTS NDRC", etablissement: "EURIDIS BUSINESS SCHOOL (PARIS)", lieu: "75012 Paris", href: "/recherche-formation" },
      { formationTitle: "BTS NDRC", etablissement: "ESARC EVOLUTION (TOULOUSE)", lieu: "31000 Toulouse", href: "/recherche-formation" },
      { formationTitle: "BTS NDRC", etablissement: "PIGIER PERFORMANCE (LYON)", lieu: "69002 Lyon", href: "/recherche-formation" },
      { formationTitle: "BTS NDRC", etablissement: "GROUPE ALTERNANCE (BORDEAUX)", lieu: "33000 Bordeaux", href: "/recherche-formation" },
      { formationTitle: "BTS NDRC", etablissement: "TALIS BUSINESS SCHOOL (BORDEAUX)", lieu: "33000 Bordeaux", href: "/recherche-formation" },
      { formationTitle: "BTS NDRC", etablissement: "H3 CAMPUS (POISSY)", lieu: "78300 Poissy", href: "/recherche-formation" },
      { formationTitle: "BTS NDRC", etablissement: "INSEEC (PARIS)", lieu: "75012 Paris", href: "/recherche-formation" },
      { formationTitle: "BTS NDRC", etablissement: "ISME (NANTES)", lieu: "44000 Nantes", href: "/recherche-formation" },
      { formationTitle: "BTS NDRC", etablissement: "EEC PARIS", lieu: "75010 Paris", href: "/recherche-formation" },
    ],
    salaire: [
      { age: "16-17 ans", premiereAnnee: "471€", deuxiemeAnnee: "689€" },
      { age: "18-20 ans", premiereAnnee: "751€", deuxiemeAnnee: "891€" },
      { age: "21-25 ans", premiereAnnee: "849€", deuxiemeAnnee: "980€" },
      { age: "26 ans et +", premiereAnnee: "1 767€", deuxiemeAnnee: "1 767€" },
    ],
    metiers: {
      title: "Quels métiers exercer avec un diplôme BTS NDRC ?",
      text: "Le BTS NDRC ouvre les portes de nombreux métiers dans la vente, la négociation commerciale et la relation client digitale.",
      liste: [
        { icon: "fr-icon-briefcase-line", title: "Commercial terrain / sédentaire", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Chargé de clientèle", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Technico-commercial", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Conseiller commercial en banque / assurance", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Chargé d'affaires B2B", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Responsable e-commerce", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
      ],
    },
    autresDiplomes: [
      { icon: "fr-icon-store-line", title: "BTS MCO", sousTitre: "Management Commercial Opérationnel", href: "/alternance/diplome/bts-mco" },
      { icon: "fr-icon-discuss-line", title: "BTS Communication", href: "/alternance/diplome/bts-communication" },
      { icon: "fr-icon-money-euro-circle-line", title: "BTS CG", sousTitre: "Comptabilité et Gestion", href: "/alternance/diplome/bts-cg" },
      { icon: "fr-icon-team-line", title: "BTS SAM", sousTitre: "Support à l'Action Managériale", href: "/alternance/diplome/bts-sam" },
      { icon: "fr-icon-building-line", title: "BTS GPME", sousTitre: "Gestion de la PME", href: "/alternance/diplome/bts-gpme" },
      { icon: "fr-icon-code-s-slash-line", title: "BTS SIO", sousTitre: "Services Informatiques aux Organisations", href: "/alternance/diplome/bts-sio" },
      { icon: "fr-icon-user-heart-line", title: "Licence Pro RH", sousTitre: "Ressources Humaines", href: "/alternance/diplome/licence-pro-rh" },
      { icon: "fr-icon-heart-pulse-line", title: "CAP AEPE", sousTitre: "Accompagnant Éducatif Petite Enfance", href: "/alternance/diplome/cap-aepe" },
      { icon: "fr-icon-clipboard-line", title: "Titre Pro Secrétaire Médicale", href: "/alternance/diplome/titre-pro-secretaire-medicale" },
    ],
  },
  {
    slug: "bts-sam",
    titre: "BTS SAM",
    sousTitre: "Support à l'Action Managériale",
    intituleLongFormation: "SUPPORT A L'ACTION MANAGERIALE",
    kpis: { duration: "2 ans", entreprise: "XX", salaire: "849€-980€", insertion: "XX%" },
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
    /*
    entreprises: {
      title: "Entreprises qui recrutent en alternance",
      text: "Découvrez les entreprises qui recrutent activement des alternants en BTS SAM :",
      liste: [
        { name: "BNP Paribas", postes: 10 },
        { name: "Société Générale", postes: 8 },
        { name: "AXA", postes: 7 },
        { name: "EDF", postes: 5 },
        { name: "Capgemini", postes: 4 },
        { name: "Groupe BPCE", postes: 3 },
      ],
    },
    */
    /*
    formations: {
      title: "Les formations",
      niveaux: [
        {
          title: "BTS SAM",
          formations: 180,
          duree: "2 ans",
          niveau: "Bac+2",
          specialisation: "Support à l'Action Managériale",
          competences: "Gestion administrative, gestion de projet, RH, communication multilingue",
        },
        {
          title: "Licence Pro Management des organisations",
          formations: 54,
          duree: "1 an",
          niveau: "Bac+3",
          specialisation: "Management et gestion des organisations",
          competences: "Pilotage d'activité, management d'équipe, gestion budgétaire",
        },
        {
          title: "Master Management",
          formations: 18,
          duree: "2 ans",
          niveau: "Bac+5",
          specialisation: "Management et stratégie",
          competences: "Direction administrative, stratégie d'entreprise, conduite du changement",
        },
      ],
    },
    */
    /*
    localisation: {
      title: "Où trouver une alternance BTS SAM ?",
      text: "Les offres par ville :",
      villes: [
        { name: "Paris", offres: 320, href: "/recherche-emploi" },
        { name: "Lyon", offres: 145, href: "/recherche-emploi" },
        { name: "Marseille", offres: 98, href: "/recherche-emploi" },
        { name: "Toulouse", offres: 76, href: "/recherche-emploi" },
        { name: "Bordeaux", offres: 65, href: "/recherche-emploi" },
        { name: "Nantes", offres: 54, href: "/recherche-emploi" },
      ],
    },
    */
    /*
    perspectives: {
      title: "Perspectives d'emploi après une alternance",
      kpis: [
        { icon: "fr-icon-map-pin-2-line", value: "85%", label: "Taux de placement à 6 mois" },
        { icon: "fr-icon-file-text-line", value: "72%", label: "Embauchés en CDI" },
        { icon: "fr-icon-line-chart-line", value: "+20%", label: "Évolution salariale moyenne" },
      ],
      carrieres: [
        { periode: "Années 1-2", titre: "Assistant de direction", salaire: "1 800-2 200€", missions: "Gestion d'agenda, organisation de réunions, suivi administratif" },
        { periode: "Années 3-5", titre: "Office manager", salaire: "2 400-3 000€", missions: "Coordination des services, gestion des prestataires, optimisation des process" },
        { periode: "5+ années", titre: "Responsable administratif", salaire: "3 000-4 000€", missions: "Pilotage administratif, management d'équipe, gestion budgétaire" },
      ],
    },
    */
    ecoles: [
      { formationTitle: "BTS SUPPORT À L'ACTION MANAGÉRIALE", etablissement: "PIGIER PERFORMANCE (PARIS)", lieu: "75015 Paris", href: "/recherche-formation" },
      { formationTitle: "BTS SUPPORT À L'ACTION MANAGÉRIALE", etablissement: "IGENSIA ALTERNANCE (LYON)", lieu: "69003 Lyon", href: "/recherche-formation" },
      { formationTitle: "BTS SUPPORT À L'ACTION MANAGÉRIALE", etablissement: "ESAGE (PARIS)", lieu: "75010 Paris", href: "/recherche-formation" },
      { formationTitle: "BTS SUPPORT À L'ACTION MANAGÉRIALE", etablissement: "H3 CAMPUS (POISSY)", lieu: "78300 Poissy", href: "/recherche-formation" },
      { formationTitle: "BTS SUPPORT À L'ACTION MANAGÉRIALE", etablissement: "INTERFOR (AMIENS)", lieu: "80000 Amiens", href: "/recherche-formation" },
      { formationTitle: "BTS SUPPORT À L'ACTION MANAGÉRIALE", etablissement: "ESARC BORDEAUX", lieu: "33000 Bordeaux", href: "/recherche-formation" },
      { formationTitle: "BTS SUPPORT À L'ACTION MANAGÉRIALE", etablissement: "LYCÉE POLYVALENT GUSTAVE EIFFEL (BORDEAUX)", lieu: "33000 Bordeaux", href: "/recherche-formation" },
      { formationTitle: "BTS SUPPORT À L'ACTION MANAGÉRIALE", etablissement: "INSTITUT F2I (VINCENNES)", lieu: "94300 Vincennes", href: "/recherche-formation" },
      { formationTitle: "BTS SUPPORT À L'ACTION MANAGÉRIALE", etablissement: "TALIS BUSINESS SCHOOL (TOULOUSE)", lieu: "31000 Toulouse", href: "/recherche-formation" },
    ],
    salaire: [
      { age: "16-17 ans", premiereAnnee: "471€", deuxiemeAnnee: "689€" },
      { age: "18-20 ans", premiereAnnee: "751€", deuxiemeAnnee: "891€" },
      { age: "21-25 ans", premiereAnnee: "849€", deuxiemeAnnee: "980€" },
      { age: "26 ans et +", premiereAnnee: "1 767€", deuxiemeAnnee: "1 767€" },
    ],
    metiers: {
      title: "Quels métiers exercer avec un diplôme BTS SAM ?",
      text: "Le BTS SAM ouvre les portes de nombreux métiers dans le support administratif, l'assistanat de direction et la gestion des ressources humaines.",
      liste: [
        { icon: "fr-icon-briefcase-line", title: "Assistant de direction", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Assistant manager", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Assistant ressources humaines", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Office manager", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Chargé(e) de recrutement", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
      ],
    },
    autresDiplomes: [
      { icon: "fr-icon-shopping-cart-line", title: "BTS MCO", sousTitre: "Management Commercial Opérationnel", href: "/alternance/diplome/bts-mco" },
      { icon: "fr-icon-file-text-line", title: "BTS NDRC", sousTitre: "Négociation et Digitalisation de la Relation Client", href: "/alternance/diplome/bts-ndrc" },
      { icon: "fr-icon-discuss-line", title: "BTS Communication", href: "/alternance/diplome/bts-communication" },
      { icon: "fr-icon-money-euro-circle-line", title: "BTS CG", sousTitre: "Comptabilité et Gestion", href: "/alternance/diplome/bts-cg" },
      { icon: "fr-icon-building-line", title: "BTS GPME", sousTitre: "Gestion de la PME", href: "/alternance/diplome/bts-gpme" },
      { icon: "fr-icon-code-s-slash-line", title: "BTS SIO", sousTitre: "Services Informatiques aux Organisations", href: "/alternance/diplome/bts-sio" },
      { icon: "fr-icon-user-heart-line", title: "Licence Pro RH", sousTitre: "Ressources Humaines", href: "/alternance/diplome/licence-pro-rh" },
      { icon: "fr-icon-heart-pulse-line", title: "CAP AEPE", sousTitre: "Accompagnant Éducatif Petite Enfance", href: "/alternance/diplome/cap-aepe" },
      { icon: "fr-icon-stethoscope-line", title: "Titre Pro Secrétaire Médicale", href: "/alternance/diplome/titre-pro-secretaire-medicale" },
    ],
  },
  {
    slug: "bts-sio",
    titre: "BTS SIO",
    sousTitre: "Services Informatiques aux Organisations",
    intituleLongFormation: "SERVICES INFORMATIQUES AUX ORGANISATIONS",
    kpis: { duration: "2 ans", entreprise: "XX", salaire: "1120€-1300€", insertion: "XX%" },
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
    /*
    entreprises: {
      title: "Entreprises qui recrutent en alternance",
      text: "Découvrez les entreprises qui recrutent activement des alternants en BTS SIO :",
      liste: [
        { name: "Capgemini", postes: 12 },
        { name: "Sopra Steria", postes: 10 },
        { name: "Atos", postes: 8 },
        { name: "Orange", postes: 7 },
        { name: "SFR", postes: 5 },
        { name: "BNP Paribas", postes: 4 },
      ],
    },
    */
    /*
    formations: {
      title: "Les formations",
      niveaux: [
        {
          title: "BTS SIO",
          formations: 320,
          duree: "2 ans",
          niveau: "Bac+2",
          specialisation: "Services Informatiques aux Organisations (SISR / SLAM)",
          competences: "Administration réseau, développement, cybersécurité, support informatique",
        },
        {
          title: "Licence Pro Informatique",
          formations: 85,
          duree: "1 an",
          niveau: "Bac+3",
          specialisation: "Métiers de l'informatique",
          competences: "Développement avancé, administration système, gestion de projets IT",
        },
        {
          title: "Master Informatique",
          formations: 40,
          duree: "2 ans",
          niveau: "Bac+5",
          specialisation: "Ingénierie logicielle ou réseaux",
          competences: "Architecture logicielle, cloud computing, management SI, cybersécurité avancée",
        },
      ],
    },
    */
    /*
    localisation: {
      title: "Où trouver une alternance BTS SIO ?",
      text: "Les offres par ville :",
      villes: [
        { name: "Paris", offres: 520, href: "/recherche-emploi" },
        { name: "Lyon", offres: 175, href: "/recherche-emploi" },
        { name: "Toulouse", offres: 120, href: "/recherche-emploi" },
        { name: "Nantes", offres: 95, href: "/recherche-emploi" },
        { name: "Bordeaux", offres: 82, href: "/recherche-emploi" },
        { name: "Lille", offres: 78, href: "/recherche-emploi" },
      ],
    },
    */
    /*
    perspectives: {
      title: "Perspectives d'emploi après une alternance",
      kpis: [
        { icon: "fr-icon-map-pin-2-line", value: "87%", label: "Taux de placement à 6 mois" },
        { icon: "fr-icon-file-text-line", value: "72%", label: "Embauchés en CDI" },
        { icon: "fr-icon-line-chart-line", value: "+30%", label: "Évolution salariale moyenne" },
      ],
      carrieres: [
        {
          periode: "Années 1-2",
          titre: "Technicien informatique / Développeur junior",
          salaire: "2 000-2 500€",
          missions: "Support utilisateur, maintenance réseau, développement d'applications",
        },
        {
          periode: "Années 3-5",
          titre: "Administrateur systèmes et réseaux / Développeur confirmé",
          salaire: "2 800-3 500€",
          missions: "Administration infrastructure, développement full-stack, cybersécurité",
        },
        {
          periode: "5+ années",
          titre: "Responsable informatique / Chef de projet IT",
          salaire: "3 500-4 800€",
          missions: "Direction technique, architecture SI, management d'équipe IT",
        },
      ],
    },
    */
    ecoles: [
      { formationTitle: "BTS SIO option SLAM", etablissement: "IPSSI (PARIS)", lieu: "75011 Paris", href: "/recherche-formation" },
      { formationTitle: "BTS SIO option SISR", etablissement: "H3 HITEMA (PARIS)", lieu: "75020 Paris", href: "/recherche-formation" },
      { formationTitle: "BTS SIO option SLAM", etablissement: "INSTITUT F2I (VINCENNES)", lieu: "94300 Vincennes", href: "/recherche-formation" },
      { formationTitle: "BTS SIO option SISR", etablissement: "LYCÉE GUSTAVE EIFFEL (BORDEAUX)", lieu: "33000 Bordeaux", href: "/recherche-formation" },
      { formationTitle: "BTS SIO option SLAM", etablissement: "MYDIGITALSCHOOL (LYON)", lieu: "69002 Lyon", href: "/recherche-formation" },
      { formationTitle: "BTS SIO option SISR", etablissement: "CESI ALTERNANCE (TOULOUSE)", lieu: "31670 Labège", href: "/recherche-formation" },
      { formationTitle: "BTS SIO option SLAM", etablissement: "EPSI (NANTES)", lieu: "44200 Nantes", href: "/recherche-formation" },
      { formationTitle: "BTS SIO option SISR", etablissement: "PIGIER PERFORMANCE (LILLE)", lieu: "59000 Lille", href: "/recherche-formation" },
      { formationTitle: "BTS SIO option SLAM", etablissement: "ESUP (RENNES)", lieu: "35000 Rennes", href: "/recherche-formation" },
    ],
    salaire: [
      { age: "16-17 ans", premiereAnnee: "471€", deuxiemeAnnee: "689€" },
      { age: "18-20 ans", premiereAnnee: "751€", deuxiemeAnnee: "891€" },
      { age: "21-25 ans", premiereAnnee: "849€", deuxiemeAnnee: "980€" },
      { age: "26 ans et +", premiereAnnee: "1 767€", deuxiemeAnnee: "1 767€" },
    ],
    metiers: {
      title: "Quels métiers exercer avec un diplôme BTS SIO ?",
      text: "Le BTS SIO ouvre les portes de nombreux métiers dans le secteur du numérique et de l'informatique, que ce soit en infrastructure ou en développement.",
      liste: [
        { icon: "fr-icon-briefcase-line", title: "Technicien systèmes et réseaux", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Développeur web / Développeur d'applications", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Technicien support informatique", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Administrateur réseau", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Technicien en cybersécurité", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
      ],
    },
    autresDiplomes: [
      { icon: "fr-icon-shopping-cart-2-line", title: "BTS MCO", sousTitre: "Management Commercial Opérationnel", href: "/alternance/diplome/bts-mco" },
      { icon: "fr-icon-file-text-line", title: "BTS NDRC", sousTitre: "Négociation et Digitalisation de la Relation Client", href: "/alternance/diplome/bts-ndrc" },
      { icon: "fr-icon-discuss-line", title: "BTS Communication", href: "/alternance/diplome/bts-communication" },
      { icon: "fr-icon-money-euro-circle-line", title: "BTS CG", sousTitre: "Comptabilité et Gestion", href: "/alternance/diplome/bts-cg" },
      { icon: "fr-icon-team-line", title: "BTS SAM", sousTitre: "Support à l'Action Managériale", href: "/alternance/diplome/bts-sam" },
      { icon: "fr-icon-building-line", title: "BTS GPME", sousTitre: "Gestion de la PME", href: "/alternance/diplome/bts-gpme" },
      { icon: "fr-icon-user-heart-line", title: "Licence Pro RH", sousTitre: "Ressources Humaines", href: "/alternance/diplome/licence-pro-rh" },
      { icon: "fr-icon-heart-pulse-line", title: "CAP AEPE", sousTitre: "Accompagnant Éducatif Petite Enfance", href: "/alternance/diplome/cap-aepe" },
      {
        icon: "fr-icon-stethoscope-line",
        title: "Titre Pro Secrétaire Médicale",
        sousTitre: "Secrétaire Assistant Médico-Social",
        href: "/alternance/diplome/titre-pro-secretaire-medicale",
      },
    ],
  },
  {
    slug: "cap-aepe",
    titre: "CAP AEPE",
    sousTitre: "Accompagnant Éducatif Petite Enfance",
    intituleLongFormation: "ACCOMPAGNANT EDUCATIF PETITE ENFANCE",
    kpis: { duration: "1 à 2 ans", entreprise: "XX", salaire: "471€-980€", insertion: "XX%" },
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
    /*
    entreprises: {
      title: "Entreprises qui recrutent en alternance",
      text: "Découvrez les XX entreprises qui recrutent activement des alternants en CAP AEPE :",
      liste: [
        { name: "Babilou", postes: 15 },
        { name: "People&Baby", postes: 12 },
        { name: "La Maison Bleue", postes: 10 },
        { name: "Les Petits Chaperons Rouges", postes: 8 },
        { name: "Crèche Attitude", postes: 6 },
        { name: "Grandir", postes: 4 },
      ],
    },
    */
    /*
    formations: {
      title: "Les formations",
      niveaux: [
        {
          title: "CAP AEPE",
          formations: 180,
          duree: "1 à 2 ans",
          niveau: "Niveau 3 (CAP)",
          specialisation: "Accompagnant Éducatif Petite Enfance",
          competences: "Accueil, soins, éveil, accompagnement du jeune enfant",
        },
        {
          title: "Bac Pro ASSP",
          formations: 95,
          duree: "3 ans",
          niveau: "Niveau 4 (Bac)",
          specialisation: "Accompagnement, Soins et Services à la Personne",
          competences: "Soins, animation, gestion de structure, accompagnement social",
        },
        {
          title: "DE Auxiliaire de Puériculture",
          formations: 42,
          duree: "1 an",
          niveau: "Niveau 4",
          specialisation: "Puériculture et soins aux nourrissons",
          competences: "Soins médicaux, suivi du développement, travail en équipe pluridisciplinaire",
        },
      ],
    },
    */
    /*
    localisation: {
      title: "Où trouver une alternance CAP AEPE ?",
      text: "Les offres par ville :",
      villes: [
        { name: "Paris", offres: 437, href: "/recherche-emploi" },
        { name: "Lyon", offres: 189, href: "/recherche-emploi" },
        { name: "Marseille", offres: 134, href: "/recherche-emploi" },
        { name: "Toulouse", offres: 98, href: "/recherche-emploi" },
        { name: "Bordeaux", offres: 87, href: "/recherche-emploi" },
        { name: "Nantes", offres: 76, href: "/recherche-emploi" },
      ],
    },
    */
    /*
    perspectives: {
      title: "Perspectives d'emploi après une alternance",
      kpis: [
        { icon: "fr-icon-map-pin-2-line", value: "XX%", label: "Taux de placement à 6 mois" },
        { icon: "fr-icon-file-text-line", value: "XX%", label: "Embauchés en CDI" },
        { icon: "fr-icon-line-chart-line", value: "+XX%", label: "Évolution salariale moyenne" },
      ],
      carrieres: [
        {
          periode: "Années 1-2",
          titre: "Agent de crèche / Auxiliaire petite enfance",
          salaire: "1 750-1 900€",
          missions: "Accueil des enfants, soins quotidiens, activités d'éveil",
        },
        { periode: "Années 3-5", titre: "ATSEM / Animateur petite enfance", salaire: "1 900-2 200€", missions: "Accompagnement en école maternelle, animation, soutien éducatif" },
        {
          periode: "5+ années",
          titre: "Auxiliaire de puériculture / Assistant maternel",
          salaire: "2 000-2 500€",
          missions: "Soins spécialisés, suivi du développement, encadrement",
        },
      ],
    },
    */
    ecoles: [
      { formationTitle: "CAP AEPE", etablissement: "CFA ACADÉMIQUE DE CRÉTEIL", lieu: "94000 Créteil", href: "/recherche-formation" },
      { formationTitle: "CAP AEPE", etablissement: "LYCÉE PROFESSIONNEL CAMILLE DE LELLIS", lieu: "59100 Roubaix", href: "/recherche-formation" },
      { formationTitle: "CAP AEPE", etablissement: "MFR DU PONT DU GARD", lieu: "30210 Remoulins", href: "/recherche-formation" },
      { formationTitle: "CAP AEPE", etablissement: "CAMPUS SUD DES MÉTIERS (MARSEILLE)", lieu: "13006 Marseille", href: "/recherche-formation" },
      { formationTitle: "CAP AEPE", etablissement: "CFA COMMERCE ET SERVICES (BLAGNAC)", lieu: "31700 Blagnac", href: "/recherche-formation" },
      { formationTitle: "CAP AEPE", etablissement: "IRSS NANTES", lieu: "44000 Nantes", href: "/recherche-formation" },
      { formationTitle: "CAP AEPE", etablissement: "LYCÉE JEAN MONNET (MONTPELLIER)", lieu: "34000 Montpellier", href: "/recherche-formation" },
      { formationTitle: "CAP AEPE", etablissement: "CFA ACADÉMIQUE DE LYON", lieu: "69000 Lyon", href: "/recherche-formation" },
      { formationTitle: "CAP AEPE", etablissement: "CAMPUS MEWO (METZ)", lieu: "57000 Metz", href: "/recherche-formation" },
    ],
    salaire: [
      { age: "16-17 ans", premiereAnnee: "471€", deuxiemeAnnee: "689€" },
      { age: "18-20 ans", premiereAnnee: "751€", deuxiemeAnnee: "891€" },
      { age: "21-25 ans", premiereAnnee: "849€", deuxiemeAnnee: "980€" },
      { age: "26 ans et +", premiereAnnee: "1 767€", deuxiemeAnnee: "1 767€" },
    ],
    metiers: {
      title: "Quels métiers exercer avec un diplôme CAP AEPE ?",
      text: "Le CAP AEPE ouvre les portes de nombreux métiers dans le secteur de la petite enfance, en accueil collectif comme individuel.",
      liste: [
        { icon: "fr-icon-briefcase-line", title: "Agent de crèche / Auxiliaire petite enfance", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        {
          icon: "fr-icon-briefcase-line",
          title: "Agent Territorial Spécialisé des Écoles Maternelles (ATSEM)",
          offres: "XX offres en alternance sur toute la France",
          href: "/recherche-emploi",
        },
        { icon: "fr-icon-briefcase-line", title: "Garde d'enfants à domicile", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Assistant maternel (après agrément)", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Animateur petite enfance", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Agent d'animation en structure d'accueil", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
      ],
    },
    autresDiplomes: [
      { icon: "fr-icon-store-line", title: "BTS MCO", sousTitre: "Management Commercial Opérationnel", href: "/alternance/diplome/bts-mco" },
      { icon: "fr-icon-file-text-line", title: "BTS NDRC", sousTitre: "Négociation et Digitalisation de la Relation Client", href: "/alternance/diplome/bts-ndrc" },
      { icon: "fr-icon-discuss-line", title: "BTS Communication", href: "/alternance/diplome/bts-communication" },
      { icon: "fr-icon-money-euro-circle-line", title: "BTS CG", sousTitre: "Comptabilité et Gestion", href: "/alternance/diplome/bts-cg" },
      { icon: "fr-icon-team-line", title: "BTS SAM", sousTitre: "Support à l'Action Managériale", href: "/alternance/diplome/bts-sam" },
      { icon: "fr-icon-building-line", title: "BTS GPME", sousTitre: "Gestion de la PME", href: "/alternance/diplome/bts-gpme" },
      { icon: "fr-icon-code-s-slash-line", title: "BTS SIO", sousTitre: "Services Informatiques aux Organisations", href: "/alternance/diplome/bts-sio" },
      { icon: "fr-icon-user-heart-line", title: "Licence Pro RH", sousTitre: "Ressources Humaines", href: "/alternance/diplome/licence-pro-rh" },
      {
        icon: "fr-icon-heart-pulse-line",
        title: "Titre Pro Secrétaire Médicale",
        sousTitre: "Secrétaire Assistant Médico-Social",
        href: "/alternance/diplome/titre-pro-secretaire-medicale",
      },
    ],
  },
  {
    slug: "licence-pro-rh",
    titre: "Licence Pro RH",
    sousTitre: "Ressources Humaines",
    intituleLongFormation: "RESSOURCES HUMAINES",
    kpis: { duration: "1 an", entreprise: "XX", salaire: "1120€-1300€", insertion: "XX%" },
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
    /*
    entreprises: {
      title: "Entreprises qui recrutent en alternance",
      text: "Découvrez les entreprises qui recrutent activement des alternants en Licence Pro RH :",
      liste: [
        { name: "Adecco", postes: 12 },
        { name: "Manpower", postes: 10 },
        { name: "Randstad", postes: 8 },
        { name: "Crédit Agricole", postes: 6 },
        { name: "SNCF", postes: 5 },
        { name: "Orange", postes: 4 },
      ],
    },
    */
    /*
    formations: {
      title: "Les formations",
      niveaux: [
        {
          title: "Licence Pro RH",
          formations: 120,
          duree: "1 an",
          niveau: "Bac+3",
          specialisation: "Métiers de la GRH : Assistant",
          competences: "Paie, recrutement, droit social, GPEC, SIRH",
        },
        {
          title: "Master RH",
          formations: 45,
          duree: "2 ans",
          niveau: "Bac+5",
          specialisation: "Management des Ressources Humaines",
          competences: "Stratégie RH, relations sociales, conduite du changement, management",
        },
        {
          title: "MBA RH",
          formations: 15,
          duree: "1-2 ans",
          niveau: "Bac+5/6",
          specialisation: "Direction des Ressources Humaines",
          competences: "Direction RH, stratégie d'entreprise, transformation digitale RH",
        },
      ],
    },
    */
    /*
    localisation: {
      title: "Où trouver une alternance Licence Pro RH ?",
      text: "Les offres par ville :",
      villes: [
        { name: "Paris", offres: 320, href: "/recherche-emploi" },
        { name: "Lyon", offres: 145, href: "/recherche-emploi" },
        { name: "Marseille", offres: 98, href: "/recherche-emploi" },
        { name: "Toulouse", offres: 76, href: "/recherche-emploi" },
        { name: "Bordeaux", offres: 65, href: "/recherche-emploi" },
        { name: "Nantes", offres: 54, href: "/recherche-emploi" },
      ],
    },
    */
    /*
    perspectives: {
      title: "Perspectives d'emploi après une alternance",
      kpis: [
        { icon: "fr-icon-map-pin-2-line", value: "XX%", label: "Taux de placement à 6 mois" },
        { icon: "fr-icon-file-text-line", value: "XX%", label: "Embauchés en CDI" },
        { icon: "fr-icon-line-chart-line", value: "+XX%", label: "Évolution salariale moyenne" },
      ],
      carrieres: [
        { periode: "Années 1-2", titre: "Assistant RH", salaire: "1 900-2 300€", missions: "Administration du personnel, paie, recrutement, gestion des absences" },
        { periode: "Années 3-5", titre: "Chargé de recrutement / Chargé de formation", salaire: "2 500-3 200€", missions: "Recrutement, plan de formation, GPEC, reporting RH" },
        { periode: "5+ années", titre: "Responsable RH", salaire: "3 500-4 500€", missions: "Pilotage RH, relations sociales, stratégie de développement des talents" },
      ],
    },
    */
    ecoles: [
      { formationTitle: "LP MÉTIERS DE LA GRH : ASSISTANT", etablissement: "IUT DE PARIS - RIVES DE SEINE", lieu: "75016 Paris", href: "/recherche-formation" },
      { formationTitle: "LP MÉTIERS DE LA GRH : ASSISTANT", etablissement: "IUT JEAN MOULIN LYON 3", lieu: "69008 Lyon", href: "/recherche-formation" },
      { formationTitle: "LP MÉTIERS DE LA GRH : ASSISTANT", etablissement: "UNIVERSITÉ BRETAGNE SUD (VANNES)", lieu: "56000 Vannes", href: "/recherche-formation" },
      { formationTitle: "LP MÉTIERS DE LA GRH : ASSISTANT", etablissement: "UNIVERSITÉ VERSAILLES SAINT-QUENTIN (UVSQ)", lieu: "78000 Versailles", href: "/recherche-formation" },
      {
        formationTitle: "LP MÉTIERS DE LA GRH : FORMATION, COMPÉTENCES ET EMPLOI",
        etablissement: "UNIVERSITÉ GRENOBLE ALPES",
        lieu: "38000 Grenoble",
        href: "/recherche-formation",
      },
      { formationTitle: "LICENCE GESTION DES RESSOURCES HUMAINES", etablissement: "CNAM ILE-DE-FRANCE", lieu: "75003 Paris", href: "/recherche-formation" },
      { formationTitle: "LP MÉTIERS DE LA GRH : ASSISTANT", etablissement: "UNIVERSITÉ PARIS-EST CRÉTEIL (UPEC)", lieu: "94000 Créteil", href: "/recherche-formation" },
      { formationTitle: "LP GESTIONNAIRE DE PAIE ET ADMINISTRATION DU PERSONNEL", etablissement: "IGENSIA ALTERNANCE", lieu: "75013 Paris", href: "/recherche-formation" },
      { formationTitle: "LP MÉTIERS DE LA GRH : ASSISTANT", etablissement: "UNIVERSITÉ PARIS 1 PANTHÉON-SORBONNE", lieu: "75005 Paris", href: "/recherche-formation" },
    ],
    salaire: [
      { age: "16-17 ans", premiereAnnee: "471€", deuxiemeAnnee: "689€" },
      { age: "18-20 ans", premiereAnnee: "751€", deuxiemeAnnee: "891€" },
      { age: "21-25 ans", premiereAnnee: "849€", deuxiemeAnnee: "980€" },
      { age: "26 ans et +", premiereAnnee: "1 767€", deuxiemeAnnee: "1 767€" },
    ],
    metiers: {
      title: "Quels métiers exercer avec une Licence Pro RH ?",
      text: "La Licence Professionnelle Ressources Humaines ouvre les portes de nombreux métiers dans la gestion du personnel, le recrutement et l'administration RH.",
      liste: [
        { icon: "fr-icon-briefcase-line", title: "Assistant ressources humaines", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Gestionnaire de paie", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Chargé de recrutement", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Chargé de formation", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Assistant de gestion du personnel", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
      ],
    },
    autresDiplomes: [
      { icon: "fr-icon-shopping-cart-line", title: "BTS MCO", sousTitre: "Management Commercial Opérationnel", href: "/alternance/diplome/bts-mco" },
      { icon: "fr-icon-file-text-line", title: "BTS NDRC", sousTitre: "Négociation et Digitalisation de la Relation Client", href: "/alternance/diplome/bts-ndrc" },
      { icon: "fr-icon-discuss-line", title: "BTS Communication", href: "/alternance/diplome/bts-communication" },
      { icon: "fr-icon-money-euro-circle-line", title: "BTS CG", sousTitre: "Comptabilité et Gestion", href: "/alternance/diplome/bts-cg" },
      { icon: "fr-icon-team-line", title: "BTS SAM", sousTitre: "Support à l'Action Managériale", href: "/alternance/diplome/bts-sam" },
      { icon: "fr-icon-building-line", title: "BTS GPME", sousTitre: "Gestion de la PME", href: "/alternance/diplome/bts-gpme" },
      { icon: "fr-icon-code-s-slash-line", title: "BTS SIO", sousTitre: "Services Informatiques aux Organisations", href: "/alternance/diplome/bts-sio" },
      { icon: "fr-icon-heart-pulse-line", title: "CAP AEPE", sousTitre: "Accompagnant Éducatif Petite Enfance", href: "/alternance/diplome/cap-aepe" },
      { icon: "fr-icon-clipboard-line", title: "Titre Pro Secrétaire Médicale", href: "/alternance/diplome/titre-pro-secretaire-medicale" },
    ],
  },
  {
    slug: "titre-pro-secretaire-medicale",
    titre: "Titre Pro Secrétaire Médicale",
    sousTitre: "Secrétaire Assistant Médico-Social",
    intituleLongFormation: "SECRETAIRE ASSISTANT MEDICO-SOCIAL",
    kpis: { duration: "12 mois", entreprise: "XX", salaire: "751€-980€", insertion: "XX%" },
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
    /*
    entreprises: {
      title: "Entreprises qui recrutent en alternance",
      text: "Découvrez les structures sanitaires et médico-sociales qui recrutent activement des alternants en secrétariat médical :",
      liste: [
        { name: "AP-HP", postes: 12 },
        { name: "Groupe Ramsay Santé", postes: 8 },
        { name: "Groupe Elsan", postes: 6 },
        { name: "Korian", postes: 5 },
        { name: "Mutualité Française", postes: 4 },
        { name: "Croix-Rouge Française", postes: 3 },
      ],
    },
    */
    /*
    formations: {
      title: "Les formations",
      niveaux: [
        {
          title: "TP Secrétaire Assistant Médico-Social",
          formations: 120,
          duree: "12 mois",
          niveau: "Niveau 4 (Bac)",
          specialisation: "Secrétariat médico-social",
          competences: "Accueil patient, gestion administrative, terminologie médicale, coordination parcours de soins",
        },
        {
          title: "TP Secrétaire Assistant",
          formations: 85,
          duree: "8 mois",
          niveau: "Niveau 4 (Bac)",
          specialisation: "Secrétariat général",
          competences: "Accueil, gestion administrative, communication, organisation",
        },
        {
          title: "BTS SAM",
          formations: 45,
          duree: "2 ans",
          niveau: "Bac+2",
          specialisation: "Support à l'Action Managériale",
          competences: "Gestion administrative, organisation, communication, management",
        },
      ],
    },
    */
    /*
    localisation: {
      title: "Où trouver une alternance Titre Pro Secrétaire Médicale ?",
      text: "Les offres par ville :",
      villes: [
        { name: "Paris", offres: 187, href: "/recherche-emploi" },
        { name: "Lyon", offres: 89, href: "/recherche-emploi" },
        { name: "Marseille", offres: 67, href: "/recherche-emploi" },
        { name: "Toulouse", offres: 45, href: "/recherche-emploi" },
        { name: "Bordeaux", offres: 38, href: "/recherche-emploi" },
        { name: "Nantes", offres: 32, href: "/recherche-emploi" },
      ],
    },
    */
    /*
    perspectives: {
      title: "Perspectives d'emploi après une alternance",
      kpis: [
        { icon: "fr-icon-map-pin-2-line", value: "85%", label: "Taux de placement à 6 mois" },
        { icon: "fr-icon-file-text-line", value: "70%", label: "Embauchés en CDI" },
        { icon: "fr-icon-line-chart-line", value: "+20%", label: "Évolution salariale moyenne" },
      ],
      carrieres: [
        { periode: "Années 1-2", titre: "Secrétaire médical(e)", salaire: "1 600-1 900€", missions: "Accueil patients, gestion des rendez-vous, traitement du courrier médical" },
        {
          periode: "Années 3-5",
          titre: "Assistant(e) médico-administratif(ve)",
          salaire: "1 900-2 300€",
          missions: "Coordination parcours patient, gestion dossiers médicaux, facturation",
        },
        {
          periode: "5+ années",
          titre: "Responsable de secrétariat médical",
          salaire: "2 300-2 800€",
          missions: "Management d'équipe, organisation du service, relation avec les praticiens",
        },
      ],
    },
    */
    ecoles: [
      { formationTitle: "SECRÉTAIRE ASSISTANT MÉDICO-SOCIAL (TP)", etablissement: "AFPA (PARIS)", lieu: "75012 Paris", href: "/recherche-formation" },
      { formationTitle: "SECRÉTAIRE ASSISTANT MÉDICO-SOCIAL (TP)", etablissement: "GRETA MÉDITERRANÉE (MARSEILLE)", lieu: "13003 Marseille", href: "/recherche-formation" },
      { formationTitle: "SECRÉTAIRE ASSISTANT MÉDICO-SOCIAL (TP)", etablissement: "IFOCOP (RUNGIS)", lieu: "94150 Rungis", href: "/recherche-formation" },
      { formationTitle: "SECRÉTAIRE ASSISTANT MÉDICO-SOCIAL (TP)", etablissement: "CNED (LYON)", lieu: "69003 Lyon", href: "/recherche-formation" },
      { formationTitle: "SECRÉTAIRE ASSISTANT MÉDICO-SOCIAL (TP)", etablissement: "GRETA CFA AQUITAINE (BORDEAUX)", lieu: "33000 Bordeaux", href: "/recherche-formation" },
      { formationTitle: "SECRÉTAIRE ASSISTANT MÉDICO-SOCIAL (TP)", etablissement: "NEXTFORMATION (PARIS)", lieu: "75020 Paris", href: "/recherche-formation" },
      { formationTitle: "SECRÉTAIRE ASSISTANT MÉDICO-SOCIAL (TP)", etablissement: "AFTEC FORMATION (RENNES)", lieu: "35000 Rennes", href: "/recherche-formation" },
      { formationTitle: "SECRÉTAIRE ASSISTANT MÉDICO-SOCIAL (TP)", etablissement: "PIGIER PERFORMANCE (TOULOUSE)", lieu: "31000 Toulouse", href: "/recherche-formation" },
      { formationTitle: "SECRÉTAIRE ASSISTANT MÉDICO-SOCIAL (TP)", etablissement: "EFAM (NANTES)", lieu: "44000 Nantes", href: "/recherche-formation" },
    ],
    salaire: [
      { age: "16-17 ans", premiereAnnee: "471€", deuxiemeAnnee: "689€" },
      { age: "18-20 ans", premiereAnnee: "751€", deuxiemeAnnee: "891€" },
      { age: "21-25 ans", premiereAnnee: "849€", deuxiemeAnnee: "980€" },
      { age: "26 ans et +", premiereAnnee: "1 767€", deuxiemeAnnee: "1 767€" },
    ],
    metiers: {
      title: "Quels métiers exercer avec un diplôme Titre Pro Secrétaire Médicale ?",
      text: "Le Titre Pro Secrétaire Assistant Médico-Social ouvre les portes de nombreux métiers dans le secteur sanitaire et médico-social.",
      liste: [
        { icon: "fr-icon-briefcase-line", title: "Secrétaire médical(e)", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Secrétaire médico-social(e)", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Assistant(e) médico-administratif(ve)", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Secrétaire hospitalier(ère)", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
        { icon: "fr-icon-briefcase-line", title: "Technicien(ne) d'information médicale", offres: "XX offres en alternance sur toute la France", href: "/recherche-emploi" },
      ],
    },
    autresDiplomes: [
      { icon: "fr-icon-shopping-cart-2-line", title: "BTS MCO", sousTitre: "Management Commercial Opérationnel", href: "/alternance/diplome/bts-mco" },
      { icon: "fr-icon-file-text-line", title: "BTS NDRC", sousTitre: "Négociation et Digitalisation de la Relation Client", href: "/alternance/diplome/bts-ndrc" },
      { icon: "fr-icon-discuss-line", title: "BTS Communication", href: "/alternance/diplome/bts-communication" },
      { icon: "fr-icon-money-euro-circle-line", title: "BTS CG", sousTitre: "Comptabilité et Gestion", href: "/alternance/diplome/bts-cg" },
      { icon: "fr-icon-team-line", title: "BTS SAM", sousTitre: "Support à l'Action Managériale", href: "/alternance/diplome/bts-sam" },
      { icon: "fr-icon-building-line", title: "BTS GPME", sousTitre: "Gestion de la PME", href: "/alternance/diplome/bts-gpme" },
      { icon: "fr-icon-code-s-slash-line", title: "BTS SIO", sousTitre: "Services Informatiques aux Organisations", href: "/alternance/diplome/bts-sio" },
      { icon: "fr-icon-user-heart-line", title: "Licence Pro RH", sousTitre: "Ressources Humaines", href: "/alternance/diplome/licence-pro-rh" },
      { icon: "fr-icon-heart-pulse-line", title: "CAP AEPE", sousTitre: "Accompagnant Éducatif Petite Enfance", href: "/alternance/diplome/cap-aepe" },
    ],
  },
]
