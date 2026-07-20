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
  JOB_CREATION_STARTED: "job_creation_started",
  JOB_CREATION_COMPLETED: "job_creation_completed",
  JOB_CREATION_FT_PARTNERSHIP_STEP: "job_creation_ft_partnership_step",
  OFFER_EDIT_CLICKED: "offer_edit_clicked",
  OFFER_EXTEND_CLICKED: "offer_extend_clicked",
  OFFER_VIEW_ONLINE_CLICKED: "offer_view_online_clicked",
  OFFER_PRINT_CLICKED: "offer_print_clicked",
  OFFER_LINK_COPIED: "offer_link_copied",
  OFFER_CFA_SHARE_CLICKED: "offer_cfa_share_clicked",
  OFFER_DELETE_CONFIRMED: "offer_delete_confirmed",
}

export function getMatomoJobOfferType(ideaType: LBA_ITEM_TYPE | LBA_ITEM_TYPE_OLD): LBA_ITEM_TYPE | "non_renseigné" {
  switch (ideaType) {
    case LBA_ITEM_TYPE.RECRUTEURS_LBA:
    case LBA_ITEM_TYPE_OLD.LBA:
    case LBA_ITEM_TYPE_OLD.LBB:
      return LBA_ITEM_TYPE.RECRUTEURS_LBA
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA:
    case LBA_ITEM_TYPE_OLD.MATCHA:
      return LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES:
    case LBA_ITEM_TYPE_OLD.PARTNER_JOB:
    case LBA_ITEM_TYPE_OLD.PE:
    case LBA_ITEM_TYPE_OLD.PEJOB:
      return LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES
    default:
      return "non_renseigné"
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
