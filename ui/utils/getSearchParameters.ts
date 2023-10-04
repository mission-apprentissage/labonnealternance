export const getSearchQueryParameters = (searchParameters) => {
  if (!searchParameters) {
    return ""
  }

  const result = `job_name=${searchParameters?.job.label ? encodeURIComponent(searchParameters?.job.label) : ""}&romes=${searchParameters?.job.romes.toString()}${
    searchParameters.diploma ? "&diploma=" + searchParameters.diploma : ""
  }&radius=${searchParameters.radius || 30}${
    searchParameters?.location?.value
      ? `&lat=${searchParameters.location.value.coordinates[1]}&lon=${searchParameters.location.value.coordinates[0]}&zipcode=${searchParameters.location.zipcode || ""}&insee=${
          searchParameters.location.insee || ""
        }&address=${searchParameters.location.label ? encodeURIComponent(searchParameters.location.label) : ""}`
      : ""
  }${searchParameters?.opcoFilter ? `&opco=${searchParameters.opcoFilter}` : ""}${searchParameters?.opcoUrlFilter ? `&opcoUrl=${searchParameters.opcoUrlFilter}` : ""}`

  return result
}
