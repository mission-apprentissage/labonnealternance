import type { IDiplomeSeoData } from "../types"

export const capAepe: IDiplomeSeoData = {
  slug: "cap-aepe",
  titre: "CAP AEPE",
  sousTitre: "Accompagnant Éducatif Petite Enfance",
  intituleLongFormation: "ACCOMPAGNANT EDUCATIF PETITE ENFANCE",
  kpis: [
    { label: "Durée de la formation", value: "1 à 2 ans", iconSrc: "/images/diplome/offre-emploi.svg", labelFirst: true },
    { label: "entreprises recrutent", value: "XX", iconSrc: "/images/diplome/companie.svg" },
    { label: "Salaire mensuel moyen", value: "471€-980€", iconSrc: "/images/diplome/money.svg" },
    { label: "Taux d'insertion post formation", value: "XX%", iconSrc: "/images/diplome/ecosystem.svg" },
  ],
  description: {
    text: "Le CAP Accompagnant Éducatif Petite Enfance (AEPE) est le diplôme de référence pour travailler auprès des enfants de 0 à 6 ans. Cette formation en alternance prépare à l'accueil, la garde et l'accompagnement du développement des jeunes enfants dans différents contextes : crèches, écoles maternelles ou à domicile. Le CAP AEPE remplace l'ancien CAP Petite Enfance et offre un programme enrichi, adapté aux exigences actuelles du secteur de la petite enfance.",
    objectifs: [
      {
        iconSrc: "/images/diplome/icon-success.svg",
        title: "Objectifs du diplôme :",
        items: [
          "Accompagner le développement du jeune enfant dans ses apprentissages quotidiens.",
          "Exercer son activité en accueil collectif (crèche, halte-garderie, multi-accueil).",
          "Exercer son activité en accueil individuel (à domicile ou chez les parents).",
          "Assurer les soins d'hygiène, de confort et de sécurité de l'enfant.",
          "Mettre en place des activités d'éveil et d'éducation adaptées.",
        ],
      },
    ],
  },
  programme: {
    title: "Programme du diplôme",
    titleHighlight: "CAP AEPE",
    text: "Le programme du CAP AEPE en alternance couvre l'ensemble des compétences nécessaires à l'accompagnement éducatif des jeunes enfants, alliant enseignements théoriques et pratique professionnelle en structure d'accueil.",
    sections: [
      {
        icon: "fr-icon-book-2-line",
        title: "Enseignements généraux",
        items: [
          "Français, histoire-géographie et enseignement moral et civique.",
          "Mathématiques et physique-chimie.",
          "Éducation physique et sportive.",
          "Prévention santé environnement (PSE).",
        ],
      },
      {
        icon: "fr-icon-briefcase-line",
        title: "Enseignements professionnels",
        items: [
          "Accompagner le développement du jeune enfant.",
          "Exercer son activité en accueil collectif.",
          "Exercer son activité en accueil individuel.",
          "Sciences médico-sociales et biologie appliquée.",
          "Techniques d'animation et d'éveil de l'enfant.",
        ],
      },
      {
        icon: "fr-icon-award-line",
        title: "Compétences développées",
        items: [
          "Soins d'hygiène et de confort du jeune enfant.",
          "Préparation et service des repas en respectant les règles nutritionnelles.",
          "Animation d'activités d'éveil et de loisirs.",
          "Communication professionnelle avec les familles et l'équipe éducative.",
          "Application des protocoles de sécurité et de premiers secours.",
        ],
      },
    ],
  },
  preparation: {
    title: "Comment se préparer à une alternance",
    titleHighlight: "CAP AEPE ?",
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
    title: "Comment intégrer un CAP AEPE en alternance",
    prerequis: [
      { label: "Niveau 3ème (aucun diplôme requis)" },
      { label: "Avoir 16 ans minimum (ou 15 ans à la sortie de 3ème)" },
      { label: "Maîtrise du français écrit et oral" },
      { label: "Motivation pour le travail auprès des enfants" },
      { label: "CAP AEPE en 1 an : être titulaire d'un diplôme de niveau 3 ou plus" },
    ],
    etapes: [
      {
        numero: 1,
        title: "Trouve une entreprise",
        description:
          "Recherchez une structure d'accueil petite enfance qui recrute des alternants en CAP AEPE. Consultez les offres sur La bonne alternance et candidatez directement.",
        ctaLabel: "Voir les offres",
        ctaHref: "/recherche-emploi",
      },
      {
        numero: 2,
        title: "Choisis ta formation",
        description: "Sélectionnez un centre de formation qui propose le CAP AEPE en alternance. Comparez les programmes et les taux de réussite.",
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
  ecoles: {
    title: "Quelques écoles qui proposent le diplôme",
    titleHighlight: "CAP AEPE :",
    formations: [
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
  },
  salaire: {
    title: "Le salaire en",
    titleHighlight: "CAP AEPE",
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
}
