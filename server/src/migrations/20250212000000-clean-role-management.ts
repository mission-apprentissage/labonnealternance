import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  const docWithIds = await getDbCollection("rolemanagements")
    .aggregate([
      {
        $lookup: {
          from: "userswithaccounts",
          foreignField: "_id",
          localField: "user_id",
          as: "user",
        },
      },
      {
        $match: {
          "user.0": { $exists: false },
        },
      },
      {
        $project: {
          _id: 1,
        },
      },
    ])
    .toArray()
  const ids = docWithIds.map((doc) => doc._id)
  const result = await getDbCollection("rolemanagement360").deleteMany({ _id: { $in: ids } })
  console.log("20250212000000-clean-role-management: deleted count=", result.deletedCount)
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
