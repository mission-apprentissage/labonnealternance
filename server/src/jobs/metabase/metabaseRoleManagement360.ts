import type { ICFA } from "shared/models/cfa.model"
import cfaModel, { zCFA } from "shared/models/cfa.model"
import type { IEntreprise } from "shared/models/entreprise.model"
import entrepriseModel, { ZEntreprise } from "shared/models/entreprise.model"
import type { IRoleManagement } from "shared/models/index"
import { AccessEntityType, ZRoleManagement } from "shared/models/index"
import roleManagement360Model from "shared/models/roleManagement360.model"
import type { IUserWithAccount } from "shared/models/userWithAccount.model"
import userWithAccountModel, { ZUserWithAccount } from "shared/models/userWithAccount.model"

import { logger } from "@/common/logger"
import { getDatabase, getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"

export const roleManagement360AggregationStages = [
  { $match: { authorized_type: { $in: [AccessEntityType.CFA, AccessEntityType.ENTREPRISE] } } },
  {
    $addFields: {
      authorized_object_id: { $convert: { input: "$authorized_id", to: "objectId" } },
    },
  },
  {
    $lookup: {
      from: userWithAccountModel.collectionName,
      foreignField: "_id",
      localField: "user_id",
      as: "user",
    },
  },
  { $unwind: "$user" },
  {
    $lookup: {
      from: entrepriseModel.collectionName,
      foreignField: "_id",
      localField: "authorized_object_id",
      as: "entrepriseArray",
    },
  },
  {
    $lookup: {
      from: cfaModel.collectionName,
      foreignField: "_id",
      localField: "authorized_object_id",
      as: "cfaArray",
    },
  },
  {
    $addFields: {
      entreprise: { $first: "$entrepriseArray" },
      cfa: { $first: "$cfaArray" },
    },
  },
  {
    $unset: ["entrepriseArray", "cfaArray"],
  },
]

export type RoleManagement360Document = IRoleManagement & {
  entreprise?: IEntreprise
  cfa?: ICFA
  user: IUserWithAccount
}

export const createRoleManagement360 = async () => {
  logger.info("Creating roleManagement360 collection...")
  const destCollectionName = roleManagement360Model.collectionName
  await getDbCollection("rolemanagements")
    .aggregate([
      ...roleManagement360AggregationStages,
      {
        $project: Object.fromEntries([
          ...Object.keys(ZRoleManagement.shape).map((field) => [`role_${field}`, `$${field}`]),
          ...Object.keys(ZUserWithAccount.shape).map((field) => [`user_${field}`, `$user.${field}`]),
          ...Object.keys(ZEntreprise.shape).map((field) => [`entreprise_${field}`, `$entreprise.${field}`]),
          ...Object.keys(zCFA.shape).map((field) => [`cfa_${field}`, `$cfa.${field}`]),
        ]),
      },
      {
        $addFields: {
          user_last_status: { $last: "$user_status.status" },
          role_last_status: { $last: "$role_status.status" },
          entreprise_last_status: { $last: "$entreprise_status.status" },
        },
      },
      { $out: destCollectionName },
    ])
    .toArray()
  const destCount = await getDatabase().collection(destCollectionName).countDocuments({})
  await notifyToSlack({
    subject: `Génération de la collection ${destCollectionName}`,
    message: `${destCollectionName} created with ${destCount} documents.`,
    error: destCount <= 0,
  })
  logger.info("roleManagement360 collection created")
}
