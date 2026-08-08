import type { INiveauDiplomeEuropeen } from "shared/models/jobs-partners.model"
import type { IApiError } from "@/common/utils/error-manager"
import type { ILbaItemCompany, ILbaItemFormation, ILbaItemFtJob, ILbaItemJob } from "./lbaitem.shared.service.types"

export type TJobSearchQuery = {
  romes?: string
  romeDomain?: string
  rncp?: string
  referer?: string
  caller?: string | null | undefined
  latitude?: number
  longitude?: number
  radius?: number
  insee?: string
  sources?: string
  // sources?: LBA_ITEM_TYPE
  diploma?: INiveauDiplomeEuropeen
  opco?: string
  opcoUrl?: string
  isMinimalData: boolean
  elligibleHandicapFilter?: boolean
}

export type TFormationSearchQuery = TJobSearchQuery & { region?: string; departement?: string }

export type TLbaItemResult<T extends ILbaItemCompany | ILbaItemFormation | ILbaItemFtJob | ILbaItemJob> =
  | IApiError
  | {
      results: T[]
    }
