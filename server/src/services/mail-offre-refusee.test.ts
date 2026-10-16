import { describe, expect, it } from "vitest"

import { getStaticFilePath } from "@/common/utils/get-static-file-path"
import mailer from "./mailer.service"

const render = (data: { agent_note: string[]; comment: string | null }) =>
  mailer.renderEmail(getStaticFilePath("./templates/mail-offre-refusee.mjml.ejs"), {
    images: { logoLba: "https://exemple.fr/logo_LBA.png", logoRf: "https://exemple.fr/logo_rf.png" },
    nom: "Martin",
    prenom: "Sylvie",
    date_depot: "01/10/2026",
    job_title: "Commis de cuisine",
    raison_sociale: "Boulangerie du test",
    charteRedactionUrl: "https://exemple.fr/guide",
    publicEmail: "contact@exemple.fr",
    ...data,
  })

describe("e-mail de refus d'une offre (#5499)", () => {
  it("insère la note de l'agent puis le commentaire, échappé", async () => {
    const html = await render({ agent_note: ["Premier paragraphe de la note.", "Second paragraphe."], comment: "Merci de corriger <b>les horaires</b>." })

    expect(html).toContain("Vous avez déposé le 01/10/2026 l’offre en alternance")
    expect(html).toContain("elle ne peut pas être diffusée sur La bonne alternance en l’état")
    expect(html.indexOf("Premier paragraphe de la note.")).toBeLessThan(html.indexOf("Second paragraphe."))
    expect(html.indexOf("Second paragraphe.")).toBeLessThan(html.indexOf("Merci de corriger"))
    expect(html).toContain("&lt;b&gt;les horaires&lt;/b&gt;")
    expect(html).not.toContain("<b>les horaires</b>")
  })

  it("reste générique sans note ni commentaire", async () => {
    const html = await render({ agent_note: [], comment: null })

    expect(html).toContain("Découvrir la charte de rédaction")
    expect(html).not.toContain("#F6F6F6")
  })
})
