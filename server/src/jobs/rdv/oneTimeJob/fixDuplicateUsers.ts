import { IUser } from "shared"

import { logger } from "../../../common/logger"
import { Appointment, User } from "../../../common/model"

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
  const users = await User.find({}).lean()
  const duplicates: Iterable<IUser[]> = findDuplicates(users)

  for await (const groupOfUsers of duplicates) {
    const userToKeep = groupOfUsers.shift()
    for await (const group of groupOfUsers) {
      await Appointment.updateMany({ applicant_id: group._id.toString() }, { $set: { applicant_id: userToKeep?._id.toString() } })
      await User.findByIdAndDelete(group._id)
    }
  }
  logger.info(`End user deduplication`)
}
