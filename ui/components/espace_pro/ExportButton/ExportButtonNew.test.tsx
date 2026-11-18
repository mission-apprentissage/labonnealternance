import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { AUTHTYPE } from "@/common/contants"
import ExportButtonNew from "./ExportButtonNew"

vi.mock("@/context/UserContext", () => ({ useAuth: () => ({ user: { type: AUTHTYPE.OPCO } }) }))
vi.mock("react-csv", () => ({ CSVLink: ({ data }: { data: string }) => <pre>{data}</pre> }))

describe("ExportButtonNew, export OPCO", () => {
  it("n'exporte pas la conformité de l'offre, valeur interne de la liste des comptes", () => {
    const html = renderToStaticMarkup(
      <ExportButtonNew data={[{ establishment_siret: "11000001500013", establishment_raison_sociale: "Entreprise test", offer_conformity: "non_conforme", job_detail: [] }]} />
    )
    const [header, row] = html.replace(/<\/?pre>/g, "").split("\n")

    expect(header).toContain("establishment_raison_sociale")
    expect(row).toContain("Entreprise test")
    expect(header).not.toContain("offer_conformity")
    expect(row).not.toContain("non_conforme")
  })
})
