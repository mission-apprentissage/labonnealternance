import { badRequest } from "@hapi/boom"
import type { AnyBulkWriteOperation } from "mongodb"
import type { IEligibleTrainingsForAppointment } from "shared"
import { zRoutes } from "shared/index"
import type { IReferrerName } from "shared/models/elligible-training.model"
import type { IETFABulkOperation } from "shared/routes/eligible-trainings-for-appointment.routes"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import type { Server } from "@/http/server"
import { applyReferrerOverrides, loadDiffusionContexts } from "@/services/referrers-diffusion.service"

const upsertCustomEmails = async (entries: { cle_ministere_educatif: string; email: string }[]) => {
  if (!entries.length) return
  await getDbCollection("customemailetfas").bulkWrite(
    entries.map(({ cle_ministere_educatif, email }) => ({
      updateOne: { filter: { cle_ministere_educatif }, update: { $set: { email, cle_ministere_educatif } }, upsert: true },
    })),
    { ordered: false }
  )
}

const withoutReferrer = (list: IReferrerName[], referrer: IReferrerName) => list.filter((item) => item !== referrer)
const withReferrer = (list: IReferrerName[], referrer: IReferrerName) => (list.includes(referrer) ? list : [...list, referrer])
const sameList = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((item) => b.includes(item))

const setReferrers = async (ids: IEligibleTrainingsForAppointment["_id"][], changes: Extract<IETFABulkOperation, { type: "set_referrers" }>["changes"]) => {
  const parameters = await getDbCollection("eligible_trainings_for_appointments")
    .find({ _id: { $in: ids } })
    .toArray()
  const contextOf = await loadDiffusionContexts(parameters)
  let skipped = 0

  const operations: AnyBulkWriteOperation<IEligibleTrainingsForAppointment>[] = parameters.flatMap((parameter) => {
    const { auto, eligible } = contextOf(parameter)
    let forcedOn = parameter.referrers_forced_on ?? []
    let forcedOff = parameter.referrers_forced_off ?? []

    for (const { referrer, mode } of changes) {
      if (mode === "auto") {
        forcedOn = withoutReferrer(forcedOn, referrer)
        forcedOff = withoutReferrer(forcedOff, referrer)
      } else if (!eligible.includes(referrer)) {
        skipped++
      } else if (mode === "on") {
        forcedOn = withReferrer(forcedOn, referrer)
        forcedOff = withoutReferrer(forcedOff, referrer)
      } else {
        forcedOff = withReferrer(forcedOff, referrer)
        forcedOn = withoutReferrer(forcedOn, referrer)
      }
    }

    const nextReferrers = applyReferrerOverrides({ auto, eligible, forcedOn, forcedOff })
    const unchanged =
      sameList(forcedOn, parameter.referrers_forced_on ?? []) && sameList(forcedOff, parameter.referrers_forced_off ?? []) && sameList(nextReferrers, parameter.referrers ?? [])
    if (unchanged) return []
    return [
      {
        updateOne: {
          filter: { _id: parameter._id },
          update: { $set: { referrers: nextReferrers, referrers_forced_on: forcedOn, referrers_forced_off: forcedOff } },
        },
      },
    ]
  })

  if (operations.length) await getDbCollection("eligible_trainings_for_appointments").bulkWrite(operations, { ordered: false })
  return { updated: operations.length, skipped }
}

export default (server: Server) => {
  server.get(
    "/admin/eligible-trainings-for-appointment/etablissement-formateur-siret/:siret",
    {
      schema: zRoutes.get["/admin/eligible-trainings-for-appointment/etablissement-formateur-siret/:siret"],
      onRequest: [server.auth(zRoutes.get["/admin/eligible-trainings-for-appointment/etablissement-formateur-siret/:siret"])],
    },
    async (req, res) => {
      const { siret } = req.params

      const parameters = await getDbCollection("eligible_trainings_for_appointments").find({ etablissement_formateur_siret: siret }).toArray()

      if (parameters == undefined || parameters.length == 0) {
        throw badRequest()
      }

      const contextOf = await loadDiffusionContexts(parameters)

      return res.send({
        parameters: parameters.map((parameter) => {
          const { auto, eligible } = contextOf(parameter)
          return { ...parameter, referrers_auto: auto, referrers_eligible: eligible }
        }),
      })
    }
  )

  server.patch(
    "/admin/eligible-trainings-for-appointment",
    {
      schema: zRoutes.patch["/admin/eligible-trainings-for-appointment"],
      onRequest: [server.auth(zRoutes.patch["/admin/eligible-trainings-for-appointment"])],
    },
    async ({ body: { ids, operation } }, res) => {
      const collection = getDbCollection("eligible_trainings_for_appointments")

      if (operation.type === "set_email") {
        const parameters = await collection.find({ _id: { $in: ids } }, { projection: { cle_ministere_educatif: 1 } }).toArray()
        const result = await collection.updateMany({ _id: { $in: ids } }, { $set: { lieu_formation_email: operation.email, is_lieu_formation_email_customized: true } })
        await upsertCustomEmails(parameters.map(({ cle_ministere_educatif }) => ({ cle_ministere_educatif, email: operation.email })))
        return res.send({ updated: result.modifiedCount, skipped: 0 })
      }

      if (operation.type === "reset_email") {
        // L'e-mail reste en place jusqu'à la synchronisation de nuit, qui le recalcule depuis le catalogue.
        const result = await collection.updateMany({ _id: { $in: ids }, is_lieu_formation_email_customized: true }, { $set: { is_lieu_formation_email_customized: false } })
        return res.send({ updated: result.modifiedCount, skipped: 0 })
      }

      return res.send(await setReferrers(ids, operation.changes))
    }
  )

  server.patch(
    "/admin/eligible-trainings-for-appointment/:id",
    {
      schema: zRoutes.patch["/admin/eligible-trainings-for-appointment/:id"],
      onRequest: [server.auth(zRoutes.patch["/admin/eligible-trainings-for-appointment/:id"])],
    },
    async ({ body, params }, res) => {
      if (body.is_lieu_formation_email_customized && body.lieu_formation_email && body.cle_ministere_educatif) {
        await upsertCustomEmails([{ cle_ministere_educatif: body.cle_ministere_educatif, email: body.lieu_formation_email }])
      }
      const result = await getDbCollection("eligible_trainings_for_appointments").findOneAndUpdate({ _id: params.id }, { $set: { ...body } }, { returnDocument: "after" })

      res.send(result)
    }
  )
}
