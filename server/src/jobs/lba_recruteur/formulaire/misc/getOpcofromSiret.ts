import axios from "axios"
import { logger } from "../../../../common/logger.js"
import { Recruiter } from "../../../../db/index.js"
import { asyncForEach } from "../../../../common/utils/asyncUtils.js"
import { runScript } from "../../../scriptWrapper.js"
import { IRecruiter } from "../../../../db/schema/recruiter/recruiter.types.js"

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

runScript(async () => {
  const form = await Recruiter.find({ $or: [{ opco: { $exists: false } }, { opco: null }] })
  logger.info(`${form.length} entreprise à rechercher`)
  let count = 0

  await asyncForEach(form, async (f) => {
    logger.info(`get idcc for ${f.establishment_siret}`)
    const idcc = await axios.get(`https://siret2idcc.fabrique.social.gouv.fr/api/v2/${f.establishment_siret}`)

    if (idcc.data[0].conventions?.length === 0) {
      logger.info("Not Found")
      return
    }

    const { num } = idcc.data[0]?.conventions[0]

    const { data } = await axios.get(`https://www.cfadock.fr/api/opcos?idcc=${num}`)
    logger.info(`Opco: ${data.opcoName} - Idcc: ${data.idcc} –-> establishment_siret: ${f.establishment_siret} — ${f.email}`)
    f.opco = data.opcoName
    f.idcc = data.idcc

    await f.save()
    count++
    await delay(2000)
  })

  return { count }
})
