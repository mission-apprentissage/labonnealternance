import { importLeboncoin, importLeboncoinToComputed } from "./importLeboncoin"

export const processLeboncoin = async () => {
  await importLeboncoin()
  await importLeboncoinToComputed()
}
