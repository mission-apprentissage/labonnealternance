import { describe, expect, it } from "vitest"

import { buildRecherchePageMetadata } from "./recherche.metadata.utils"

const titleOf = (qs: string) => buildRecherchePageMetadata(new URLSearchParams(qs)).title
const robotsOf = (qs: string) => buildRecherchePageMetadata(new URLSearchParams(qs)).robots

describe("buildRecherchePageMetadata — repli SSR sur les URL du moteur legacy (?job_name=)", () => {
  it("restaure le titre métier legacy exact pour une URL ?job_name= sans géo", () => {
    // 2ᵉ source de trafic organique : sans ce repli, le nouveau moteur (schéma `q`) sert un titre générique.
    expect(titleOf("display=list&job_name=Auxiliaire de puériculture&romes=J1304")).toBe("Alternance Auxiliaire de puériculture : offres et formations | La bonne alternance")
  })

  it("ajoute la ville quand l'URL legacy porte une géo libellée (lat/lon/address)", () => {
    expect(titleOf("job_name=Plomberie&romes=F1603&lat=45.75&lon=4.85&address=Lyon")).toBe("Alternance Plomberie à Lyon : offres et formations | La bonne alternance")
  })

  it("restaure aussi description et canonical métier (parité avec la page legacy, zéro churn)", () => {
    const meta = buildRecherchePageMetadata(new URLSearchParams("job_name=Data analyst&romes=M1403"))
    expect(meta.description).toContain("Data analyst")
    expect(meta.alternates?.canonical).toBe("/recherche?romes=M1403&job_name=Data+analyst")
  })

  it("laisse le titre générique quand job_name est VIDE (page de marque, ex. romes=K2101) — pas de faux titre métier", () => {
    // Garde-fou : ces pages sont candidates au noindex ciblé (#5034), elles ne doivent pas se voir attribuer un métier.
    expect(titleOf("display=list&job_name=&romes=K2101")).toBe("Offres en alternance | La bonne alternance")
  })

  it("laisse le titre générique pour une recherche par romes seul (comportement legacy inchangé)", () => {
    expect(titleOf("display=list&romes=J1410")).toBe("Offres en alternance | La bonne alternance")
  })

  it("laisse le titre générique pour /recherche nue", () => {
    expect(titleOf("")).toBe("Offres en alternance | La bonne alternance")
  })

  it("le nouveau moteur (`q`) reste prioritaire et n'utilise pas le repli legacy", () => {
    expect(titleOf("q=boulanger")).toBe("Offres en alternance - boulanger sur la France entière | La bonne alternance")
    // q présent gagne même si un job_name legacy traîne dans l'URL
    expect(titleOf("q=boulanger&job_name=Plombier")).toBe("Offres en alternance - boulanger sur la France entière | La bonne alternance")
  })
})

describe("buildRecherchePageMetadata — noindex chirurgical des pages /recherche sans intention propre (#5034)", () => {
  it("passe /recherche nue en noindex (redondante avec l'accueil : ~98 % de requêtes de marque)", () => {
    // La page nue capte les requêtes « la bonne alternance » déjà servies par l'accueil → on consolide dessus.
    expect(robotsOf("")).toEqual({ index: false, follow: true })
  })

  it("passe en noindex une page à job_name VIDE (page de marque, ex. romes=K2101)", () => {
    expect(robotsOf("display=list&job_name=&romes=K2101")).toEqual({ index: false, follow: true })
  })

  it("passe en noindex une recherche par romes seul, sans métier libellé", () => {
    expect(robotsOf("display=list&romes=J1410")).toEqual({ index: false, follow: true })
  })

  it("laisse INDEXÉE (robots hérité) une page à job_name réel — 2ᵉ source de trafic, ~213k clics/an", () => {
    expect(robotsOf("display=list&job_name=Auxiliaire de puériculture&romes=J1304")).toBeUndefined()
  })

  it("laisse INDEXÉE (robots hérité) une page du nouveau moteur `q`", () => {
    expect(robotsOf("q=boulanger")).toBeUndefined()
  })
})
