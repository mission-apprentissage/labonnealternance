import { paramCase } from "param-case"
import { oldItemTypeToNewItemType } from "shared/constants/lbaitem"

import { getCampaignParameters } from "./campaignParameters"
import { getSearchQueryParameters } from "./getSearchParameters"

const buildQueryParams = ({ display, page, searchParameters, searchTimestamp, displayMap, path }) => {
  const queryParams = [
    display ? `display=${display}` : "",
    page ? `page=${page}` : "",
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
  path,
}) => {
  const params = buildQueryParams({
    display,
    page,
    searchParameters,
    searchTimestamp,
    displayMap,
    path: path ?? router.pathname,
  })

  const navigationMethod = isReplace ? router.replace : router.push
  if (page === "fiche") {
    const title = paramCase(item?.title)
    const link = `/${item?.ideaType === "formation" ? "" : "emploi/"}${oldItemTypeToNewItemType(item?.ideaType)}/${encodeURIComponent(item?.id)}/${title}`
    navigationMethod(`${link}${params ? `?${params}` : ""}`, undefined, {
      shallow: true,
    })
  } else {
    navigationMethod(`${path ?? router.pathname}${params ? `?${params}` : ""}`, undefined, {
      shallow: true,
    })
  }
}

export default pushHistory
