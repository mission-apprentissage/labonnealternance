import { IUser } from "shared"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../../common/logger"

const findDuplicates = (users) => {
  const emailMap: { [key: string]: IUser[] } = {}

  users.forEach((user) => {
    const { email } = user

    if (!emailMap[email]) {
      emailMap[email] = [user]
    } else {
      emailMap[email].push(user)
    }
  })

  const duplicateGroups = Object.values(emailMap)
    .filter((group) => group.length > 1)
    .map((group) => group.sort((a, b) => new Date(b.last_action_date).getTime() - new Date(a.last_action_date).getTime()))

  return duplicateGroups
}

export const fixDuplicateUsers = async () => {
  logger.info(`Start user deduplication`)
  const users = await getDbCollection("users").find({}).toArray()
  const duplicates: Iterable<IUser[]> = findDuplicates(users)

  for await (const groupOfUsers of duplicates) {
    const userToKeep = groupOfUsers.shift()
    for await (const group of groupOfUsers) {
      await getDbCollection("appointments").updateMany({ applicant_id: group._id }, { $set: { applicant_id: userToKeep?._id } })
      await getDbCollection("users").deleteOne({ _id: group._id })
    }
  }
  logger.info(`End user deduplication`)
}
