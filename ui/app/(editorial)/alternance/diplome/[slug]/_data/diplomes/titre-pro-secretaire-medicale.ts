import type { IDiplomeSeoData } from "../types"

export const titreProSecretaireMedicale: IDiplomeSeoData = {
  slug: "titre-pro-secretaire-medicale",
  titre: "Titre Pro Secrétaire Médicale",
  sousTitre: "Secrétaire Assistant Médico-Social",
  intituleLongFormation: "SECRETAIRE ASSISTANT MEDICO-SOCIAL",
  kpis: [
    { label: "Durée de la formation", value: "12 mois", iconSrc: "/images/diplome/offre-emploi.svg", labelFirst: true },
    { label: "entreprises recrutent", value: "XX", iconSrc: "/images/diplome/companie.svg" },
    { label: "Salaire mensuel moyen", value: "751€-980€", iconSrc: "/images/diplome/money.svg" },
    { label: "Taux d'insertion post formation", value: "XX%", iconSrc: "/images/diplome/ecosystem.svg" },
  ],
  description: {
    title: "Qu'est ce que le diplôme",
    titleHighlight: "Titre Pro Secrétaire Médicale ?",
    text: "Le Titre Professionnel Secrétaire Assistant Médico-Social (TP SAMS) est une certification de niveau 4 (Bac) délivrée par le Ministère du Travail et enregistrée au RNCP (RNCP36805). Cette formation en alternance prépare des professionnels capables d'assurer l'accueil et la prise en charge administrative des patients et usagers dans les structures sanitaires, médico-sociales et sociales. Le secrétaire assistant médico-social gère la planification des activités du service, le traitement et le suivi administratif des dossiers, ainsi que la coordination des opérations liées au parcours du patient ou de l'usager.",
    objectifs: [
      {
        iconSrc: "/images/diplome/icon-success.svg",
        title: "Objectifs du diplôme :",
        items: [
          "Assister une équipe dans la communication des informations et l'organisation des activités.",
          "Assurer l'accueil et la prise en charge administrative du patient ou de l'usager.",
          "Traiter les dossiers et coordonner les opérations liées au parcours du patient ou de l'usager.",
          "Maîtriser la terminologie médicale et les règles de confidentialité (secret médical).",
          "Utiliser les outils numériques et les logiciels métiers du secteur médico-social.",
        ],
      },
    ],
  },
  programme: {
    title: "Programme du diplôme",
    titleHighlight: "Titre Pro Secrétaire Médicale",
    text: "Le programme du Titre Pro Secrétaire Médicale en alternance est organisé autour de trois blocs de compétences professionnelles (CCP), couvrant l'ensemble des activités du secrétariat médico-social.",
    sections: [
      {
        icon: "fr-icon-book-2-line",
        title: "CCP 1 - Assister une équipe",
        items: [
          "Produire des documents professionnels courants (courriers, comptes rendus, tableaux).",
          "Communiquer des informations par écrit et à l'oral.",
          "Assurer la traçabilité et la conservation des informations.",
          "Accueillir un visiteur et transmettre des informations oralement.",
          "Planifier et organiser les activités de l'équipe.",
        ],
      },
      {
        icon: "fr-icon-briefcase-line",
        title: "CCP 2 - Accueil et gestion administrative",
        items: [
          "Renseigner et orienter le public dans un service sanitaire, médico-social ou social.",
          "Planifier et gérer les rendez-vous de patients ou d'usagers.",
          "Assurer la prise en charge médico-administrative et sociale du patient ou de l'usager.",
          "Contrôler les données administratives du patient ou de l'usager.",
        ],
      },
      {
        icon: "fr-icon-award-line",
        title: "CCP 3 - Traitement des dossiers et coordination",
        items: [
          "Retranscrire des informations à caractère médical ou social.",
          "Assurer le suivi et la mise à jour des dossiers de patients ou d'usagers.",
          "Coordonner les opérations liées au parcours du patient ou de l'usager.",
          "Élaborer et actualiser des tableaux de suivi dans un service sanitaire ou médico-social.",
        ],
      },
    ],
  },
  preparation: {
    title: "Comment se préparer à une alternance",
    titleHighlight: "Titre Pro Secrétaire Médicale ?",
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
    title: "Comment intégrer un Titre Pro Secrétaire Médicale en alternance",
    prerequis: [
      { label: "Niveau 3ème ou équivalent" },
      { label: "Maîtrise de la langue française (écrit et oral)" },
      { label: "Connaissances bureautiques de base" },
      { label: "Entretien de motivation" },
      { label: "Tests de positionnement" },
    ],
    etapes: [
      {
        numero: 1,
        title: "Trouve une entreprise",
        description:
          "Recherchez une structure du secteur sanitaire ou médico-social qui recrute des alternants : hôpital, clinique, cabinet médical, laboratoire, EHPAD, centre médico-social. Consultez les offres sur La bonne alternance et candidatez directement.",
        ctaLabel: "Voir les offres",
        ctaHref: "/recherche-emploi",
      },
      {
        numero: 2,
        title: "Choisis ta formation",
        description:
          "Sélectionnez un centre de formation qui propose le Titre Pro Secrétaire Assistant Médico-Social en alternance. Comparez les programmes et les modalités d'accompagnement.",
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
  ecoles: {
    title: "Quelques écoles qui proposent le diplôme",
    titleHighlight: "Titre Pro Secrétaire Médicale :",
    formations: [
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
  },
  salaire: {
    title: "Le salaire en",
    titleHighlight: "Titre Pro Secrétaire Médicale",
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
}
