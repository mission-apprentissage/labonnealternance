import { Formik } from "formik"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import DropdownCombobox from "./DropdownCombobox"

const render = ({ touched, error }: { touched: boolean; error?: string }) => {
  const html = renderToStaticMarkup(
    <Formik initialValues={{ rome_label: "" }} initialTouched={{ rome_label: touched }} initialErrors={error ? { rome_label: error } : {}} onSubmit={vi.fn()}>
      <DropdownCombobox label="Métier" name="rome_label" handleSearch={vi.fn()} saveSelectedItem={vi.fn()} placeholder="Rechercher un métier" />
    </Formik>
  )
  const input = html.match(/<input [^>]*>/)?.[0] ?? ""
  const attr = (name: string) => input.match(new RegExp(` ${name}="([^"]*)"`))?.[1]
  return { html, input, attr }
}

describe("DropdownCombobox", () => {
  it("rend la structure du champ DSFR : groupe, label avec indication, input, groupe de messages", () => {
    const { html, attr } = render({ touched: false })

    expect(html).toMatch(
      new RegExp(
        `<div class="fr-input-group"><label class="fr-label" for="${attr("id")}"[^>]*>Métier<span class="fr-hint-text">Sélectionnez un métier pour référencer l&#x27;offre</span></label><input [^>]*class="fr-input"[^>]*><div [^>]*class="fr-messages-group"[^>]*></div></div>`
      )
    )
  })

  it("expose le pattern ARIA combobox sur l'input", () => {
    const { html, input, attr } = render({ touched: false })

    expect(attr("role")).toBe("combobox")
    expect(attr("aria-expanded")).toBe("false")
    expect(html).toMatch(new RegExp(`<ul [^>]*id="${attr("aria-controls")}" role="listbox"`))
    expect(input).not.toContain("aria-activedescendant")
    expect(input).toContain(`required=""`)
    expect(attr("name")).toBe("rome_label")
  })

  it("passe en erreur DSFR et lie le message à l'input une fois le champ touché", () => {
    const { html, attr } = render({ touched: true, error: "Champ obligatoire" })

    expect(html).toContain(`<div class="fr-input-group fr-input-group--error">`)
    expect(html).toContain(`<p id="${attr("aria-describedby")}" class="fr-message fr-message--error">Champ obligatoire</p>`)
    expect(attr("aria-invalid")).toBe("true")
  })

  it("n'affiche pas l'erreur d'un champ non touché", () => {
    const { html, attr } = render({ touched: false, error: "Champ obligatoire" })

    expect(html).not.toContain(`class="fr-message `)
    expect(attr("aria-describedby")).toBeUndefined()
    expect(attr("aria-invalid")).toBe("false")
  })
})
