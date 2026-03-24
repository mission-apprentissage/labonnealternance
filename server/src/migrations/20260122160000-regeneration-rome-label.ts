import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { ajoutRomesADomaineMetiers } from "@/jobs/domainesMetiers/domaineMetiersFixRomes"
import { domaineMetierToDomaineMetierSimple } from "@/services/domainesmetiers.service"

export const up = async () => {
  const domainesmetiers = await getDbCollection("domainesmetiers").find({}).toArray()

  await asyncForEach(domainesmetiers, async (domainemetier) => {
    const { domaineMetierSimple, errors } = domaineMetierToDomaineMetierSimple(domainemetier)
    if (errors.length) {
      console.warn(errors)
    }
    const codeRomes = domaineMetierSimple.romes.map((x) => x.codeRome)
    await ajoutRomesADomaineMetiers(
      {
        [domaineMetierSimple.sous_domaine]: codeRomes,
      },
      false
    )
  })
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
