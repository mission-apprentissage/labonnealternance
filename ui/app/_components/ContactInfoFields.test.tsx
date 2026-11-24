import { Formik } from "formik"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { ContactInfoFields, type ContactInfoFieldsVariant } from "./ContactInfoFields"

const render = ({
  variant,
  emailDisabled = false,
  phoneError,
  phoneHiddenOption,
  phoneHidden,
}: {
  variant?: ContactInfoFieldsVariant
  emailDisabled?: boolean
  phoneError?: string
  phoneHiddenOption?: { hint?: string }
  phoneHidden?: boolean
}) => {
  const html = renderToStaticMarkup(
    <Formik
      initialValues={{ last_name: "", first_name: "", phone: "", email: "", ...(phoneHidden !== undefined ? { phone_hidden: phoneHidden } : {}) }}
      initialTouched={phoneError ? { phone: true } : {}}
      initialErrors={phoneError ? { phone: phoneError } : {}}
      onSubmit={vi.fn()}
    >
      <ContactInfoFields variant={variant} emailDisabled={emailDisabled} phoneHiddenOption={phoneHiddenOption} />
    </Formik>
  )
  const input = (name: string) => html.match(new RegExp(`<input [^>]*name="${name}"[^>]*>`))?.[0] ?? ""
  const describedIds = (name: string) => (input(name).match(/aria-describedby="([^"]*)"/)?.[1] ?? "").split(" ").filter(Boolean)
  const textOf = (id: string) => html.match(new RegExp(`id="${id}"[^>]*>(.*?)</(?:div|p)>`))?.[1] ?? ""
  return { html, input, describedIds, textOf }
}

describe("ContactInfoFields", () => {
  it("variante opérateur : formats attendus seuls, aucune mention de vérification", () => {
    const { html, describedIds, textOf } = render({})

    expect(html).not.toContain("fr-message--info")
    expect(html).toContain(">Téléphone<")
    expect(describedIds("phone").map(textOf)).toEqual(["10 chiffres, par exemple 0612345678"])
    expect(describedIds("email").map(textOf)).toEqual(["Format attendu : nom@domaine.fr"])
  })

  it("variante recruteur : aide puis mention reliées au champ, dans cet ordre", () => {
    const { describedIds, textOf } = render({ variant: "recruteur" })

    const [phoneHint, phoneMention] = describedIds("phone").map(textOf)
    expect(phoneHint).toBe("Privilégiez un numéro de téléphone fixe à 10 chiffres, par exemple 0212345678")
    expect(phoneMention).toContain("<b>Nos équipes peuvent être amenées à vous appeler</b>")

    const [, emailMention] = describedIds("email").map(textOf)
    expect(emailMention).toContain("la mise en ligne de votre offre")
  })

  it("variante CFA : la mention e-mail vise la validation du compte, pas la mise en ligne d'une offre", () => {
    const { describedIds, textOf } = render({ variant: "cfa" })

    const emailTexts = describedIds("email").map(textOf).join(" ")
    expect(emailTexts).toContain("la validation de votre compte")
    expect(emailTexts).not.toContain("offre")
  })

  it("e-mail désactivé : pas de mention sur un champ non modifiable", () => {
    const { describedIds } = render({ variant: "recruteur", emailDisabled: true })

    expect(describedIds("email")).toHaveLength(1)
  })

  it("en erreur, l'erreur est lue entre l'aide et la mention", () => {
    const { describedIds, textOf } = render({ variant: "recruteur", phoneError: "champ obligatoire" })

    const ids = describedIds("phone")
    expect(ids).toHaveLength(3)
    expect(ids[1]).toMatch(/-error$/)
    expect(ids[2]).toMatch(/-mention$/)
    expect(textOf(ids[2])).toContain("Nos équipes")
  })

  it("variante partenaire : mention de confidentialité sous l'e-mail, aucune sous le téléphone", () => {
    const { describedIds, textOf } = render({ variant: "partenaire" })

    expect(describedIds("phone")).toHaveLength(1)
    expect(describedIds("email").map(textOf).join(" ")).toContain("<b>Important</b> : ces informations restent confidentielles")
  })

  describe("option de masquage du téléphone (#5886)", () => {
    it("sans l'option : aucune case phone_hidden et mention inchangée", () => {
      const { html, input, describedIds, textOf } = render({ variant: "recruteur" })

      expect(input("phone_hidden")).toBe("")
      expect(html).not.toContain("Même masqué")
      expect(textOf(describedIds("phone")[1])).toContain("Nos équipes")
    })

    it("variante recruteur : case sur « mes offres », aide affichée, mention précisant que le numéro reste obligatoire", () => {
      const { html, input, describedIds, textOf } = render({ variant: "recruteur", phoneHiddenOption: { hint: "Vous pourrez modifier ce choix dans votre compte." } })

      expect(input("phone_hidden")).toContain('type="checkbox"')
      expect(input("phone_hidden")).not.toContain("checked")
      expect(html).toContain("Masquer mon numéro de téléphone sur mes offres")
      expect(html).toContain("Vous pourrez modifier ce choix dans votre compte.")
      expect(textOf(describedIds("phone")[1])).toContain("Même masqué, votre numéro reste obligatoire.")
    })

    it("variante opérateur : libellé à la troisième personne, sans mention, case cochée quand le compte est masqué", () => {
      const { html, input } = render({ phoneHiddenOption: {}, phoneHidden: true })

      expect(html).toContain("Masquer le numéro de téléphone sur les offres")
      expect(input("phone_hidden")).toContain("checked")
      expect(html).not.toContain("Même masqué")
    })

    it("variante partenaire : pas de case même si l'option est demandée, ses coordonnées n'apparaissent pas sur les offres", () => {
      const { input } = render({ variant: "partenaire", phoneHiddenOption: {} })

      expect(input("phone_hidden")).toBe("")
    })
  })
})
