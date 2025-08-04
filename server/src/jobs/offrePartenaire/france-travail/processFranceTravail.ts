import { importFranceTravailRaw, importFranceTravailToComputed } from "./importJobsFranceTravail"

export const processFranceTravail = async () => {
  await importFranceTravailRaw()
  await importFranceTravailToComputed()
}
