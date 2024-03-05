export enum LBA_ITEM_TYPE {
  FORMATION = "formation",
  RECRUTEURS_LBA = "recruteurs_lba",
  OFFRES_EMPLOI_LBA = "offres_emploi_lba",
  OFFRES_EMPLOI_PARTENAIRES = "offres_emploi_partenaires",
}

export const allLbaItemType: string[] = [...Object.values(LBA_ITEM_TYPE)]
