import { describe, expect, it } from "vitest"
import { getAccountMatches } from "./same-siret-accounts.service"

const account = (props: { first_name?: string; last_name?: string; phone?: string }) => ({ first_name: "Léa", last_name: "Durand", phone: "0601020304", ...props })

describe("getAccountMatches", () => {
  it("ne signale rien quand seul le nom de famille est commun", () => {
    expect(getAccountMatches(account({}), account({ first_name: "Hugo", phone: "0699999999" }))).toEqual([])
  })

  it("ne rapproche pas deux téléphones vides ou trop courts", () => {
    expect(getAccountMatches(account({ phone: "" }), account({ first_name: "Hugo", phone: "" }))).toEqual([])
    expect(getAccountMatches(account({ phone: "1234" }), account({ first_name: "Hugo", phone: "1234" }))).toEqual([])
  })

  it("ne rapproche pas deux noms vides", () => {
    expect(getAccountMatches(account({ first_name: "", last_name: "", phone: "0611111111" }), account({ first_name: "", last_name: "", phone: "0622222222" }))).toEqual([])
  })

  it("rapproche un même numéro écrit avec ou sans indicatif", () => {
    expect(getAccountMatches(account({}), account({ first_name: "Hugo", phone: "+33 6 01 02 03 04" }))).toEqual(["phone"])
    expect(getAccountMatches(account({}), account({ first_name: "Hugo", phone: "0033601020304" }))).toEqual(["phone"])
  })

  it("rapproche un même nom malgré la casse, les accents, les tirets et l'ordre prénom / nom", () => {
    expect(getAccountMatches(account({}), account({ first_name: "LEA", last_name: "durand", phone: "0699999999" }))).toEqual(["name"])
    expect(getAccountMatches(account({ first_name: "Jean-Marc" }), account({ first_name: "jean marc", phone: "0699999999" }))).toEqual(["name"])
    expect(getAccountMatches(account({}), account({ first_name: "Durand", last_name: "Léa", phone: "0699999999" }))).toEqual(["name"])
  })

  it("cumule téléphone et nom", () => {
    expect(getAccountMatches(account({}), account({}))).toEqual(["phone", "name"])
  })
})
