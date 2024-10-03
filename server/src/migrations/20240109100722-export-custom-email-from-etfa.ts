import { ObjectId } from "mongodb"
import { ICustomEmailETFA } from "shared/models"

import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  const emailCustom = await getDbCollection("eligible_trainings_for_appointments")
    .find(
      { is_lieu_formation_email_customized: true },
      {
        projection: {
          lieu_formation_email: 1,
          cle_ministere_educatif: 1,
          _id: 0,
        },
      }
    )
    .toArray()

  await asyncForEach(emailCustom, async (custom) => {
    const newCustomMailETFA: ICustomEmailETFA = {
      _id: new ObjectId(),
      cle_ministere_educatif: custom.cle_ministere_educatif,
      email: custom.lieu_formation_email as string,
    }
    await getDbCollection("customemailetfas").insertOne(newCustomMailETFA)
  })
}
