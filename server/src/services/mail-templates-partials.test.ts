import ejs from "ejs"
import { describe, expect, it } from "vitest"

import { getStaticFilePath } from "@/common/utils/get-static-file-path"

const site = "https://labonnealternance.apprentissage.beta.gouv.fr"
const data = { publicEmail: "contact@exemple.fr", images: { logoRf: "rf.png", logoLba: "lba.png" } }

const renderPartial = (name: string, params: Record<string, unknown> = {}) =>
  new Promise<string>((resolve, reject) =>
    ejs.renderFile(getStaticFilePath(`templates/partials/${name}.ejs`), { data, ...params }, (err, html) => (err ? reject(err) : resolve(html)))
  )

const hrefs = (html: string) => [...html.matchAll(/href="([^"]*)"/g)].map(([, href]) => href)

describe("partial header", () => {
  it("lie le logo au site, sans query string par défaut", async () => {
    expect(hrefs(await renderPartial("header"))).toEqual([site])
  })

  it("ajoute utm au lien du logo", async () => {
    expect(hrefs(await renderPartial("header", { utm: "utm_campaign=test" }))).toEqual([`${site}?utm_campaign=test`])
  })
})

describe("partial footer", () => {
  it("rend les liens sans query string ni ancre par défaut", async () => {
    expect(hrefs(await renderPartial("footer"))).toEqual([
      `${site}/faq`,
      "mailto:contact@exemple.fr",
      "mailto:contact@exemple.fr?subject=Droit%20opposition",
      `${site}/politique-de-confidentialite`,
    ])
  })

  it("ajoute utm à la FAQ et à la politique de confidentialité, avant l'ancre", async () => {
    const html = await renderPartial("footer", { utm: "utm_campaign=test", faqAnchor: "recruteur", contactSubject: "Confirmez%20votre%20email" })

    expect(hrefs(html)).toEqual([
      `${site}/faq?utm_campaign=test#recruteur`,
      "mailto:contact@exemple.fr?subject=Confirmez%20votre%20email",
      "mailto:contact@exemple.fr?subject=Droit%20opposition",
      `${site}/politique-de-confidentialite?utm_campaign=test`,
    ])
  })

  it("laisse faqUtm et privacyUtm remplacer utm lien par lien", async () => {
    const html = await renderPartial("footer", { utm: "utm_campaign=commun", faqUtm: "utm_campaign=faq", privacyUtm: "utm_campaign=rgpd" })

    expect(hrefs(html)).toContain(`${site}/faq?utm_campaign=faq`)
    expect(hrefs(html)).toContain(`${site}/politique-de-confidentialite?utm_campaign=rgpd`)
  })

  it("échappe les & des UTM", async () => {
    expect(hrefs(await renderPartial("footer", { utm: "utm_source=a&utm_campaign=b" }))).toContain(`${site}/faq?utm_source=a&amp;utm_campaign=b`)
  })

  it("omet le bloc de contact avec contact: false", async () => {
    const html = await renderPartial("footer", { contact: false })

    expect(html).not.toContain("Pour toute question")
    expect(hrefs(html)).not.toContain(`${site}/faq`)
  })

  it("rend chaque phrase de contactReason, en chaîne ou en tableau", async () => {
    expect(await renderPartial("footer", { contactReason: "Phrase unique." })).toContain("<br />Phrase unique.")

    const html = await renderPartial("footer", { contactReason: ["Première phrase.", "Seconde phrase."] })
    expect(html).toContain("<br />Première phrase.")
    expect(html).toContain("<br />Seconde phrase.")
  })

  it("rend la mention du Tableau de bord de l'apprentissage avec legal: tableau-de-bord", async () => {
    const html = await renderPartial("footer", { legal: "tableau-de-bord" })

    expect(html).toContain("votre école transmet vos données au Tableau de bord de l’apprentissage")
    expect(hrefs(html)).not.toContain("mailto:contact@exemple.fr?subject=Droit%20opposition")
  })
})
