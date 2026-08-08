import { importLeboncoin, importLeboncoinToComputed } from "./import-leboncoin"

export const processLeboncoin = async () => {
  await importLeboncoin()
  await importLeboncoinToComputed()
}
