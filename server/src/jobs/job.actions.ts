import { Filter, FindOptions, MatchKeysAndValues, ObjectId } from "mongodb"

import { IInternalJobs, IInternalJobsCron, IInternalJobsCronTask, IInternalJobsSimple } from "@/common/model/internalJobs.types"

import { getDbCollection } from "../common/utils/mongodbUtils"

type CreateJobSimpleParams = Pick<IInternalJobsSimple, "name" | "payload" | "scheduled_for" | "sync">

export const createJobSimple = async ({ name, payload, scheduled_for = new Date(), sync = false }: CreateJobSimpleParams): Promise<IInternalJobsSimple> => {
  const job: IInternalJobsSimple = {
    _id: new ObjectId(),
    name,
    type: "simple",
    status: sync ? "will_start" : "pending",
    payload,
    updated_at: new Date(),
    created_at: new Date(),
    scheduled_for,
    sync,
  }
  await getDbCollection("internalJobs").insertOne(job)
  return job
}

type CreateJobCronParams = Pick<IInternalJobsCron, "name" | "cron_string" | "scheduled_for" | "sync">

export const createJobCron = async ({ name, cron_string, scheduled_for = new Date(), sync = false }: CreateJobCronParams): Promise<IInternalJobsCron> => {
  const job: IInternalJobsCron = {
    _id: new ObjectId(),
    name,
    type: "cron",
    status: sync ? "will_start" : "pending",
    cron_string,
    updated_at: new Date(),
    created_at: new Date(),
    scheduled_for,
    sync,
  }
  await getDbCollection("internalJobs").insertOne(job)
  return job
}

type CreateJobCronTaskParams = Pick<IInternalJobsCron, "name" | "scheduled_for">

export const createJobCronTask = async ({ name, scheduled_for }: CreateJobCronTaskParams): Promise<IInternalJobsCronTask> => {
  const job: IInternalJobsCronTask = {
    _id: new ObjectId(),
    name,
    type: "cron_task",
    status: "pending",
    updated_at: new Date(),
    created_at: new Date(),
    scheduled_for,
    sync: false,
  }
  await getDbCollection("internalJobs").insertOne(job)
  return job
}

export const findJob = async (filter: Filter<IInternalJobs>, options?: FindOptions<IInternalJobs>): Promise<IInternalJobs | null> => {
  return await getDbCollection("internalJobs").findOne(filter, options)
}

export const findJobs = async <T extends IInternalJobs>(filter: Filter<T>, options?: FindOptions<T>): Promise<T[]> => {
  return await getDbCollection("internalJobs").find(filter, options).toArray()
}

/**
 * Mise à jour d'un job
 */
export const updateJob = async (_id: ObjectId, data: MatchKeysAndValues<IInternalJobs>) => {
  return getDbCollection("internalJobs").updateOne({ _id }, { $set: { ...data, updated_at: new Date() } })
}
