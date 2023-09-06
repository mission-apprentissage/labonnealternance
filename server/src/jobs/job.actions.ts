import { Filter, FindOptions, MatchKeysAndValues, ObjectId, WithoutId } from "mongodb"
import mongoose from "mongoose"

import { jobsDb } from "../model/collections"

import { IInternalJobs } from "common/model/schema/internalJobs/internalJobs.types.js"

type CreateJobParam = Pick<IInternalJobs, "name" | "type" | "cron_string" | "payload" | "scheduled_for" | "sync">

const db = mongoose.connection

/**
 * Création d'un job
 */
export const createJob = async ({ name, type = "simple", payload, scheduled_for = new Date(), sync = false, cron_string }: CreateJobParam): Promise<IInternalJobs> => {
  const job: WithoutId<IInternalJobs> = {
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

export const findJob = async (filter: Filter<IInternalJobs>, options?: FindOptions<IInternalJobs>): Promise<IInternalJobs | null> => {
  return await jobsDb().findOne(filter, options)
}

export const findJobs = async (filter: Filter<IInternalJobs>, options?: FindOptions<IInternalJobs>): Promise<IInternalJobs[]> => {
  return await jobsDb().find<IInternalJobs>(filter, options).toArray()
}

/**
 * Mise à jour d'un job
 */
export const updateJob = async (_id: ObjectId, data: MatchKeysAndValues<IInternalJobs>) => {
  return db.collection("internalJobs").updateOne({ _id }, { $set: { ...data, updated_at: new Date() } })
}
