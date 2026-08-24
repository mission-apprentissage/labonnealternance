import { badRequest } from "@hapi/boom"
import { ObjectId } from "mongodb"
import type { ILbaItemLbaCompany, ILbaItemLbaJob, ILbaItemPartnerJob } from "shared"
import { assertUnreachable, zRoutes } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import type { Server } from "@/http/server"
import { addOffreDetailView } from "@/services/lbajob.service"
import { getPartnerJobByIdV2 } from "@/services/partner-job.service"
import { getRecruteurLbaFromDB } from "@/services/recruteur-lba.service"

const config = {
  rateLimit: {
    max: 5,
    timeWindow: "1s",
  },
}

export default (server: Server) => {
  server.get(
    "/_private/jobs/:source/:id",
    {
      schema: zRoutes.get["/_private/jobs/:source/:id"],
      config,
    },
    async (req, res) => {
      const { source, id } = req.params
      let result: ILbaItemLbaJob | ILbaItemPartnerJob | ILbaItemLbaCompany | null

      switch (source) {
        case LBA_ITEM_TYPE.RECRUTEURS_LBA:
          result = await getRecruteurLbaFromDB(id)
          break
        case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA:
        case LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES:
          if (!ObjectId.isValid(id)) {
            throw badRequest("id is not valid")
          }
          result = await getPartnerJobByIdV2(new ObjectId(id))
          break

        default:
          assertUnreachable(source as never)
      }
      return res.send(result)
    }
  )

  server.post(
    "/v1/jobs/matcha/:id/stats/view-details",
    {
      schema: zRoutes.post["/v1/jobs/matcha/:id/stats/view-details"],
      config,
    },
    async (req, res) => {
      const { id } = req.params
      await addOffreDetailView(id)
      return res.send({})
    }
  )
}
