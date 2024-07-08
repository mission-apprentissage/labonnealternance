import { AccessEntityType, ZRoleManagement } from "shared/models"
import cfaModel, { zCFA } from "shared/models/cfa.model"
import entrepriseModel, { ZEntreprise } from "shared/models/entreprise.model"
import userWithAccountModel, { ZUserWithAccount } from "shared/models/userWithAccount.model"

import { logger } from "@/common/logger"
import { getDatabase, getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"

export const createRoleManagement360 = async () => {
  logger.info("Creating roleManagement360 collection...")
  const destCollectionName = "rolemanagement360"
  await getDbCollection("rolemanagements")
    .aggregate([
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
      {
        $project: Object.fromEntries([
          ...Object.keys(ZRoleManagement.shape).map((field) => [`role_${field}`, `$${field}`]),
          ...Object.keys(ZUserWithAccount.shape).map((field) => [`user_${field}`, `$user.${field}`]),
          ...Object.keys(ZEntreprise.shape).map((field) => [`entreprise_${field}`, `$entreprise.${field}`]),
          ...Object.keys(zCFA.shape).map((field) => [`cfa_${field}`, `$cfa.${field}`]),
        ]),
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
