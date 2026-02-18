import type { ILbaItemLbaCompany, ILbaItemLbaJob, ILbaItemPartnerJob } from "shared"
import { assertUnreachable, zRoutes } from "shared"

import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { INiveauDiplomeEuropeen } from "shared/models/jobsPartners.model"

import { getJobsQueryPrivate } from "@/services/jobs/jobOpportunity/jobOpportunity.service"
import { addOffreDetailView } from "@/services/lbajob.service"
import { getRecruteurLbaFromDB } from "@/services/recruteurLba.service"

import type { Server } from "@/http/server"

import { getPartnerJobByIdV2 } from "@/services/partnerJob.service"

const config = {
  rateLimit: {
    max: 5,
    timeWindow: "1s",
  },
}

export default (server: Server) => {
  server.get(
    "/v1/_private/jobs/min",
    {
      schema: zRoutes.get["/v1/_private/jobs/min"],
      config,
    },
    async (req, res) => {
      const { referer } = req.headers
      const { romes, rncp, caller, latitude, longitude, radius, insee, diploma, opco, elligibleHandicapFilter } = req.query
      const result = await getJobsQueryPrivate({
        romes,
        rncp,
        caller,
        referer,
        latitude,
        longitude,
        radius,
        insee,
        diploma: INiveauDiplomeEuropeen.fromParam(diploma),
        opco,
        isMinimalData: true,
        elligibleHandicapFilter: elligibleHandicapFilter === "true",
      })

      if ("error" in result) {
        return res.status(500).send(result)
      }
      return res.status(200).send(result)
    }
  )

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
          result = await getPartnerJobByIdV2(id)
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
