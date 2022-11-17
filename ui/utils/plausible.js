export const SendPlausibleEvent = (name, props) => {
  if (typeof window !== "undefined" && window?.plausible) {
    window.plausible(name, { props })
  }
}

export const GTMPageView = (url) => {
  const pageEvent = {
    event: "pageview",
    page: url,
  }

  window && window.dataLayer && window.dataLayer.push(pageEvent)

  return pageEvent
}

export const SendTrackEvent = (event) => {
  window?.dataLayer?.push(event)
  return event
}
