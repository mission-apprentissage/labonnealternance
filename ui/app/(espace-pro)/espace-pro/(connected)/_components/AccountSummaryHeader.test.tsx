import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { AccountSummaryHeader } from "./AccountSummaryHeader"

const account = {
  type: "ENTREPRISE",
  email: "lea.durand@example.fr",
  establishment_siret: "12345678900012",
  establishment_raison_sociale: "BOULANGERIE MARTIN",
  address: "12 rue des Lilas 69003 LYON",
  origin: "création de compte entreprise",
  createdAt: "2026-11-03T10:00:00.000Z",
}

const render = (props: Partial<typeof account>) =>
  renderToStaticMarkup(<AccountSummaryHeader account={{ ...account, ...props }} title="Boulangerie Martin" statusBadge={<span>À VÉRIFIER</span>} actions={null} />)

describe("AccountSummaryHeader", () => {
  it("relie le SIRET à l'Annuaire des entreprises et enchaîne date, origine et liens de vérification", () => {
    const html = render({})

    expect(html).toContain('href="https://annuaire-entreprises.data.gouv.fr/etablissement/12345678900012"')
    expect(html).toContain("sur l&#x27;Annuaire des entreprises")
    expect(html).toContain("créé le 03/11/2026 · origine : création de compte entreprise · ")
    expect(html).toContain("Rechercher l&#x27;email")
    expect(html).toContain("Google Maps")
    expect(html).toContain("Entreprise")
    expect(html).toContain("<h1")
  })

  it("n'affiche pas de séparateur orphelin quand des informations manquent", () => {
    const html = render({ origin: null, address: null, email: null })

    expect(html).not.toContain("origine")
    expect(html).not.toContain("Google Maps")
    expect(html).not.toMatch(/·\s*</)
  })

  it("affiche le type CFA", () => {
    expect(render({ type: "CFA" })).toContain(">CFA<")
  })
})
