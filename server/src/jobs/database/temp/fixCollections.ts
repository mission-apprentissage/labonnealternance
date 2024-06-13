import { z } from "zod"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { Appointment, User } from "../../../common/model"
import { asyncForEach } from "../../../common/utils/asyncUtils"

const fixOptoutContactList = async () => {
  const optouts = await getDbCollection("optouts").find({}).toArray()

  await asyncForEach(optouts, async ({ contacts, _id }) => {
    await asyncForEach(contacts, async (contact) => {
      if (!z.string().email().safeParse(contact.email).success) {
        await Optout.findByIdAndUpdate(_id, { $pull: { contacts: { email: contact.email } } })
      }
    })
  })
}

const fixUserMissingType = async () => await User.updateMany({ type: { $exists: false } }, { $set: { type: "etudiant" } })

const fixUserEmail = async () => {
  const users = await User.find({}).lean()
  await asyncForEach(users, async (user) => {
    if (!z.string().email().safeParse(user.email).success) {
      await Appointment.findOneAndDelete({ applicant_id: user._id.toString() })
      await User.findByIdAndDelete(user._id)
    }
  })
}

export const fixCollections = async () => {
  await fixOptoutContactList()
  await fixUserMissingType()
  await fixUserEmail()
}
