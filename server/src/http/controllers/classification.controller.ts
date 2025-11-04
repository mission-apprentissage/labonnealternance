import { zRoutes } from "shared"

import type { Server } from "@/http/server"
import { getDbCollection } from "@/common/utils/mongodbUtils"

type IModelTraining = {
  label: string
  workplace_name: string
  workplace_description: string
  offer_title: string
  offer_description: string
}

export const classificationRoutes = (app: Server) => {
  app.get("/classification", { schema: zRoutes.get["/classification"] }, async (_, res) => {
    const result = (await getDbCollection("cache_classification")
      .aggregate([
        {
          $match: {
            human_verification: { $nin: [null, ""] },
          },
        },
        {
          $lookup: {
            from: "jobs_partners",
            localField: "partner_job_id",
            foreignField: "partner_job_id",
            as: "job",
          },
        },
        { $unwind: "$job" },
        {
          $project: {
            _id: 0,
            label: "$human_verification",
            workplace_name: "$job.workplace_name",
            workplace_description: "$job.workplace_description",
            offer_title: "$job.offer_title",
            offer_description: "$job.offer_description",
          },
        },
      ])
      .toArray()) as IModelTraining[]

    return res.status(200).send(result)
  })
}
