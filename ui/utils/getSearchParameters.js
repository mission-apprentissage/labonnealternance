export const getSearchQueryParameters = (searchParameters) => {
  if (!searchParameters) {
    return "";
  }

  let result = `job_name=${
    searchParameters?.job.label ? encodeURIComponent(searchParameters?.job.label) : ""
  }&romes=${searchParameters?.job.romes.toString()}${
    searchParameters.diploma ? "&diploma=" + searchParameters.diploma : ""
  }&radius=${searchParameters.radius || 30}${
    searchParameters?.location?.value
      ? `&lat=${searchParameters.location.value.coordinates[1]}&lon=${
          searchParameters.location.value.coordinates[0]
        }&zipcode=${searchParameters.location.zipcode || ""}&insee=${searchParameters.location.insee || ""}&address=${
          searchParameters.location.label ? encodeURIComponent(searchParameters.location.label) : ""
        }`
      : ""
  }${searchParameters?.opcoFiter ? `&opco=${searchParameters.opcoFiter}` : ""}`;

  return result;
};
