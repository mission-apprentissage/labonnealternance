import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  logger.info(`[20260318120000-fill-entreprises-managed-by-cfa] starting`)

  await getDbCollection("recruiters")
    .aggregate([
      {
        $match: {
          cfa_delegated_siret: { $ne: null },
          managed_by: { $ne: null },
        },
      },
      {
        $lookup: {
          from: "cfas",
          localField: "cfa_delegated_siret",
          foreignField: "siret",
          as: "cfa",
        },
      },
      {
        $unwind: "$cfa",
      },
      {
        $lookup: {
          from: "entreprises",
          localField: "establishment_siret",
          foreignField: "siret",
          as: "entreprise",
        },
      },
      {
        $unwind: "$entreprise",
      },
      {
        $project: {
          _id: 1,
          first_name: 1,
          last_name: 1,
          phone: 1,
          email: 1,
          origin: 1,
          entreprise_id: "$entreprise._id",
          cfa_id: "$cfa._id",
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $group: {
          _id: {
            entreprise_id: "$entreprise_id",
            cfa_id: "$cfa_id",
          },
          id: { $first: "$_id" },
          first_name: { $first: "$first_name" },
          last_name: { $first: "$last_name" },
          phone: { $first: "$phone" },
          email: { $first: "$email" },
          origin: { $first: "$origin" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
        },
      },
      {
        $project: {
          _id: "$id",
          first_name: 1,
          last_name: 1,
          phone: 1,
          email: 1,
          origin: 1,
          entreprise_id: "$_id.entreprise_id",
          cfa_id: "$_id.cfa_id",
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $merge: "entreprise_managed_by_cfa",
      },
    ])
    .toArray()

  logger.info(`[20260318120000-fill-entreprises-managed-by-cfa] completed.`)
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
