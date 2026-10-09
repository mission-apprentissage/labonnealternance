import { NextResponse } from "next/server"
import { describe, expect, it } from "vitest"

import { applyOpcoFilterFromUrl, OPCO_FILTER_COOKIE_NAME, OPCO_URL_FILTER_COOKIE_NAME, readOpcoFilterQuerystring } from "./opco-search-filter.utils"

const apply = (query: string) => {
  const response = NextResponse.next()
  applyOpcoFilterFromUrl(new URLSearchParams(query), response.cookies)
  return response.cookies
}

describe("applyOpcoFilterFromUrl", () => {
  it("pose les deux filtres normalisés en cookie de session utilisable en iframe", () => {
    const cookies = apply("opco=akto&opcoUrl=https://www.JeCompte.fr/")

    expect(cookies.get(OPCO_FILTER_COOKIE_NAME)).toMatchObject({ value: "AKTO", sameSite: "none", secure: true, partitioned: true, path: "/" })
    expect(cookies.get(OPCO_FILTER_COOKIE_NAME)?.maxAge).toBeUndefined()
    expect(cookies.get(OPCO_URL_FILTER_COOKIE_NAME)?.value).toBe("www.jecompte.fr")
  })

  it("ne touche à rien sans paramètre OPCO dans l'URL", () => {
    expect(apply("q=boulanger").getAll()).toEqual([])
  })

  it("ignore une valeur invalide plutôt que d'effacer le filtre en place", () => {
    expect(apply("opco=inconnu&opcoUrl=pas un domaine").getAll()).toEqual([])
  })

  it("retire le filtre sur un paramètre vide", () => {
    const cookies = apply("opco=")

    expect(cookies.get(OPCO_FILTER_COOKIE_NAME)).toMatchObject({ value: "", maxAge: 0 })
    expect(cookies.get(OPCO_URL_FILTER_COOKIE_NAME)).toBeUndefined()
  })
})

describe("readOpcoFilterQuerystring", () => {
  it("restitue les paramètres de /v1/search", () => {
    expect(readOpcoFilterQuerystring("mtm_consent=1; lba_opco=AKTO; lba_opco_url=www.jecompte.fr")).toEqual({ opco: "AKTO", opcoUrl: "www.jecompte.fr" })
  })

  it("écarte un cookie altéré, que l'API refuserait", () => {
    expect(readOpcoFilterQuerystring("lba_opco=FAUX; lba_opco_url=a b")).toEqual({})
  })

  it("renvoie un objet vide sans cookie", () => {
    expect(readOpcoFilterQuerystring("")).toEqual({})
  })
})
