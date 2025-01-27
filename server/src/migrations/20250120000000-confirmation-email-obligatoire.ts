import { VALIDATION_UTILISATEUR } from "shared/constants"
import { IUserStatusEvent, IUserWithAccount, UserEventType } from "shared/models"

import { deduplicateBy } from "@/common/utils/array"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  console.info("start 20250120000000-confirmation-email-obligatoire")

  const documents = await getDbCollection("recruiters")
    .aggregate([
      {
        $match: {
          "jobs.job_status": "Active",
        },
      },
      {
        $addFields: {
          managed_by_object_id: {
            $convert: {
              input: "$managed_by",
              to: "objectId",
            },
          },
        },
      },
      {
        $lookup: {
          from: "userswithaccounts",
          localField: "managed_by_object_id",
          foreignField: "_id",
          as: "users",
        },
      },
      {
        $match: {
          "users.0": { $exists: true },
        },
      },
      {
        $match: {
          "users.0.status": {
            $not: {
              $elemMatch: {
                status: "VALIDATION_EMAIL",
              },
            },
          },
        },
      },
    ])
    .toArray()
  const event: IUserStatusEvent = {
    date: new Date(),
    status: UserEventType.VALIDATION_EMAIL,
    validation_type: VALIDATION_UTILISATEUR.AUTO,
    reason: "migration: la confirmation de l'email est maintenant requise pour publier une offre (lbac-2198)",
  }
  const users: IUserWithAccount[] = documents.map((doc) => doc.users[0])
  const uniqueUsers = deduplicateBy(users, (user) => user._id.toString())
  const writes = uniqueUsers.map((user) => {
    return {
      updateOne: {
        filter: { _id: user._id },
        update: { $push: { status: event }, $set: { updatedAt: new Date() } },
      },
    }
  })
  console.info(`mise à jour de ${uniqueUsers.length} users`)
  if (writes.length) {
    await getDbCollection("userswithaccounts").bulkWrite(writes)
  }
  console.info("end 20250120000000-confirmation-email-obligatoire")
}
