import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { ConformityWithAgentNote, getAgentNoteSections } from "./AgentNote"

describe("getAgentNoteSections", () => {
  it("renvoie un bloc par champ, dans l'ordre de la page, et sépare le libellé du critère de l'extrait", () => {
    const sections = getAgentNoteSections([
      { champ: "job_description", category: "experience_exigee", verbatim: "Une première alternance réussie" },
      { champ: "job_description", category: "poste_salarie", verbatim: null },
    ])

    expect(sections.map(({ field }) => field)).toEqual(["job_employer_description", "job_description"])
    expect(sections[0].items).toEqual([])
    expect(sections[1].items).toEqual([
      { label: "Expérience exigée", verbatim: "Une première alternance réussie" },
      { label: "Responsabilités de salarié confirmé", verbatim: null },
    ])
  })
})

describe("ConformityWithAgentNote", () => {
  it("ajoute au badge un bouton de divulgation, fermé par défaut, qui contrôle la note de l'agent", () => {
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
    expect(html).not.toContain('role="tooltip"')
    const [, panelId] = html.match(/<button[^>]*aria-expanded="false"[^>]*aria-controls="([^"]+)"[^>]*>Note de l’agent<\/button>/) ?? []
    expect(panelId).toBeTruthy()
    expect(html).toMatch(new RegExp(`<div[^>]*id="${panelId}"[^>]*hidden=""`))
    expect(html).toMatch(/La description de l’entreprise :<\/span> Conforme/)
    expect(html).toMatch(/<ul[^>]*><li>Expérience exigée \(<q>Une première alternance réussie<\/q>\)<\/li><\/ul>/)
  })

  it("n'affiche que le badge quand l'analyse n'a pas abouti", () => {
    const html = renderToStaticMarkup(<ConformityWithAgentNote summary={{ offer_moderation_verdict: "a_verifier", offer_moderation_status: "indisponible", findings: [] }} />)

    expect(html).not.toContain("<button")
    expect(html).not.toContain("Note de l’agent")
  })
})
