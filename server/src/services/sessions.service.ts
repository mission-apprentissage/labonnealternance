import { Filter, FindOptions, ObjectId } from "mongodb"
import { ISession } from "shared"

import config from "@/config"

import { getDbCollection } from "../common/utils/mongodbUtils"

type TCreateSession = Pick<ISession, "token">

export const createSession = async (data: TCreateSession) => {
  const now = new Date()

  const sessionObj: ISession = {
    ...data,
    _id: new ObjectId(),
    updated_at: now,
    created_at: now,
    expires_at: new Date(now.getTime() + config.auth.session.cookie.maxAge),
  }
  const { insertedId } = await getDbCollection("sessions").insertOne(sessionObj)

  const session = await getSession({ _id: insertedId })

  return session
}

export const getSession = async (filter: Filter<ISession>, options?: FindOptions): Promise<ISession | null> => {
  return getDbCollection("sessions").findOne(filter, options)
}

export const deleteSession = async (token: string) => {
  await getDbCollection("sessions").deleteMany({ token })
}

export const updateSession = async (_id: ObjectId, data: Partial<ISession>) => {
  return getDbCollection("sessions").updateOne({ _id }, { $set: { ...data, updated_at: new Date() } })
}
