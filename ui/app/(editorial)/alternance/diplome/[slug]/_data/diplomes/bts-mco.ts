import type { IDiplomeSeoData } from "../types"

export const btsMco: IDiplomeSeoData = {
  slug: "bts-mco",
  titre: "BTS MCO",
  sousTitre: "Management Commercial Opérationnel",
  intituleLongFormation: "MANAGEMENT COMMERCIAL OPERATIONNEL",
  kpis: [
    { label: "Durée de la formation", value: "2 ans", iconSrc: "/images/diplome/offre-emploi.svg", labelFirst: true },
    { label: "entreprises recrutent", value: "XX", iconSrc: "/images/diplome/companie.svg" },
    { label: "Salaire mensuel moyen", value: "471€ - 1 767€", iconSrc: "/images/diplome/money.svg" },
    { label: "Taux d'insertion post formation", value: "XX%", iconSrc: "/images/diplome/ecosystem.svg" },
  ],
  description: {
    title: "Qu'est ce que le diplôme",
    titleHighlight: "BTS MCO ?",
    text: "Le BTS Management Commercial Opérationnel (MCO) est un diplôme national de niveau 5 (Bac+2) qui forme des professionnels capables de prendre la responsabilité opérationnelle de tout ou partie d'une unité commerciale. En alternance, cette formation permet d'acquérir une solide expérience terrain en gestion, animation et dynamisation de l'offre commerciale, tout en développant la relation client et le management d'équipe. Le BTS MCO en alternance est particulièrement prisé dans les secteurs de la grande distribution, de la banque-assurance, de l'immobilier et du e-commerce.",
    objectifs: [
      {
        iconSrc: "/images/diplome/icon-success.svg",
        title: "Objectifs du diplôme :",
        items: [
          "Maîtriser la gestion opérationnelle d'une unité commerciale (stocks, approvisionnements, budgets).",
          "Développer la relation client et assurer la vente conseil.",
          "Animer et dynamiser l'offre commerciale par le merchandising et les actions promotionnelles.",
          "Manager une équipe commerciale : organisation, motivation et supervision.",
          "Analyser les performances commerciales et proposer des actions correctives.",
        ],
      },
    ],
  },
  programme: {
    title: "Programme du diplôme",
    titleHighlight: "BTS MCO",
    text: "Le programme du BTS MCO en alternance couvre un large éventail de compétences commerciales et managériales, réparties en enseignements généraux et professionnels sur deux années de formation.",
    sections: [
      {
        icon: "fr-icon-book-2-line",
        title: "Enseignements généraux",
        items: ["Culture générale et expression.", "Langue vivante étrangère (anglais).", "Culture économique, juridique et managériale (CEJM)."],
      },
      {
        icon: "fr-icon-briefcase-line",
        title: "Enseignements professionnels",
        items: [
          "Développement de la relation client et vente conseil.",
          "Animation et dynamisation de l'offre commerciale.",
          "Gestion opérationnelle (analyse des stocks, marges, budgets).",
          "Management de l'équipe commerciale.",
        ],
      },
      {
        icon: "fr-icon-award-line",
        title: "Compétences développées",
        items: [
          "Techniques de vente, négociation et merchandising.",
          "Gestion des stocks et des approvisionnements.",
          "Management d'équipe et leadership.",
          "Analyse de données commerciales et pilotage de la performance.",
          "Communication professionnelle écrite et orale.",
        ],
      },
    ],
  },
  preparation: {
    title: "Comment se préparer à une alternance",
    titleHighlight: "BTS MCO ?",
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
    title: "Comment intégrer un BTS MCO en alternance",
    prerequis: [
      { label: "Baccalauréat général" },
      { label: "Bac technologique STMG" },
      { label: "Bac professionnel Métiers du commerce et de la vente" },
      { label: "Dossier scolaire et entretien de motivation" },
    ],
    etapes: [
      {
        numero: 1,
        title: "Trouve une entreprise",
        description: "Recherchez une entreprise qui recrute des alternants en BTS MCO. Consultez les offres sur La bonne alternance et candidatez directement.",
        ctaLabel: "Voir les offres",
        ctaHref: "/recherche-emploi",
      },
      {
        numero: 2,
        title: "Choisis ta formation",
        description: "Sélectionnez un centre de formation qui propose le BTS MCO en alternance. Comparez les programmes et les taux de réussite.",
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
  ecoles: {
    title: "Quelques écoles qui proposent le diplôme",
    titleHighlight: "BTS MCO :",
    formations: [
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
  },
  salaire: {
    title: "Le salaire en",
    titleHighlight: "BTS MCO",
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
}
