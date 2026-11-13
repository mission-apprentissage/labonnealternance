import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderToStaticMarkup } from "react-dom/server"
import { AUTHTYPE } from "shared/constants/recruteur"
import { describe, expect, it, vi } from "vitest"
import DetailEntreprise from "./DetailEntreprise"

const session = vi.hoisted(() => ({ type: "CFA" as string }))

vi.mock("@/app/(espace-pro)/espace-pro/contexts/userContext", () => ({ useConnectedSessionClient: () => ({ user: { type: session.type } }) }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock("@/app/hooks/useToast", () => ({ useToast: () => vi.fn() }))
vi.mock("./account-review/AccountReview", () => ({ AccountReview: () => <p>ACCOUNT_REVIEW</p> }))
vi.mock("./OffresTabs", () => ({ OffresTabs: () => null }))
vi.mock("./InformationLegaleEntreprise", () => ({ default: ({ type }: { type: string }) => <p>BLOC_ENTREPRISE type={type}</p> }))

// Réponse de getEntrepriseManagedByCfa (ZRecruiter) : pas de champ `type`
const entreprisePartenaire = {
  _id: "id",
  establishment_id: "establishment-id",
  establishment_siret: "12345678900012",
  establishment_raison_sociale: "ENTREPRISE ALPHA",
  last_name: "Martin",
  first_name: "Lucie",
  phone: "0102030405",
  email: "contact@entreprise-alpha.fr",
}

const render = (userType: string, isCfaManagedEntreprise = false) => {
  session.type = userType
  return renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <DetailEntreprise userRecruteur={entreprisePartenaire} isCfaManagedEntreprise={isCfaManagedEntreprise} />
    </QueryClientProvider>
  )
}

describe("DetailEntreprise", () => {
  it.each([AUTHTYPE.ADMIN, AUTHTYPE.OPCO])("%s sur un compte entreprise : fiche de revue, pas le formulaire d'entreprise partenaire", (userType) => {
    const html = render(userType)

    expect(html).toContain("ACCOUNT_REVIEW")
    expect(html).not.toContain("<form")
  })

  it("CFA : formulaire d'entreprise partenaire, bloc entreprise chargé comme ENTREPRISE malgré l'absence de type", () => {
    const html = render(AUTHTYPE.CFA)

    expect(html).not.toContain("ACCOUNT_REVIEW")
    expect(html).toContain("BLOC_ENTREPRISE type=ENTREPRISE")
    expect(html).toContain("ces informations restent confidentielles")
    expect(html).toContain('type="checkbox"')
    expect(html).not.toContain("<select")
  })

  it("admin sur une entreprise gérée par un CFA : même formulaire, sans les mentions destinées au CFA", () => {
    const html = render(AUTHTYPE.ADMIN, true)

    expect(html).not.toContain("ACCOUNT_REVIEW")
    expect(html).toContain("BLOC_ENTREPRISE type=ENTREPRISE")
    expect(html).not.toContain("confidentielles")
    expect(html).not.toContain('type="checkbox"')
  })
})
