import { rawPostalAddress } from "./addressUtils"
//import * as Sentry from "@sentry/react";

const getPathLink = (anyItem) => {
  let res = ""
  if (anyItem?.place) {
    res = `https://www.google.fr/maps/dir//${encodeURIComponent(rawPostalAddress(anyItem.place.fullAddress || anyItem.place.city))}/@${anyItem.place.latitude},${
      anyItem.place.longitude
    },12z/`
  }
  return res
}

const getValueFromPath = (key) => {
  let res = ""
  if (typeof window !== "undefined") {
    // @ts-expect-error: TODO
    const url = new URL(window.location)

    // WARNING: URLSearchParams not supported by IE
    const searchParams = new URLSearchParams(url.search)

    res = searchParams.get(key)
  }

  return res
}

const scrollToTop = (elementId) => {
  if (elementId) {
    document.getElementById(elementId).scrollTo({
      top: 0,
      left: 0,
    })
  } else {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0)
    }
  }
}

const scrollToNestedElement = ({ containerId, nestedElement, yOffsett = 100 }) => {
  const ancestorElement = document.getElementById(containerId)

  let distanceFromAncestorTop = 0
  let currentElement = nestedElement

  while (currentElement !== ancestorElement && currentElement !== null) {
    distanceFromAncestorTop += currentElement.offsetTop
    currentElement = currentElement.offsetParent
  }
  ancestorElement.scrollTo({
    top: distanceFromAncestorTop - yOffsett,
    behavior: "smooth",
  })
}

const logError = (title, error = undefined) => {
  const err = error instanceof Error ? error : new Error(error)
  err.name = title

  console.error(`Error ${title} sent to Sentry`)
}

export { getPathLink, getValueFromPath, logError, scrollToNestedElement, scrollToTop }
