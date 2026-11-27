import { readdirSync, readFileSync } from "node:fs"
import ejs from "ejs"
import mjml from "mjml"
import { describe, expect, it } from "vitest"

import { getStaticFilePath } from "@/common/utils/get-static-file-path"

const templatesDir = getStaticFilePath("templates")
const templates = readdirSync(templatesDir)
  .filter((file) => file.endsWith(".mjml.ejs"))
  .sort()

// Tout champ absent des valeurs explicites s'affiche comme son chemin (`{data.company_name}`) et vaut vrai dans
// une condition : un seul jeu de données couvre ainsi tous les templates. Les tableaux, eux, doivent être réels.
const fakeData = (values: Record<string, unknown>, path = "data"): Record<string, unknown> =>
  new Proxy(values, {
    get(target, prop) {
      if (prop === Symbol.toPrimitive || prop === "toString") return () => `{${path}}`
      if (typeof prop === "symbol") return undefined
      const value = target[prop]
      if (Array.isArray(value)) return value
      if (value !== null && typeof value === "object") return fakeData(value as Record<string, unknown>, `${path}.${prop}`)
      return prop in target ? value : fakeData({}, `${path}.${prop}`)
    },
  })

const values = {
  publicEmail: "contact@exemple.fr",
  utmParams: "utm_source=test&utm_campaign=snapshot",
  images: {
    logoRf: "https://exemple.fr/logo_republique_francaise.png",
    logoLba: "https://exemple.fr/logo_la_bonne_alternance.png",
    logoNumeriqueGouv: "https://exemple.fr/logo_numerique_gouv.png",
  },
  threshold: 3,
  comment: "Première ligne.\nSeconde ligne.",
  jobSourceType: "ENTREPRISE",
  reasons: ["Profil incomplet"],
  agent_note: [["Paragraphe de la note."]],
  offres: [fakeData({}, "data.offres[0]")],
  delegations: [{ raison_sociale: "CFA du test", adresse_etablissement: "1 rue du Test, 75001 Paris" }],
  suggestions: [{ title: "Commis de cuisine", company: "Boulangerie du test", city: "Paris" }],
  appointment: { reasons: ["modalite", "autre"] },
  applicant_answers_to_recruiter_questions: [{ question: "Avez-vous le permis B ?", answer: "Oui" }],
}

// Même chaîne que mailer.renderEmail, sans minification pour que les écarts de snapshot restent lisibles.
const render = async (file: string, data = fakeData(values)) => {
  const source = await new Promise<string>((resolve, reject) => ejs.renderFile(`${templatesDir}/${file}`, { data }, (err, html) => (err ? reject(err) : resolve(html))))
  return mjml(source, { minify: false })
}

describe("rendu des templates d'e-mails (#5796)", () => {
  it.each(templates)("%s", async (file) => {
    const { html, errors } = await render(file)

    await expect(html).toMatchFileSnapshot(`./__snapshots__/mail-templates/${file.replace(".mjml.ejs", ".html")}`)
    // La validation MJML est permissive (le mail part malgré les erreurs) : les erreurs sont figées pour qu'une
    // nouvelle apparaisse dans le diff du snapshot.
    expect(errors.map(({ tagName, message }) => `${tagName} : ${message}`)).toMatchSnapshot()
  })

  // Le jeu commun rend vrais isParcoursup et isAffelnet à la fois : la variante Affelnet est vérifiée à part.
  const affelnetTemplates = templates.filter((file) => readFileSync(`${templatesDir}/${file}`, "utf8").includes("isAffelnet"))

  it.each(affelnetTemplates)("%s : titre de la variante Choisir son affectation après la 3e", async (file) => {
    const { html } = await render(file, fakeData({ ...values, isParcoursup: false, isAffelnet: true }))
    const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1].replace(/\s+/g, " ")

    expect(title).toContain("Choisir son affectation après la 3e")
    expect(title).not.toContain("Parcoursup")
  })
})
