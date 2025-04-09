import { importMeteojobRaw, importMeteojobToComputed } from "./importMeteojob"

export const processMeteojob = async () => {
  await importMeteojobRaw()
  await importMeteojobToComputed()
}
