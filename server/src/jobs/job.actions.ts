import { MatchKeysAndValues, ObjectId, FilterQuery, FindOneOptions } from "mongodb"

import { IInternalJobs } from "@/common/model/schema/internalJobs/internalJobs.types"
import { db } from "@/common/mongodb"

type CreateJobParam = Pick<IInternalJobs, "name" | "type" | "cron_string" | "payload" | "scheduled_for" | "sync">

/**
 * Création d'un job
 */
export const createJob = async ({ name, type = "simple", payload, scheduled_for = new Date(), sync = false, cron_string }: CreateJobParam): Promise<IInternalJobs> => {
  const job: Omit<IInternalJobs, "_id"> = {
    name,
    type,
    status: sync ? "will_start" : "pending",
    ...(payload ? { payload } : {}),
    ...(cron_string ? { cron_string } : {}),
    updated_at: new Date(),
    created_at: new Date(),
    scheduled_for,
    sync,
  }
  const { insertedId: _id } = await db.collection("internalJobs").insertOne(job)
  return { ...job, _id }
}

export const findJob = async (filter: FilterQuery<IInternalJobs>, options?: FindOneOptions<IInternalJobs>): Promise<IInternalJobs | null> => {
  return await db.collection("internalJobs").findOne(filter, options)
}

export const findJobs = async (filter: FilterQuery<IInternalJobs>, options?: FindOneOptions<IInternalJobs>): Promise<IInternalJobs[]> => {
  return await db.collection("internalJobs").find(filter, options).toArray()
}

/**
 * Mise à jour d'un job
 */
export const updateJob = async (_id: ObjectId, data: MatchKeysAndValues<IInternalJobs>) => {
  return db.collection("internalJobs").updateOne({ _id }, { $set: { ...data, updated_at: new Date() } })
}
