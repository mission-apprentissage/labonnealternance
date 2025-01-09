import { ObjectId } from "mongodb"
import { zRoutes } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { getOffre } from "@/services/formulaire.service"
import { getFtJobFromIdV2 } from "@/services/ftjob.service"

import { Server } from "../server"

export default (server: Server) => {
  server.post(
    "/report-company",
    {
      schema: zRoutes.post["/report-company"],
    },
    async (req, res) => {
      const { reason, reasonDetails } = req.body
      const { itemId, type } = req.query
      const additionalInfos = await getReportAdditionalInfos(itemId, type)
      await getDbCollection("reported_companies").insertOne({
        ...additionalInfos,
        _id: new ObjectId(),
        createdAt: new Date(),
        type,
        itemId,
        reason,
        reasonDetails,
      })
      return res.send({})
    }
  )
}

const getReportAdditionalInfos = async (itemId: string, type: LBA_ITEM_TYPE) => {
  switch (type) {
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA: {
      const recruiterOpt = await getOffre(itemId)
      const jobOpt = recruiterOpt?.jobs.find((job) => job._id.toString() === itemId)
      if (!jobOpt || !recruiterOpt) {
        return null
      }
      const { establishment_siret, establishment_raison_sociale, establishment_enseigne } = recruiterOpt
      const { rome_appellation_label } = jobOpt
      return {
        siret: establishment_siret,
        companyName: establishment_raison_sociale || establishment_enseigne,
        jobTitle: rome_appellation_label,
      }
    }
    case LBA_ITEM_TYPE.RECRUTEURS_LBA: {
      const recruteur = await getDbCollection("recruteurslba").findOne({ siret: itemId })
      if (!recruteur) return null
      const { siret, enseigne, raison_sociale } = recruteur
      return {
        siret,
        companyName: raison_sociale || enseigne,
      }
    }
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES: {
      if (ObjectId.isValid(itemId)) {
        const jobOpt = await getDbCollection("jobs_partners").findOne({ _id: new ObjectId(itemId) })
        if (!jobOpt) return null
        const { offer_title, workplace_name, workplace_siret, partner_label } = jobOpt
        return {
          siret: workplace_siret,
          partnerLabel: partner_label,
          jobTitle: offer_title,
          companyName: workplace_name,
        }
      } else {
        const ftJob = await getFtJobFromIdV2({ id: itemId, caller: undefined })
        if (!ftJob) return null
        const {
          job: { company, title },
        } = ftJob
        return {
          siret: company?.siret,
          partnerLabel: "France Travail",
          jobTitle: title,
          companyName: company?.name,
        }
      }
    }
    default: {
      return null
    }
  }
}
