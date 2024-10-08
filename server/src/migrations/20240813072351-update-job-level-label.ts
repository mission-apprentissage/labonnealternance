import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  await getDbCollection("recruiters").updateMany(
    { "jobs.job_level_label": "Licence, autres formations niveau (Bac+3)" },
    { $set: { "jobs.$[].job_level_label": "Licence, Maîtrise, autres formations niveaux 6 (Bac+3 à Bac+4)" } },
    { bypassDocumentValidation: true }
  )
  await getDbCollection("recruiters").updateMany(
    { "jobs.job_level_label": "Master, titre ingénieur, autres formations niveaux 7 ou 8 (bac+5)" },
    { $set: { "jobs.$[].job_level_label": "Master, titre ingénieur, autres formations niveaux 7 ou 8 (Bac+5)" } },
    { bypassDocumentValidation: true }
  )
}
