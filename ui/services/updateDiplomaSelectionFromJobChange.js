import fetchDiplomas from "../services/fetchDiplomas"

export default async function updateDiplomaSelectionFromJobChange(job, setDiplomasFunc) {
  let diplomas = []
  if (job) {
    try {
      diplomas = await fetchDiplomas(job.romes, job.rncps)
    } catch (err) {
      diplomas = ["3 (CAP...)", "4 (BAC...)", "5 (BTS, DEUST...)", "6 (Licence, BUT...)", "7 (Master, titre ingénieur...)"]
    }
  }

  setTimeout(() => {
    setDiplomasFunc(diplomas)
  }, 0)
}
