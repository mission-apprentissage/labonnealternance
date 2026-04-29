import type { IDiplomeSeoData } from "../types"

export const btsNdrc: IDiplomeSeoData = {
  slug: "bts-ndrc",
  titre: "BTS NDRC en alternance",
  titreAccent: "BTS NDRC",
  sousTitre: "Négociation et Digitalisation de la Relation Client",
  kpis: [
    { label: "Durée de la formation", value: "2 ans", iconSrc: "/images/diplome/offre-emploi.svg", labelFirst: true },
    { label: "entreprises recrutent", value: "XX", iconSrc: "/images/diplome/companie.svg" },
    { label: "Salaire mensuel moyen", value: "1120€-1300€", iconSrc: "/images/diplome/money.svg" },
    { label: "Taux d'insertion post formation", value: "XX%", iconSrc: "/images/diplome/ecosystem.svg" },
  ],
  description: {
    title: "Qu'est ce que le diplôme",
    titleHighlight: "BTS NDRC ?",
    text: "Le BTS Négociation et Digitalisation de la Relation Client (NDRC) forme des professionnels de la vente et de la relation client, capables d'intervenir sur l'ensemble du cycle commercial : prospection, négociation, fidélisation et digitalisation de la relation client. Cette formation en alternance de niveau Bac+2 prépare à gérer la relation client sous toutes ses formes (en présentiel, à distance et en e-commerce) tout en maîtrisant les outils numériques. Le BTS NDRC en alternance est particulièrement recherché par les entreprises car il allie compétences commerciales terrain et maîtrise des canaux digitaux.",
    objectifs: [
      {
        iconSrc: "/images/diplome/icon-success.svg",
        title: "Objectifs du diplôme :",
        items: [
          "Maîtriser les techniques de négociation et de vente en face-à-face.",
          "Gérer la relation client à distance via les outils numériques (CRM, réseaux sociaux, e-mailing).",
          "Prospecter et développer un portefeuille client en utilisant les canaux digitaux.",
          "Animer un réseau de distributeurs ou de partenaires.",
          "Piloter et optimiser la stratégie commerciale digitale.",
        ],
      },
    ],
  },
  programme: {
    title: "Programme du diplôme",
    titleHighlight: "BTS NDRC",
    text: "Le programme du BTS NDRC en alternance couvre l'ensemble des compétences nécessaires à la gestion de la relation client, de la négociation terrain à la digitalisation des processus commerciaux.",
    sections: [
      {
        icon: "fr-icon-book-2-line",
        title: "Enseignements généraux",
        items: ["Culture générale et expression.", "Langue vivante étrangère.", "Culture économique, juridique et managériale (CEJM)."],
      },
      {
        icon: "fr-icon-briefcase-line",
        title: "Enseignements professionnels",
        items: [
          "Relation client et négociation-vente.",
          "Relation client à distance et digitalisation.",
          "Relation client et animation de réseaux.",
          "Ateliers de professionnalisation et culture numérique.",
        ],
      },
      {
        icon: "fr-icon-award-line",
        title: "Compétences développées",
        items: [
          "Techniques de prospection et de négociation commerciale.",
          "Utilisation des outils CRM et marketing digital.",
          "Communication commerciale écrite et orale.",
          "Gestion et animation d'un réseau de partenaires.",
          "Analyse de la performance commerciale.",
        ],
      },
    ],
  },
  preparation: {
    title: "Comment se préparer à une alternance",
    titleHighlight: "BTS NDRC ?",
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
    title: "Comment intégrer un BTS NDRC en alternance",
    prerequis: [
      { label: "Baccalauréat général" },
      { label: "Bac STMG" },
      { label: "Bac professionnel Métiers du commerce et de la vente" },
      { label: "Bac professionnel Vente" },
      { label: "Dossier scolaire et entretien de motivation" },
    ],
    etapes: [
      {
        numero: 1,
        title: "Trouve une entreprise",
        description: "Recherchez une entreprise qui recrute des alternants en BTS NDRC. Consultez les offres sur La bonne alternance et candidatez directement.",
        ctaLabel: "Voir les offres",
        ctaHref: "/recherche-emploi",
      },
      {
        numero: 2,
        title: "Choisis ta formation",
        description: "Sélectionnez un centre de formation qui propose le BTS NDRC en alternance. Comparez les programmes et les taux de réussite.",
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
  ecoles: {
    title: "Quelques écoles qui proposent le diplôme",
    titleHighlight: "BTS NDRC :",
    formations: [
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
  },
  salaire: {
    title: "Le salaire en",
    titleHighlight: "BTS NDRC",
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
}
