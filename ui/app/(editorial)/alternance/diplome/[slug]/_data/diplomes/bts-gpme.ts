import type { IDiplomeSeoData } from "../types"

export const btsGpme: IDiplomeSeoData = {
  slug: "bts-gpme",
  titre: "BTS GPME",
  sousTitre: "Gestion de la PME",
  intituleLongFormation: "GESTION DE LA PME",
  kpis: [
    { label: "Durée de la formation", value: "2 ans", iconSrc: "/images/diplome/offre-emploi.svg", labelFirst: true },
    { label: "entreprises recrutent", value: "XX", iconSrc: "/images/diplome/companie.svg" },
    { label: "Salaire mensuel moyen", value: "1120€-1300€", iconSrc: "/images/diplome/money.svg" },
    { label: "Taux d'insertion post formation", value: "XX%", iconSrc: "/images/diplome/ecosystem.svg" },
  ],
  description: {
    title: "Qu'est ce que le diplôme",
    titleHighlight: "BTS GPME ?",
    text: "Le BTS Gestion de la PME forme des collaborateurs polyvalents capables d'assister le dirigeant d'une petite ou moyenne entreprise dans l'ensemble de ses activités. Cette formation en alternance permet d'acquérir des compétences en gestion administrative, relation clients et fournisseurs, gestion du personnel et communication. Le BTS GPME en alternance est particulièrement adapté aux profils organisés et rigoureux souhaitant évoluer dans un environnement professionnel varié au sein de PME.",
    objectifs: [
      {
        iconSrc: "/images/diplome/icon-success.svg",
        title: "Objectifs du diplôme :",
        items: [
          "Gérer la relation avec les clients et les fournisseurs de la PME.",
          "Participer à la gestion des risques de la PME.",
          "Gérer le personnel et contribuer à la gestion des ressources humaines.",
          "Soutenir le fonctionnement et le développement de la PME.",
        ],
      },
    ],
  },
  programme: {
    title: "Programme du diplôme",
    titleHighlight: "BTS GPME",
    text: "Le programme du BTS GPME en alternance couvre un large éventail de compétences administratives et de gestion, alliant enseignements théoriques et pratique professionnelle en entreprise.",
    sections: [
      {
        icon: "fr-icon-book-2-line",
        title: "Enseignements généraux",
        items: ["Culture générale et expression.", "Langue vivante étrangère.", "Culture économique, juridique et managériale."],
      },
      {
        icon: "fr-icon-briefcase-line",
        title: "Enseignements professionnels",
        items: [
          "Gérer la relation avec les clients et les fournisseurs de la PME.",
          "Participer à la gestion des risques de la PME.",
          "Gérer le personnel et contribuer à la gestion des ressources humaines.",
          "Soutenir le fonctionnement et le développement de la PME.",
        ],
      },
      {
        icon: "fr-icon-award-line",
        title: "Compétences développées",
        items: [
          "Gestion administrative et organisationnelle.",
          "Communication interne et externe.",
          "Comptabilité courante et suivi de trésorerie.",
          "Gestion du personnel et paie.",
          "Analyse de l'activité de l'entreprise.",
        ],
      },
    ],
  },
  preparation: {
    title: "Comment se préparer à une alternance",
    titleHighlight: "BTS GPME ?",
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
    title: "Comment intégrer un BTS GPME en alternance",
    prerequis: [
      { label: "Baccalauréat général" },
      { label: "Bac STMG" },
      { label: "Bac professionnel Gestion-Administration" },
      { label: "Bac professionnel Commerce" },
      { label: "Dossier scolaire et entretien de motivation" },
    ],
    etapes: [
      {
        numero: 1,
        title: "Trouve une entreprise",
        description: "Recherchez une PME qui recrute des alternants en BTS GPME. Consultez les offres sur La bonne alternance et candidatez directement.",
        ctaLabel: "Voir les offres",
        ctaHref: "/recherche-emploi",
      },
      {
        numero: 2,
        title: "Choisis ta formation",
        description: "Sélectionnez un centre de formation qui propose le BTS GPME en alternance. Comparez les programmes et les taux de réussite.",
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
  ecoles: {
    title: "Quelques écoles qui proposent le diplôme",
    titleHighlight: "BTS GPME :",
    formations: [
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
  },
  salaire: {
    title: "Le salaire en",
    titleHighlight: "BTS GPME",
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
}
