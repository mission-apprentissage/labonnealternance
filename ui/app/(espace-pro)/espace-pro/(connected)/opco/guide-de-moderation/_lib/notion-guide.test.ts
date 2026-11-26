import { describe, expect, it } from "vitest"
import { OPCO_GUIDE_SECTIONS } from "@/app/(espace-pro)/espace-pro/(connected)/_components/moderation/opco-guide.utils"
import { getOpcoGuideVideoIds, getRenderableHref, structureOpcoGuide } from "./notion-guide"
import { block, heading2, paragraph, sectionHeadings, text, videoFile } from "./notion-guide.fixtures"

const SECTION_COUNT = OPCO_GUIDE_SECTIONS.length

describe("structureOpcoGuide", () => {
  it.each([
    ["une section de moins", sectionHeadings(SECTION_COUNT - 1)],
    ["une section de plus", sectionHeadings(SECTION_COUNT + 1)],
    ["deux sections inversées", [heading2("1. A"), heading2("3. C"), heading2("2. B"), ...sectionHeadings(SECTION_COUNT).slice(6)]],
    ["un titre sans numéro", [heading2("Introduction"), ...sectionHeadings(SECTION_COUNT)]],
    ["un numéro sans point", [heading2("1 Les nouveautés"), ...sectionHeadings(SECTION_COUNT).slice(2)]],
    ["aucun titre", [paragraph(text("Texte fictif"))]],
  ])("refuse la page quand il y a %s, plutôt que de décaler les ancres", (_, blocks) => {
    expect(structureOpcoGuide(blocks).status).toBe("invalid")
  })

  it("rattache chaque titre numéroté à l'ancre de même rang", () => {
    const result = structureOpcoGuide(sectionHeadings(SECTION_COUNT))

    expect(result.status).toBe("ok")
    if (result.status !== "ok") return
    expect(result.guide.sections.map(({ id }) => id)).toEqual(OPCO_GUIDE_SECTIONS.map(({ id }) => id))
  })

  it("garde l'introduction, ignore le sommaire Notion et s'arrête au premier séparateur", () => {
    const intro = paragraph(text("Chapeau fictif"))
    const closing = paragraph(text("Conclusion fictive"))
    const result = structureOpcoGuide([intro, block("table_of_contents"), ...sectionHeadings(SECTION_COUNT), block("divider"), closing])

    expect(result.status).toBe("ok")
    if (result.status !== "ok") return
    expect(result.guide.intro).toEqual([intro])
    expect(result.guide.sections.flatMap(({ blocks }) => blocks)).not.toContain(closing)
  })

  it("signale les blocs non rendus, y compris imbriqués", () => {
    const toggle = block("toggle", { rich_text: [text("Question fictive")] }, [block("child_database")])
    const [firstHeading, ...rest] = sectionHeadings(SECTION_COUNT)
    const result = structureOpcoGuide([firstHeading, block("image"), toggle, ...rest])

    expect(result.status === "ok" && result.unsupportedTypes).toEqual(["child_database", "image"])
  })

  it("rend une vidéo déposée dans Notion, signale un lien vidéo externe", () => {
    const [firstHeading, ...rest] = sectionHeadings(SECTION_COUNT)
    const result = structureOpcoGuide([firstHeading, videoFile(), block("video", { type: "external", external: { url: "https://video.fictive/x" } }), ...rest])

    expect(result.status === "ok" && result.unsupportedTypes).toEqual(["video:external"])
  })
})

describe("getOpcoGuideVideoIds", () => {
  it("liste les vidéos déposées, y compris imbriquées, mais pas les liens externes ni les autres fichiers", () => {
    const top = videoFile()
    const nested = videoFile()
    const [firstHeading, ...rest] = sectionHeadings(SECTION_COUNT)
    const result = structureOpcoGuide([
      firstHeading,
      top,
      block("toggle", { rich_text: [text("Question fictive")] }, [nested]),
      block("video", { type: "external", external: { url: "https://video.fictive/x" } }),
      block("file", { type: "file", file: { url: "https://stockage.fictif/doc.pdf", expiry_time: "2099-01-01T00:00:00.000Z" } }),
      ...rest,
    ])
    if (result.status !== "ok") throw new Error(result.reason)

    expect(getOpcoGuideVideoIds(result.guide)).toEqual([top.id, nested.id])
  })
})

describe("getRenderableHref", () => {
  it.each([
    ["l'exemple masqué que Notion transforme en mailto", "mailto:emxxx@xxx.fr"],
    ["un mailto vers un domaine tiers", "mailto:contact@exemple.fr"],
    ["un domaine qui finit comme le nôtre", "mailto:contact@faux-beta.gouv.fr.example"],
    ["un lien vers l'espace Notion privé", "https://www.notion.so/espace/page-123"],
    ["un lien vers app.notion.com", "https://app.notion.com/p/123"],
    ["un lien relatif Notion", "/4230c88032c881f1b4e5e58a3849ef90"],
    ["un lien non chiffré", "http://exemple.fr"],
    ["un lien javascript", "javascript:alert(1)"],
  ])("ne rend pas de lien pour %s", (_, href) => {
    expect(getRenderableHref(href)).toBeNull()
  })

  it.each(["mailto:contact@labonnealternance.apprentissage.beta.gouv.fr", "https://annuaire-entreprises.data.gouv.fr"])("garde %s", (href) => {
    expect(getRenderableHref(href)).toBe(href)
  })
})
