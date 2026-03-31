import dayjs from "dayjs"
export const DATE_DERNIERE_MISE_A_JOUR: Date = new Date("2026-01-27")
export const DATE_FIN_EXONERATION_CHARGES_APPRENTISSAGE: Date = new Date("2025-03-01")

export const MIN_DEBUT_CONTRAT = dayjs().startOf("year")
export const NEXT_START_OF_MONTH = dayjs().add(1, "month").startOf("month")
export const MIN_DATE_NAISSANCE = dayjs().subtract(77, "years")
export const MAX_DATE_NAISSANCE = dayjs().subtract(14, "years")
