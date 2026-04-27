import type { IDiplomeSeoData } from "../types"

export const btsCommunication: IDiplomeSeoData = {
  slug: "bts-communication",
  titre: "BTS Communication",
  sousTitre: "Communication",
  intituleLongFormation: "COMMUNICATION",
  kpis: [
    { label: "Durée de la formation", value: "2 ans", iconSrc: "/images/diplome/offre-emploi.svg", labelFirst: true },
    { label: "entreprises recrutent", value: "XX", iconSrc: "/images/diplome/companie.svg" },
    { label: "Salaire mensuel moyen", value: "849€-980€", iconSrc: "/images/diplome/money.svg" },
    { label: "Taux d'insertion post formation", value: "XX%", iconSrc: "/images/diplome/ecosystem.svg" },
  ],
  description: {
    text: "Le BTS Communication forme des professionnels capables de concevoir et mettre en œuvre des opérations de communication. Cette formation en alternance de niveau Bac+2 prépare aux métiers de la communication d'entreprise, de la publicité, des relations presse et du digital. En alternance, les étudiants développent une expertise concrète en création de supports, gestion de projets et relations clients, ce qui constitue un véritable atout sur le marché de l'emploi.",
    objectifs: [
      {
        iconSrc: "/images/diplome/icon-success.svg",
        title: "Objectifs du diplôme :",
        items: [
          "Contribuer à l'élaboration et au pilotage de la stratégie de communication.",
          "Concevoir et réaliser des supports de communication (print et digital).",
          "Organiser et gérer des événements de communication.",
          "Gérer la relation avec les prestataires et les partenaires.",
          "Veiller à la cohérence de l'image de l'organisation.",
        ],
      },
    ],
  },
  programme: {
    title: "Programme du diplôme",
    titleHighlight: "BTS Communication",
    text: "Le programme du BTS Communication en alternance couvre un large éventail de compétences en communication, alliant enseignements théoriques et pratique professionnelle en entreprise.",
    sections: [
      {
        icon: "fr-icon-book-2-line",
        title: "Enseignements généraux",
        items: ["Cultures de la communication.", "Langue vivante étrangère (anglais).", "Culture économique, juridique et managériale.", "Expression et culture générale."],
      },
      {
        icon: "fr-icon-briefcase-line",
        title: "Enseignements professionnels",
        items: [
          "Contribution à l'élaboration et au pilotage de la stratégie de communication.",
          "Conception et mise en œuvre de solutions de communication.",
          "Accompagnement du développement de solutions media et digitales.",
          "Veille opérationnelle et études de marché.",
        ],
      },
      {
        icon: "fr-icon-award-line",
        title: "Compétences développées",
        items: [
          "Maîtrise des outils de PAO et de création graphique.",
          "Gestion de projet événementiel et communication digitale.",
          "Rédaction de contenus et storytelling.",
          "Relations presse et relations publiques.",
          "Pilotage de campagnes sur les réseaux sociaux.",
        ],
      },
    ],
  },
  preparation: {
    title: "Comment se préparer à une alternance",
    titleHighlight: "BTS Communication ?",
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
    title: "Comment intégrer un BTS Communication en alternance",
    prerequis: [
      { label: "Baccalauréat général" },
      { label: "Bac STMG" },
      { label: "Bac professionnel Métiers du commerce et de la vente" },
      { label: "Bac professionnel Accueil" },
      { label: "Dossier scolaire et entretien de motivation" },
    ],
    etapes: [
      {
        numero: 1,
        title: "Trouve une entreprise",
        description: "Recherchez une entreprise qui recrute des alternants en BTS Communication. Consultez les offres sur La bonne alternance et candidatez directement.",
        ctaLabel: "Voir les offres",
        ctaHref: "/recherche-emploi",
      },
      {
        numero: 2,
        title: "Choisis ta formation",
        description: "Sélectionnez un centre de formation qui propose le BTS Communication en alternance. Comparez les programmes et les taux de réussite.",
        ctaLabel: "Voir les formations",
        ctaHref: "/recherche-formation",
      },
      {
        numero: 3,
        title: "Signe ton contrat",
        description:
          "Une fois l'entreprise et la formation trouvées, signez votre contrat d'apprentissage ou de professionnalisation. L'école et l'entreprise vous accompagnent dans les démarches.",
      },
    ],
  },
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
  ecoles: {
    title: "Quelques écoles qui proposent le diplôme",
    titleHighlight: "BTS Communication :",
    formations: [
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
  },
  salaire: {
    title: "Le salaire en",
    titleHighlight: "BTS Communication",
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
}
