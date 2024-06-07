import { writeFileSync } from "fs"

import { db } from "../../common/mongodb"
import { uploadFileToS3 } from "../../common/utils/awsUtils"

interface IGeneratorParams {
  collection: "jobs" | "bonnesboites"
  query: object
  projection: object
  fileName: "lba_recruteurs.json" | "offres_emploi_lba.json"
}

async function generateJsonExport({ collection, query, projection, fileName }: IGeneratorParams): Promise<string> {
  const filePath = new URL(`./${fileName}`, import.meta.url)
  const data = await db.collection(collection).find(query).project(projection).toArray()
  writeFileSync(filePath, JSON.stringify(data, null, 4))
  return filePath.pathname
}

async function exportLbaJobsToS3() {
  const offres_emploi_lba: IGeneratorParams = {
    collection: "jobs",
    query: { job_status: "Active" },
    projection: { rome_detail: 0, _id: 0, delegations: 0, address_detail: 0, jobId: 0, recruiterId: 0, email: 0, phone: 0 },
    fileName: "offres_emploi_lba.json",
  }
  const recruteurs_lba: IGeneratorParams = {
    collection: "bonnesboites",
    query: {},
    projection: { _id: 0, email: 0, phone: 0, geopoint: 0 },
    fileName: "lba_recruteurs.json",
  }
  const paths = await Promise.all([generateJsonExport(offres_emploi_lba), generateJsonExport(recruteurs_lba)])
  await Promise.all(paths.map((path) => uploadFileToS3({ key: path.split("/").pop() as string, filePath: path, noCache: true })))
}

export { exportLbaJobsToS3 }
