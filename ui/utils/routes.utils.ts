import type { Metadata } from "next"
import { assertUnreachable, removeUndefinedFields, toKebabCase } from "shared"
import type { ETAT_UTILISATEUR, OPCOS_LABEL } from "shared/constants/index"
import { ADMIN, CFA, ENTREPRISE, OPCO } from "shared/constants/index"
import type { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { generateUri } from "shared/helpers/generateUri"

import type { IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { buildRecherchePageParams, buildSearchTitle, IRechercheMode } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"

export interface IPage {
  getPath: (args?: any) => string
  title: string
  index?: boolean
  getMetadata?: (args?: any) => Metadata
}

interface INotionPage extends IPage {
  notionId: string
}

interface IPages {
  static: Record<string, IPage>

  dynamic: Record<string, (props: any) => IPage>
  notion: Record<string, INotionPage>
}

export const PAGES = {
  static: {
    home: {
      getPath: () => `/` as string,
      title: "Accueil",
      index: true,
      getMetadata: () => ({
        title: "La bonne alternance - Trouvez l'alternance idéale",
        description: "Découvrez des offres d’alternance adaptées à votre profil et boostez votre carrière avec La bonne alternance.",
      }),
    },
    authentification: {
      getPath: () => `/espace-pro/authentification` as string,
      title: "Authentification",
      index: false,
      getMetadata: () => ({
        title: "Authentification - La bonne alternance",
        description: "Connectez-vous à votre compte La bonne alternance pour accéder à vos offres d’alternance.",
      }),
    },
    aPropos: {
      getPath: () => `/a-propos` as string,
      title: "À propos",
      index: false,
      getMetadata: () => ({
        title: "À propos de La bonne alternance - Notre mission et engagement",
        description: "Apprenez-en plus sur La bonne alternance, notre mission et notre engagement pour faciliter votre recherche d’alternance.",
      }),
    },
    cgu: {
      getPath: () => `/conditions-generales-utilisation` as string,
      title: "Conditions générales d'utilisation",
      index: false,
      getMetadata: () => ({
        title: "Conditions générales d'utilisation - La bonne alternance",
        description: "Consultez les conditions générales d’utilisation de La bonne alternance pour comprendre nos règles et engagements.",
      }),
    },
    faq: {
      getPath: () => `/faq` as string,
      title: "FAQ",
      index: false,
      getMetadata: () => ({
        title: "FAQ - Réponses à vos questions sur l'alternance",
        description: "Trouvez des réponses aux questions fréquentes sur l’alternance, nos services et le fonctionnement du site.",
      }),
    },
    mentionsLegales: {
      getPath: () => `/mentions-legales` as string,
      title: "Mentions légales",
      index: false,
      getMetadata: () => ({
        title: "Mentions légales - La bonne alternance",
        description: "Consultez les mentions légales de La bonne alternance pour en savoir plus sur nos obligations légales et notre responsabilité.",
      }),
    },
    politiqueConfidentialite: {
      getPath: () => `/politique-de-confidentialite` as string,
      title: "Politique de confidentialité - La bonne alternance",
      index: false,
      getMetadata: () => ({
        title: "Politique de confidentialité - Protection de vos données",
        description: "Découvrez comment nous protégeons vos données personnelles et respectons votre vie privée sur La bonne alternance.",
      }),
    },
    metiers: {
      getPath: () => `/metiers` as string,
      title: "Métiers",
      index: false,
      getMetadata: () => ({
        title: "Métiers en alternance - Découvrez les opportunités sur La bonne alternance",
        description: "Explorez les différents métiers accessibles en alternance et trouvez celui qui correspond à votre projet professionnel.",
      }),
    },
    codeSources: {
      getPath: () => `https://github.com/mission-apprentissage/labonnealternance` as string,
      title: "Sources",
      index: false,
      getMetadata: () => ({
        title: "Nos sources de données - La bonne alternance",
        description: "Découvrez les sources de données que nous utilisons pour vous proposer les meilleures offres d’alternance.",
      }),
    },
    blog: {
      getPath: () => `https://labonnealternance.sites.beta.gouv.fr/?utm_source=lba&utm_medium=website&utm_campaign=lba_footer` as string,
      title: "Blog",
      index: false,
      getMetadata: () => ({
        title: "Blog - Conseils et actualités sur l'alternance",
        description: "Lisez nos articles sur l’alternance, les conseils de carrière et les tendances du marché pour optimiser votre recherche.",
      }),
    },
    ressources: {
      getPath: () => `/ressources` as string,
      title: "Ressources",
      index: false,
      getMetadata: () => ({
        title: "Ressources pour réussir votre alternance - La bonne alternance",
        description: "Accédez à des guides et outils pratiques pour maximiser vos chances de trouver une alternance et réussir votre parcours.",
      }),
    },
    EspaceDeveloppeurs: {
      getPath: () => `/espace-developpeurs` as string,
      title: "Espace développeurs",
      index: false,
      getMetadata: () => ({
        title: "Espace développeurs - Transparence et qualité des offres - La bonne alternance",
        description: "En savoir plus sur notre API et nos données pour développer vos propres outils et services d’alternance.",
      }),
    },
    contact: {
      getPath: () => `/contact` as string,
      title: "Contact",
      index: false,
      getMetadata: () => ({
        title: "Contactez-nous - La bonne alternance",
        description: "Besoin d’aide ou d’informations ? Contactez notre équipe pour toute question relative à votre recherche d’alternance.",
      }),
    },
    statistiques: {
      getPath: () => `/statistiques` as string,
      title: "Statistiques",
      index: false,
      getMetadata: () => ({
        title: "Statistiques - La bonne alternance",
        description: "Consultez nos statistiques et analyses sur le marché de l’alternance en France.",
      }),
    },
    accesRecruteur: {
      getPath: () => `/acces-recruteur` as string,
      title: "Recruteur",
      index: false,
      getMetadata: () => ({
        title: "Accès recruteur - La bonne alternance",
        description: "Diffusez simplement et gratuitement vos offres en alternance.",
      }),
    },
    organismeDeFormation: {
      getPath: () => `/organisme-de-formation` as string,
      title: "Organisme de formation",
      index: false,
      getMetadata: () => ({
        title: "Accès Organisme de formation - La bonne alternance",
        description: "Diffusez simplement et gratuitement vos offres en alternance.",
      }),
    },
    espaceProCreationEntreprise: {
      getPath: () => `/espace-pro/creation/entreprise` as string,
      title: "Créer un compte entreprise",
      getMetadata: () => ({
        title: "Créer un compte recruteur - La bonne alternance",
        description: "Créer un compte recruteur pour diffuser simplement et gratuitement vos offres en alternance.",
      }),
    },
    espaceProCreationCfa: {
      getPath: () => `/espace-pro/creation/cfa` as string,
      title: "Créer un compte d'organisme de formation",
      getMetadata: () => ({
        title: "Créer un compte d'organisme de formation - La bonne alternance",
        description: "Créer un compte d'organisme de formation pour diffuser simplement et gratuitement les offres en alternance de vos entreprises partenaires.",
      }),
    },
    backCfaHome: {
      getPath: () => `/espace-pro/cfa` as string,
      title: "Accueil CFA",
      getMetadata: () => ({
        title: "Accueil espace CFA - La bonne alternance",
      }),
    },
    backCfaCreationEntreprise: {
      getPath: () => `/espace-pro/cfa/creation-entreprise` as string,
      title: "Création d'entreprise",
      getMetadata: () => ({
        title: "Création d'entreprise partenaire - La bonne alternance",
      }),
    },
    backAdminHome: {
      getPath: () => `/espace-pro/administration/users` as string,
      title: "Accueil administration",
      getMetadata: () => ({
        title: "Accueil espace administration - La bonne alternance",
      }),
    },
    backAdminGestionDesEntreprises: {
      getPath: () => `/espace-pro/administration/gestion-des-entreprises` as string,
      title: "Gestion des entreprises",
      getMetadata: () => ({
        title: "Gestion des entreprises - La bonne alternance",
      }),
    },
    backAdminGestionDesAdministrateurs: {
      getPath: () => `/espace-pro/administration/gestion-des-administrateurs` as string,
      title: "Gestion des administrateurs",
      getMetadata: () => ({
        title: "Gestion des administrateurs - La bonne alternance",
      }),
    },
    backOpcoHome: {
      getPath: () => `/espace-pro/opco` as string,
      title: "Accueil OPCO",
      getMetadata: () => ({
        title: "Accueil espace OPCO - La bonne alternance",
      }),
    },
    backHomeEntreprise: {
      getPath: () => `/espace-pro/entreprise` as string,
      title: "Accueil entreprise",
      getMetadata: () => ({
        title: "Accueil espace recruteur - La bonne alternance",
      }),
    },
    backEntrepriseCreationOffre: {
      getPath: () => `/espace-pro/entreprise/creation-offre` as string,
      title: "Nouvelle offre",
      getMetadata: () => ({
        title: "Nouvelle offre - La bonne alternance",
      }),
    },
    rendezVousApprentissageRecherche: {
      getPath: () => `/espace-pro/administration/rendez-vous-apprentissage` as string,
      title: "Recherche etablissement rendez-vous apprentissage",
      getMetadata: () => ({
        title: "Recherche etablissement rendez-vous apprentissage - La bonne alternance",
      }),
    },
    backCreateCFAEnAttente: {
      getPath: () => "/espace-pro/authentification/en-attente" as string,
      title: "Création de compte CFA en attente",
      getMetadata: () => ({
        title: "Création de compte CFA en attente - La bonne alternance",
      }),
    },
    desinscription: {
      getPath: () => `/desinscription` as string,
      title: "Désinscription candidatures spontanées",
      index: false,
      getMetadata: () => ({
        title: "Désinscription candidatures spontanées - La bonne alternance",
        description: "Désinscrivez vous de l'envoi de candidatures spontanées.",
      }),
    },
    accessibilite: {
      getPath: () => `/accessibilite` as string,
      title: "Déclaration d'accessibilité",
      index: true,
      getMetadata: () => ({
        title: "Déclaration d'accessibilité - La bonne alternance",
        description: "Politique de confidentialité, traitement des données à caractère personnel sur le site de La bonne alternance.",
      }),
    },
    planDuSite: {
      getPath: () => `/plan-du-site` as string,
      title: "Plan du site",
      index: false,
      getMetadata: () => ({
        title: "Plan du site - La bonne alternance",
        description: "Découvrez l'ensemble des pages et services disponibles sur La bonne alternance.",
      }),
    },
    adminProcessor: {
      getPath: () => `/espace-pro/administration/processeur` as string,
      index: false,
      title: "Statut du processeur",
      getMetadata: () => ({
        title: "Statut du processeur - La bonne alternance",
      }),
    },
    postuler: {
      getPath: () => `/postuler` as string,
      title: "Postuler",
      index: false,
      getMetadata: () => ({
        title: "Postuler à l'offre - La bonne alternance",
      }),
    },
    detailRendezVousApprentissage: {
      title: "Détail du rendez-vous d'apprentissage",
      getPath: () => `/detail-rendez-vous` as string,
      index: false,
      getMetadata: () => ({
        title: "Détail du rendez-vous d'apprentissage - La bonne alternance",
      }),
    },
    salaireAlternant: {
      getPath: () => `/salaire-alternant` as string,
      title: "Simulateur",
      index: true,
      getMetadata: () => ({
        title: "Simulateur de rémunération alternant - La bonne alternance",
        description: "Simulez votre rémunération en alternance selon votre âge, le type de contrat et la durée de votre formation.",
      }),
    },
  },
  dynamic: {
    compte: ({ userType }: { userType: "CFA" | "ENTREPRISE" | "OPCO" | "ADMIN" }): IPage => ({
      getPath: () => {
        switch (userType) {
          case "CFA":
            return "/espace-pro/cfa/compte"
          case "ENTREPRISE":
            return "/espace-pro/entreprise/compte"
          case "OPCO":
            return "/espace-pro/opco/compte"
          case "ADMIN":
            return "/espace-pro/administration/compte"
          default:
            throw new Error("unsupported user type")
        }
      },
      index: false,
      getMetadata: () => ({ title: "Informations de contact - La bonne alternance" }),
      title: "Informations de contact",
    }),
    metierJobById: (metier: string): IPage => ({
      getPath: () => `/metiers/${metier}` as string,
      index: false,
      getMetadata: () => ({
        title: `${metier} en alternance - Découvrez les opportunités`,
        description: `Explorez les différents métiers accessibles en ${metier} en alternance et trouvez celui qui correspond à votre projet professionnel.`,
      }),
      title: metier,
    }),
    modificationEntreprise: (userType: string, establishment_id?: string): IPage => ({
      getPath: () => (userType === "CFA" ? `/espace-pro/cfa/entreprise/${establishment_id}/informations` : "/espace-pro/entreprise/compte"),
      index: false,
      getMetadata: () => ({ title: "Modification entreprise - La bonne alternance" }),
      title: "Modification entreprise",
    }),
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
    }): IPage => {
      const isCreation = offerId === "creation"
      return {
        getPath: () => {
          const raisonSocialeParam = raison_sociale ? `?raison_sociale=${encodeURIComponent(raison_sociale)}` : ""
          switch (userType) {
            case OPCO:
              return `/espace-pro/opco/users/${userId}/entreprise/${establishment_id}/offre/${offerId}${raisonSocialeParam}`
            case CFA:
              return isCreation ? PAGES.dynamic.backCfaEntrepriseCreationOffre(establishment_id).getPath() : `/espace-pro/cfa/entreprise/${establishment_id}/offre/${offerId}`
            case ENTREPRISE:
              return isCreation ? PAGES.static.backEntrepriseCreationOffre.getPath() : PAGES.dynamic.backEntrepriseEditionOffre({ job_id: offerId }).getPath()
            case ADMIN:
              return `/espace-pro/administration/users/${userId}/entreprise/${establishment_id}/offre/${offerId}${raisonSocialeParam}`
            default:
              throw new Error("not implemented")
          }
        },
        index: false,
        getMetadata: () => ({ title: `${isCreation ? "Création d'une offre" : "Edition d'une offre"} - La bonne alternance` }),
        title: isCreation ? "Création d'une offre" : "Edition d'une offre",
      }
    },
    successEditionOffre: ({ userType, establishment_id, user_id }: { userType: "OPCO" | "ENTREPRISE" | "CFA" | "ADMIN"; establishment_id?: string; user_id?: string }): IPage => {
      let path = ""
      switch (userType) {
        case "OPCO":
          path = `/espace-pro/opco/entreprise/${user_id}/entreprise/${establishment_id}`
          break
        case "CFA":
          path = `/espace-pro/cfa`
          break
        case "ADMIN":
          path = `/espace-pro/administration/users/${user_id}`
          break
        case "ENTREPRISE":
          path = `/espace-pro/entreprise`
          break
        default:
          assertUnreachable(`wrong user type ${userType}` as never)
      }

      return {
        getPath: () => path,
        title: "Success édition offre",
        index: false,
        getMetadata: () => ({}),
      }
    },
    espaceProCreationDetail: (props: { siret: string; email?: string; type: "CFA" | "ENTREPRISE"; origin: string; isWidget: boolean }): IPage => ({
      getPath: () => {
        const { isWidget, ...querystring } = props
        return generateUri(isWidget ? "/espace-pro/widget/entreprise/detail" : "/espace-pro/creation/detail", {
          querystring: { ...querystring },
        }) as string
      },
      title: "Créer un compte entreprise",
    }),
    espaceProCreationOffre: (props: {
      establishment_id: string
      type: "CFA" | "ENTREPRISE"
      email: string
      userId: string
      token: string
      displayBanner: boolean
      isWidget: boolean
    }): IPage => ({
      getPath: () => {
        const { isWidget, displayBanner, ...querystring } = props
        return generateUri(isWidget ? "/espace-pro/widget/entreprise/offre" : "/espace-pro/creation/offre", {
          querystring: { ...querystring, displayBanner: displayBanner.toString() },
        }) as string
      },
      title: "Créer un compte entreprise",
    }),
    espaceProCreationFin: (props: {
      jobId: string
      email?: string
      withDelegation: boolean
      fromDashboard: boolean
      userId: string
      token?: string
      isWidget: boolean
    }): IPage => ({
      getPath: () => {
        const { isWidget, fromDashboard, withDelegation, ...querystring } = props

        const path = isWidget ? "/espace-pro/widget/entreprise/fin" : "/espace-pro/creation/fin"

        return generateUri(path, {
          querystring: removeUndefinedFields({ ...querystring, fromDashboard: fromDashboard.toString(), withDelegation: withDelegation.toString() }),
        }) as string
      },
      title: props.fromDashboard ? "Nouvelle offre" : "Créer un compte entreprise",
    }),
    espaceProOffreImpression: (jobId: string) => ({
      getPath: () => `/espace-pro/offre/impression/${jobId}`,
      title: "Imprimer mon offre",
    }),
    genericRecherche({ rechercheParams, mode }: { rechercheParams: Partial<IRecherchePageParams> | null; mode: IRechercheMode }): IPage {
      if (mode === IRechercheMode.FORMATIONS_ONLY) {
        return PAGES.dynamic.rechercheFormation(rechercheParams)
      }
      if (mode === IRechercheMode.JOBS_ONLY) {
        return PAGES.dynamic.rechercheEmploi(rechercheParams)
      }
      return PAGES.dynamic.recherche(rechercheParams)
    },
    recherche: (rechercheParams: Partial<IRecherchePageParams> | null): IPage => {
      const search = buildRecherchePageParams(rechercheParams, IRechercheMode.DEFAULT)
      const searchTitleContext = buildSearchTitle(rechercheParams)

      return {
        getPath: () => `/recherche?${search}` as string,
        index: false,
        getMetadata: () => ({
          title: `Offres en alternance${searchTitleContext} | La bonne alternance`,
          description: `Recherche - Offres en alternance${searchTitleContext} sur le site de La bonne alternance`,
        }),
        title: "Offres en alternance",
      }
    },
    rechercheFormation: (rechercheParams: Partial<IRecherchePageParams> | null): IPage => {
      const search = buildRecherchePageParams(rechercheParams, IRechercheMode.FORMATIONS_ONLY)
      const searchTitleContext = buildSearchTitle(rechercheParams)

      return {
        getPath: () => `/recherche-formation?${search}` as string,
        index: false,
        getMetadata: () => ({
          title: `Formations en alternance${searchTitleContext} | La bonne alternance`,
          description: `Recherche - Formations en alternance${searchTitleContext} sur le site de La bonne alternance`,
        }),
        title: "Formations en alternance",
      }
    },
    rechercheEmploi: (rechercheParams: Partial<IRecherchePageParams> | null): IPage => {
      const search = buildRecherchePageParams(rechercheParams, IRechercheMode.JOBS_ONLY)
      const searchTitleContext = buildSearchTitle(rechercheParams)

      return {
        getPath: () => `/recherche-emploi?${search}` as string,
        index: false,
        getMetadata: () => ({
          title: `Offres en alternance${searchTitleContext} | La bonne alternance`,
          description: `Recherche - Offres en alternance${searchTitleContext} sur le site de La bonne alternance`,
        }),
        title: "Offres en alternance",
      }
    },
    jobDetail: (props: { type: Exclude<LBA_ITEM_TYPE, LBA_ITEM_TYPE.FORMATION>; jobId: string } & Partial<IRecherchePageParams>): IPage => {
      const rechercheParams = props
      const jobTitle = rechercheParams.job_name ?? "Offre"
      const search = buildRecherchePageParams(rechercheParams, IRechercheMode.DEFAULT)
      return {
        getPath: () => `/emploi/${rechercheParams.type}/${encodeURIComponent(rechercheParams.jobId)}/${toKebabCase(jobTitle)}?${search}` as string,
        title: jobTitle,
      }
    },
    formationDetail: (props: { jobId: string } & Partial<IRecherchePageParams>): IPage => {
      const jobTitle = props.job_name ?? "Formation"
      const search = buildRecherchePageParams(props, IRechercheMode.DEFAULT)

      return {
        getPath: () => `/formation/${encodeURIComponent(props.jobId)}/${toKebabCase(jobTitle)}?${search}` as string,
        title: jobTitle,
      }
    },
    backCfaEntrepriseCreationDetail: (siret: string): IPage => ({
      getPath: () => `/espace-pro/cfa/creation-entreprise/${siret}` as string,
      title: siret,
      getMetadata: () => ({
        title: `Création entreprise ${siret} - La bonne alternance`,
      }),
    }),
    backCfaPageEntreprise: (establishment_id: string, establishmentLabel?: string): IPage => ({
      getPath: () => `/espace-pro/cfa/entreprise/${establishment_id}` as string,
      title: establishmentLabel ?? "Entreprise",
      getMetadata: () => ({
        title: `${establishmentLabel ?? "Entreprise"} - La bonne alternance`,
      }),
    }),
    backCfaPageInformations: (establishment_id: string): IPage => ({
      getPath: () => `/espace-pro/cfa/entreprise/${establishment_id}/informations` as string,
      title: "Informations de contact",
      getMetadata: () => ({
        title: "Informations de contact entreprise - La bonne alternance",
      }),
    }),
    backCfaEntrepriseCreationOffre: (establishment_id: string): IPage => ({
      getPath: () => `/espace-pro/cfa/entreprise/${establishment_id}/creation-offre` as string,
      title: "Création d'une offre",
      getMetadata: () => ({
        title: "Création d'une offre - La bonne alternance",
      }),
    }),
    backAdminGestionDesRecruteurs: (props: { status?: ETAT_UTILISATEUR; accountType?: typeof CFA | typeof ENTREPRISE; opco?: OPCOS_LABEL; page?: string }): IPage => {
      const searchParams = new URLSearchParams()
      Object.entries(props).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value + "")
        }
      })
      return {
        getPath: () => `/espace-pro/administration/users?${searchParams}` as string,
        title: "Gestion des recruteurs",
        getMetadata: () => ({
          title: "Gestion des recruteurs - La bonne alternance",
        }),
      }
    },
    backAdminRecruteurOffres: ({ user_id, user_label }: { user_id: string; user_label?: string }): IPage => ({
      getPath: () => `/espace-pro/administration/users/${user_id}` as string,
      title: user_label ?? "Entreprise",
      getMetadata: () => ({
        title: `${user_label ?? "Entreprise"} - La bonne alternance`,
      }),
    }),
    backEntrepriseEditionOffre: ({ job_id }: { job_id: string }): IPage => ({
      getPath: () => `/espace-pro/entreprise/offre/${job_id}` as string,
      title: job_id ? "Edition d'une offre" : "Création d'une offre",
      getMetadata: () => ({
        title: `${job_id ? "Edition d'une offre" : "Création d'une offre"} - La bonne alternance`,
      }),
    }),
    backEntrepriseMiseEnRelation: ({ job_id }: { job_id: string }): IPage => ({
      getPath: () => `/espace-pro/entreprise/offre/${job_id}/mise-en-relation` as string,
      title: "Mise en relation avec des organismes de formation",
      getMetadata: () => ({
        title: "Mise en relation avec des organismes de formation - La bonne alternance",
      }),
    }),
    backOpcoInformationEntreprise: ({ user_id, user_label }: { user_id: string; user_label?: string }): IPage => ({
      getPath: () => `/espace-pro/opco/users/${user_id}` as string,
      title: user_label ?? "Entreprise",
      getMetadata: () => ({
        title: `${user_label ?? "Entreprise"} - La bonne alternance`,
      }),
    }),
    backEditAdministrator: ({ userId }: { userId: string }): IPage => ({
      getPath: () => `/espace-pro/administration/gestion-des-administrateurs/user/${userId}` as string,
      title: "Modification d'administrateur",
      getMetadata: () => ({
        title: "Modification d'administrateur - La bonne alternance",
      }),
    }),
    backCreateCFAConfirmation: ({ email }: { email: string }): IPage => ({
      getPath: () => `/espace-pro/authentification/confirmation?email=${email}` as string,
      title: "Confirmation de création de compte",
      getMetadata: () => ({
        title: "Confirmation de création de compte - La bonne alternance",
      }),
    }),
    backHome: ({ userType }: { userType: "CFA" | "ENTREPRISE" | "ADMIN" | "OPCO" }): IPage => {
      switch (userType) {
        case "CFA":
          return PAGES.static.backCfaHome
        case "ENTREPRISE":
          return PAGES.static.backHomeEntreprise
        case "ADMIN":
          return PAGES.static.backAdminHome
        case "OPCO":
          return PAGES.static.backOpcoHome
        default:
          throw new Error("user type not supported")
      }
    },
    rendezVousApprentissageDetail: ({ siret }: { siret: string }): IPage => ({
      getPath: () => `/espace-pro/administration/rendez-vous-apprentissage/${siret}` as string,
      title: `Détail etablissement ${siret}`,
      getMetadata: () => ({
        title: `Détail etablissement ${siret} - La bonne alternance`,
      }),
    }),
    prdvUnsubscribeOptout: ({ id }: { id: string }): IPage => ({
      getPath: () => `/optout/unsubscribe/${id}` as string,
      title: `Désinscription à l'opt out`,
    }),
    adminProcessorJob: (name: string): IPage => ({
      getPath: () => `/espace-pro/administration/processeur/job/${name}`,
      index: false,
      title: `Job ${name}`,
      getMetadata: () => ({
        title: `Job ${name} - La bonne alternance`,
      }),
    }),
    adminProcessorJobInstance: (props: { name: string; id: string }): IPage => ({
      getPath: () => `/espace-pro/administration/processeur/job/${props.name}/${props.id}`,
      index: false,
      title: `Tâche Job ${props.id}`,
      getMetadata: () => ({
        title: `Tâche Job ${props.id} - La bonne alternance`,
      }),
    }),
    adminProcessorCron: (name: string): IPage => ({
      getPath: () => `/espace-pro/administration/processeur/cron/${name}`,
      index: false,
      title: `CRON ${name}`,
      getMetadata: () => ({
        title: `CRON ${name} - La bonne alternance`,
      }),
    }),
    adminProcessorCronTask: (props: { name: string; id: string }): IPage => ({
      getPath: () => `/espace-pro/administration/processeur/cron/${props.name}/${props.id}`,
      index: false,
      title: `Tâche CRON ${props.id}`,
      getMetadata: () => ({
        title: `Tâche CRON ${props.id} - La bonne alternance`,
      }),
    }),
    seoVille: (villeSlug: string): IPage => ({
      getPath: () => `/alternance/ville/${villeSlug}`,
      title: `Trouver une alternance à ${villeSlug}`,
    }),
  },
  notion: {},
} as const satisfies IPages
