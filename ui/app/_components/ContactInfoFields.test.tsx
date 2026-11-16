import { Formik } from "formik"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { ContactInfoFields, type ContactInfoFieldsVariant } from "./ContactInfoFields"

const render = ({ variant, emailDisabled = false, phoneError }: { variant?: ContactInfoFieldsVariant; emailDisabled?: boolean; phoneError?: string }) => {
  const html = renderToStaticMarkup(
    <Formik
      initialValues={{ last_name: "", first_name: "", phone: "", email: "" }}
      initialTouched={phoneError ? { phone: true } : {}}
      initialErrors={phoneError ? { phone: phoneError } : {}}
      onSubmit={vi.fn()}
    >
      <ContactInfoFields variant={variant} emailDisabled={emailDisabled} />
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
})
