export const MATOMO_EVENTS = {
  FILTER_HANDI_CHANGED: "filter_handi_changed",
  FILTER_DROPDOWN_OPENED: "filter_dropdown_opened",
  FILTER_TYPE_OFFER_APPLIED: "filter_type_offer_applied",
  SALARY_SIMULATION_COMPLETED: "salary_simulation_completed",
  PARTNER_APPLY_POPIN_SHOW: "partner_apply_popin_show",
  PARTNER_APPLY_POPIN_CONFIRMED: "partner_apply_popin_confirmed",
  PARTNER_APPLY_POPIN_LATER: "partner_apply_popin_later",
  PARTNER_APPLY_POPIN_DISMISSED: "partner_apply_popin_dismissed",
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
