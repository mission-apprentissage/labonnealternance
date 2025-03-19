import { importMonsterRaw, importMonsterToComputed } from "./importMonster"

export const processMonster = async () => {
  await importMonsterRaw()
  await importMonsterToComputed()
}
