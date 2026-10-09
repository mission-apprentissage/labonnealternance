import { describe, expect, it } from "vitest"

import { isOfferExpired } from "./offer-expiration.js"

const NOW = new Date("2026-10-06T10:00:00.000Z")

describe("isOfferExpired", () => {
  it("une offre expirée la veille reste ouverte", () => {
    expect(isOfferExpired("2026-10-05T11:00:00.000Z", NOW)).toBe(false)
  })

  it("une offre expirée depuis plus de 24 h est fermée", () => {
    expect(isOfferExpired("2026-10-05T09:00:00.000Z", NOW)).toBe(true)
  })

  it("accepte une Date comme une chaîne ISO", () => {
    expect(isOfferExpired(new Date("2026-10-05T09:00:00.000Z"), NOW)).toBe(true)
  })

  it("une date d'expiration future laisse l'offre ouverte", () => {
    expect(isOfferExpired("2026-12-31T00:00:00.000Z", NOW)).toBe(false)
  })

  it.each([[null], [undefined], [""]])("sans date d'expiration (%s), l'offre reste ouverte", (expiration) => {
    expect(isOfferExpired(expiration, NOW)).toBe(false)
  })

  it("une date illisible ne ferme pas l'offre", () => {
    expect(isOfferExpired("pas une date", NOW)).toBe(false)
  })
})
