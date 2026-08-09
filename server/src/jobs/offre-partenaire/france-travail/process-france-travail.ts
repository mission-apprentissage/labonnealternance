import { importFranceTravailRaw, importFranceTravailToComputed } from "./import-jobs-france-travail"

export const processFranceTravail = async () => {
  await importFranceTravailRaw()
  await importFranceTravailToComputed()
}
