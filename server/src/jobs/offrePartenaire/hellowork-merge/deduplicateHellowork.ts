import type { ObjectId } from "mongodb"
import { distance as stringDistance } from "fastest-levenshtein"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { logger } from "@/common/logger"

type AggregateResult = {
  _id: ObjectId
  refBuddi: string
  idHellowork: ObjectId
  refHellowork: string
  siret?: string
}

export async function deduplicateHellowork() {
  logger.info("start mergeHelloworkFlux")

  logger.info("adding ref_start to raw_hellowork")
  await getDbCollection("raw_hellowork")
    .aggregate([
      {
        $addFields: {
          ref_start: {
            $substr: ["$job.reference", 0, 8],
          },
        },
      },
      {
        $project: {
          ref_start: 1,
        },
      },
      {
        $merge: {
          into: "raw_hellowork",
          on: "_id",
          whenNotMatched: "fail",
        },
      },
    ])
    .toArray()

  logger.info("adding ref_start to raw_hellowork_buddi")
  await getDbCollection("raw_hellowork_buddi")
    .aggregate([
      {
        $addFields: {
          ref_start: {
            $substr: ["$job.reference", 0, 8],
          },
        },
      },
      {
        $project: {
          ref_start: 1,
        },
      },
      {
        $merge: {
          into: "raw_hellowork_buddi",
          on: "_id",
          whenNotMatched: "fail",
        },
      },
    ])
    .toArray()

  logger.info("looking for duplicates")
  const doublons: AggregateResult[] = (await getDbCollection("raw_hellowork_buddi")
    .aggregate([
      {
        $lookup: {
          from: "raw_hellowork",
          localField: "ref_start",
          foreignField: "ref_start",
          as: "hellowork",
        },
      },
      {
        $unwind: "$hellowork",
      },
      {
        $project: {
          _id: 1,
          refBuddi: "$job.reference",
          refHellowork: "$hellowork.job.reference",
          idHellowork: "$hellowork._id",
          siret: "$hellowork.job.siret",
        },
      },
    ])
    .toArray()) as AggregateResult[]

  logger.info("duplicates", doublons.length)
  const doublonsASupprimer = doublons.filter(({ refBuddi, refHellowork }) => {
    const distance = stringDistance(refBuddi, refHellowork)
    const isValid = distance <= 10
    if (!isValid) {
      logger.warn("detected high string distance between hellowork references", { refBuddi, refHellowork, distance })
    }
    return isValid
  })
  if (doublonsASupprimer.length) {
    const deleteResult = await getDbCollection("raw_hellowork").deleteMany({
      _id: { $in: doublonsASupprimer.map((x) => x.idHellowork) },
    })
    logger.info("deleted", deleteResult.deletedCount, "offers in raw_hellowork")

    const writeResult = await getDbCollection("raw_hellowork_buddi").bulkWrite(
      doublonsASupprimer.flatMap(({ _id, siret }) => {
        if (!siret) {
          return []
        }
        return [
          {
            updateOne: {
              filter: { _id, "job.siret": null },
              update: {
                $set: {
                  "job.siret": siret,
                },
              },
            },
          },
        ]
      }),
      {
        ordered: false,
      }
    )
    logger.info("updated", writeResult.modifiedCount, "sirets in raw_hellowork_buddi")
  }

  logger.info("end mergeHelloworkFlux")
}
