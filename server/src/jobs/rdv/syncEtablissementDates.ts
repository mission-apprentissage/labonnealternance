import { isEmpty } from "lodash-es"
import { IEtablissement } from "shared"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { notifyToSlack } from "../../common/utils/slackUtils"

function findEarliestDates(objectsArray) {
  const earliestDates = {}

  objectsArray.forEach((obj) => {
    Object.keys(obj).forEach((key) => {
      if (obj[key] instanceof Date) {
        if (!earliestDates[key] || obj[key] < earliestDates[key]) {
          earliestDates[key] = obj[key]
        }
      }
    })
  })

  if (Object.keys(earliestDates).length === 0) {
    return null
  }

  return earliestDates
}

type IEtablissementByGestionnaireSiret = Array<{
  _id: string
  documents: Array<
    Partial<
      Pick<
        IEtablissement,
        | "optout_activation_date"
        | "optout_activation_scheduled_date"
        | "optout_invitation_date"
        | "optout_refusal_date"
        | "premium_activation_date"
        | "premium_invitation_date"
        | "premium_refusal_date"
        | "premium_affelnet_activation_date"
        | "premium_affelnet_invitation_date"
        | "premium_affelnet_refusal_date"
        | "premium_follow_up_date"
        | "premium_affelnet_follow_up_date"
      >
    >
  >
}>

export const syncEtablissementDates = async () => {
  const etablissementByGestionnaireSiret: IEtablissementByGestionnaireSiret = (await getDbCollection("etablissements")
    .aggregate([
      {
        $group: {
          _id: "$gestionnaire_siret",
          documents: { $push: "$$ROOT" },
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
      {
        $project: {
          _id: 1,
          documents: {
            $map: {
              input: "$documents",
              as: "doc",
              in: {
                _id: "$$doc._id",
                premium_invitation_date: "$$doc.premium_invitation_date",
                premium_activation_date: "$$doc.premium_activation_date",
                premium_refusal_date: "$$doc.premium_refusal_date",
                premium_follow_up_date: "$$doc.premium_follow_up_date",
                premium_affelnet_invitation_date: "$$doc.premium_affelnet_invitation_date",
                premium_affelnet_activation_date: "$$doc.premium_affelnet_activation_date",
                premium_affelnet_refusal_date: "$$doc.premium_affelnet_refusal_date",
                premium_affelnet_follow_up_date: "$$doc.premium_affelnet_follow_up_date",
                optout_invitation_date: "$$doc.optout_invitation_date",
                optout_activation_date: "$$doc.optout_activation_date",
                optout_activation_scheduled_date: "$$doc.optout_activation_scheduled_date",
                optout_refusal_date: "$$doc.optout_refusal_date",
              },
            },
          },
        },
      },
    ])
    .toArray()) as IEtablissementByGestionnaireSiret

  if (etablissementByGestionnaireSiret.length) {
    for await (const etablissement of etablissementByGestionnaireSiret) {
      const earliestDates = findEarliestDates(etablissement.documents)
      if (!isEmpty(earliestDates)) {
        await getDbCollection("etablissements").updateMany({ gestionnaire_siret: etablissement._id }, { $set: earliestDates })
      }
    }
  }

  await notifyToSlack({ subject: "RDVA - SYNCHRONISATION DATE ETABLISSEMENT", message: `${etablissementByGestionnaireSiret.length} etablissement(s) gestionnaire mis à jour` })
}
