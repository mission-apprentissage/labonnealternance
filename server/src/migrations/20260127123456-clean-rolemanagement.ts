import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  const docWithIds = await getDbCollection("rolemanagements")
    .aggregate([
      {
        $lookup: {
          from: "userswithaccounts",
          localField: "user_id",
          foreignField: "_id",
          as: "users",
        },
      },
      {
        $match: {
          users: { $size: 0 },
        },
      },
      {
        $project: {
          _id: 1,
        },
      },
    ])
    .toArray()
  const objectIds = docWithIds.map(({ _id }) => _id)
  await getDbCollection("rolemanagements").deleteMany({ _id: { $in: objectIds } })
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
