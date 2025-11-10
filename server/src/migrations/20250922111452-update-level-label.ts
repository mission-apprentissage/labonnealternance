import { Writable } from "node:stream"
import { pipeline } from "node:stream/promises"

import type { IRecruiter } from "shared"

import { getDbCollection } from "@/common/utils/mongodbUtils"

const levelsMap = [
  { from: "Indifférent", to: "Indifférent" },
  { from: "Cap, autres formations niveau (Infrabac)", to: "Cap, autres formations (Infrabac)" },
  { from: "BP, Bac, autres formations niveau (Bac)", to: "BP, Bac, autres formations (Bac)" },
  { from: "BTS, DEUST, autres formations niveau (Bac+2)", to: "BTS, DEUST, autres formations (Bac+2)" },
  { from: "Licence, Maîtrise, autres formations niveau (Bac+3 à Bac+4)", to: "Licence, Maîtrise, autres formations (Bac+3 à Bac+4)" },
  { from: "Master, titre ingénieur, autres formations niveau (Bac+5)", to: "Master, titre ingénieur, autres formations (Bac+5)" },
]

const getNewLevelLabel = (level) => {
  const newLevel = levelsMap.find((x) => x.from === level)?.to
  if (!newLevel) return level
  return newLevel
}

export const up = async () => {
  for (const level of levelsMap) {
    const { from, to } = level
    await getDbCollection("jobs_partners").updateMany({ "offer_target_diploma.label": from }, { $set: { "offer_target_diploma.label": to } })
  }

  const cursor = await getDbCollection("recruiters").find({}).stream()
  const transform = new Writable({
    objectMode: true,
    async write(recruiter: IRecruiter, _encoding, callback) {
      const { jobs } = recruiter
      const jobsToUpdate = jobs.map((job) => {
        return {
          ...job,
          job_level_label: getNewLevelLabel(job.job_level_label),
        }
      })
      // @ts-ignore
      await getDbCollection("recruiters").updateOne({ _id: recruiter._id }, { $set: { jobs: jobsToUpdate } })
      callback()
    },
  })

  await pipeline(cursor, transform)
}

export const requireShutdown: boolean = true
