import { renderToStaticMarkup } from "react-dom/server"
import { ETAT_UTILISATEUR } from "shared/constants/recruteur"
import type { ISameSiretAccountJson } from "shared/routes/user.routes"
import { describe, expect, it } from "vitest"
import { buildDuplicateWarning, SameSiretAccountsTable } from "./SameSiretAccounts"

const account: ISameSiretAccountJson = {
  _id: "6ad734de852d3675eb942548",
  organizationId: "6ad734de852d3675eb942549",
  first_name: "Camille",
  last_name: "Martin",
  email: "camille.martin@example.fr",
  createdAt: "2025-03-01T00:00:00.000Z",
  status: ETAT_UTILISATEUR.DESACTIVE,
  status_date: "2026-06-01T00:00:00.000Z",
  status_reason: "doublon",
  last_action_date: null,
  jobs_count: 3,
}

describe("SameSiretAccountsTable", () => {
  it("indique qu'aucun autre compte n'a ce SIRET", () => {
    const html = renderToStaticMarkup(<SameSiretAccountsTable accounts={[]} viewer="ADMIN" />)

    expect(html).toContain("Aucun autre compte n&#x27;a été créé avec ce SIRET.")
    expect(html).not.toContain("<table")
  })

  it("affiche date de création, statut, motif et nombre d'offres", () => {
    const html = renderToStaticMarkup(<SameSiretAccountsTable accounts={[account]} viewer="ADMIN" />)

    expect(html).toContain("1 autre compte avec ce SIRET")
    expect(html).toContain("01/03/2025")
    expect(html).toContain("Inactif")
    expect(html).toContain("depuis le 01/06/2026")
    expect(html).toContain("doublon")
    expect(html).toContain("<td>3</td>")
  })

  it("renvoie l'admin vers la fiche admin du compte, avec son organisation", () => {
    const html = renderToStaticMarkup(<SameSiretAccountsTable accounts={[account]} viewer="ADMIN" />)

    expect(html).toContain(`href="/espace-pro/administration/users/${account._id}?organizationId=${account.organizationId}"`)
  })

  it("renvoie l'OPCO vers la fiche OPCO du compte", () => {
    const html = renderToStaticMarkup(<SameSiretAccountsTable accounts={[account]} viewer="OPCO" />)

    expect(html).toContain(`href="/espace-pro/opco/users/${account._id}"`)
    expect(html).not.toContain("/administration/")
  })
})

describe("buildDuplicateWarning", () => {
  const actif = { ...account, _id: "6ad734de852d3675eb942550", status: ETAT_UTILISATEUR.VALIDE }
  const enAttente = { ...account, _id: "6ad734de852d3675eb942551", status: ETAT_UTILISATEUR.ATTENTE }

  it("ne compte comme désactivés que les comptes désactivés", () => {
    expect(buildDuplicateWarning([actif, enAttente], true)).toBe("2 autres comptes existent pour ce SIRET. Vérifiez qu'il ne s'agit pas d'un doublon avant d'activer ce compte.")
  })

  it("indique le nombre de comptes désactivés", () => {
    expect(buildDuplicateWarning([account, actif, { ...account, _id: "6ad734de852d3675eb942552" }], true)).toBe(
      "3 autres comptes existent pour ce SIRET, dont 2 désactivés. Vérifiez qu'il ne s'agit pas d'un doublon avant d'activer ce compte."
    )
  })

  it("accorde au singulier", () => {
    expect(buildDuplicateWarning([account], true)).toBe("1 autre compte, désactivé, existe pour ce SIRET. Vérifiez qu'il ne s'agit pas d'un doublon avant d'activer ce compte.")
    expect(buildDuplicateWarning([actif], true)).toBe("1 autre compte existe pour ce SIRET. Vérifiez qu'il ne s'agit pas d'un doublon avant d'activer ce compte.")
  })

  it("ne parle pas d'activation pour un compte déjà tranché", () => {
    expect(buildDuplicateWarning([actif], false)).toBe("1 autre compte existe pour ce SIRET. Vérifiez qu'il ne s'agit pas d'un doublon.")
  })
})
