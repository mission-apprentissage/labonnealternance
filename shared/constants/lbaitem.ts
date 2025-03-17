import { assertUnreachable } from "../utils/assertUnreachable.js"

/**
 * KBA 20240805
 * to be split and replaced with shared/models/jobsPartners.model.ts when private route V2 are active
 */
export enum LBA_ITEM_TYPE {
  FORMATION = "formation",
  RECRUTEURS_LBA = "recruteurs_lba",
  OFFRES_EMPLOI_LBA = "offres_emploi_lba",
  OFFRES_EMPLOI_PARTENAIRES = "offres_emploi_partenaires",
}

/**
 * KBA 20240805
 * to be removed once private route V2 are active
 */
export enum LBA_ITEM_TYPE_OLD {
  FORMATION = "formation",
  MATCHA = "matcha",
  LBA = "lba",
  LBB = "lbb",
  PE = "offres",
  PEJOB = "peJob",
  PARTNER_JOB = "partnerJob",
}

/**
 * KBA 20240805
 * to be removed once public API route V2 are active
 */
export const oldItemTypeToNewItemType = (lbaItemType: LBA_ITEM_TYPE_OLD | LBA_ITEM_TYPE): LBA_ITEM_TYPE => {
  switch (lbaItemType) {
    case LBA_ITEM_TYPE_OLD.MATCHA:
      return LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA
    case LBA_ITEM_TYPE_OLD.LBA:
    case LBA_ITEM_TYPE_OLD.LBB:
      return LBA_ITEM_TYPE.RECRUTEURS_LBA
    case LBA_ITEM_TYPE_OLD.PE:
    case LBA_ITEM_TYPE_OLD.PEJOB:
      return LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES
    case LBA_ITEM_TYPE_OLD.FORMATION:
      return LBA_ITEM_TYPE.FORMATION
    case LBA_ITEM_TYPE_OLD.PARTNER_JOB:
      return LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES
    case LBA_ITEM_TYPE.FORMATION:
      return LBA_ITEM_TYPE.FORMATION
    case LBA_ITEM_TYPE.RECRUTEURS_LBA:
      return LBA_ITEM_TYPE.RECRUTEURS_LBA
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA:
      return LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES:
      return LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES
    default:
      assertUnreachable(lbaItemType)
  }
}

/**
 * KBA 20240805
 * to be removed once public API route V2 are active
 */
export const newItemTypeToOldItemType = (lbaItemType: LBA_ITEM_TYPE): LBA_ITEM_TYPE_OLD => {
  switch (lbaItemType) {
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA:
      return LBA_ITEM_TYPE_OLD.MATCHA
    case LBA_ITEM_TYPE.RECRUTEURS_LBA:
      return LBA_ITEM_TYPE_OLD.LBA
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES:
      return LBA_ITEM_TYPE_OLD.PARTNER_JOB
    case LBA_ITEM_TYPE.FORMATION:
      throw new Error("not used")
    default:
      assertUnreachable(lbaItemType)
  }
}

export const allLbaItemType = Object.values(LBA_ITEM_TYPE)
export const allLbaItemTypeOLD = Object.values(LBA_ITEM_TYPE_OLD)
