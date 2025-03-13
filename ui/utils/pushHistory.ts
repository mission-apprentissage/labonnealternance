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
  item,
  page,
  display,
  searchParameters,
  searchTimestamp,
  isReplace = false,
  displayMap = false,
}: {
  router: any
  scopeContext: any
  item?: any
  page?: string
  display?: string
  searchParameters?: string | null
  searchTimestamp?: string | number
  isReplace?: boolean
  displayMap?: boolean
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
