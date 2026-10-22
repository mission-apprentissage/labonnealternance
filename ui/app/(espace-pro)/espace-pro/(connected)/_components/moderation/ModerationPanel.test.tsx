import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { ModerationPanel } from "./ModerationPanel"
import type { IModerationJobDetailJson } from "./moderation.types"

// Décision possible côté serveur et analyse relançable : seul `readOnly` peut masquer les actions.
const buildDetail = (offer: Partial<IModerationJobDetailJson["offer"]> = {}) =>
  ({
    offer: {
      _id: "6ad734de852d3675eb942548",
      offer_status: "InReview",
      offer_moderation_verdict: "non_conforme",
      offer_moderation_status: "ok",
      offer_moderation_review: null,
      ...offer,
    },
    moderation: { _id: "6ad734de852d3675eb942549", findings: [], review: null },
    decision_blocked_reason: null,
    can_reclassify: true,
    reports_count: 0,
  }) as unknown as IModerationJobDetailJson

const render = (detail: IModerationJobDetailJson, readOnly?: boolean) => renderToStaticMarkup(<ModerationPanel detail={detail} onChange={vi.fn()} readOnly={readOnly} />)

describe("ModerationPanel", () => {
  it("n'affiche aucune action en lecture seule, même quand le serveur permettrait de décider", () => {
    const html = render(buildDetail(), true)

    expect(html).toContain("Consultation seule : la décision revient à l’équipe de La bonne alternance.")
    expect(html).not.toContain("Valider l’offre")
    expect(html).not.toContain("Refuser l’offre")
    expect(html).not.toContain("Relancer l’analyse")
  })

  it("affiche les actions à un administrateur", () => {
    const html = render(buildDetail())

    expect(html).toContain("Valider l’offre")
    expect(html).toContain("Refuser l’offre")
    expect(html).toContain("Relancer l’analyse")
    expect(html).not.toContain("Consultation seule")
  })

  it("n'invite pas à relancer ni à décider une analyse en échec en lecture seule", () => {
    const html = render(buildDetail({ offer_moderation_verdict: "a_verifier", offer_moderation_status: "indisponible" }), true)

    expect(html).toContain("L’analyse automatique n’a pas abouti.")
    expect(html).not.toContain("relancez-la")
  })
})
