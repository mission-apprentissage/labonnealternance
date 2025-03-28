import type { Metadata, MetadataRoute } from "next"
import { assertUnreachable, removeUndefinedFields, toKebabCase } from "shared"
import { ADMIN, AUTHTYPE, CFA, ENTREPRISE, OPCO } from "shared/constants/index"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { generateUri } from "shared/helpers/generateUri"

import { buildRecherchePageParams, IRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { publicConfig } from "@/config.public"

export interface IPage {
  getPath: (args?: any) => string
  title: string
  index?: boolean
  getMetadata?: (args?: any) => Metadata
}

export interface INotionPage extends IPage {
  notionId: string
}

export interface IPages {
  static: Record<string, IPage>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dynamic: Record<string, (params: any) => IPage>
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
      title: "Politique de confidentialité",
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
        title: "Métiers en alternance - Découvrez les opportunités",
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
        title: "Ressources pour réussir votre alternance",
        description: "Accédez à des guides et outils pratiques pour maximiser vos chances de trouver une alternance et réussir votre parcours.",
      }),
    },
    EspaceDeveloppeurs: {
      getPath: () => `/espace-developpeurs` as string,
      title: "Espace développeurs",
      index: false,
      getMetadata: () => ({
        title: "Espace developpeurs - Transparence et qualité des offres",
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
      title: "Accès recruteur",
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
        title: "Accès recruteur - La bonne alternance",
        description: "Diffusez simplement et gratuitement vos offres en alternance.",
      }),
    },
    espaceProCreationEntreprise: {
      getPath: () => `/espace-pro/creation/entreprise` as string,
      title: "Créer un compte entreprise",
    },
    espaceProCreationCfa: {
      getPath: () => `/espace-pro/creation/cfa` as string,
      title: "Créer un compte d'organisme de formation",
    },
    backCfaHome: {
      getPath: () => `/espace-pro/cfa` as string,
      title: "Accueil CFA",
    },
    backCfaCreationEntreprise: {
      getPath: () => `/espace-pro/cfa/creation-entreprise` as string,
      title: "Création d'entreprise",
    },
    backAdminHome: {
      getPath: () => `/espace-pro/administration/users` as string,
      title: "Accueil administration",
    },
    backAdminGestionDesEntreprises: {
      getPath: () => `/espace-pro/administration/gestion-des-entreprises` as string,
      title: "Gestion des entreprises",
    },
    backAdminGestionDesAdministrateurs: {
      getPath: () => `/espace-pro/administration/gestion-des-administrateurs` as string,
      title: "Gestion des administrateurs",
    },
    backOpcoHome: {
      getPath: () => `/espace-pro/opco` as string,
      title: "Accueil OPCO",
    },
    backHomeEntreprise: {
      getPath: () => `/espace-pro/entreprise` as string,
      title: "Accueil entreprise",
    },
    backEntrepriseCreationOffre: {
      getPath: () => `/espace-pro/entreprise/creation-offre` as string,
      title: "Nouvelle offre",
    },
    rendezVousApprentissageRecherche: {
      getPath: () => `/espace-pro/administration/rendez-vous-apprentissage` as string,
      title: "Recherche etablissement rendez-vous apprentissage",
    },
    backCreateCFAEnAttente: {
      getPath: () => "/espace-pro/authentification/en-attente" as string,
      title: "Création de compte CFA en attente",
    },
    desinscription: {
      getPath: () => `/desinscription` as string,
      title: "Désinscription candidatures spontanées",
      index: false,
      getMetadata: () => ({
        title: "Désinscription candidatures spontanées",
        description: "Désinscrivez vous de l'envoi de candidatures spontanées.",
      }),
    },
    accessibilite: {
      getPath: () => `/accessibilite` as string,
      title: "Déclaration d'accessibilité",
      index: true,
      getMetadata: () => ({
        title: "Déclaration d'accessibilité",
        description: "Politique de confidentialité, traitement des données à caractère personnel sur le site de La bonne alternance.",
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
      getMetadata: () => ({ title: "Informations de contact" }),
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
    modificationEntreprise: (): IPage => ({
      getPath: () => `/espace-pro/entreprise/compte` as string,
      index: false,
      getMetadata: () => ({ title: "Modification entreprise" }),
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
        getMetadata: () => ({ title: isCreation ? "Création d'une offre" : "Edition d'une offre" }),
        title: isCreation ? "Création d'une offre" : "Edition d'une offre",
      }
    },
    successEditionOffre: ({ userType, establishment_id, user_id }: { userType: "OPCO" | "ENTREPRISE" | "CFA" | "ADMIN"; establishment_id?: string; user_id?: string }): IPage => {
      let path = ""
      switch (userType) {
        case OPCO:
          path = `/espace-pro/opco/entreprise/${user_id}/entreprise/${establishment_id}`
          break
        case CFA:
          path = `/espace-pro/cfa`
          break
        case ADMIN:
          path = `/espace-pro/administration/users/${user_id}`
          break
        case ENTREPRISE:
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
    espaceProCreationDetail: (params: { siret: string; email?: string; type: "CFA" | "ENTREPRISE"; origin: string; isWidget: boolean }): IPage => ({
      getPath: () => {
        const { isWidget, ...querystring } = params
        return generateUri(isWidget ? "/espace-pro/widget/entreprise/detail" : "/espace-pro/creation/detail", {
          querystring: { ...querystring },
        }) as string
      },
      title: "Créer un compte entreprise",
    }),
    espaceProCreationOffre: (params: {
      establishment_id: string
      type: "CFA" | "ENTREPRISE"
      email: string
      userId: string
      token: string
      displayBanner: boolean
      isWidget: boolean
    }): IPage => ({
      getPath: () => {
        const { isWidget, displayBanner, ...querystring } = params
        return generateUri(isWidget ? "/espace-pro/widget/entreprise/offre" : "/espace-pro/creation/offre", {
          querystring: { ...querystring, displayBanner: displayBanner.toString() },
        }) as string
      },
      title: "Créer un compte entreprise",
    }),
    espaceProCreationFin: (params: {
      jobId: string
      email?: string
      withDelegation: boolean
      fromDashboard: boolean
      userId: string
      token?: string
      isWidget: boolean
    }): IPage => ({
      getPath: () => {
        const { isWidget, fromDashboard, withDelegation, ...querystring } = params

        const path = isWidget ? "/espace-pro/widget/entreprise/fin" : "/espace-pro/creation/fin"

        return generateUri(path, {
          querystring: removeUndefinedFields({ ...querystring, fromDashboard: fromDashboard.toString(), withDelegation: withDelegation.toString() }),
        }) as string
      },
      title: params.fromDashboard ? "Nouvelle offre" : "Créer un compte entreprise",
    }),
    espaceProOffreImpression: (jobId: string) => ({
      getPath: () => `/espace-pro/offre/impression/${jobId}`,
      title: "Imprimer mon offre",
    }),
    recherche: (params: IRecherchePageParams | null): IPage => {
      const search = params === null ? "" : buildRecherchePageParams(params, "default")

      let searchTitleContext = ""
      if (params?.job_name) {
        searchTitleContext += ` - ${params.job_name}`
        if (params?.geo?.address) {
          searchTitleContext += ` à ${params.geo.address}`
        } else if (params?.geo == null) {
          searchTitleContext += ` sur la France entière `
        }
      }

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
    rechercheFormation: (params: IRecherchePageParams | null): IPage => {
      const search = params === null ? "" : buildRecherchePageParams(params, "formations-only")

      let searchTitleContext = ""
      if (params?.job_name) {
        searchTitleContext += ` - ${params.job_name}`
        if (params?.geo?.address) {
          searchTitleContext += ` à ${params.geo.address}`
        } else if (params?.geo == null) {
          searchTitleContext += ` sur la France entière `
        }
      }

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
    rechercheEmploi: (params: IRecherchePageParams | null): IPage => {
      const search = params === null ? "" : buildRecherchePageParams(params, "jobs-only")

      let searchTitleContext = ""
      if (params?.job_name) {
        searchTitleContext += ` - ${params.job_name}`
        if (params?.geo?.address) {
          searchTitleContext += ` à ${params.geo.address}`
        } else if (params?.geo == null) {
          searchTitleContext += ` sur la France entière `
        }
      }

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
    jobDetail: (params: { type: Exclude<LBA_ITEM_TYPE, LBA_ITEM_TYPE.FORMATION>; jobId: string } & Partial<IRecherchePageParams>): IPage => {
      const jobTitle = params.job_name ?? "Offre"
      const search = buildRecherchePageParams(params, "default")

      return {
        getPath: () => `/emploi/${params.type}/${encodeURIComponent(params.jobId)}/${toKebabCase(jobTitle)}?${search}` as string,
        title: jobTitle,
      }
    },
    formationDetail: (params: { jobId: string } & Partial<IRecherchePageParams>): IPage => {
      const jobTitle = params.job_name ?? "Formation"
      const search = buildRecherchePageParams(params, "default")

      return {
        getPath: () => `/formation/${encodeURIComponent(params.jobId)}/${toKebabCase(jobTitle)}?${search}` as string,
        title: jobTitle,
      }
    },
    backCfaEntrepriseCreationDetail: (siret: string): IPage => ({
      getPath: () => `/espace-pro/cfa/creation-entreprise/${siret}` as string,
      title: siret,
    }),
    backCfaPageEntreprise: (establishment_id: string): IPage => ({
      getPath: () => `/espace-pro/cfa/entreprise/${establishment_id}` as string,
      title: "Entreprise",
    }),
    backCfaEntrepriseCreationOffre: (establishment_id: string): IPage => ({
      getPath: () => `/espace-pro/cfa/entreprise/${establishment_id}/creation-offre` as string,
      title: "Création d'une offre",
    }),
    backAdminRecruteurOffres: ({ user_id, user_label }: { user_id: string; user_label?: string }): IPage => ({
      getPath: () => `/espace-pro/administration/users/${user_id}` as string,
      title: user_label ?? "Entreprise",
    }),
    backEntrepriseEditionOffre: ({ job_id }: { job_id: string }): IPage => ({
      getPath: () => `/espace-pro/entreprise/offre/${job_id}` as string,
      title: job_id ? "Edition d'une offre" : "Création d'une offre",
    }),
    backOpcoInformationEntreprise: ({ user_id, user_label }: { user_id: string; user_label?: string }): IPage => ({
      getPath: () => `/espace-pro/opco/users/${user_id}` as string,
      title: user_label ?? "Entreprise",
    }),
    backEditAdministrator: ({ userId }: { userId: string }): IPage => ({
      getPath: () => `/espace-pro/administration/gestion-des-administrateurs/user/${userId}` as string,
      title: "Modification d'administrateur",
    }),
    backCreateCFAConfirmation: ({ email }: { email: string }): IPage => ({
      getPath: () => `/espace-pro/authentification/confirmation?email=${email}` as string,
      title: "Confirmation de création de compte",
    }),
    backHome: ({ userType }: { userType: "CFA" | "ENTREPRISE" | "ADMIN" | "OPCO" }): IPage => {
      switch (userType) {
        case AUTHTYPE.CFA:
          return PAGES.static.backCfaHome
        case AUTHTYPE.ENTREPRISE:
          return PAGES.static.backHomeEntreprise
        case AUTHTYPE.ADMIN:
          return PAGES.static.backAdminHome
        case AUTHTYPE.OPCO:
          return PAGES.static.backOpcoHome
        default:
          throw new Error("user type not supported")
      }
    },
    rendezVousApprentissageDetail: ({ siret }: { siret: string }): IPage => ({
      getPath: () => `/espace-pro/administration/rendez-vous-apprentissage/${siret}` as string,
      title: `Détail etablissement ${siret}`,
    }),
  },
  notion: {},
} as const satisfies IPages

function getRawPath(pathname: string): string {
  const rawPath = pathname.replace(/^\/fr/, "").replace(/^\/en/, "")
  return rawPath === "" ? "/" : rawPath
}

export function isStaticPage(pathname: string): boolean {
  return Object.values(PAGES.static).some((page) => getRawPath(page.getPath()) === pathname)
}

export function isDynamicPage(pathname: string): boolean {
  if (pathname === "/auth/inscription") {
    return true
  }
  if (pathname === "/auth/refus-inscription") {
    return true
  }
  if (/^\/admin\/utilisateurs\/[^/]+$/.test(pathname)) {
    return true
  }

  return false
}

export function isNotionPage(pathname: string): boolean {
  return pathname.startsWith("/doc/") || /^\/notion\/[^/]+$/.test(pathname)
}

function getSitemapItem(page: IPage): MetadataRoute.Sitemap[number] {
  return {
    url: `${publicConfig.baseUrl}${getRawPath(page.getPath())}`,
    alternates: {
      languages: {
        fr: `${publicConfig.baseUrl}${page.getPath()}`,
        en: `${publicConfig.baseUrl}${page.getPath()}`,
      },
    },
  }
}

export function getSitemap(): MetadataRoute.Sitemap {
  return Object.values((PAGES as IPages).static)
    .filter((page) => page.index === true)
    .map(getSitemapItem)
}

export function isPage(pathname: string): boolean {
  return isStaticPage(pathname) || isDynamicPage(pathname) || isNotionPage(pathname)
}
