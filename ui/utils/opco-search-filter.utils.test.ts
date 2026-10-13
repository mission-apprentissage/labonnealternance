import { NextResponse } from "next/server"
import { describe, expect, it } from "vitest"

import { applyOpcoFilterFromUrl, OPCO_FILTER_COOKIE_NAME, readOpcoFilterCookie } from "./opco-search-filter.utils"

const apply = (query: string) => {
  const response = NextResponse.next()
  applyOpcoFilterFromUrl(new URLSearchParams(query), response.cookies)
  return response.cookies
}

describe("applyOpcoFilterFromUrl", () => {
  it("pose la clé normalisée en cookie de session utilisable en iframe", () => {
    const cookies = apply("opco=akto")

    expect(cookies.get(OPCO_FILTER_COOKIE_NAME)).toMatchObject({ value: "AKTO", sameSite: "none", secure: true, partitioned: true, path: "/" })
    expect(cookies.get(OPCO_FILTER_COOKIE_NAME)?.maxAge).toBeUndefined()
  })

  it("ne touche à rien sans paramètre opco dans l'URL", () => {
    expect(apply("q=boulanger").getAll()).toEqual([])
  })

  it("ignore une valeur invalide plutôt que d'effacer le filtre en place", () => {
    expect(apply("opco=inconnu").getAll()).toEqual([])
  })

  it("retire le filtre sur un paramètre vide", () => {
    const cookie = apply("opco=").get(OPCO_FILTER_COOKIE_NAME)

    expect(cookie?.value).toBe("")
    expect(cookie?.expires).toEqual(new Date(0))
  })
})

describe("readOpcoFilterCookie", () => {
  it("restitue la clé du cookie de session", () => {
    expect(readOpcoFilterCookie("mtm_consent=1; lba_opco=AKTO")).toBe("AKTO")
  })

  it("écarte un cookie altéré, que l'API refuserait", () => {
    expect(readOpcoFilterCookie("lba_opco=FAUX")).toBeUndefined()
  })

  it("renvoie undefined sans cookie", () => {
    expect(readOpcoFilterCookie("")).toBeUndefined()
  })
})
