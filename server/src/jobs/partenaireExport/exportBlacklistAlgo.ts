import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { s3WriteString } from "@/common/utils/awsUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"

const uploadJsonToS3 = async (fileKey: string, data: unknown): Promise<void> => {
  await s3WriteString("storage", fileKey, {
    Body: JSON.stringify(data, null, 2),
    ContentType: "application/json",
  })
}

const exportBlacklistAlgo = async (): Promise<void> => {
  const [reportedCompanies, unsubscribedCompanies] = await Promise.all([
    getDbCollection("reported_companies")
      .find({ reason: "Entreprise fermée", type: LBA_ITEM_TYPE.RECRUTEURS_LBA }, { projection: { _id: 0, siret: 1 } })
      .toArray(),
    getDbCollection("unsubscribedrecruteurslba")
      .find({}, { projection: { _id: 0, siret: 1 } })
      .toArray(),
  ])

  const uniqueSiret = [...new Set([...reportedCompanies, ...unsubscribedCompanies].map((company) => company.siret))]

  await uploadJsonToS3("blacklist-algo.json", uniqueSiret)
  await notifyToSlack({ subject: "Fichier de blacklist pour l'algorithme", message: `${uniqueSiret.length} siret exportés` })
}

const exportApplications = async (): Promise<void> => {
  const applications = await getDbCollection("applications")
    .find({ job_origin: LBA_ITEM_TYPE.RECRUTEURS_LBA }, { projection: { _id: 1, company_siret: 1, created_at: 1 } })
    .toArray()

  await uploadJsonToS3("applications-algo.json", applications)
  await notifyToSlack({ subject: "Fichier des candidatures pour l'algorithme", message: `${applications.length} candidatures exportées` })
}

export const exportFileForAlgo = async (): Promise<void> => {
  await Promise.all([exportBlacklistAlgo(), exportApplications()])
}
