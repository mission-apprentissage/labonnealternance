import { renderToStaticMarkup } from "react-dom/server"
import { ETAT_UTILISATEUR } from "shared/constants/recruteur"
import type { ISameSiretAccountJson } from "shared/routes/user.routes"
import { describe, expect, it } from "vitest"
import { SameSiretAccountsTable } from "./SameSiretAccounts"

const account: ISameSiretAccountJson = {
  _id: "6ad734de852d3675eb942548",
  organizationId: "6ad734de852d3675eb942549",
  first_name: "Camille",
  last_name: "Martin",
  email: "camille.martin@example.fr",
  createdAt: "2025-03-01T00:00:00.000Z",
  status: ETAT_UTILISATEUR.DESACTIVE,
  status_date: "2026-06-01T00:00:00.000Z",
  status_reason: "Compte en doublon",
  last_action_date: null,
  jobs_count: 3,
  matches: [],
}

describe("SameSiretAccountsTable", () => {
  it("indique qu'aucun autre compte n'a ce SIRET", () => {
    const html = renderToStaticMarkup(<SameSiretAccountsTable accounts={[]} viewer="ADMIN" />)

    expect(html).toContain("Aucun autre compte n&#x27;a été créé avec ce SIRET.")
    expect(html).not.toContain("<table")
  })

  it("affiche date de création, statut avec sa date et son motif, et nombre d'offres", () => {
    const html = renderToStaticMarkup(<SameSiretAccountsTable accounts={[account]} viewer="ADMIN" />)

    expect(html).toContain("1 autre compte avec ce SIRET")
    expect(html).toContain("01/03/2025")
    expect(html).toContain("Inactif")
    expect(html).toContain("01/06/2026 · Compte en doublon")
    expect(html).toContain("<td>3</td>")
  })

  it("n'affiche aucun point commun quand il n'y en a pas", () => {
    const html = renderToStaticMarkup(<SameSiretAccountsTable accounts={[account]} viewer="ADMIN" />)

    expect(html).toContain("Aucun")
    expect(html).not.toContain("Même téléphone")
    expect(html).not.toContain("Même nom")
  })

  it("affiche les points communs avec le compte consulté", () => {
    const html = renderToStaticMarkup(<SameSiretAccountsTable accounts={[{ ...account, matches: ["phone", "name"] }]} viewer="ADMIN" />)

    expect(html).toContain("Même téléphone")
    expect(html).toContain("Même nom")
  })

  it("renvoie l'admin vers la fiche admin du compte, avec son organisation", () => {
    const html = renderToStaticMarkup(<SameSiretAccountsTable accounts={[account]} viewer="ADMIN" />)

    expect(html).toContain(`href="/espace-pro/administration/users/${account._id}?organizationId=${account.organizationId}"`)
  })

  it("renvoie l'OPCO vers la fiche OPCO du compte", () => {
    const html = renderToStaticMarkup(<SameSiretAccountsTable accounts={[account]} viewer="OPCO" />)

    expect(html).toContain(`href="/espace-pro/opco/users/${account._id}?organizationId=${account.organizationId}"`)
    expect(html).not.toContain("/administration/")
  })
})
