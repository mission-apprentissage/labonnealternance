import { importFranceTravailRaw, importFranceTravailToComputed } from "./import-jobs-france-travail"

export const processFranceTravail = async () => {
  const raw = await importFranceTravailRaw()
  const computed = await importFranceTravailToComputed()
  return { raw, computed }
}
