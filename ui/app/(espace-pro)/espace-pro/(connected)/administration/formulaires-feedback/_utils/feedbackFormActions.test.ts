import { describe, expect, it } from "vitest"

import { getFeedbackFormActions } from "./feedbackFormActions"

const ids = (status: "draft" | "active" | "inactive" | "archived") => getFeedbackFormActions({ slug: "fiche", status }).map(({ id }) => id)

describe("actions sur un formulaire", () => {
  it("propose l'activation et la suppression sur un brouillon", () => {
    expect(ids("draft")).toEqual(["results", "preview", "edit", "duplicate", "activate", "archive", "delete"])
  })

  it("propose la désactivation sur un formulaire actif, sans suppression possible", () => {
    expect(ids("active")).toEqual(["results", "preview", "edit", "duplicate", "deactivate", "archive"])
  })

  it("propose la réactivation sur un formulaire inactif, sans suppression possible", () => {
    expect(ids("inactive")).toEqual(["results", "preview", "edit", "duplicate", "activate", "archive"])
  })

  it("permet de consulter, dupliquer ou supprimer un formulaire archivé", () => {
    expect(ids("archived")).toEqual(["results", "preview", "duplicate", "delete"])
  })

  it("fait passer les seules actions destructives par une confirmation", () => {
    const confirmed = getFeedbackFormActions({ slug: "fiche", status: "draft" }).filter((action) => action.kind === "confirm")
    expect(confirmed.map(({ id }) => id)).toEqual(["archive", "delete"])
  })
})
