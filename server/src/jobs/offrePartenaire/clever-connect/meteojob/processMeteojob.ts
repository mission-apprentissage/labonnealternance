import { importMeteojobRaw, importMeteojobToComputed } from "@/jobs/offrePartenaire/clever-connect/meteojob/importMeteojob"

export const processMeteojob = async () => {
  await importMeteojobRaw()
  await importMeteojobToComputed()
}
