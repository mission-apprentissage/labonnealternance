import type { IDiplomeSeoData } from "../types"

export const licenceProRh: IDiplomeSeoData = {
  slug: "licence-pro-rh",
  titre: "Licence Pro RH",
  sousTitre: "Ressources Humaines",
  intituleLongFormation: "RESSOURCES HUMAINES",
  kpis: [
    { label: "Durée de la formation", value: "1 an", iconSrc: "/images/diplome/offre-emploi.svg", labelFirst: true },
    { label: "entreprises recrutent", value: "XX", iconSrc: "/images/diplome/companie.svg" },
    { label: "Salaire mensuel moyen", value: "1120€-1300€", iconSrc: "/images/diplome/money.svg" },
    { label: "Taux d'insertion post formation", value: "XX%", iconSrc: "/images/diplome/ecosystem.svg" },
  ],
  description: {
    text: "La Licence Professionnelle Métiers de la Gestion des Ressources Humaines forme des professionnels opérationnels capables d'assister les responsables RH dans l'ensemble de leurs missions : recrutement, gestion administrative du personnel, paie, formation et développement des compétences. Cette formation en alternance de niveau Bac+3 (niveau 6) permet d'acquérir en un an après un Bac+2 une expertise polyvalente en ressources humaines, très recherchée par les entreprises. La Licence Pro RH en alternance allie enseignements universitaires et immersion professionnelle pour une insertion rapide sur le marché du travail.",
    objectifs: [
      {
        iconSrc: "/images/diplome/icon-success.svg",
        title: "Objectifs du diplôme :",
        items: [
          "Maîtriser la gestion administrative du personnel et la paie.",
          "Participer au processus de recrutement et à l'intégration des collaborateurs.",
          "Contribuer à l'élaboration et au suivi du plan de développement des compétences.",
          "Assurer le suivi des relations sociales et du dialogue social en entreprise.",
          "Utiliser les outils SIRH et les logiciels de gestion RH.",
          "Appliquer le droit du travail individuel et collectif dans les situations courantes.",
        ],
      },
    ],
  },
  programme: {
    title: "Programme du diplôme",
    titleHighlight: "Licence Pro RH",
    text: "Le programme de la Licence Pro RH en alternance couvre l'ensemble des fonctions ressources humaines, alliant enseignements théoriques en droit social et management à une forte dimension pratique grâce à l'alternance en entreprise.",
    sections: [
      {
        icon: "fr-icon-book-2-line",
        title: "Enseignements généraux",
        items: [
          "Anglais professionnel et communication interculturelle.",
          "Management et leadership.",
          "Outils numériques et bureautique avancée.",
          "Méthodologie de projet et mémoire professionnel.",
        ],
      },
      {
        icon: "fr-icon-briefcase-line",
        title: "Enseignements professionnels",
        items: [
          "Droit du travail individuel et collectif.",
          "Gestion administrative du personnel et paie.",
          "Recrutement, intégration et marque employeur.",
          "Gestion prévisionnelle des emplois et des compétences (GPEC).",
          "Formation professionnelle et développement des compétences.",
          "Relations sociales, santé au travail et qualité de vie au travail (QVT).",
        ],
      },
      {
        icon: "fr-icon-award-line",
        title: "Compétences développées",
        items: [
          "Maîtrise des logiciels de paie et SIRH.",
          "Conduite d'entretiens de recrutement.",
          "Élaboration de tableaux de bord RH et reporting social.",
          "Rédaction de contrats de travail et documents RH.",
          "Gestion du dialogue social et des instances représentatives du personnel.",
        ],
      },
    ],
  },
  preparation: {
    title: "Comment se préparer à une alternance",
    titleHighlight: "Licence Pro RH ?",
    text: "Découvrez nos ressources pour vous préparer au mieux à l'alternance :",
    ressources: [
      {
        title: "Introduction sur l'alternance",
        description: "Découvrez comment fonctionne l'alternance",
        href: "/guide-alternant/decouvrir-l-alternance",
        imageSrc: "/images/diplome/card-left.svg",
      },
      {
        title: "Préparer son projet en alternance",
        description: "Découvrez les étapes clés d'un projet en alternance",
        href: "/guide-alternant/preparer-son-projet-en-alternance",
        imageSrc: "/images/diplome/card-right.svg",
      },
    ],
  },
  integration: {
    title: "Comment intégrer une Licence Pro RH en alternance",
    prerequis: [
      { label: "BTS SAM (Support à l'Action Managériale)" },
      { label: "BTS CG (Comptabilité et Gestion)" },
      { label: "BTS Gestion de la PME (GPME)" },
      { label: "DUT / BUT GEA (Gestion des Entreprises et des Administrations)" },
      { label: "L2 validée en Droit, Économie ou Gestion (120 ECTS)" },
      { label: "DEUST métiers de la gestion ou équivalent Bac+2" },
      { label: "Dossier de candidature (CV, lettre de motivation, relevés de notes)" },
    ],
    etapes: [
      {
        numero: 1,
        title: "Trouve une entreprise",
        description:
          "Recherchez une entreprise qui recrute des alternants en Licence Pro RH. Consultez les offres sur La bonne alternance et candidatez directement auprès des services RH, cabinets de recrutement ou agences d'intérim.",
        ctaLabel: "Voir les offres",
        ctaHref: "/recherche-emploi",
      },
      {
        numero: 2,
        title: "Choisis ta formation",
        description:
          "Sélectionnez un IUT, une université ou un centre de formation qui propose la Licence Pro RH en alternance. Comparez les programmes, les taux de réussite et les partenariats entreprises.",
        ctaLabel: "Voir les formations",
        ctaHref: "/recherche-formation",
      },
      {
        numero: 3,
        title: "Signe ton contrat",
        description:
          "Une fois l'entreprise et la formation trouvées, signez votre contrat d'apprentissage ou de professionnalisation. L'école et l'entreprise vous accompagnent dans les démarches administratives.",
      },
    ],
  },
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
  ecoles: {
    title: "Quelques écoles qui proposent le diplôme",
    titleHighlight: "Licence Pro RH :",
    formations: [
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
  },
  salaire: {
    title: "Le salaire en",
    titleHighlight: "Licence Pro RH",
    titleSuffix: "en alternance",
    texteIntro: "Grille de salaire sur la base des contrats en apprentissage en France sur l'année 2024/2025 :",
    lignes: [
      { age: "16-17 ans", premiereAnnee: "471€", deuxiemeAnnee: "689€" },
      { age: "18-20 ans", premiereAnnee: "751€", deuxiemeAnnee: "891€" },
      { age: "21-25 ans", premiereAnnee: "849€", deuxiemeAnnee: "980€" },
      { age: "26 ans et +", premiereAnnee: "1 767€", deuxiemeAnnee: "1 767€" },
    ],
  },
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
}
