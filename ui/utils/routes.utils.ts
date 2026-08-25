import { assertUnreachable, removeUndefinedFields, toKebabCase } from "shared"
import type { ETAT_UTILISATEUR, OPCOS_LABEL } from "shared/constants/index"
import { ADMIN, CFA, ENTREPRISE, OPCO } from "shared/constants/index"
import type { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { generateUri } from "shared/helpers/generate-uri"
import type { IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { buildRecherchePageParams, IRechercheMode } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"

// Ce module est embarqué dans les bundles client (header, footer, error boundary…) : ne rien
// y ajouter qui ne serve qu'au serveur. Les métadonnées SEO (title/description) vivent dans
// routes.metadata.utils.ts (registre METADATA, server-only) — issue #5214.
export interface IPage {
  getPath: (args?: any) => string
  title: string
  index?: boolean
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
    },
    authentification: {
      getPath: () => `/espace-pro/authentification` as string,
      title: "Authentification",
      index: false,
    },
    aPropos: {
      getPath: () => `/a-propos` as string,
      title: "À propos",
      index: false,
    },
    cgu: {
      getPath: () => `/conditions-generales-utilisation` as string,
      title: "Conditions générales d'utilisation",
      index: false,
    },
    faq: {
      getPath: () => `/faq` as string,
      title: "FAQ",
      index: false,
    },
    mentionsLegales: {
      getPath: () => `/mentions-legales` as string,
      title: "Mentions légales",
      index: false,
    },
    politiqueConfidentialite: {
      getPath: () => `/politique-de-confidentialite` as string,
      title: "Politique de confidentialité - La bonne alternance",
      index: false,
    },
    metiers: {
      getPath: () => `/metiers` as string,
      title: "Métiers",
      index: false,
    },
    alternanceMetiers: {
      getPath: () => `/alternance/metiers` as string,
      title: "Métiers en alternance",
      index: true,
    },
    alternanceVilles: {
      getPath: () => `/alternance/villes` as string,
      title: "Alternance dans les grandes villes",
      index: true,
    },
    alternanceDiplomes: {
      getPath: () => `/alternance/diplomes` as string,
      title: "Diplômes en alternance",
      index: true,
    },
    codeSources: {
      getPath: () => `https://github.com/mission-apprentissage/labonnealternance` as string,
      title: "Sources",
      index: false,
    },
    blog: {
      getPath: () => `https://labonnealternance.sites.beta.gouv.fr/?utm_source=lba&utm_medium=website&utm_campaign=lba_footer` as string,
      title: "Blog",
      index: false,
    },
    ressources: {
      getPath: () => `/ressources` as string,
      title: "Ressources",
      index: false,
    },
    guideDecouvrirLAlternance: {
      getPath: () => `/guide/decouvrir-l-alternance` as string,
      title: "Découvrir l'alternance",
      index: true,
    },
    guideApprentissageEtHandicap: {
      getPath: () => `/guide/apprentissage-et-handicap` as string,
      title: "Apprentissage & handicap",
      index: true,
    },
    guidePreventionDesRisquesProfessionnelsPourLesApprentis: {
      getPath: () => `/guide/prevention-des-risques-professionnels-pour-les-apprentis` as string,
      title: "La prévention des risques professionnels pour les apprentis",
      index: true,
    },
    guideAlternant: {
      getPath: () => `/guide-alternant` as string,
      title: "Je m'informe sur l'alternance",
      index: true,
    },
    guideAlternantPreparerSonProjetEnAlternance: {
      getPath: () => `/guide-alternant/preparer-son-projet-en-alternance` as string,
      title: "Préparer son projet en alternance",
      index: true,
    },
    guideAlternantSeFaireAccompagner: {
      getPath: () => `/guide-alternant/se-faire-accompagner` as string,
      title: "Des professionnels pour vous accompagner",
      index: true,
    },
    guideAlternantLaRuptureDeContrat: {
      getPath: () => `/guide-alternant/la-rupture-de-contrat` as string,
      title: "Rupture d'un contrat d'alternance : guide complet",
      index: true,
    },
    guideAlternantComprendreLaRemuneration: {
      getPath: () => `/guide-alternant/comprendre-la-remuneration` as string,
      title: "Comprendre la rémunération en alternance",
      index: true,
    },
    guideAlternantCommentSignerUnContratEnAlternance: {
      getPath: () => `/guide-alternant/comment-signer-un-contrat-en-alternance` as string,
      title: "Comment signer un contrat en alternance ?",
      index: true,
    },
    guideAlternantRoleEtMissionsDuMaitreDApprentissageOuTuteur: {
      getPath: () => `/guide-alternant/role-et-missions-du-maitre-d-apprentissage-ou-tuteur` as string,
      title: "Le rôle et les missions du maître d'apprentissage ou tuteur",
      index: true,
    },
    guideAlternantAProposDesFormations: {
      getPath: () => `/guide-alternant/a-propos-des-formations` as string,
      title: "À propos des formations",
      index: true,
    },
    guideAlternantConseilsEtAstucesPourTrouverUnEmployeur: {
      getPath: () => `/guide-alternant/conseils-et-astuces-pour-trouver-un-employeur` as string,
      title: "Conseils et astuces pour trouver un employeur",
      index: true,
    },
    guideAlternantLesAidesFinancieresEtMaterielles: {
      getPath: () => `/guide-alternant/les-aides-financieres-et-materielles` as string,
      title: "Les aides financières et matérielles pour les alternants",
      index: true,
    },
    jeSuisCFA: {
      getPath: () => `/je-suis-cfa` as string,
      title: "Je suis CFA",
      index: true,
    },
    guideCfa: {
      getPath: () => `/guide-cfa` as string,
      title: "Je m'informe sur l'alternance",
      index: true,
    },
    guideCfaLaCarteEtudiantDesMetiers: {
      getPath: () => `/guide-cfa/la-carte-etudiant-des-metiers` as string,
      title: "Téléchargement de la carte d'étudiant des métiers",
      index: true,
    },
    guideCfaAccompagnerVosAlternants: {
      getPath: () => `/guide-cfa/accompagner-vos-alternants` as string,
      title: "Accompagner vos alternants dans leurs démarches de candidatures",
      index: true,
    },
    jeSuisRecruteur: {
      getPath: () => `/je-suis-recruteur` as string,
      title: "Je suis recruteur",
      index: true,
    },
    guideRecruteur: {
      getPath: () => `/guide-recruteur` as string,
      title: "Je m'informe sur l'alternance",
      index: true,
    },
    guideRecruteurJeSuisEmployeurPublic: {
      getPath: () => `/guide-recruteur/je-suis-employeur-public` as string,
      title: "Je suis employeur public",
      index: true,
    },
    guideRecruteurCerfaApprentissageEtProfessionnalisation: {
      getPath: () => `/guide-recruteur/cerfa-apprentissage-et-professionnalisation` as string,
      title: "Cerfa apprentissage et professionnalisation : le guide complet",
      index: true,
    },
    guideRecruteurRecruterUnAlternant: {
      getPath: () => `/guide-recruteur/recruter-un-alternant` as string,
      title: "Recruter un alternant",
      index: true,
    },
    salaireAlternant: {
      getPath: () => `/salaire-alternant` as string,
      title: "Salaire alternant",
      index: true,
    },
    EspaceDeveloppeurs: {
      getPath: () => `/espace-developpeurs` as string,
      title: "Espace développeurs",
      index: false,
    },
    contact: {
      getPath: () => `/contact` as string,
      title: "Contact",
      index: false,
    },
    statistiques: {
      getPath: () => `/statistiques` as string,
      title: "Statistiques",
      index: false,
    },
    barometre: {
      getPath: () => `/barometre` as string,
      title: "Baromètre de l’alternance",
      index: true,
    },
    accesRecruteur: {
      getPath: () => `/acces-recruteur` as string,
      title: "Recruteur",
      index: false,
    },
    organismeDeFormation: {
      getPath: () => `/organisme-de-formation` as string,
      title: "Organisme de formation",
      index: false,
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
    espaceProCfaCarteDEtudiantDesMetiers: {
      getPath: () => `/espace-pro/cfa/carte-d-etudiant-des-metiers` as string,
      title: "Carte d'étudiant des métiers",
      index: true,
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
    backAdminGestionDesRecruteurs: {
      getPath: () => `/espace-pro/administration/recruteurs` as string,
      title: "Gestion des recruteurs",
    },
    backAdminGestionDesOffresPartenaires: {
      getPath: () => `/espace-pro/administration/offres-partenaires` as string,
      title: "Offres partenaires",
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
    },
    accessibilite: {
      getPath: () => `/accessibilite` as string,
      title: "Déclaration d'accessibilité",
      index: true,
    },
    planDuSite: {
      getPath: () => `/plan-du-site` as string,
      title: "Plan du site",
      index: false,
    },
    adminProcessor: {
      getPath: () => `/espace-pro/administration/processeur` as string,
      index: false,
      title: "Statut du processeur",
    },
    postuler: {
      getPath: () => `/postuler` as string,
      title: "Postuler",
      index: false,
    },
    detailRendezVousApprentissage: {
      title: "Détail du rendez-vous d'apprentissage",
      getPath: () => `/detail-rendez-vous` as string,
      index: false,
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
      title: "Informations de contact",
    }),
    metierJobById: (metier: string): IPage => ({
      getPath: () => `/metiers/${metier}` as string,
      index: false,
      title: metier,
    }),
    modificationEntreprise: (userType: string, establishment_id?: string): IPage => ({
      getPath: () => (userType === "CFA" ? `/espace-pro/cfa/entreprise/${establishment_id}/informations` : "/espace-pro/entreprise/compte"),
      index: false,
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
    // print_source et non source : « source » est un paramètre réservé de Plausible (attribution
    // d'acquisition). La page d'impression lit encore l'ancien nom en repli.
    espaceProOffreImpression: (jobId: string, printSource?: "cfa-sharing") => ({
      getPath: () => generateUri("/espace-pro/offre/impression/:jobId", { params: { jobId }, querystring: removeUndefinedFields({ print_source: printSource }) }),
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

      return {
        getPath: () => `/recherche${search ? `?${search}` : ""}` as string,
        index: false,
        title: "Offres en alternance",
      }
    },
    rechercheFormation: (rechercheParams: Partial<IRecherchePageParams> | null): IPage => {
      const search = buildRecherchePageParams(rechercheParams, IRechercheMode.FORMATIONS_ONLY)

      return {
        getPath: () => `/recherche-formation${search ? `?${search}` : ""}` as string,
        index: false,
        title: "Formations en alternance",
      }
    },
    rechercheEmploi: (rechercheParams: Partial<IRecherchePageParams> | null): IPage => {
      const search = buildRecherchePageParams(rechercheParams, IRechercheMode.JOBS_ONLY)

      return {
        getPath: () => `/recherche-emploi${search ? `?${search}` : ""}` as string,
        index: false,
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
    }),
    backCfaPageEntreprise: (establishment_id: string, establishmentLabel?: string): IPage => ({
      getPath: () => `/espace-pro/cfa/entreprise/${establishment_id}` as string,
      title: establishmentLabel ?? "Entreprise",
    }),
    backCfaPageInformations: (establishment_id: string): IPage => ({
      getPath: () => `/espace-pro/cfa/entreprise/${establishment_id}/informations` as string,
      title: "Informations de contact",
    }),
    backCfaEntrepriseCreationOffre: (establishment_id: string): IPage => ({
      getPath: () => `/espace-pro/cfa/entreprise/${establishment_id}/creation-offre` as string,
      title: "Création d'une offre",
    }),
    backAdminRecruteursATraiter: (props: { status?: ETAT_UTILISATEUR; accountType?: typeof CFA | typeof ENTREPRISE; opco?: OPCOS_LABEL; page?: string }): IPage => {
      const searchParams = new URLSearchParams()
      Object.entries(props).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value + "")
        }
      })
      return {
        getPath: () => `/espace-pro/administration/users?${searchParams}` as string,
        title: "Gestion des recruteurs",
      }
    },
    backAdminRecruteurOffres: ({ user_id, user_label }: { user_id: string; user_label?: string }): IPage => ({
      getPath: () => `/espace-pro/administration/users/${user_id}` as string,
      title: user_label ?? "Entreprise",
    }),
    backAdminUserCfaEntreprise: ({ user_id, establishment_id, user_label }: { user_id: string; establishment_id: string; user_label?: string }): IPage => ({
      getPath: () => `/espace-pro/administration/users/${user_id}/cfa/${establishment_id}` as string,
      title: user_label ?? "Entreprise",
    }),
    backEntrepriseEditionOffre: ({ job_id }: { job_id: string }): IPage => ({
      getPath: () => `/espace-pro/entreprise/offre/${job_id}` as string,
      title: job_id ? "Edition d'une offre" : "Création d'une offre",
    }),
    backEntrepriseMiseEnRelation: ({ job_id }: { job_id: string }): IPage => ({
      getPath: () => `/espace-pro/entreprise/offre/${job_id}/mise-en-relation` as string,
      title: "Mise en relation avec des organismes de formation",
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
    }),
    prdvUnsubscribeOptout: ({ id }: { id: string }): IPage => ({
      getPath: () => `/optout/unsubscribe/${id}` as string,
      title: `Désinscription à l'opt out`,
    }),
    adminProcessorJob: (name: string): IPage => ({
      getPath: () => `/espace-pro/administration/processeur/job/${name}`,
      index: false,
      title: `Job ${name}`,
    }),
    adminProcessorJobInstance: (props: { name: string; id: string }): IPage => ({
      getPath: () => `/espace-pro/administration/processeur/job/${props.name}/${props.id}`,
      index: false,
      title: `Tâche Job ${props.id}`,
    }),
    adminProcessorCron: (name: string): IPage => ({
      getPath: () => `/espace-pro/administration/processeur/cron/${name}`,
      index: false,
      title: `CRON ${name}`,
    }),
    adminProcessorCronTask: (props: { name: string; id: string }): IPage => ({
      getPath: () => `/espace-pro/administration/processeur/cron/${props.name}/${props.id}`,
      index: false,
      title: `Tâche CRON ${props.id}`,
    }),
    seoVille: (villeSlug: string, villeLabel?: string): IPage => ({
      getPath: () => `/alternance/ville/${villeSlug}`,
      title: villeLabel ?? `Trouver une alternance à ${villeSlug}`,
    }),
    seoMetier: (metierSlug: string, metierLabel?: string): IPage => ({
      getPath: () => `/alternance/metier/${metierSlug}`,
      title: metierLabel ?? `Trouver une alternance en ${metierSlug}`,
    }),
    seoDiplome: (diplomeSlug: string, diplomeLabel?: string): IPage => ({
      getPath: () => `/alternance/diplome/${diplomeSlug}`,
      title: diplomeLabel ?? `${diplomeSlug} en alternance`,
    }),
  },
  notion: {},
} as const satisfies IPages
