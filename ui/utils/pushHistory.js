import { getCampaignParameters } from "./campaignParameters"
import { getItemQueryParameters } from "./getItemId"
import { getSearchQueryParameters } from "./getSearchParameters"

const pushHistory = ({ router, scopeContext, item, page, display, searchParameters, searchTimestamp, isReplace, displayMap }) => {
  let params = `${display ? `&display=${display}` : ""}${page ? `&page=${page}` : ""}${item ? `&${getItemQueryParameters(item)}` : ""}${
    searchParameters ? `&${getSearchQueryParameters(searchParameters)}` : ""
  }${searchTimestamp ? `&s=${searchTimestamp}` : ""}${getCampaignParameters()}${displayMap === true ? "&displayMap=true" : ""}`

  if (!isReplace) {
    router.push(`${scopeContext.path}${params ? `?${params}` : ""}`, undefined, {
      shallow: true,
    })
  } else {
    router.replace(`${scopeContext.path}${params ? `?${params}` : ""}`, undefined, {
      shallow: true,
    })
  }
}

export default pushHistory
