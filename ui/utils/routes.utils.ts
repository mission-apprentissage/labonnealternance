import type { Metadata, MetadataRoute } from "next"
import { OPCO } from "shared/constants"
import { generateUri } from "shared/helpers/generateUri"

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

export type IRecherchePageParams = {
  romes: string
  geo: null | { address: string | null; latitude: number; longitude: number; radius: number }
  diploma: string | null
  job_name: string | null
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
    administrationOpco: {
      getPath: () => `/espace-pro/opco` as string,
      title: "Administration OPCO",
      index: false,
      getMetadata: () => ({
        title: "Administration OPCO",
        description: "",
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
  },
  dynamic: {
    // example
    inscription: (token: string): IPage => ({
      getPath: () => `/auth/inscription?token=${token}`,
      index: false,
      getMetadata: () => ({ title: "" }),
      title: "Inscription",
    }),
    administrationDesOffres: (navigationContext: string): IPage => ({
      getPath: () => `${navigationContext}`,
      index: false,
      getMetadata: () => ({ title: "Administration des offres" }),
      title: "Administration des offres",
    }),
    compte: (): IPage => ({
      getPath: () => "/compte",
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

    modificationEntreprise: (establishment_id): IPage => ({
      getPath: () => `/espace-pro/entreprise/${establishment_id}/edition` as string,
      index: false,
      getMetadata: () => ({ title: "Modification entreprise" }),
      title: "Modification entreprise",
    }),
    offreCreation: ({
      offerId,
      establishment_id,
      userType,
      raison_sociale,
      establishment_siret,
    }: {
      offerId: string
      establishment_id: string
      userType: string
      raison_sociale?: string
      establishment_siret?: string
    }): IPage => ({
      getPath: () => {
        const raisonSocialeParam = raison_sociale ? `?raison_sociale=${raison_sociale}` : ""
        switch (userType) {
          case OPCO:
            return `/espace-pro/opco/entreprise/${establishment_siret}/${establishment_id}/offre/${offerId}}${raisonSocialeParam}`
          default:
            return `/espace-pro/entreprise/${establishment_id}/offre/${offerId}${raisonSocialeParam}`
        }
      },
      index: false,
      getMetadata: () => ({ title: "Création d'une offre" }),
      title: "Création d'une offre",
    }),
    successEditionOffre: ({ userType, establishment_id, user_id }: { userType: "OPCO" | "ENTREPRISE" | "CFA" | "ADMIN"; establishment_id?: string; user_id?: string }): IPage => ({
      getPath: () => {
        return userType === OPCO ? `/espace-pro/opco/entreprise/${user_id}/entreprise/${establishment_id}` : `/espace-pro/entreprise/${establishment_id}`
      },
      title: "Success édition offre",
      index: false,
      getMetadata: () => ({}),
    }),
    miseEnRelationCreationOffre: ({ isWidget, queryParameters }: { isWidget: boolean; queryParameters: string }): IPage => {
      const path = `${isWidget ? "/espace-pro/widget/entreprise/mise-en-relation" : "/espace-pro/creation/mise-en-relation"}${queryParameters}`

      return {
        getPath: () => path,
        title: "Mise en relation avec les CFAs",
        index: false,
        getMetadata: () => ({}),
      }
    },
    finCreationOffre: ({ isWidget, queryParameters }: { isWidget: boolean; queryParameters: string }): IPage => {
      const path = `${isWidget ? "/espace-pro/widget/entreprise/fin" : "/espace-pro/creation/fin"}${queryParameters}`

      return {
        getPath: () => path,
        title: "Création d'offre terminée",
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
    espaceProCreationFin: (params: { jobId: string; email: string; withDelegation: boolean; fromDashboard: boolean; userId: string; token: string; isWidget: boolean }): IPage => ({
      getPath: () => {
        const { isWidget, fromDashboard, withDelegation, ...querystring } = params
        return generateUri(isWidget ? "/espace-pro/widget/entreprise/fin" : "/espace-pro/creation/fin", {
          querystring: { ...querystring, fromDashboard: fromDashboard.toString(), withDelegation: withDelegation.toString() },
        }) as string
      },
      title: "Créer un compte entreprise",
    }),
    recherche: (params: IRecherchePageParams): IPage => {
      const query = new URLSearchParams()
      query.set("romes", params.romes)
      if (params.geo) {
        query.set("lat", params.geo.latitude.toString())
        query.set("lon", params.geo.longitude.toString())
        query.set("radius", params.geo.radius.toString())

        if (params.geo.address) {
          query.set("address", params.geo.address)
        }
      }

      if (params.diploma) {
        query.set("diploma", params.diploma)
      }
      if (params.job_name) {
        query.set("job_name", params.job_name)
      }
      query.set("display", "list")

      return {
        getPath: () => `/recherche?${query.toString()}` as string,
        index: false,
        getMetadata: () => ({ title: "" }),
        title: "Recherche",
      }
    },
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
