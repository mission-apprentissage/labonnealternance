import type { ExtendedRecordMap } from "notion-types"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { NotionRenderer } from "react-notion-x"
import { describe, expect, it } from "vitest"

// Garde-fou du patch .yarn/patches/react-notion-x-*.patch (RGAA 8.9, #5542) : si une montée de
// version de react-notion-x le fait sauter, ces tests échouent.

const PAGE_ID = "00000000-0000-0000-0000-000000000000"

const block = (id: string, value: Record<string, unknown>) => ({ role: "reader", value: { id, alive: true, parent_id: PAGE_ID, parent_table: "block", ...value } })

const recordMap = (blocks: Record<string, ReturnType<typeof block>>, pageContent: string[]) =>
  ({
    block: { [PAGE_ID]: block(PAGE_ID, { type: "page", content: pageContent, properties: { title: [["Page"]] } }), ...blocks },
    collection: {},
    collection_view: {},
    notion_user: {},
    collection_query: {},
    signed_urls: {},
  }) as unknown as ExtendedRecordMap

const render = (map: ExtendedRecordMap) => renderToStaticMarkup(createElement(NotionRenderer, { recordMap: map, fullPage: false, disableHeader: true }))

describe("patch react-notion-x", () => {
  it("rend un bloc texte en <p>", () => {
    const html = render(recordMap({ t1: block("t1", { type: "text", properties: { title: [["Un paragraphe"]] } }) }, ["t1"]))

    expect(html).toMatch(/<p class="notion-text[^"]*">Un paragraphe<\/p>/)
    expect(html).not.toMatch(/<div class="notion-text[^"]*">Un paragraphe/)
  })

  it("garde un conteneur div, avec le texte en <p>, pour un bloc texte à enfants", () => {
    const html = render(
      recordMap(
        {
          parent: block("parent", { type: "text", properties: { title: [["Parent"]] }, content: ["child"] }),
          child: block("child", { type: "text", parent_id: "parent", properties: { title: [["Enfant"]] } }),
        },
        ["parent"]
      )
    )

    expect(html).toMatch(/<div class="notion-text[^"]*"><p class="notion-text-content">Parent<\/p><div class="notion-text-children">/)
    expect(html).toMatch(/<p class="notion-text[^"]*">Enfant<\/p>/)
  })

  it("masque le bloc vide d'espacement aux technologies d'assistance", () => {
    const html = render(recordMap({ blank: block("blank", { type: "text" }) }, ["blank"]))

    expect(html).toMatch(/<div class="notion-blank[^"]*" aria-hidden="true">/)
  })
})
