import type { IDiplomeSeoData } from "../types"

export const btsSam: IDiplomeSeoData = {
  slug: "bts-sam",
  titre: "BTS SAM en alternance",
  titreAccent: "BTS SAM",
  sousTitre: "Support à l'Action Managériale",
  kpis: [
    { label: "Durée de la formation", value: "2 ans", iconSrc: "/images/diplome/offre-emploi.svg", labelFirst: true },
    { label: "entreprises recrutent", value: "XX", iconSrc: "/images/diplome/companie.svg" },
    { label: "Salaire mensuel moyen", value: "849€-980€", iconSrc: "/images/diplome/money.svg" },
    { label: "Taux d'insertion post formation", value: "XX%", iconSrc: "/images/diplome/ecosystem.svg" },
  ],
  description: {
    title: "Qu'est ce que le diplôme",
    titleHighlight: "BTS SAM ?",
    text: "Le BTS Support à l'Action Managériale forme des professionnels polyvalents capables d'assister un dirigeant, un cadre ou une équipe dans leurs missions quotidiennes. Cette formation en alternance permet d'acquérir des compétences en gestion administrative, organisation de projets, collaboration aux ressources humaines et communication en plusieurs langues. Le BTS SAM en alternance est un diplôme de niveau 5 (Bac+2) reconnu par l'État, idéal pour intégrer rapidement le monde de l'entreprise tout en se formant.",
    objectifs: [
      {
        iconSrc: "/images/diplome/icon-success.svg",
        title: "Objectifs du diplôme :",
        items: [
          "Optimiser les processus administratifs au sein d'une organisation.",
          "Gérer et coordonner des projets en appui à l'action managériale.",
          "Collaborer à la gestion des ressources humaines.",
          "Communiquer efficacement en français et dans deux langues vivantes étrangères.",
          "Maîtriser les outils numériques et bureautiques professionnels.",
        ],
      },
    ],
  },
  programme: {
    title: "Programme du diplôme",
    titleHighlight: "BTS SAM",
    text: "Le programme du BTS SAM en alternance couvre un large éventail de compétences administratives et managériales, alliant enseignements théoriques et pratique professionnelle en entreprise.",
    sections: [
      {
        icon: "fr-icon-book-2-line",
        title: "Enseignements généraux",
        items: ["Culture générale et expression.", "Langue vivante étrangère A (anglais).", "Langue vivante étrangère B.", "Culture économique, juridique et managériale."],
      },
      {
        icon: "fr-icon-briefcase-line",
        title: "Enseignements professionnels",
        items: [
          "Optimisation des processus administratifs.",
          "Gestion de projet.",
          "Collaboration à la gestion des ressources humaines.",
          "Ateliers de professionnalisation et de culture économique, juridique et managériale appliquée.",
        ],
      },
      {
        icon: "fr-icon-award-line",
        title: "Compétences développées",
        items: [
          "Organisation et gestion administrative.",
          "Communication professionnelle en français et en langues étrangères.",
          "Conduite et suivi de projet.",
          "Gestion des dossiers du personnel et processus RH.",
          "Maîtrise des outils collaboratifs et numériques.",
        ],
      },
    ],
  },
  preparation: {
    title: "Comment se préparer à une alternance",
    titleHighlight: "BTS SAM ?",
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
    title: "Comment intégrer un BTS SAM en alternance",
    prerequis: [
      { label: "Baccalauréat général" },
      { label: "Bac STMG" },
      { label: "Bac professionnel Assistance à la gestion des organisations et de leurs activités" },
      { label: "Bac professionnel Métiers de l'accueil" },
      { label: "Dossier scolaire et lettre de motivation via Parcoursup" },
    ],
    etapes: [
      {
        numero: 1,
        title: "Trouve une entreprise",
        description: "Recherchez une entreprise qui recrute des alternants en BTS SAM. Consultez les offres sur La bonne alternance et candidatez directement.",
        ctaLabel: "Voir les offres",
        ctaHref: "/recherche-emploi",
      },
      {
        numero: 2,
        title: "Choisis ta formation",
        description: "Sélectionnez un centre de formation qui propose le BTS SAM en alternance. Comparez les programmes et les taux de réussite.",
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
  ecoles: {
    title: "Quelques écoles qui proposent le diplôme",
    titleHighlight: "BTS SAM :",
    formations: [
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
  },
  salaire: {
    title: "Le salaire en",
    titleHighlight: "BTS SAM",
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
}
