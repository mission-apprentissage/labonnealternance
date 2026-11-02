import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { ReviewStatusBadge } from "./ModerationBadges"

// Le badge ne contient qu'un nœud texte : on le lit entre les balises plutôt que de retirer celles-ci.
const label = (props: Parameters<typeof ReviewStatusBadge>[0]) => renderToStaticMarkup(<ReviewStatusBadge {...props} />).match(/>([^<>]+)</)?.[1]

describe("ReviewStatusBadge", () => {
  it("n'attend aucune décision sur une offre jugée conforme", () => {
    expect(label({ review: null, isClassified: true, verdict: "conforme", status: "ok" })).toBe("Non requise")
  })

  it.each([
    ["à vérifier", "a_verifier", "ok"],
    ["non conforme", "non_conforme", "ok"],
    ["conforme mais en échec d'analyse", "conforme", "indisponible"],
    ["conforme mais aux tentatives épuisées", "conforme", "epuise"],
  ] as const)("attend une décision sur une offre %s", (_label, verdict, status) => {
    expect(label({ review: null, isClassified: true, verdict, status })).toBe("En attente")
  })

  it("affiche la décision prise, y compris sur une offre conforme", () => {
    expect(label({ review: "validee", isClassified: true, verdict: "conforme", status: "ok" })).toBe("Validé")
    expect(label({ review: "refusee", isClassified: true, verdict: "conforme", status: "ok" })).toBe("Refusé")
  })

  it("ne s'applique pas à une offre jamais classifiée", () => {
    expect(label({ review: null, isClassified: false, verdict: null, status: null })).toBe("Non applicable")
  })
})
