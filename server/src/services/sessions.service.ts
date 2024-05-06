import { FindOptions, ObjectId } from "mongodb"
import { FilterQuery } from "mongoose"
import { ISession } from "shared"

import config from "@/config"

import { Session } from "../common/model/index"

type TCreateSession = Pick<ISession, "token">

export const createSession = async (data: TCreateSession) => {
  const now = new Date()

  const sessionObj = new Session({
    ...data,
    updated_at: now,
    created_at: now,
    expires_at: new Date(now.getTime() + config.auth.session.cookie.maxAge),
  })
  await sessionObj.save()

  const session = await getSession({ _id: sessionObj._id })

  return session
}

export const getSession = async (filter: FilterQuery<ISession>, options?: FindOptions): Promise<ISession | null> => {
  return Session.findOne(filter, options)
}

export const deleteSession = async (token: string) => {
  await Session.deleteMany({ token })
}

export const updateSession = async (_id: ObjectId, data: Partial<ISession>) => {
  return Session.updateOne({ _id }, { $set: { ...data, updated_at: new Date() } })
}
