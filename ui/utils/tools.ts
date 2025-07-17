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

type ScrollToNestedElementParams = {
  containerId: string
  nestedElement: HTMLElement
  yOffsett?: number
}

const scrollToNestedElement = ({ containerId, nestedElement, yOffsett = 100 }: ScrollToNestedElementParams) => {
  const ancestorElement = document.getElementById(containerId)

  let distanceFromAncestorTop = 0
  let currentElement: HTMLElement | null = nestedElement

  while (currentElement !== ancestorElement && currentElement !== null) {
    distanceFromAncestorTop += currentElement.offsetTop
    currentElement = currentElement.offsetParent as HTMLElement | null
  }
  ancestorElement.scrollTo({
    top: distanceFromAncestorTop - yOffsett,
    behavior: "smooth",
  })
}

const logError = (title: string, error: string | Error = undefined) => {
  const err = error instanceof Error ? error : new Error(error)
  err.name = title

  console.error(`Error ${title} sent to Sentry`)
}

export { getPathLink, logError, scrollToNestedElement }
