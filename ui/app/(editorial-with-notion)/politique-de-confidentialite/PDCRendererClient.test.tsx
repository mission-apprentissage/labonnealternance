import type { ExtendedRecordMap } from "notion-types"
import { describe, expect, it } from "vitest"

import { patchPrivacyPolicyRecordMap } from "./PDCRendererClient"

const createRecordMap = (sentence: string): ExtendedRecordMap =>
  ({
    block: {
      page: {
        value: {
          id: "page",
          properties: {
            title: [[sentence]],
          },
        },
      },
      child: {
        value: {
          id: "child",
          properties: {
            title: [["Autre texte"]],
          },
        },
      },
    },
    collection: {},
    collection_view: {},
    notion_user: {},
    collection_query: {},
    signed_urls: {},
  }) as unknown as ExtendedRecordMap

describe("patchPrivacyPolicyRecordMap", () => {
  it("remplace la phrase obsolète de conservation des CV sans toucher au reste du contenu", () => {
    const oldSentence = "Les curriculum vitae sont toutefois supprimés immédiatement après la transmission de la candidature au recruteur."
    const newSentence = "Les curriculum vitae (CV) sont supprimés 12 mois après la transmission de la candidature au recruteur."

    const patched = patchPrivacyPolicyRecordMap(createRecordMap(oldSentence))

    const titles = JSON.stringify(patched)
    expect(titles).toContain(newSentence)
    expect(titles).not.toContain(oldSentence)
    expect(titles).toContain("Autre texte")
  })
})
