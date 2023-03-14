export const buildLinkForTownAndJob = (town, job) => {
  let result = `/recherche-apprentissage?&display=list&displayMap=false&job_name=${encodeURIComponent(job.name)}&romes=${job.romes.join(",")}${town.name !== "France"?`&radius=30&lat=${town.lat}&lon=${town.lon}&zipcode=${town.zip}&insee=${town.insee}&address=${encodeURIComponent(town.name)}`:""}`
  return result
}
