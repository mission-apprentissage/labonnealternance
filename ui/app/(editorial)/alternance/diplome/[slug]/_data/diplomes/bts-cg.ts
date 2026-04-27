import type { IDiplomeSeoData } from "../types"

export const btsCg: IDiplomeSeoData = {
  slug: "bts-cg",
  titre: "BTS CG",
  sousTitre: "Comptabilité et Gestion",
  intituleLongFormation: "COMPTABILITE ET GESTION",
  kpis: [
    { label: "Durée de la formation", value: "2 ans", iconSrc: "/images/diplome/offre-emploi.svg", labelFirst: true },
    { label: "entreprises recrutent", value: "XX", iconSrc: "/images/diplome/companie.svg" },
    { label: "Salaire mensuel moyen", value: "1120€-1300€", iconSrc: "/images/diplome/money.svg" },
    { label: "Taux d'insertion post formation", value: "XX%", iconSrc: "/images/diplome/ecosystem.svg" },
  ],
  description: {
    title: "Qu'est ce que le diplôme",
    titleHighlight: "BTS CG ?",
    text: "Le BTS Comptabilité et Gestion (BTS CG) est un diplôme d'État de niveau Bac+2 qui forme des techniciens supérieurs capables de prendre en charge les activités comptables et de gestion d'une entreprise ou d'un cabinet d'expertise comptable. Cette formation en alternance permet d'acquérir des compétences opérationnelles en comptabilité, fiscalité, gestion sociale et analyse financière, tout en développant une expérience professionnelle concrète. Le BTS CG en alternance est particulièrement apprécié des recruteurs pour la polyvalence et l'autonomie immédiate des diplômés.",
    objectifs: [
      {
        iconSrc: "/images/diplome/icon-success.svg",
        title: "Objectifs du diplôme :",
        items: [
          "Maîtriser le traitement comptable des opérations commerciales et financières.",
          "Gérer les obligations fiscales et sociales de l'entreprise.",
          "Produire et analyser l'information financière.",
          "Réaliser l'analyse et la prévision de l'activité.",
          "Utiliser les outils numériques et les systèmes d'information comptables.",
        ],
      },
    ],
  },
  programme: {
    title: "Programme du diplôme",
    titleHighlight: "BTS CG",
    text: "Le programme du BTS CG en alternance est structuré autour de 7 processus professionnels couvrant l'ensemble des activités comptables et financières, complétés par des enseignements généraux.",
    sections: [
      {
        icon: "fr-icon-book-2-line",
        title: "Enseignements généraux",
        items: ["Culture générale et expression.", "Anglais obligatoire.", "Mathématiques appliquées.", "Économie, droit et management des entreprises."],
      },
      {
        icon: "fr-icon-briefcase-line",
        title: "Enseignements professionnels",
        items: [
          "Contrôle et traitement comptable des opérations commerciales (P1).",
          "Contrôle et production de l'information financière (P2).",
          "Gestion des obligations fiscales (P3).",
          "Gestion des relations sociales (P4).",
          "Analyse et prévision de l'activité (P5).",
          "Analyse de la situation financière (P6).",
        ],
      },
      {
        icon: "fr-icon-award-line",
        title: "Compétences développées",
        items: [
          "Maîtrise des logiciels comptables et des tableurs.",
          "Établissement des déclarations fiscales et sociales.",
          "Analyse des documents de synthèse (bilan, compte de résultat).",
          "Contrôle de gestion et élaboration de tableaux de bord.",
          "Communication professionnelle et travail collaboratif.",
        ],
      },
    ],
  },
  preparation: {
    title: "Comment se préparer à une alternance",
    titleHighlight: "BTS CG ?",
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
    title: "Comment intégrer un BTS CG en alternance",
    prerequis: [
      { label: "Baccalauréat général" },
      { label: "Bac STMG (spécialité Gestion et Finance recommandée)" },
      { label: "Bac professionnel Métiers de la Gestion-Administration" },
      { label: "Bac professionnel Assistance à la Gestion des Organisations" },
      { label: "Dossier scolaire et entretien de motivation" },
    ],
    etapes: [
      {
        numero: 1,
        title: "Trouve une entreprise",
        description:
          "Recherchez une entreprise ou un cabinet comptable qui recrute des alternants en BTS CG. Consultez les offres sur La bonne alternance et candidatez directement.",
        ctaLabel: "Voir les offres",
        ctaHref: "/recherche-emploi",
      },
      {
        numero: 2,
        title: "Choisis ta formation",
        description: "Sélectionnez un centre de formation qui propose le BTS CG en alternance. Comparez les programmes et les taux de réussite.",
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
  ecoles: {
    title: "Quelques écoles qui proposent le diplôme",
    titleHighlight: "BTS CG :",
    formations: [
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
  },
  salaire: {
    title: "Le salaire en",
    titleHighlight: "BTS CG",
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
}
