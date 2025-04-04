import { ILbaItemCompany, ILbaItemFormation2Json, ILbaItemFtJobJson, ILbaItemLbaCompanyJson, ILbaItemLbaJobJson } from "shared"

import { rawPostalAddress } from "./addressUtils"
//import * as Sentry from "@sentry/react";

const getPathLink = (anyItem: ILbaItemFormation2Json | ILbaItemLbaCompanyJson | ILbaItemCompany | ILbaItemLbaJobJson | ILbaItemFtJobJson) => {
  let res = ""
  if (anyItem?.place) {
    res = `https://www.google.fr/maps/dir//${encodeURIComponent(rawPostalAddress(anyItem.place.fullAddress || anyItem.place.city))}/@${anyItem.place.latitude},${
      anyItem.place.longitude
    },12z/`
  }
  return res
}

const getValueFromPath = (key) => {
  let res: string | null = ""
  if (typeof window !== "undefined") {
    // @ts-expect-error: TODO
    const url = new URL(window.location)

    // WARNING: URLSearchParams not supported by IE
    const searchParams = new URLSearchParams(url.search)

    res = searchParams.get(key)
  }

  return res
}

const scrollToNestedElement = ({ containerId, nestedElement, yOffsett = 100 }) => {
  const ancestorElement = document.getElementById(containerId)

  let distanceFromAncestorTop = 0
  let currentElement = nestedElement

  while (currentElement !== ancestorElement && currentElement !== null) {
    distanceFromAncestorTop += currentElement.offsetTop
    currentElement = currentElement.offsetParent
  }
  ancestorElement?.scrollTo({
    top: distanceFromAncestorTop - yOffsett,
    behavior: "smooth",
  })
}

const logError = (title, error: Error | string) => {
  const err = error instanceof Error ? error : new Error(error)
  err.name = title

  console.error(`Error ${title} sent to Sentry`)
}

export { getPathLink, getValueFromPath, logError, scrollToNestedElement }
