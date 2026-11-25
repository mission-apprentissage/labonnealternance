import { describe, expect, it } from "vitest"

import { isInBold } from "./email.test.utils"

describe("isInBold", () => {
  it.each([
    { html: '<span style="font-weight: 700;">X</span>', expected: true },
    { html: '<td style="font-weight:700">A<br>X</td>', expected: true },
    { html: "<strong>X</strong>", expected: true },
    { html: "<b>X</b>", expected: true },
    { html: '<span style="font-weight:700"><span>X</span></span>', expected: true },
    { html: '<span style="font-weight: 700;">A</span> X', expected: false },
    { html: '<div style="font-weight:400">A<br>X</div>', expected: false },
    { html: "<body>X</body>", expected: false },
    { html: '<title>X</title><body><div style="font-weight:700" aria-label="X">A</div><p>X</p></body>', expected: false },
    { html: '<span style="font-weight: 700;">Voici <em>la</em> réponse : X</span>', expected: true },
    { html: '<span style="font-weight: 700;"><a href="#">lien</a><br/>X</span>', expected: true },
    { html: '<span style="font-weight:600">X</span>', expected: true },
    { html: '<span style="font-weight: bold">X</span>', expected: true },
    { html: '<div style="font-weight:700"><span style="font-weight: 700;">A</span> X</div>', expected: true },
    { html: '<span style="font-weight: 700;"><span style="font-weight:400">X</span></span>', expected: false },
    { html: '<br data-x="font-weight:700">X', expected: false },
    { html: '<!--[if mso]><td style="font-weight:700"><![endif]-->X', expected: false },
  ])("$html → $expected", ({ html, expected }) => {
    expect(isInBold(html, "X")).toBe(expected)
  })
})
