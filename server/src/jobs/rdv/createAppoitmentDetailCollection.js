/**
 * @description For metabase stats only
 */

import { omit } from "lodash-es"
import { Appointment, AppointmentDetailed, User } from "../../common/model/index.js"
import { asyncForEach } from "../../common/utils/asyncUtils.js"
import { runScript } from "../scriptWrapper.js"

const normalise = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

runScript(async () => {
  // clean DB
  await AppointmentDetailed.deleteMany({})

  const apt = await Appointment.find().lean()

  await asyncForEach(apt, async (rdv) => {
    const filtApt = omit(rdv, ["_id", "_v", "__v"])
    const candidat = await User.findById(rdv.candidat_id).lean()
    const filtCandidat = omit(candidat, ["_id", "__v", "password"])

    filtCandidat.firstname = candidat?.firstname ? normalise(candidat.firstname) : null
    filtCandidat.lastname = candidat?.lastname ? normalise(candidat.lastname) : null

    await AppointmentDetailed.collection.insertOne({ ...filtApt, ...filtCandidat })
  })

  const count = await AppointmentDetailed.countDocuments()
  return { count }
})
