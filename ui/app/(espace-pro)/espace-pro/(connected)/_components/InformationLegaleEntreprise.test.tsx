import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderToStaticMarkup } from "react-dom/server"
import { CFA, ENTREPRISE, OPCOS_LABEL } from "shared/constants/recruteur"
import { describe, expect, it } from "vitest"
import InformationLegaleEntreprise from "./InformationLegaleEntreprise"

const SIRET = "12345678900012"

const entreprise = {
  siret: SIRET,
  raison_sociale: "ENTREPRISE LAMBDA",
  enseigne: null,
  address: "10 RUE DE L'EXEMPLE 75011 PARIS",
  naf_code: "52.10B",
  naf_label: "Entreposage et stockage non frigorifique",
  opco: OPCOS_LABEL.MOBILITE,
}

const render = ({ type, data, hideUnknownOpco }: { type: typeof ENTREPRISE | typeof CFA; data: Record<string, unknown>; hideUnknownOpco?: boolean }) => {
  const client = new QueryClient()
  client.setQueryData([type === ENTREPRISE ? "get-entreprise" : "get-cfa-infos", SIRET], { statusCode: 200, data, error: false })
  return renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <InformationLegaleEntreprise siret={SIRET} type={type} hideUnknownOpco={hideUnknownOpco} />
    </QueryClientProvider>
  )
}

describe("InformationLegaleEntreprise", () => {
  it("annonce l'origine Sirene et affiche le code NAF, sans infobulle", () => {
    const html = render({ type: ENTREPRISE, data: entreprise })

    expect(html).toContain("Informations issues du répertoire")
    expect(html).toContain('href="https://www.insee.fr/fr/information/6675111"')
    expect(html).toContain("Activité (NAF)\u00a0: <b>52.10B, Entreposage et stockage non frigorifique</b>")
    expect(html).toContain("OPCO de référence\u00a0: <b>Opco Mobilités</b>")
    expect(html).not.toContain("tooltip")
  })

  it("n'affiche ni ligne NAF vide ni enseigne absente", () => {
    const html = render({ type: ENTREPRISE, data: { ...entreprise, naf_code: null, naf_label: null } })

    expect(html).not.toContain("Activité (NAF)")
    expect(html).not.toContain("Enseigne")
  })

  it("OPCO inconnu : « non renseigné », ou masqué quand le formulaire le demande", () => {
    const unknown = { ...entreprise, opco: OPCOS_LABEL.UNKNOWN_OPCO }

    expect(render({ type: ENTREPRISE, data: unknown })).toContain("OPCO de référence\u00a0: <b>non renseigné</b>")
    expect(render({ type: ENTREPRISE, data: unknown, hideUnknownOpco: true })).not.toContain("OPCO de référence")
    expect(render({ type: ENTREPRISE, data: entreprise, hideUnknownOpco: true })).toContain("OPCO de référence")
  })

  it("OPCO : libellé court, et « OPCO multiple » traité comme non renseigné", () => {
    expect(render({ type: ENTREPRISE, data: { ...entreprise, opco: OPCOS_LABEL.AKTO } })).toContain("OPCO de référence\u00a0: <b>AKTO</b>")
    expect(render({ type: ENTREPRISE, data: { ...entreprise, opco: OPCOS_LABEL.MULTIPLE_OPCO } })).toContain("OPCO de référence\u00a0: <b>non renseigné</b>")
  })

  it("CFA : établissement, Qualiopi, ni NAF ni OPCO ni engagement handicap", () => {
    const html = render({ type: CFA, data: { ...entreprise, naf_code: "85.59A", naf_label: "Formation continue d'adultes" } })

    expect(html).toContain("Informations de l&#x27;établissement")
    expect(html).toContain("Qualiopi\u00a0: <b>Oui</b>")
    expect(html).not.toContain("NAF")
    expect(html).not.toContain("OPCO")
    expect(html).not.toContain("Engagement Handicap")
  })

  it("sans raison sociale, signale le problème technique au lieu de citer Sirene", () => {
    const html = render({ type: ENTREPRISE, data: { ...entreprise, raison_sociale: null } })

    expect(html).toContain("problème technique")
    expect(html).not.toContain("répertoire")
  })
})
