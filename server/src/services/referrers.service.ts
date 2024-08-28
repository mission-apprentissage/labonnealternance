import { badRequest } from "@hapi/boom"
import { ReferrerObject, referrers } from "shared/constants/referers"

function isReferrer(name: string): name is keyof typeof referrers {
  return Object.keys(referrers).includes(name)
}

export function getReferrerByKeyName(name: string | null | undefined): ReferrerObject {
  if (!name) throw badRequest("Referrer introuvable.")
  const upperName = name.toUpperCase()
  if (!isReferrer(upperName)) {
    throw badRequest("Referrer introuvable.")
  }
  const referrerFound = referrers[upperName]
  return referrerFound
}
