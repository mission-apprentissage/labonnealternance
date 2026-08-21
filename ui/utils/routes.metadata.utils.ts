import "server-only"
import type { Metadata } from "next"
import type { CFA, ENTREPRISE, ETAT_UTILISATEUR, OPCOS_LABEL } from "shared/constants/index"
import type { PAGES } from "@/utils/routes.utils"

// Registre des métadonnées SEO des pages, séparé de PAGES (routes.utils.ts) et server-only :
// PAGES est importé par de nombreux composants client (header, footer, error boundary) et ces
// littéraux titre/description représentaient ~la moitié de ses octets émis dans les bundles
// client, dupliqués entre chunks (issue #5214). Les clés reflètent celles de PAGES — le
// `satisfies` en fin de fichier casse le typecheck si une clé de PAGES est renommée ou supprimée.
export const METADATA = {
  static: {
    home: () => ({
      title: "La bonne alternance | Trouvez votre alternance, formation et emploi",
      description:
        "Trouvez votre alternance parmi des milliers d’offres d’emploi et de formations. Recherchez par métier et par ville, candidatez en ligne ou en spontané. Service public gratuit.",
    }),
    authentification: () => ({
      title: "Authentification - La bonne alternance",
      description: "Connectez-vous à votre compte La bonne alternance pour accéder à vos offres d’alternance.",
    }),
    aPropos: () => ({
      title: "À propos de La bonne alternance - Notre mission et engagement",
      description: "Apprenez-en plus sur La bonne alternance, notre mission et notre engagement pour faciliter votre recherche d’alternance.",
    }),
    cgu: () => ({
      title: "Conditions générales d'utilisation - La bonne alternance",
      description: "Consultez les conditions générales d’utilisation de La bonne alternance pour comprendre nos règles et engagements.",
    }),
    faq: () => ({
      title: "FAQ - Réponses à vos questions sur l'alternance",
      description: "Trouvez des réponses aux questions fréquentes sur l’alternance, nos services et le fonctionnement du site.",
    }),
    mentionsLegales: () => ({
      title: "Mentions légales - La bonne alternance",
      description: "Consultez les mentions légales de La bonne alternance pour en savoir plus sur nos obligations légales et notre responsabilité.",
    }),
    politiqueConfidentialite: () => ({
      title: "Politique de confidentialité - Protection de vos données",
      description: "Découvrez comment nous protégeons vos données personnelles et respectons votre vie privée sur La bonne alternance.",
    }),
    // Le « 77 » correspond au nombre de secteurs listés dans ui/config/metiers.txt (compteur en dur, cf. note ci-dessous).
    metiers: () => ({
      title: "Métiers en alternance : 77 secteurs | La bonne alternance",
      description: "La liste des 77 secteurs qui recrutent en alternance : RH, communication, vente, BTP, santé, informatique… Offres d'emploi et formations du CAP au Master.",
    }),
    // Note : les compteurs des meta ci-dessous sont en dur volontairement (importer les tableaux
    // _data juste pour un .length alourdirait le graphe serveur pour rien). À mettre à jour lors
    // d'un changement de palier (30/30/10 → 100). Les pages hub affichent, elles, le décompte
    // dynamique via {data.length}.
    alternanceMetiers: () => ({
      title: "30 métiers en alternance qui recrutent | La bonne alternance",
      description: "Découvrez 30 métiers accessibles en alternance avec offres, salaires moyens et formations. Tertiaire, numérique, médico-social, artisanat.",
    }),
    alternanceVilles: () => ({
      title: "Alternance dans 30 grandes villes | La bonne alternance",
      description: "Trouvez votre alternance dans 30 grandes villes françaises. Offres, entreprises qui recrutent, logement, transports et vie d'alternant.",
    }),
    alternanceDiplomes: () => ({
      title: "Diplômes en alternance : BTS, BUT, Licence Pro | LBA",
      description: "Explorez 10 diplômes accessibles en alternance (BTS, BUT, Licence Pro, CAP, Titres Pro). Programme, durée, salaire et débouchés.",
    }),
    codeSources: () => ({
      title: "Nos sources de données - La bonne alternance",
      description: "Découvrez les sources de données que nous utilisons pour vous proposer les meilleures offres d’alternance.",
    }),
    blog: () => ({
      title: "Blog - Conseils et actualités sur l'alternance",
      description: "Lisez nos articles sur l’alternance, les conseils de carrière et les tendances du marché pour optimiser votre recherche.",
    }),
    ressources: () => ({
      title: "Ressources pour réussir votre alternance - La bonne alternance",
      description: "Accédez à des guides et outils pratiques pour maximiser vos chances de trouver une alternance et réussir votre parcours.",
    }),
    guideDecouvrirLAlternance: () => ({
      title: "Découvrir l'alternance | Contrats, conditions et durée",
      description: "Apprentissage ou professionnalisation : conditions d'accès, durée, rythme, coût de la formation et conditions de travail. Tout comprendre en 5 min.",
    }),
    guideApprentissageEtHandicap: () => ({
      title: "Apprentissage et handicap | Droits, aides et aménagements",
      description: "Alternance et situation de handicap : conditions d'accès, aménagements de formation, rémunération et aides spécifiques (AGEFIPH, FIPHFP). Guide 2026.",
    }),
    guidePreventionDesRisquesProfessionnelsPourLesApprentis: () => ({
      title: "La prévention des risques professionnels | Guide pour les apprentis, les CFA et les recruteurs",
      description: "Obligations des employeurs, accueil en entreprise et rôle des CFA dans la prévention des risques professionnels pour les apprentis.",
    }),
    guideAlternant: () => ({
      title: "Guide de l'alternant 2026 | Tout savoir sur l'alternance",
      description: "Informations, conseils et outils pour réussir votre alternance : contrats, rémunération, aides, formation et recherche d'employeur. Guide complet.",
    }),
    guideAlternantPreparerSonProjetEnAlternance: () => ({
      title: "Préparer son projet en alternance | Les 5 étapes clés",
      description: "Les 5 étapes pour réussir votre entrée en alternance : choix du métier, du contrat, recherche d’entreprise, de formation et aides disponibles.",
    }),
    guideAlternantSeFaireAccompagner: () => ({
      title: "Accompagnement alternance | Missions locales et mentorat",
      description: "Missions locales, cellules régionales, mentorat, 1jeune1solution : tous les dispositifs gratuits pour vous aider à trouver votre alternance.",
    }),
    guideAlternantLaRuptureDeContrat: () => ({
      title: "Rupture de contrat en alternance | Guide complet 2026",
      description: "Comment rompre un contrat d'apprentissage ou de professionnalisation ? Procédures, délais, droits et obligations. Guide pratique pour les alternants.",
    }),
    guideAlternantComprendreLaRemuneration: () => ({
      title: "Salaire en alternance 2026 : grille et barèmes officiels",
      description:
        "Grille de salaire en alternance 2026 : de 27 % à 100 % du SMIC selon l'âge et l'année de contrat. Apprentissage et professionnalisation, calcul brut/net et exonérations.",
    }),
    guideAlternantCommentSignerUnContratEnAlternance: () => ({
      title: "Signer un contrat en alternance | Démarches et Cerfa",
      description: "Guide complet pour signer votre contrat d'apprentissage ou de professionnalisation : formulaires Cerfa, informations requises et étapes clés.",
    }),
    guideAlternantRoleEtMissionsDuMaitreDApprentissageOuTuteur: () => ({
      title: "Maître d'apprentissage et tuteur | Rôle et missions",
      description: "Quel est le rôle du maître d'apprentissage ou tuteur en alternance ? Conditions, missions d'accompagnement et recours en cas de difficulté.",
    }),
    guideAlternantAProposDesFormations: () => ({
      title: "Bien choisir sa formation en alternance | Conseils pratiques",
      description: "Taux de réussite, insertion professionnelle, certification Qualiopi : les critères clés pour choisir votre formation en alternance.",
    }),
    guideAlternantConseilsEtAstucesPourTrouverUnEmployeur: () => ({
      title: "Trouver un employeur en alternance | Conseils et astuces",
      description: "Salons, candidatures spontanées, CV, préparation aux entretiens : nos conseils pratiques pour décrocher votre contrat en alternance.",
    }),
    guideAlternantLesAidesFinancieresEtMaterielles: () => ({
      title: "Aides alternant 2026 | Logement, transport et aides financières",
      description: "APL, Mobili-Jeune, Avance Loca-Pass, aides transport : toutes les aides financières et matérielles pour les alternants. Simulateur inclus.",
    }),
    jeSuisCFA: () => ({
      title: "CFA et organismes de formation | La bonne alternance",
      description: "Diffusez gratuitement les offres de vos entreprises partenaires, recevez des candidatures et gérez la carte étudiant des métiers. Service public.",
    }),
    guideCfa: () => ({
      title: "Guide CFA | Ressources organismes de formation en alternance",
      description: "Outils, liens utiles et documents pour les CFA : catalogue des formations, Vade-mecum, Cerfa, guides handicap et aides aux contrats.",
    }),
    guideCfaLaCarteEtudiantDesMetiers: () => ({
      title: "Carte étudiant des métiers | Délivrance et avantages",
      description: "Délivrance de la carte d'étudiant des métiers par les CFA : obligations, délais (30 jours), avantages et réductions pour les alternants.",
    }),
    guideCfaAccompagnerVosAlternants: () => ({
      title: "Guide CFA | Accompagner vos alternants",
      description: "Comment les candidatures spontanées augmentent les chances de trouver son futur employeur.",
    }),
    jeSuisRecruteur: () => ({
      title: "Recruteur alternance | Publiez vos offres gratuitement",
      description: "Diffusez gratuitement vos offres d'alternance sur La bonne alternance, 1jeune1solution et Parcoursup. Recevez des candidatures en quelques clics.",
    }),
    guideRecruteur: () => ({
      title: "Guide recruteur alternance 2026 | Ressources employeurs",
      description: "Informations et outils pour recruter en alternance : contrats, Cerfa, aides à l'embauche, OPCO et prévention des risques. Guide complet employeur.",
    }),
    guideRecruteurJeSuisEmployeurPublic: () => ({
      title: "Apprentissage dans la fonction publique | Guide employeur public",
      description: "Recrutement d'apprentis dans le secteur public : financement, démarches administratives spécifiques et dispositifs de titularisation.",
    }),
    guideRecruteurCerfaApprentissageEtProfessionnalisation: () => ({
      title: "Cerfa apprentissage et professionnalisation | Guide complet 2026",
      description: "Comment remplir le Cerfa d'apprentissage ou de professionnalisation ? Formulaires, délais OPCO et documents requis. Guide employeur.",
    }),
    guideRecruteurAidesALEmbaucheEnAlternance: () => ({
      title: "Aides à l'embauche en alternance 2026 | Jusqu'à 6 000 €",
      description: "Aide unique, aide exceptionnelle jusqu'à 6 000 €, exonérations : toutes les aides financières pour recruter un alternant en 2026.",
    }),
    salaireAlternant: () => ({
      title: "Simulateur salaire alternance 2026 | Calcul gratuit brut et net",
      description:
        "Calculez votre salaire net en alternance en 2 clics. Indiquez votre âge, type de contrat et durée : le simulateur affiche votre rémunération mensuelle brut et net.",
    }),
    EspaceDeveloppeurs: () => ({
      title: "Espace développeurs - Transparence et qualité des offres - La bonne alternance",
      description: "En savoir plus sur notre API et nos données pour développer vos propres outils et services d’alternance.",
    }),
    contact: () => ({
      title: "Contactez-nous - La bonne alternance",
      description: "Besoin d’aide ou d’informations ? Contactez notre équipe pour toute question relative à votre recherche d’alternance.",
    }),
    statistiques: () => ({
      title: "Statistiques - La bonne alternance",
      description: "Consultez nos statistiques et analyses sur le marché de l’alternance en France.",
    }),
    barometre: () => ({
      title: "Baromètre de l’alternance T1 2026 - La bonne alternance",
      description:
        "Baromètre T1 2026 de l’alternance : offres, candidatures, métiers les plus recherchés, secteurs qui recrutent, tensions par région. Données La bonne alternance.",
      keywords: [
        "baromètre alternance",
        "marché de l’alternance",
        "alternance T1 2026",
        "candidatures alternance",
        "offres apprentissage",
        "métiers en alternance",
        "secteurs qui recrutent en alternance",
        "tensions alternance par région",
        "La bonne alternance",
      ],
      openGraph: {
        title: "Baromètre de l’alternance T1 2026 - La bonne alternance",
        description:
          "Baromètre T1 2026 de l’alternance : offres, candidatures, métiers les plus recherchés, secteurs qui recrutent, tensions par région. Données La bonne alternance.",
        url: `/barometre`,
        siteName: "La bonne alternance",
        locale: "fr_FR",
        type: "article",
        images: [
          {
            url: "/favicon/android-chrome-512x512.png",
            width: 512,
            height: 512,
            alt: "La bonne alternance",
          },
        ],
      },
    }),
    accesRecruteur: () => ({
      title: "Accès recruteur - La bonne alternance",
      description: "Diffusez simplement et gratuitement vos offres en alternance.",
    }),
    organismeDeFormation: () => ({
      title: "Accès Organisme de formation - La bonne alternance",
      description: "Diffusez simplement et gratuitement vos offres en alternance.",
    }),
    espaceProCreationEntreprise: () => ({
      title: "Créer un compte recruteur - La bonne alternance",
      description: "Créer un compte recruteur pour diffuser simplement et gratuitement vos offres en alternance.",
    }),
    espaceProCreationCfa: () => ({
      title: "Créer un compte d'organisme de formation - La bonne alternance",
      description: "Créer un compte d'organisme de formation pour diffuser simplement et gratuitement les offres en alternance de vos entreprises partenaires.",
    }),
    backCfaHome: () => ({
      title: "Accueil espace CFA - La bonne alternance",
    }),
    espaceProCfaCarteDEtudiantDesMetiers: () => ({
      title: "Carte d'étudiant des métiers - La bonne alternance",
      description: "Téléchargez la carte d'étudiant des métiers",
    }),
    backCfaCreationEntreprise: () => ({
      title: "Création d'entreprise partenaire - La bonne alternance",
    }),
    backAdminHome: () => ({
      title: "Accueil espace administration - La bonne alternance",
    }),
    backAdminGestionDesEntreprises: () => ({
      title: "Gestion des entreprises - La bonne alternance",
    }),
    backAdminGestionDesAdministrateurs: () => ({
      title: "Gestion des administrateurs - La bonne alternance",
    }),
    backAdminGestionDesRecruteurs: () => ({
      title: "Gestion des recruteurs - La bonne alternance",
    }),
    backAdminGestionDesOffresPartenaires: () => ({
      title: "Offres partenaires - La bonne alternance",
    }),
    backOpcoHome: () => ({
      title: "Accueil espace OPCO - La bonne alternance",
    }),
    backHomeEntreprise: () => ({
      title: "Accueil espace recruteur - La bonne alternance",
    }),
    backEntrepriseCreationOffre: () => ({
      title: "Nouvelle offre - La bonne alternance",
    }),
    rendezVousApprentissageRecherche: () => ({
      title: "Recherche etablissement rendez-vous apprentissage - La bonne alternance",
    }),
    backCreateCFAEnAttente: () => ({
      title: "Création de compte CFA en attente - La bonne alternance",
    }),
    desinscription: () => ({
      title: "Désinscription candidatures spontanées - La bonne alternance",
      description: "Désinscrivez vous de l'envoi de candidatures spontanées.",
    }),
    accessibilite: () => ({
      title: "Déclaration d'accessibilité - La bonne alternance",
      description: "Politique de confidentialité, traitement des données à caractère personnel sur le site de La bonne alternance.",
    }),
    planDuSite: () => ({
      title: "Plan du site - La bonne alternance",
      description: "Découvrez l'ensemble des pages et services disponibles sur La bonne alternance.",
    }),
    adminProcessor: () => ({
      title: "Statut du processeur - La bonne alternance",
    }),
    postuler: () => ({
      title: "Postuler à l'offre - La bonne alternance",
    }),
    detailRendezVousApprentissage: () => ({
      title: "Détail du rendez-vous d'apprentissage - La bonne alternance",
    }),
  },
  dynamic: {
    compte: ({ userType }: { userType: "CFA" | "ENTREPRISE" | "OPCO" | "ADMIN" }): Metadata => ({ title: "Informations de contact - La bonne alternance" }),
    metierJobById: (metier: string): Metadata => ({
      title: `${metier} en alternance - Découvrez les opportunités`,
      description: `Explorez les différents métiers accessibles en ${metier} en alternance et trouvez celui qui correspond à votre projet professionnel.`,
    }),
    modificationEntreprise: (userType: string, establishment_id?: string): Metadata => ({ title: "Modification entreprise - La bonne alternance" }),
    offreUpsert: ({
      offerId,
      establishment_id,
      userType,
      userId,
      raison_sociale,
    }: {
      offerId: string
      establishment_id: string
      userType: string
      userId?: string
      raison_sociale?: string
    }): Metadata => ({ title: `${offerId === "creation" ? "Création d'une offre" : "Edition d'une offre"} - La bonne alternance` }),
    backCfaEntrepriseCreationDetail: (siret: string): Metadata => ({
      title: `Création entreprise ${siret} - La bonne alternance`,
    }),
    backCfaPageEntreprise: (establishment_id: string, establishmentLabel?: string): Metadata => ({
      title: `${establishmentLabel ?? "Entreprise"} - La bonne alternance`,
    }),
    backCfaPageInformations: (establishment_id: string): Metadata => ({
      title: "Informations de contact entreprise - La bonne alternance",
    }),
    backCfaEntrepriseCreationOffre: (establishment_id: string): Metadata => ({
      title: "Création d'une offre - La bonne alternance",
    }),
    backAdminRecruteursATraiter: (props: { status?: ETAT_UTILISATEUR; accountType?: typeof CFA | typeof ENTREPRISE; opco?: OPCOS_LABEL; page?: string }): Metadata => ({
      title: "Gestion des recruteurs - La bonne alternance",
    }),
    backAdminRecruteurOffres: ({ user_id, user_label }: { user_id: string; user_label?: string }): Metadata => ({
      title: `${user_label ?? "Entreprise"} - La bonne alternance`,
    }),
    backAdminUserCfaEntreprise: ({ user_id, establishment_id, user_label }: { user_id: string; establishment_id: string; user_label?: string }): Metadata => ({
      title: `${user_label ?? "Entreprise"} - La bonne alternance`,
    }),
    backEntrepriseEditionOffre: ({ job_id }: { job_id: string }): Metadata => ({
      title: `${job_id ? "Edition d'une offre" : "Création d'une offre"} - La bonne alternance`,
    }),
    backEntrepriseMiseEnRelation: ({ job_id }: { job_id: string }): Metadata => ({
      title: "Mise en relation avec des organismes de formation - La bonne alternance",
    }),
    backOpcoInformationEntreprise: ({ user_id, user_label }: { user_id: string; user_label?: string }): Metadata => ({
      title: `${user_label ?? "Entreprise"} - La bonne alternance`,
    }),
    backEditAdministrator: ({ userId }: { userId: string }): Metadata => ({
      title: "Modification d'administrateur - La bonne alternance",
    }),
    backCreateCFAConfirmation: ({ email }: { email: string }): Metadata => ({
      title: "Confirmation de création de compte - La bonne alternance",
    }),
    rendezVousApprentissageDetail: ({ siret }: { siret: string }): Metadata => ({
      title: `Détail etablissement ${siret} - La bonne alternance`,
    }),
    adminProcessorJob: (name: string): Metadata => ({
      title: `Job ${name} - La bonne alternance`,
    }),
    adminProcessorJobInstance: (props: { name: string; id: string }): Metadata => ({
      title: `Tâche Job ${props.id} - La bonne alternance`,
    }),
    adminProcessorCron: (name: string): Metadata => ({
      title: `CRON ${name} - La bonne alternance`,
    }),
    adminProcessorCronTask: (props: { name: string; id: string }): Metadata => ({
      title: `Tâche CRON ${props.id} - La bonne alternance`,
    }),
  },
} as const satisfies {
  static: Partial<Record<keyof typeof PAGES.static, () => Metadata>>
  dynamic: Partial<Record<keyof typeof PAGES.dynamic, (...args: never[]) => Metadata>>
}
