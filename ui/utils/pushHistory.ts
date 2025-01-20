import { paramCase } from "param-case"

import { getCampaignParameters } from "./campaignParameters"
import { getItemQueryParameters } from "./getItemId"
import { getSearchQueryParameters } from "./getSearchParameters"

const buildQueryParams = ({ display, page, item, searchParameters, searchTimestamp, displayMap, path }) => {
  const queryParams = [
    display ? `display=${display}` : "",
    page ? `page=${page}` : "",
    item ? getItemQueryParameters(item) : "",
    searchParameters ? getSearchQueryParameters(searchParameters) : "",
    searchTimestamp ? `s=${searchTimestamp}` : "",
    getCampaignParameters(),
    displayMap === true ? "displayMap=true" : "",
    `path=${path ?? "/recherche"}`,
  ]

  return queryParams.filter(Boolean).join("&")
}

const pushHistory = ({
  router,
  item = undefined,
  page = undefined,
  display = undefined,
  searchParameters = undefined,
  searchTimestamp = undefined,
  isReplace = false,
  displayMap = false,
  path = "/recherche",
}) => {
  const params = buildQueryParams({
    display,
    page,
    item,
    searchParameters,
    searchTimestamp,
    displayMap,
    path,
  })

  const navigationMethod = isReplace ? router.replace : router.push

  if (page === "fiche") {
    const title = paramCase(item?.title)
    const link = `/${item?.ideaType === "formation" ? "" : "emploi/"}${item?.ideaType}/${encodeURIComponent(item?.id)}/${title}`
    navigationMethod(`${link}${params ? `?${params}` : ""}`, undefined, {
      shallow: true,
    })
  } else if (page === "list") {
    navigationMethod(`${path}${params ? `?${params}` : ""}`, undefined, {
      shallow: true,
    })
  }
}

export default pushHistory
