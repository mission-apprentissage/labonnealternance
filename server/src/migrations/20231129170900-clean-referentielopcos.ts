import { ZReferentielOpco } from "shared/models/index"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  const referentielOpcos = await getDbCollection("referentielopcos").find({}).toArray()
  const toBeDeletedOpcos = referentielOpcos.filter((refOpco) => {
    return !ZReferentielOpco.safeParse(refOpco).success
  })
  await getDbCollection("referentielopcos").deleteMany({ _id: { $in: toBeDeletedOpcos.map((opco) => opco._id) } })

  logger.info("20231129170900-clean-referentielopcos")
}
