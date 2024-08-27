import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

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

const scrollToElementInContainer = ({ containerId, el, yOffsett = 250 }) => {
  el &&
    document.getElementById(containerId).scrollTo({
      top: el.offsetTop - yOffsett,
      left: 0,
    })
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

const getItemElement = (item) => {
  let id = ""

  const realItem = item.items ? item.items[0] : item
  const kind: LBA_ITEM_TYPE_OLD = realItem.ideaType

  switch (kind) {
    case LBA_ITEM_TYPE_OLD.PEJOB: {
      id = `peJob${realItem.job.id}`
      break
    }
    case LBA_ITEM_TYPE_OLD.FORMATION: {
      id = `id${realItem.id}`
      break
    }
    case LBA_ITEM_TYPE_OLD.MATCHA: {
      id = `matcha${realItem.job.id}`
      break
    }
    case LBA_ITEM_TYPE_OLD.LBA: {
      id = `${realItem.ideaType}${realItem.company.siret}`
      break
    }
    default: {
      // TODO : typer item
      // assertUnreachable(item)
      break
    }
  }

  try {
    return document.getElementById(id).parentElement
  } catch (err) {
    return null
  }
}

const logError = (title, error = undefined) => {
  const err = error instanceof Error ? error : new Error(error)
  err.name = title

  console.error(`Error ${title} sent to Sentry`)
}

export { getItemElement, getPathLink, getValueFromPath, logError, scrollToElementInContainer, scrollToNestedElement, scrollToTop }
