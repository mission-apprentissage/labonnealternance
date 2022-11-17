import { rawPostalAddress } from "./addressUtils"
//import * as Sentry from "@sentry/react";

const getPathLink = (anyItem) => {
  let res = ""
  if (anyItem?.place) {
    res = `https://www.google.fr/maps/dir//
            ${encodeURIComponent(rawPostalAddress(anyItem.place.fullAddress))}/@
            ${anyItem.place.latitude},
            ${anyItem.place.longitude},
            14z/`
  }
  return res
}

const getCompanyPathLink = (anyItem) => {
  let res = ""
  if (anyItem?.company?.place?.city) {
    res = `https://www.google.fr/maps/dir//${encodeURIComponent(anyItem.company.place.city)}`
  }
  return res
}

const getValueFromPath = (key) => {
  let res = ""
  if (typeof window !== "undefined") {
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

const scrollToElementInContainer = (containerId, el, yOffsett, behavior) => {
  document.getElementById(containerId).scrollTo({
    top: el.offsetTop - yOffsett,
    left: 0,
    behavior,
  })
}

const getItemElement = (item) => {
  let id = ""

  let realItem = item.items ? item.items[0] : item

  switch (realItem.ideaType) {
    case "peJob": {
      id = `peJob${realItem.job.id}`
      break
    }
    case "formation": {
      id = `id${realItem.id}`
      break
    }
    case "matcha": {
      id = `matcha${realItem.job.id}`
      break
    }
    default: {
      //aka. lbb et lba
      id = `${realItem.ideaType}${realItem.company.siret}`
      break
    }
  }

  try {
    return document.getElementById(id).parentElement
  } catch (err) {
    return null
  }
}

const logError = (title, error) => {
  let err = error instanceof Error ? error : new Error(error)
  err.name = title
  //Sentry.captureException(err);
  console.log(`Error ${title} sent to Sentry`)
}

export { getPathLink, getCompanyPathLink, getValueFromPath, scrollToTop, scrollToElementInContainer, getItemElement, logError }
