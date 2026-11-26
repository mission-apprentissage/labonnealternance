import { describe, expect, it } from "vitest"
import { MODERATION_PAGES } from "@/utils/moderation-pages.utils"
import { PAGES } from "@/utils/routes.utils"
import { getOpcoGuideHref } from "./moderation/opco-guide.utils"
import { isOpcoNavItemActive } from "./NavigationOpco"

const ENTREPRISES = PAGES.static.backOpcoHome.getPath()
const QUEUE = MODERATION_PAGES.opcoQueue.getPath()
const GUIDE = MODERATION_PAGES.opcoGuide.getPath()

const activeItems = (pathname: string) => [ENTREPRISES, QUEUE, GUIDE].filter((href) => isOpcoNavItemActive(pathname, href))

describe("isOpcoNavItemActive", () => {
  it("n'active que « Guide de modération » sur la page du guide, pas « Entreprises » qui en est le préfixe", () => {
    expect(activeItems(GUIDE)).toEqual([GUIDE])
  })

  it("n'active pas le guide sur la file ni sur une offre en modération", () => {
    expect(activeItems(QUEUE)).toEqual([QUEUE])
    expect(activeItems(`${QUEUE}/6ad734de852d3675eb942548`)).toEqual([QUEUE])
  })

  it("garde « Entreprises » actif sur l'accueil OPCO et les fiches entreprise", () => {
    expect(activeItems(ENTREPRISES)).toEqual([ENTREPRISES])
    expect(activeItems(`${ENTREPRISES}/users/6ad734de852d3675eb942548`)).toEqual([ENTREPRISES])
  })
})

describe("getOpcoGuideHref", () => {
  it("pointe sur une ancre du guide", () => {
    expect(getOpcoGuideHref("guide-comptes")).toBe(`${GUIDE}#guide-comptes`)
    expect(getOpcoGuideHref()).toBe(GUIDE)
  })
})
