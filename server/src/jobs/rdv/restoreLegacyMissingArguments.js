import { logger } from "../../common/logger.js"
import { Appointment } from "../../common/model/index.js"
import { asyncForEach } from "../../common/utils/asyncUtils.js"
import { runScript } from "../scriptWrapper.js"

runScript(async ({ db }) => {
  const legacy = await db.collection("appointmentslegacy").find().toArray()
  const legacylatest = await db.collection("appointmentslegacy").find().sort({ $natural: -1 }).limit(1).toArray()

  const latestcreatedAt = legacylatest[0].created_at

  logger.info(`Restoring data up to ${latestcreatedAt} and keeping data above`)

  const running = await Appointment.find({ created_at: { $gt: latestcreatedAt } }).lean()

  const restored = [...legacy, ...running]

  await Appointment.deleteMany({})

  await asyncForEach(restored, async (apt) => {
    await Appointment.create(apt)
  })

  const count = await Appointment.countDocuments()

  return { diffprod: running.length, newDB: restored.length, retored: count }
})
