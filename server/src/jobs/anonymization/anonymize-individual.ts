import { internal } from "@hapi/boom"
import type { ObjectId } from "mongodb"
import type { IRgpdErasureMode, IRgpdUserType } from "shared/models/rgpd-erasure.model"
import { RGPD_ERASURE_MODE, RGPD_ERASURE_STATUS, RGPD_USER_TYPE } from "shared/models/rgpd-erasure.model"

import { eraseRgpdUser, getAccountRgpdUserType } from "@/services/rgpd-erasure/rgpd-erasure.service"

import { anonymizeAppointments } from "./anonymize-appointments"

/**
 * Effacement unitaire depuis la CLI, par identifiant : même service que le back-office
 * (POST /admin/rgpd/erase), avec la même trace dans rgpd_erasures.
 */
export async function anonymizeIndividual({ collection, id, mode = RGPD_ERASURE_MODE.ANONYMIZE }: { collection: string; id: ObjectId; mode?: IRgpdErasureMode }): Promise<void> {
  if (!Object.values<string>(RGPD_ERASURE_MODE).includes(mode)) {
    throw new Error(`mode ${mode} inconnu, attendu : ${Object.values(RGPD_ERASURE_MODE).join(" ou ")}`)
  }
  let userType: IRgpdUserType
  switch (collection) {
    case "applications":
      userType = RGPD_USER_TYPE.CANDIDAT
      break
    case "users":
      userType = RGPD_USER_TYPE.CANDIDAT_RDVA
      break
    case "userrecruteurs":
      userType = await getAccountRgpdUserType(id)
      break
    case "appointments":
      await anonymizeAppointments({ _id: id })
      return
    default:
      throw new Error(`collection ${collection} unsupported`)
  }

  const report = await eraseRgpdUser({ userType, query: { id }, mode, requestRef: null, requestedBy: null })
  // Code de sortie non nul : un effacement incomplet ne doit pas passer pour un succès en CLI.
  if (report.status !== RGPD_ERASURE_STATUS.DONE) {
    throw internal(`anonymize-individual : effacement ${report.status}, reprise possible après correction (audit ${report.audit_id})`, { failures: report.failures })
  }
}
export default anonymizeIndividual
