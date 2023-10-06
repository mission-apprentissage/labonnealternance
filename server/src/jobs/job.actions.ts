import type { ObjectId, MatchKeysAndValues, FilterQuery, FindOneOptions } from "mongodb"

import { IInternalJobs, IInternalJobsCron, IInternalJobsCronTask, IInternalJobsSimple } from "@/common/model/schema/internalJobs/internalJobs.types"
import { db } from "@/common/mongodb"

type CreateJobSimpleParams = Pick<IInternalJobsSimple, "name" | "payload" | "scheduled_for" | "sync">

export const createJobSimple = async ({ name, payload, scheduled_for = new Date(), sync = false }: CreateJobSimpleParams): Promise<IInternalJobsSimple> => {
  const job: Omit<IInternalJobsSimple, "_id"> = {
    name,
    type: "simple",
    status: sync ? "will_start" : "pending",
    payload,
    updated_at: new Date(),
    created_at: new Date(),
    scheduled_for,
    sync,
  }
  const { insertedId: _id } = await db.collection("internalJobs").insertOne(job)
  return { ...job, _id } as IInternalJobsSimple
}

type CreateJobCronParams = Pick<IInternalJobsCron, "name" | "cron_string" | "scheduled_for" | "sync">

export const createJobCron = async ({ name, cron_string, scheduled_for = new Date(), sync = false }: CreateJobCronParams): Promise<IInternalJobsCron> => {
  const job: Omit<IInternalJobsCron, "_id"> = {
    name,
    type: "cron",
    status: sync ? "will_start" : "pending",
    cron_string,
    updated_at: new Date(),
    created_at: new Date(),
    scheduled_for,
    sync,
  }
  const { insertedId: _id } = await db.collection("internalJobs").insertOne(job)
  return { ...job, _id }
}

type CreateJobCronTaskParams = Pick<IInternalJobsCron, "name" | "scheduled_for">

export const createJobCronTask = async ({ name, scheduled_for }: CreateJobCronTaskParams): Promise<IInternalJobsCronTask> => {
  const job: Omit<IInternalJobsCronTask, "_id"> = {
    name,
    type: "cron_task",
    status: "pending",
    updated_at: new Date(),
    created_at: new Date(),
    scheduled_for,
    sync: false,
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
