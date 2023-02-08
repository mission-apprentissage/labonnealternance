import { Opco } from "../common/model/index.js"

export default async function ({ opco, jobs }) {
  let sirens = []

  jobs.forEach((job) => {
    if (job?.company?.siret) {
      sirens.push(job.company.siret.substring(0, 9))
    }
  })

  // les sociétés sans siren ne sont pas retournées
  if (sirens.length === 0) {
    return []
  }

  let opcoCompanies = await Opco.find({ siren: sirens, opco: opco.toLowerCase() })

  // les sociétés n'appartenant pas à l'opco en paramètres ne sont pas retournées
  if (opcoCompanies.length === 0) {
    return []
  }

  const opcoSirens = opcoCompanies.map((company) => company.siren)

  let results = jobs.filter((job) => {
    if (job?.company?.siret && opcoSirens.indexOf(job.company.siret.substring(0, 9)) >= 0) {
      return true
    } else {
      return false
    }
  })

  return results
}
