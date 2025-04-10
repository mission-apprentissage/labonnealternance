import anonymizedRecruitersModel from "shared/models/anonymizedRecruiters.model"
import recruiterModel from "shared/models/recruiter.model"
import userWithAccountModel from "shared/models/userWithAccount.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  const usersToAnonymize = await getDbCollection(recruiterModel.collectionName)
    .aggregate([
      {
        $lookup: {
          from: userWithAccountModel.collectionName,
          let: {
            managedByStr: "$managed_by",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    "$_id",
                    {
                      $toObjectId: "$$managedByStr",
                    },
                  ],
                },
              },
            },
          ],
          as: "userRef",
        },
      },
      {
        $match: {
          userRef: {
            $size: 0,
          },
        },
      },
      {
        $project: {
          _id: 1,
        },
      },
    ])
    .toArray()

  const userIds = usersToAnonymize.map(({ _id }) => _id)
  const recruiterQuery = { managed_by: { $in: userIds } }

  await getDbCollection(recruiterModel.collectionName)
    .aggregate([
      {
        $match: recruiterQuery,
      },
      {
        $project: {
          establishment_id: 1,
          establishment_raison_sociale: 1,
          establishment_enseigne: 1,
          establishment_siret: 1,
          address_detail: 1,
          address: 1,
          geo_coordinates: 1,
          is_delegated: 1,
          cfa_delegated_siret: 1,
          jobs: 1,
          origin: 1,
          opco: 1,
          idcc: 1,
          status: 1,
          naf_code: 1,
          naf_label: 1,
          establishment_size: 1,
          establishment_creation_date: 1,
        },
      },
      {
        $merge: anonymizedRecruitersModel.collectionName,
      },
    ])
    .toArray()
  await getDbCollection(recruiterModel.collectionName).deleteMany(recruiterQuery)
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
