import { internal } from "@hapi/boom"
import { ObjectId } from "mongodb"
import type { IJob, ILbaItemPartnerJob, IRecruiter, IReferentielRomeForJob } from "shared"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import type { ILbaItemLbaJob } from "./lbaitem.shared.service.types"

export type IJobResult = {
  recruiter: Omit<IRecruiter, "jobs">
  job: IJob & { rome_detail: IReferentielRomeForJob }
}

export const getCity = (recruiter) => {
  let city = ""
  if (recruiter.establishment_location) {
    // cas mandataire
    city = recruiter.establishment_location
  } else if (recruiter.address_detail && "localite" in recruiter.address_detail) {
    city = recruiter.address_detail.localite
  } else if (recruiter.address_detail && "libelle_commune" in recruiter.address_detail) {
    city = recruiter.address_detail.libelle_commune
  }

  return city
}

/**
 * tri des ofres selon l'ordre alphabétique du titre (primaire) puis du nom de société (secondaire)
 */
export function sortLbaJobs(jobs: Partial<ILbaItemLbaJob | ILbaItemPartnerJob>[]) {
  jobs.sort((a, b) => {
    if (a && b) {
      if (a.title && b.title) {
        if (a?.title?.toLowerCase() < b?.title?.toLowerCase()) {
          return -1
        }
        if (a?.title?.toLowerCase() > b?.title?.toLowerCase()) {
          return 1
        }
      }

      if (a.company?.name && b.company?.name) {
        if (a?.company?.name?.toLowerCase() < b?.company?.name?.toLowerCase()) {
          return -1
        }
        if (a?.company?.name?.toLowerCase() > b?.company?.name?.toLowerCase()) {
          return 1
        }
      }
    }

    return 0
  })
}

/**
 * @description Incrémente le compteur de vue de la page de détail d'une offre LBA
 */
export const addOffreDetailView = async (jobId: ObjectId | string) => {
  try {
    await getDbCollection("jobs_partners").updateOne(
      { _id: new ObjectId(jobId.toString()) },
      {
        $inc: { stats_detail_view: 1 },
      }
    )
  } catch (err) {
    sentryCaptureException(err)
  }
}

/**
 * @description Incrémente les compteurs de vue d'un ensemble d'offres lba
 */
export const incrementLbaJobsViewCount = async (jobIds: string[]) => {
  const ids = jobIds.map((id) => new ObjectId(id))
  try {
    await getDbCollection("jobs_partners").updateMany(
      { _id: { $in: ids } },
      {
        $inc: { stats_search_view: 1 },
      }
    )
  } catch (err) {
    sentryCaptureException(err)
  }
}

export const getLbaJobContactInfo = async (recruiter: IJobResult["recruiter"]): Promise<Partial<IJobResult["recruiter"]>> => {
  if (recruiter.is_delegated && recruiter.cfa_delegated_siret) {
    const { managed_by } = recruiter
    const [cfa, cfaUser] = await Promise.all([
      getDbCollection("cfas").findOne({ siret: recruiter.cfa_delegated_siret }),
      getDbCollection("userswithaccounts").findOne({ _id: new ObjectId(managed_by) }),
    ])

    if (!cfa) {
      throw internal(`inattendu: cfa introuvable avec le siret ${recruiter.cfa_delegated_siret}`)
    }
    if (!cfaUser) {
      throw internal(`le user cfa est introuvable pour le recruiter avec id=${recruiter._id}`)
    }

    return {
      phone: cfaUser.phone,
      email: cfaUser.email,
      last_name: cfaUser.last_name,
      first_name: cfaUser.first_name,
      establishment_raison_sociale: cfa.raison_sociale,
      establishment_enseigne: cfa.enseigne,
      establishment_siret: cfa.siret,
      address: cfa.address,
    }
  }

  return {}
}

export const replaceRecruiterFieldsWithCfaFields = async (recruiter: IRecruiter) => {
  if (recruiter.is_delegated && recruiter.cfa_delegated_siret) {
    Object.assign(recruiter, await getLbaJobContactInfo(recruiter))
  }
}
