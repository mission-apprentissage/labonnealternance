import { ZReferentielOpco } from "shared/models"

import { logger } from "@/common/logger"
import { ReferentielOpco } from "@/common/model"

export const up = async () => {
  const referentielOpcos = await ReferentielOpco.find({}).lean()
  const toBeDeletedOpcos = referentielOpcos.filter((refOpco) => {
    return !ZReferentielOpco.safeParse(refOpco).success
  })
  await ReferentielOpco.deleteMany({ _id: { $in: toBeDeletedOpcos.map((opco) => opco._id) } })

  logger.info("20231129170900-clean-referentielopcos")
}
