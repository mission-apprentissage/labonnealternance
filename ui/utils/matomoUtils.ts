export const MATOMO_EVENTS = {
  FILTER_HANDI_CHANGED: "filter_handi_changed",
  FILTER_DROPDOWN_OPENED: "filter_dropdown_opened",
}

type MatomoEvent = {
  event: (typeof MATOMO_EVENTS)[keyof typeof MATOMO_EVENTS] | string
  [key: string]: unknown
}

export const pushMatomoEvent = (event: MatomoEvent) => {
  if (typeof window === "undefined") return

  window._mtm = window._mtm || []
  window._mtm.push(event)
}
