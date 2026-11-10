import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { ConformityWithAgentNote } from "./AgentNote"

describe("ConformityWithAgentNote", () => {
  it("ajoute au badge une pastille dont l'infobulle porte la note de l'agent", () => {
    const html = renderToStaticMarkup(
      <ConformityWithAgentNote
        summary={{
          offer_moderation_verdict: "non_conforme",
          offer_moderation_status: "ok",
          findings: [{ champ: "job_description", category: "experience_exigee", severity: "doute", verbatim: "Une première alternance réussie" }],
        }}
      />
    )

    expect(html).toContain("Non conforme")
    expect(html).toContain('role="tooltip"')
    expect(html).toContain("Note de l’agent :")
    expect(html).toContain("La description de l’entreprise : Conforme")
    expect(html).toContain("Expérience exigée (“Une première alternance réussie”)")
  })

  it("n'affiche que le badge quand l'analyse n'a pas abouti", () => {
    const html = renderToStaticMarkup(<ConformityWithAgentNote summary={{ offer_moderation_verdict: "a_verifier", offer_moderation_status: "indisponible", findings: [] }} />)

    expect(html).not.toContain('role="tooltip"')
    expect(html).not.toContain("Note de l’agent")
  })
})
