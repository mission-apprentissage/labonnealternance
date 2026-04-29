import type { IDiplomeSeoData } from "../types"

export const btsSio: IDiplomeSeoData = {
  slug: "bts-sio",
  titre: "BTS SIO en alternance",
  titreAccent: "BTS SIO",
  sousTitre: "Services Informatiques aux Organisations",
  kpis: [
    { label: "Durée de la formation", value: "2 ans", iconSrc: "/images/diplome/offre-emploi.svg", labelFirst: true },
    { label: "entreprises recrutent", value: "XX", iconSrc: "/images/diplome/companie.svg" },
    { label: "Salaire mensuel moyen", value: "1120€-1300€", iconSrc: "/images/diplome/money.svg" },
    { label: "Taux d'insertion post formation", value: "XX%", iconSrc: "/images/diplome/ecosystem.svg" },
  ],
  description: {
    title: "Qu'est ce que le diplôme",
    titleHighlight: "BTS SIO ?",
    text: "Le BTS Services Informatiques aux Organisations (SIO) est un diplôme d'État de niveau Bac+2 qui forme des professionnels capables de répondre aux besoins informatiques des entreprises. Cette formation en alternance propose deux spécialisations : l'option SISR (Solutions d'Infrastructure, Systèmes et Réseaux) orientée vers l'administration réseau et la cybersécurité, et l'option SLAM (Solutions Logicielles et Applications Métiers) orientée vers le développement d'applications. Le BTS SIO en alternance permet d'acquérir une expérience professionnelle concrète dans le secteur du numérique tout en préparant un diplôme reconnu par l'État.",
    objectifs: [
      {
        iconSrc: "/images/diplome/icon-success.svg",
        title: "Objectifs du diplôme :",
        items: [
          "Participer à la production et à la fourniture de services informatiques aux organisations.",
          "Installer, configurer et administrer des équipements et des services informatiques (option SISR).",
          "Concevoir, développer et maintenir des solutions applicatives (option SLAM).",
          "Assurer la cybersécurité des infrastructures et des données de l'organisation.",
          "Accompagner les utilisateurs dans l'appropriation des outils numériques.",
        ],
      },
    ],
  },
  programme: {
    title: "Programme du diplôme",
    titleHighlight: "BTS SIO",
    text: "Le programme du BTS SIO en alternance associe un tronc commun d'enseignements généraux et informatiques à une spécialisation SISR ou SLAM choisie dès le premier semestre. La formation délivre 120 crédits ECTS.",
    sections: [
      {
        icon: "fr-icon-book-2-line",
        title: "Enseignements généraux",
        items: [
          "Culture générale et expression.",
          "Expression et communication en anglais.",
          "Mathématiques pour l'informatique.",
          "Culture économique, juridique et managériale appliquée à l'informatique.",
        ],
      },
      {
        icon: "fr-icon-briefcase-line",
        title: "Enseignements professionnels",
        items: [
          "Support et mise à disposition de services informatiques (tronc commun).",
          "Option SISR : administration des systèmes et des réseaux, supervision, sécurisation de l'infrastructure.",
          "Option SLAM : conception et développement d'applications, gestion de bases de données, tests et déploiement.",
          "Cybersécurité : protection des données, gestion des risques, conformité RGPD.",
        ],
      },
      {
        icon: "fr-icon-award-line",
        title: "Compétences développées",
        items: [
          "Administration système et réseau (Linux, Windows Server).",
          "Développement web et logiciel (PHP, Java, Python, SQL).",
          "Gestion de projets informatiques et travail en équipe.",
          "Veille technologique et adaptation aux évolutions du numérique.",
          "Communication professionnelle en français et en anglais.",
        ],
      },
    ],
  },
  preparation: {
    title: "Comment se préparer à une alternance",
    titleHighlight: "BTS SIO ?",
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
    title: "Comment intégrer un BTS SIO en alternance",
    prerequis: [
      { label: "Baccalauréat général (spécialités NSI, mathématiques recommandées)" },
      { label: "Bac technologique STMG (spécialité SIG)" },
      { label: "Bac technologique STI2D (spécialité SIN)" },
      { label: "Bac professionnel CIEL (Cybersécurité, Informatique et réseaux, Électronique)" },
      { label: "Dossier scolaire et lettre de motivation via Parcoursup" },
    ],
    etapes: [
      {
        numero: 1,
        title: "Trouve une entreprise",
        description: "Recherchez une entreprise qui recrute des alternants en BTS SIO. Consultez les offres sur La bonne alternance et candidatez directement.",
        ctaLabel: "Voir les offres",
        ctaHref: "/recherche-emploi",
      },
      {
        numero: 2,
        title: "Choisis ta formation",
        description: "Sélectionnez un centre de formation qui propose le BTS SIO en alternance. Comparez les programmes SISR et SLAM selon votre projet professionnel.",
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
  ecoles: {
    title: "Quelques écoles qui proposent le diplôme",
    titleHighlight: "BTS SIO :",
    formations: [
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
  },
  salaire: {
    title: "Le salaire en",
    titleHighlight: "BTS SIO",
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
}
