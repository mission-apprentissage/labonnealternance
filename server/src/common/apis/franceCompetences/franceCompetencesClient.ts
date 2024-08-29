import axios from "axios"
import { OPCOS_LABEL } from "shared/constants/recruteur"
import { z } from "shared/helpers/zodWithOpenApi"
import { assertUnreachable, parseEnum } from "shared/utils"

import config from "@/config"

import { sentryCaptureException } from "../../utils/sentryUtils"

const { baseUrl, apiKey, bearerToken } = config.franceCompetences

// exemple de réponse
// {
// 	"code": "01",
// 	"siret": "XXXXXXXXXX",
// 	"opcoRattachement": {
// 		"code": "06",
// 		"nom": "OPCO"
// 	},
// 	"opcoGestion": {
// 		"code": "06",
// 		"nom": "OPCO"
// 	}
// }

const ZOpcoResponse = z.union([
  z.object({
    code: z.literal("99").describe("correspond à un siret non trouvé"),
  }),
  z.object({
    code: z.enum(["01", "02"]).describe("01: siret trouvé. 02: siret non trouvé mais préempté par un OPCO via l'application des déclarations"),
    opcoRattachement: z.object({
      code: z.string(),
      nom: z.string(),
    }),
    opcoGestion: z
      .object({
        code: z.string(),
        nom: z.string(),
      })
      .optional(),
  }),
])

const mappingOpcoNames: Record<string, OPCOS_LABEL> = {
  AKTO: OPCOS_LABEL.AKTO,
  "OPCO EP": OPCOS_LABEL.EP,
  "UNIFORMATION COHESION SOCIALE": OPCOS_LABEL.UNIFORMATION,
  "OPCO MOBILITES": OPCOS_LABEL.MOBILITE,
  OPCO2I: OPCOS_LABEL.OPCO2I,
}

export const FCOpcoToOpcoEnum = (fcOpco: string): OPCOS_LABEL => {
  const parsedOpco = parseEnum(OPCOS_LABEL, fcOpco)
  const finalOpco: OPCOS_LABEL | undefined = mappingOpcoNames[fcOpco] ?? parsedOpco ?? undefined
  if (!finalOpco) {
    throw new Error(`opco inconnu: ${fcOpco}`)
  }
  return finalOpco
}

export const FCGetOpcoInfos = async (siret: string): Promise<OPCOS_LABEL | null> => {
  try {
    const response = await axios.get(`${baseUrl}/siropartfc/${encodeURIComponent(siret)}`, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        "X-Gravitee-Api-Key": apiKey,
      },
    })
    if (response.status === 200) {
      const data = ZOpcoResponse.parse(response.data)
      const { code } = data
      if (code === "99" || code === "02") {
        return null
      } else if (code === "01") {
        const {
          opcoRattachement: { nom: opcoName },
        } = data
        return FCOpcoToOpcoEnum(opcoName)
      } else {
        assertUnreachable(code)
      }
    } else {
      throw new Error(`error while calling France Compétences: status=${response.status}, data=${response.data}`)
    }
  } catch (err) {
    sentryCaptureException(err)
    return null
  }
}
