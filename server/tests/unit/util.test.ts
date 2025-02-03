import assert from "assert"

import { cleanEmail, removeUrlsFromText } from "shared/helpers/common"
import { describe, it } from "vitest"

import __filename from "../../src/common/filename"
import { isOriginLocal } from "../../src/common/utils/isOriginLocal"

describe(__filename(import.meta.url), () => {
  it("Détection origine autorisée - retourne false si undefined ", () => {
    const result = isOriginLocal(undefined)
    assert.strictEqual(result, false)
  })

  it("Détection origine autorisée - retourne false si origine inconnue ", () => {
    const result = isOriginLocal("fauxDomaine")
    assert.strictEqual(result, false)
  })

  it("Détection origine autorisée - retourne true si origine connue localhost ", () => {
    const result = isOriginLocal(process.env.LBA_PUBLIC_URL)
    assert.strictEqual(result, true)
  })

  it("Détection origine autorisée - retourne true si origine connue labonnealternance.apprentissage.beta.gouv.fr", () => {
    const result = isOriginLocal("https://labonnealternance.apprentissage.beta.gouv.fr/")
    assert.strictEqual(result, true)
  })

  it("Détection origine autorisée - retourne true si origine connue labonnealternance-recette.apprentissage.beta.gouv.fr/recherche?isTrainingOnly=1", () => {
    const result = isOriginLocal("https://labonnealternance.apprentissage.beta.gouv.fr/recherche?isTrainingOnly=1")
    assert.strictEqual(result, true)
  })

  it("Suppression des accents et caractères spéciaux des adresses emails", () => {
    assert.strictEqual(cleanEmail(""), "")
    assert.strictEqual(cleanEmail("àlan.léruŷêïÿt@test.fr"), "alan.leruyeiyt@test.fr")
    assert.strictEqual(cleanEmail("jhönœ.dôœ.’£'^&/=!*?}ù@têst .com "), "jhono.doo.u@test.com")
  })

  it("Suppression des différentes formes d'URL dans un texte", () => {
    assert.strictEqual(removeUrlsFromText(undefined), "")
    assert.strictEqual(removeUrlsFromText(null), "")
    assert.strictEqual(removeUrlsFromText(""), "")
    assert.strictEqual(removeUrlsFromText("clean text"), "clean text")
    assert.strictEqual(removeUrlsFromText("text https://url.com end"), "text  end")
    assert.strictEqual(removeUrlsFromText("text http://www.url.com https://url.com evil-pirate@hack.com end"), "text    end")
    assert.strictEqual(removeUrlsFromText("text https://url.com www.url.com/?meh=lah mailto:evil@hack.com ftp://bad-ressource.com/path/path"), "text    ")
  })
})
