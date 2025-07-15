import { describe, expect, it } from "vitest"

import { sanitizeTextField } from "./stringUtils"

describe("sanitizeTextField - tests étendus avec keepFormat option", () => {
  it("retourne chaîne vide pour null/undefined", () => {
    expect(sanitizeTextField(null)).toBe("")
    expect(sanitizeTextField(undefined)).toBe("")
  })

  it("garde uniquement balises autorisées si keepFormat=true, sinon tout nettoie", () => {
    const input = `
      <p>Texte <strong>fort</strong> <em>emphase</em> <b>bold</b> <i>italic</i></p>
      <br />
      <ul><li>Item 1</li><li>Item 2</li></ul>
      <div>Div non autorisé</div>
      <section>Section interdite</section>
      <header>Header interdit</header>
    `
    const expectedWithFormat = `
      <p>Texte <strong>fort</strong> <em>emphase</em> <b>bold</b> <i>italic</i></p>
      <br />
      <ul><li>Item 1</li><li>Item 2</li></ul>
      Div non autorisé
      Section interdite
      Header interdit
    `
      .replace(/\s+/g, " ")
      .trim()

    const expectedNoFormat = `
      Texte fort emphase bold italic
      Item 1Item 2
      Div non autorisé
      Section interdite
      Header interdit
    `
      .replace(/\s+/g, " ")
      .trim()

    expect(sanitizeTextField(input, true).replace(/\s+/g, " ").trim()).toBe(expectedWithFormat)
    expect(sanitizeTextField(input, false).replace(/\s+/g, " ").trim()).toBe(expectedNoFormat)
  })

  it("nettoie tous les attributs, même valides, dans les deux modes", () => {
    const input = `<p class="txt" style="color:red" id="p1" data-info="danger" onclick="alert(1)">Texte</p>`
    const expectedWithFormat = `<p>Texte</p>`
    const expectedNoFormat = `Texte`

    expect(sanitizeTextField(input, true)).toBe(expectedWithFormat)
    expect(sanitizeTextField(input, false)).toBe(expectedNoFormat)
  })

  it("supprime les balises script, style et leur contenu, mais garde texte JS brut", () => {
    const input = `<script>alert("XSS")</script><style>body {background: red;}</style>Texte sûr`
    const expectedWithFormat = `Texte sûr`
    const expectedNoFormat = expectedWithFormat

    expect(sanitizeTextField(input, true).replace(/\s+/g, " ").trim()).toBe(expectedWithFormat.replace(/\s+/g, " ").trim())
    expect(sanitizeTextField(input, false).replace(/\s+/g, " ").trim()).toBe(expectedNoFormat.replace(/\s+/g, " ").trim())
  })

  it("décodage HTML simple et double fonctionne dans les deux modes", () => {
    const input = `&lt;p&gt;Texte &amp; &quot;quote&quot;&lt;/p&gt;`
    const expectedWithFormat = `<p>Texte &amp; "quote"</p>`
    const expectedNoFormat = `Texte &amp; "quote"`

    expect(sanitizeTextField(input, true)).toBe(expectedWithFormat)
    expect(sanitizeTextField(input, false)).toBe(expectedNoFormat)
  })

  it("enlève les balises imbriquées interdites dans balises autorisées", () => {
    const input = `<p>Texte <span>span <iframe src="bad"></iframe></span>fin</p>`
    const expectedWithFormat = `<p>Texte span fin</p>`
    const expectedNoFormat = `Texte span fin`

    expect(sanitizeTextField(input, true)).toBe(expectedWithFormat)
    expect(sanitizeTextField(input, false)).toBe(expectedNoFormat)
  })

  it("supprime balises auto-fermantes interdites et content indésirable", () => {
    const input = `<img src="x" onerror="alert(1)" /><input value="test" />Texte`
    const expectedWithFormat = `Texte`
    const expectedNoFormat = `Texte`

    expect(sanitizeTextField(input, true)).toBe(expectedWithFormat)
    expect(sanitizeTextField(input, false)).toBe(expectedNoFormat)
  })

  it("garde balises autorisées même sans fermeture explicite si keepFormat=true, sinon texte brut", () => {
    const input = `<p>Texte <br>ligne<br/>fin</p>`
    const expectedWithFormat = `<p>Texte <br />ligne<br />fin</p>`
    const expectedNoFormat = `Texte lignefin`

    expect(sanitizeTextField(input, true)).toBe(expectedWithFormat)
    expect(sanitizeTextField(input, false)).toBe(expectedNoFormat)
  })

  it("élimine tous les commentaires HTML dans les deux modes", () => {
    const input = `Texte <!-- commentaire --> fin`
    const expectedWithFormat = `Texte  fin`
    const expectedNoFormat = `Texte  fin`

    expect(sanitizeTextField(input, true)).toBe(expectedWithFormat)
    expect(sanitizeTextField(input, false)).toBe(expectedNoFormat)
  })

  it("supprime attributs event handlers et CSS malveillant", () => {
    const input = `<p onclick="alert(1)" style="background-image:url(javascript:alert(2))">Texte</p>`
    const expectedWithFormat = `<p>Texte</p>`
    const expectedNoFormat = `Texte`

    expect(sanitizeTextField(input, true)).toBe(expectedWithFormat)
    expect(sanitizeTextField(input, false)).toBe(expectedNoFormat)
  })

  it("nettoie balises <a> avec href javascript: - balise supprimée, texte conservé", () => {
    const input = `<a href="javascript:alert('XSS')">Cliquez</a>`
    const expectedWithFormat = `Cliquez`
    const expectedNoFormat = `Cliquez`

    expect(sanitizeTextField(input, true)).toBe(expectedWithFormat)
    expect(sanitizeTextField(input, false)).toBe(expectedNoFormat)
  })

  it("supprime balises <object>, <embed> et contenu dans les deux modes", () => {
    const input = `<object data="bad.swf"></object>Texte`
    const expectedWithFormat = `Texte`
    const expectedNoFormat = `Texte`

    expect(sanitizeTextField(input, true)).toBe(expectedWithFormat)
    expect(sanitizeTextField(input, false)).toBe(expectedNoFormat)
  })

  it("supporte les espaces, tabulations et retours ligne dans le texte", () => {
    const input = "Ligne 1\r\n\tLigne 2\n  Ligne 3\rLigne 4"
    expect(sanitizeTextField(input, true)).toBe(input)
    expect(sanitizeTextField(input, false)).toBe(input)
  })

  it("garde le texte brut sans HTML", () => {
    const input = "Juste un texte simple"
    expect(sanitizeTextField(input, true)).toBe(input)
    expect(sanitizeTextField(input, false)).toBe(input)
  })

  it("nettoie une longue séquence HTML complexe avec plusieurs attaques", () => {
    const input = `
      <p style="color:red" onclick="alert(1)">Texte <strong>bold</strong> <em>emphase</em></p>
      <script>malicious()</script>
      <iframe src="bad"></iframe>
      <a href="javascript:alert(2)">Click</a>
      <img src="x" onerror="alert(3)">
      <style>body {background:url("javascript:alert(4)");}</style>
      <ul><li>Item 1</li><li>Item 2</li></ul>
      <!-- commentaire -->
      Texte final
    `
    const expectedWithFormat = `
      <p>Texte <strong>bold</strong> <em>emphase</em></p>
      
      Click
      
      
      <ul><li>Item 1</li><li>Item 2</li></ul>
      
      Texte final
    `
      .replace(/\s+/g, " ")
      .trim()

    const expectedNoFormat = `
      Texte bold emphase
      Click
      Item 1Item 2
      Texte final
    `
      .replace(/\s+/g, " ")
      .trim()

    expect(sanitizeTextField(input, true).replace(/\s+/g, " ").trim()).toBe(expectedWithFormat)
    expect(sanitizeTextField(input, false).replace(/\s+/g, " ").trim()).toBe(expectedNoFormat)
  })

  it("gère les doubles encodages HTML (ex: &amp;lt;) correctement", () => {
    const input = "&amp;lt;script&amp;gt;alert('XSS')&amp;lt;/script&amp;gt;<p>Safe</p>"
    const expectedWithFormat = `<p>Safe</p>`
    const expectedNoFormat = `Safe`

    expect(sanitizeTextField(input, true)).toBe(expectedWithFormat)
    expect(sanitizeTextField(input, false)).toBe(expectedNoFormat)
  })
})
