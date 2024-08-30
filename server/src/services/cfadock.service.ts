import axios from "axios"
import { zOpcoLabel } from "shared/models/opco.model"
import { z } from "zod"

const cfaDockEndpoint = "https://www.cfadock.fr/api/opcos"

export const CFADOCK_FILTER_LIMIT = 100

const ZResponseItem = z.object({
  filters: z.object({ siret: z.string() }),
  opcoName: zOpcoLabel,
  searchStatus: z.string(),
  url: z.string().nullish(),
  idcc: z.number().nullish(),
})
export type ICfaDockOpcoItem = z.output<typeof ZResponseItem>

const ZResponseArray = z.array(ZResponseItem)

/**
 * @description Interroge CFADock pour récupérer les opcos associés aux sirens passés en paramètre.
 * Les sirens non trouvés sont ignorés.
 */
export const fetchOpcosFromCFADock = async (sirenSet: Set<string>) => {
  const response = await axios.post(
    cfaDockEndpoint,
    Array.from(sirenSet, (siret) => ({ siret })),
    { headers: { accept: "text/plain" } }
  )
  const { data } = response
  if (data?.found) {
    const parsed = ZResponseArray.parse(data.found)
    return parsed
  } else {
    return []
  }
}
