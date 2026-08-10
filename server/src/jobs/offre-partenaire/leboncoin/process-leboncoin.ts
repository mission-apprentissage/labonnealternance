import { importLeboncoin, importLeboncoinToComputed } from "./import-leboncoin"

export const processLeboncoin = async () => {
  const raw = await importLeboncoin()
  const computed = await importLeboncoinToComputed()
  return { raw, computed }
}
