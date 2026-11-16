import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { MarcheSecteurSection } from "./MarcheSecteurSection"
import { OffresEtCandidaturesSection } from "./OffresEtCandidaturesSection"

const urls = { offresSearchUrl: "/recherche?a", candidaturesSearchUrl: "/recherche?b", utmParams: "utm_source=lba" }

describe("MarcheSecteurSection", () => {
  it("ne rend rien sans chiffres de marché ni offres", () => {
    expect(renderToStaticMarkup(<MarcheSecteurSection secteur="informatique" marche={null} job_count={0} company_count={0} />)).toBe("")
  })

  it("affiche le compteur LBA quand il y a des offres", () => {
    expect(renderToStaticMarkup(<MarcheSecteurSection secteur="informatique" marche={null} job_count={12} company_count={3} />)).toContain("12 offres en alternance")
  })
})

describe("OffresEtCandidaturesSection", () => {
  it("ne rend rien sans offre ni entreprise à contacter", () => {
    expect(renderToStaticMarkup(<OffresEtCandidaturesSection secteur="informatique" job_count={0} algo_company_count={0} cards={[]} {...urls} />)).toBe("")
  })

  it("masque le panneau offres quand il n'y a aucune offre", () => {
    const html = renderToStaticMarkup(<OffresEtCandidaturesSection secteur="informatique" job_count={0} algo_company_count={8} cards={[]} {...urls} />)
    expect(html).not.toContain("Voir les offres en informatique")
    expect(html).toContain("Voir les entreprises à contacter")
  })

  it("masque le panneau candidatures quand il n'y a aucune entreprise à contacter", () => {
    const html = renderToStaticMarkup(<OffresEtCandidaturesSection secteur="informatique" job_count={5} algo_company_count={0} cards={[]} {...urls} />)
    expect(html).toContain("Voir les offres en informatique")
    expect(html).not.toContain("Voir les entreprises à contacter")
  })
})
