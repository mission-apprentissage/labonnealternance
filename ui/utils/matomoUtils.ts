import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

export const MATOMO_EVENTS = {
  FILTER_HANDI_CHANGED: "filter_handi_changed",
  FILTER_DROPDOWN_OPENED: "filter_dropdown_opened",
  FILTER_TYPE_OFFER_APPLIED: "filter_type_offer_applied",
  SALARY_SIMULATION_COMPLETED: "salary_simulation_completed",
  PARTNER_APPLY_POPIN_SHOW: "partner_apply_popin_show",
  PARTNER_APPLY_POPIN_CONFIRMED: "partner_apply_popin_confirmed",
  PARTNER_APPLY_POPIN_LATER: "partner_apply_popin_later",
  PARTNER_APPLY_POPIN_DISMISSED: "partner_apply_popin_dismissed",
  SEARCH_LAUNCHED: "search_launched",
  SEARCH_RESULTS_DISPLAYED: "search_results_displayed",
  JOB_OFFER_CLICKED: "job_offer_clicked",
  JOB_OFFER_VIEWED: "job_offer_viewed",
  SMART_APPLY_OPENED: "smart_apply_opened",
  APPLY_REDIRECT_CLICKED: "apply_redirect_clicked",
  SMART_APPLY_SUBMITTED: "smart_apply_submitted",
  SMART_APPLY_CONFIRMED: "smart_apply_confirmed",
}

export function getMatomoJobOfferType(ideaType: LBA_ITEM_TYPE | LBA_ITEM_TYPE_OLD): string {
  switch (ideaType) {
    case LBA_ITEM_TYPE.RECRUTEURS_LBA:
    case LBA_ITEM_TYPE_OLD.LBA:
      return "lba"
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA:
    case LBA_ITEM_TYPE_OLD.MATCHA:
      return "algo"
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES:
      return "partner"
    default:
      return ideaType
  }
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
