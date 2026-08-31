import { internal } from "@hapi/boom"
import { MongoServerError, ObjectId } from "mongodb"
import type { CFA } from "shared/constants/index"
import { ENTREPRISE, OPCOS_LABEL } from "shared/constants/index"
import type { ICFA } from "shared/models/cfa.model"
import type { IEntreprise } from "shared/models/entreprise.model"
import { EntrepriseStatus } from "shared/models/entreprise.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { HandiEngagement } from "shared/models/referentiel-engagement-entreprise.model"
import { EntrepriseEngagementSources, HANDI_ENGAGEMENT_OUI } from "shared/models/referentiel-engagement-entreprise.model"
import type { IRoleManagement } from "shared/models/role-management.model"
import { AccessEntityType, AccessStatus } from "shared/models/role-management.model"
import type { IUserWithAccount } from "shared/models/user-with-account.model"
import { getLastStatusEvent, isEnum } from "shared/utils/index"
import { asyncForEach } from "@/common/utils/async-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import type { getEntrepriseDataFromSiret } from "./etablissement.service"
import { autoValidateUserRoleOnCompany, sendEmailConfirmationEntreprise } from "./etablissement.service"
import { checkForJobActivations } from "./formulaire.service"
import { deactivateEntreprise, setEntrepriseInError, setEntrepriseValid } from "./user-recruteur.service"

export type Organization = { entreprise: IEntreprise; type: typeof ENTREPRISE } | { cfa: ICFA; type: typeof CFA }
export type UserAndOrganization = { user: IUserWithAccount; organization: Organization }

export const updateEntrepriseOpco = async (siret: string, { opco, idcc }: { opco: OPCOS_LABEL; idcc: number | null }) => {
  const entreprise = await getDbCollection("entreprises").findOne({ siret })
  if (!entreprise) {
    throw new Error("inattendu: aucune entreprise trouvée. Merci d'appeler cette méthode une fois l'entreprise créée")
  }
  if (!isKnownOpco(entreprise.opco)) {
    await getDbCollection("entreprises").findOneAndUpdate({ siret }, { $set: { opco, idcc } })
    return { opco, idcc }
  }
  return { opco: entreprise.opco, idcc: entreprise.idcc }
}

/**
 * Enregistre le choix de l'entreprise, exprimé à la création de compte, de valoriser (ou non) son
 * engagement en faveur de l'emploi des personnes en situation de handicap.
 *
 * Seul un choix "oui" a un effet : il alimente `referentiel_engagement_entreprise` (source LBA).
 * L'équipe LBA transmettra l'information à FT pour concrétisation.
 */
export const updateEntrepriseHandiEngagement = async (siret: string, handiEngagement: HandiEngagement) => {
  if (handiEngagement !== HANDI_ENGAGEMENT_OUI) {
    return
  }

  const now = new Date()
  const filter = { siret }
  const update = {
    $addToSet: { sources: EntrepriseEngagementSources.LBA },
    $set: { updated_at: now, engagement: "handicap" as const },
    $setOnInsert: { _id: new ObjectId(), created_at: now, siret },
  }
  try {
    await getDbCollection("referentiel_engagement_entreprise").updateOne(filter, update, { upsert: true })
  } catch (err) {
    // E11000 : deux requêtes concurrentes sans document existant pour ce siret peuvent toutes deux tenter
    // l'insert de l'upsert ; l'index unique sur siret en fait échouer une. Le document existe désormais
    // (créé par l'autre requête) : on retombe sur un simple update, sans upsert.
    if (err instanceof MongoServerError && err.code === 11000) {
      await getDbCollection("referentiel_engagement_entreprise").updateOne(filter, update)
    } else {
      throw err
    }
  }
}

/**
 * Appelée par modifyPermissionToUser à chaque transition réelle d'un rôle vers GRANTED (quel que soit le
 * chemin : auto-validation, activation admin/OPCO, création directe).
 *
 * `role.handiEngagement` est le choix déclaré à la création du compte (cf. ZRoleManagement), jamais
 * réécrit depuis — on ne l'applique au référentiel qu'ici, une fois le rôle effectivement validé, pour ne
 * pas enregistrer un engagement pour un compte jamais activé (cf. updateEntrepriseHandiEngagement, qui
 * est elle-même un no-op si `handiEngagement` n'est pas "oui").
 */
export const applyPendingHandiEngagementIfGranted = async (role: Pick<IRoleManagement, "authorized_id" | "authorized_type" | "handiEngagement">) => {
  if (role.authorized_type !== AccessEntityType.ENTREPRISE || !role.handiEngagement) {
    return
  }
  const entreprise = await getDbCollection("entreprises").findOne({ _id: new ObjectId(role.authorized_id) })
  if (!entreprise) {
    // Ne devrait jamais arriver : l'entreprise est créée avant le rôle (cf. entrepriseOnboardingWorkflow.create).
    sentryCaptureException(
      internal("applyPendingHandiEngagementIfGranted: entreprise introuvable pour un rôle GRANTED avec handiEngagement déclaré", { authorized_id: role.authorized_id })
    )
    return
  }
  await updateEntrepriseHandiEngagement(entreprise.siret, role.handiEngagement)
}

/**
 * Mets à jour l'entreprise si besoin et si possible, et renvoie l'entreprise la plus à jour possible.
 * @param siret
 * @param origin
 * @param siretResponse Réponse de la fonction getEntrepriseDataFromSiret
 * @returns renvoie l'entreprise la plus à jour possible.
 */
export const upsertEntrepriseData = async (
  siret: string,
  origin: string,
  siretResponse: Awaited<ReturnType<typeof getEntrepriseDataFromSiret>>,
  isInternalError: boolean
): Promise<IEntreprise> => {
  let existingEntreprise: IEntreprise | null = await getDbCollection("entreprises").findOne({ siret })
  if ("error" in siretResponse) {
    if (!existingEntreprise) {
      const now = new Date()
      existingEntreprise = { _id: new ObjectId(), opco: OPCOS_LABEL.UNKNOWN_OPCO, idcc: null, createdAt: now, updatedAt: now, siret, origin, status: [] }
      await getDbCollection("entreprises").insertOne(existingEntreprise)
    }
    if (isInternalError) {
      const statusToUpdate = [EntrepriseStatus.ERROR, EntrepriseStatus.A_METTRE_A_JOUR]
      const lastStatus = getLastStatusEvent(existingEntreprise.status)?.status
      if (!lastStatus || statusToUpdate.includes(lastStatus)) {
        await setEntrepriseInError(existingEntreprise._id, siretResponse.message)
      }
    } else {
      await deactivateEntreprise(existingEntreprise._id, siretResponse.message)
    }
    return (await getDbCollection("entreprises").findOne({ siret }))!
  }

  const { address, address_detail, establishment_enseigne, geo_coordinates, establishment_raison_sociale, naf_code, naf_label } = siretResponse

  const entrepriseFields: Omit<IEntreprise, "_id" | "createdAt" | "updatedAt" | "status" | "origin" | "siret" | "opco" | "idcc"> = {
    address,
    address_detail,
    enseigne: establishment_enseigne,
    geo_coordinates,
    raison_sociale: establishment_raison_sociale,
    naf_code,
    naf_label,
  }
  let savedEntreprise: IEntreprise
  if (existingEntreprise) {
    const updatedEntreprise = await getDbCollection("entreprises").findOneAndUpdate(
      { siret },
      { $set: { ...entrepriseFields, updatedAt: new Date() } },
      { returnDocument: "after" }
    )
    if (!updatedEntreprise) {
      throw internal("inattendu: aucune entreprise trouvée")
    }
    savedEntreprise = updatedEntreprise
  } else {
    const now = new Date()
    savedEntreprise = { ...entrepriseFields, opco: OPCOS_LABEL.UNKNOWN_OPCO, idcc: null, siret, origin, _id: new ObjectId(), createdAt: now, updatedAt: now, status: [] }
    await getDbCollection("entreprises").insertOne(savedEntreprise)
  }
  await setEntrepriseValid(savedEntreprise._id)

  await getDbCollection("jobs_partners").updateMany(
    {
      workplace_siret: siret,
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
    },
    {
      $set: {
        updated_at: new Date(),
        workplace_brand: establishment_enseigne,
        workplace_address_label: address ?? undefined,
        workplace_geopoint: siretResponse.geopoint,
        workplace_legal_name: establishment_raison_sociale,
        workplace_size: siretResponse.establishment_size,
        workplace_naf_code: siretResponse.naf_code,
        workplace_naf_label: siretResponse.naf_label,
      },
    }
  )

  if (getLastStatusEvent(existingEntreprise?.status)?.status === EntrepriseStatus.ERROR) {
    const roles = await getDbCollection("rolemanagements").find({ authorized_type: AccessEntityType.ENTREPRISE, authorized_id: savedEntreprise._id.toString() }).toArray()
    const rolesToUpdate = roles.filter((role) => getLastStatusEvent(role.status)?.status !== AccessStatus.DENIED)
    const users = await getDbCollection("userswithaccounts")
      .find({ _id: { $in: rolesToUpdate.map((role) => role.user_id) } })
      .toArray()
    await asyncForEach(users, async (user) => {
      const userAndOrganization: UserAndOrganization = { user, organization: { entreprise: savedEntreprise, type: ENTREPRISE } }
      const result = await autoValidateUserRoleOnCompany(userAndOrganization)
      if (result.validated) {
        await checkForJobActivations(user._id, savedEntreprise._id)
        const role = rolesToUpdate.find((role) => role.user_id.toString() === user._id.toString())
        const status = getLastStatusEvent(role?.status)?.status
        if (!status) {
          throw internal("inattendu : status du role non trouvé")
        }
        await sendEmailConfirmationEntreprise(user._id, status, EntrepriseStatus.VALIDE)
      }
    })
  }
  return savedEntreprise
}

export const isKnownOpco = (opco: OPCOS_LABEL | null) => isEnum(OPCOS_LABEL, opco) && opco !== OPCOS_LABEL.UNKNOWN_OPCO && opco !== OPCOS_LABEL.MULTIPLE_OPCO
