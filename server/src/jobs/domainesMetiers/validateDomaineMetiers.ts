import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { domaineMetierToDomaineMetierSimple } from "@/services/domainesmetiers.service"

export async function validateDomaineMetiers() {
  const domaineMetiers = await getDbCollection("domainesmetiers").find({}).toArray()
  domaineMetiers.forEach((domaineMetier) => {
    const { errors } = domaineMetierToDomaineMetierSimple(domaineMetier)
    if (errors.length) {
      logger.error(`domaine metier _id=${domaineMetier._id}, sous_domaine=${domaineMetier.sous_domaine} a les erreurs suivantes :`, errors)
    }
  })
}
