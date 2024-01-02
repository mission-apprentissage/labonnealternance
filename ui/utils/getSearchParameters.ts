export const getSearchQueryParameters = (searchParameters) => {
  if (!searchParameters) {
    return ""
  }

  const {
    job: { label: jobLabel, romes, rncp },
    diploma,
    radius = 30,
    location,
    opcoFilter,
    opcoUrlFilter,
  } = searchParameters

  const jobNameParam = jobLabel ? `job_name=${encodeURIComponent(jobLabel)}` : ""
  const romesParam = romes !== "" ? `&romes=${romes.toString()}` : ""
  const rncpParam = romes === "" ? `&rncp=${rncp}` : ""
  const diplomaParam = diploma ? `&diploma=${diploma}` : ""
  const radiusParam = `&radius=${radius}`

  let locationParams = ""
  if (location?.value) {
    const { coordinates, zipcode = "", insee = "", label: locationLabel } = location.value
    locationParams = `&lat=${coordinates[1]}&lon=${coordinates[0]}&zipcode=${zipcode}&insee=${insee}&address=${locationLabel ? encodeURIComponent(locationLabel) : ""}`
  }

  const opcoFilterParam = opcoFilter ? `&opco=${opcoFilter}` : ""
  const opcoUrlFilterParam = opcoUrlFilter ? `&opcoUrl=${opcoUrlFilter}` : ""

  const result = `${jobNameParam}${romesParam}${rncpParam}${diplomaParam}${radiusParam}${locationParams}${opcoFilterParam}${opcoUrlFilterParam}`

  return result
}
