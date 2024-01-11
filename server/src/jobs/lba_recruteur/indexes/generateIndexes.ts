import { captureException } from "@sentry/node"

import { logger } from "../../../common/logger"
import { Recruiter } from "../../../common/model/index"
import { rebuildIndex } from "../../../common/utils/esUtils"

export const generateIndexes = async (payload: { index_list?: string; recreate?: boolean }) => {
  const indexList = payload?.index_list ?? "recruiters"
  const recreate = payload?.recreate ?? false
  const list = indexList.split(",")

  const results = await Promise.allSettled(
    list.map(async (index) => {
      switch (index) {
        case "recruiters": {
          await Recruiter.syncIndexes()
          await rebuildIndex(Recruiter, { skipNotFound: true, recreate })
          break
        }
        default: {
          logger.error(`Attention l'index "${index}" ne fait pas partie de la liste elligible : recruiters`)
          break
        }
      }
    })
  )
  const errors = results.reduce((acc, item) => {
    if (item.status === "rejected") {
      acc.push(item.reason)
      logger.error(item.reason)
      captureException(item.reason)
    }
    return acc
  }, [] as Error[])
  if (errors.length) {
    throw new AggregateError(errors, `generateIndexes failed with ${errors.length} errors`)
  }
}
