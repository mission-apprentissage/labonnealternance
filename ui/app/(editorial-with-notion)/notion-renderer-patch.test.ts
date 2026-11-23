import type { ExtendedRecordMap } from "notion-types"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { NotionRenderer } from "react-notion-x"
import { describe, expect, it } from "vitest"

// Garde-fou du patch .yarn/patches/react-notion-x-*.patch (RGAA 8.9, #5542 ; RGAA 9.3, #6005) : si
// une montée de version de react-notion-x le fait sauter, ces tests échouent.

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

  it("regroupe des puces consécutives dans une seule liste", () => {
    const html = render(
      recordMap(
        {
          b1: block("b1", { type: "bulleted_list", properties: { title: [["Un"]] } }),
          b2: block("b2", { type: "bulleted_list", properties: { title: [["Deux"]] } }),
          b3: block("b3", { type: "bulleted_list", properties: { title: [["Trois"]] } }),
        },
        ["b1", "b2", "b3"]
      )
    )

    expect(html.match(/<ul/g)).toHaveLength(1)
    expect(html).toMatch(/<ul class="notion-list notion-list-disc[^"]*"><li>Un<\/li><li>Deux<\/li><li>Trois<\/li><\/ul>/)
  })

  it("imbrique une sous-liste dans le li de sa puce parente", () => {
    const html = render(
      recordMap(
        {
          b1: block("b1", { type: "bulleted_list", properties: { title: [["Parent"]] }, content: ["c1", "c2"] }),
          c1: block("c1", { type: "bulleted_list", parent_id: "b1", properties: { title: [["Enfant 1"]] } }),
          c2: block("c2", { type: "bulleted_list", parent_id: "b1", properties: { title: [["Enfant 2"]] } }),
          b2: block("b2", { type: "bulleted_list", properties: { title: [["Suivant"]] } }),
        },
        ["b1", "b2"]
      )
    )

    expect(html).toMatch(/<ul class="[^"]*"><li>Parent<ul class="[^"]*"><li>Enfant 1<\/li><li>Enfant 2<\/li><\/ul><\/li><li>Suivant<\/li><\/ul>/)
    expect(html).not.toMatch(/<\/li><ul/)
  })

  it("sépare une liste numérotée interrompue par un paragraphe en deux ol, en gardant la numérotation de Notion", () => {
    const html = render(
      recordMap(
        {
          n1: block("n1", { type: "numbered_list", properties: { title: [["Premier"]] } }),
          n2: block("n2", { type: "numbered_list", properties: { title: [["Deuxième"]] } }),
          t1: block("t1", { type: "text", properties: { title: [["Coupure"]] } }),
          n3: block("n3", { type: "numbered_list", properties: { title: [["Reprise"]] }, format: { list_start_index: 3 } }),
          n4: block("n4", { type: "numbered_list", properties: { title: [["Suite"]] } }),
        },
        ["n1", "n2", "t1", "n3", "n4"]
      )
    )

    const lists = [...html.matchAll(/<ol start="(\d+)"[^>]*>(.*?)<\/ol>/g)]
    expect(lists.map(([, start, content]) => [start, content.match(/<li>/g)?.length])).toEqual([
      ["1", 2],
      ["3", 2],
    ])
    expect(html).toMatch(/<\/ol><p class="notion-text[^"]*">Coupure<\/p><ol/)
  })
})
