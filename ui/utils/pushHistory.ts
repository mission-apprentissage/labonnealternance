import { getCampaignParameters } from "./campaignParameters"
import { getItemQueryParameters } from "./getItemId"
import { getSearchQueryParameters } from "./getSearchParameters"

const buildQueryParams = ({ display, page, item, searchParameters, searchTimestamp, displayMap }) => {
  const queryParams = [
    display ? `display=${display}` : "",
    page ? `page=${page}` : "",
    item ? getItemQueryParameters(item) : "",
    searchParameters ? getSearchQueryParameters(searchParameters) : "",
    searchTimestamp ? `s=${searchTimestamp}` : "",
    getCampaignParameters(),
    displayMap === true ? "displayMap=true" : "",
  ]

  return queryParams.filter(Boolean).join("&")
}

const pushHistory = ({
  router,
  scopeContext,
  item = undefined,
  page = undefined,
  display = undefined,
  searchParameters = undefined,
  searchTimestamp = undefined,
  isReplace = false,
  displayMap = false,
}) => {
  const params = buildQueryParams({
    display,
    page,
    item,
    searchParameters,
    searchTimestamp,
    displayMap,
  })

  const navigationMethod = isReplace ? router.replace : router.push

  navigationMethod(`${scopeContext.path}${params ? `?${params}` : ""}`, undefined, {
    shallow: true,
  })
}

export default pushHistory
