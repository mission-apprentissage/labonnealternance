import { describe, expect, it } from "vitest"

import { detectUrlAndEmails } from "./detectUrlAndEmails.js"

describe("detectUrlAndEmails", () => {
  const toBeDetected = [
    ["website domain.fr is great", [{ index: 8, length: 9 }]],
    ["website domain.fr.", [{ index: 8, length: 10 }]],
    ["website domain . fr is great", [{ index: 8, length: 11 }]],
    ["website http://www.domain.fr is great", [{ index: 8, length: 20 }]],
    ["website ftp://www.domain.fr is great", [{ index: 8, length: 19 }]],
    [
      "website www.domain.fr and mail@mail.fr",
      [
        { index: 8, length: 13 },
        { index: 26, length: 12 },
      ],
    ],
    ["website 转让等业务.中文网 great", [{ index: 8, length: 9 }]],
    ["website 转让等业务.中文网", [{ index: 8, length: 9 }]],
    ["domain.fr"],
    ["paris-sud.fr"],
    ["paris_sud.fr"],
    ["paris/sud.fr"],
    ["weird.XN--NGBRX"],
    ["http://monsite.fr:3000"],
  ] as [string, ReturnType<typeof detectUrlAndEmails>][]
  it.each(toBeDetected)("should detect: %s", (str, expected) => {
    if (!expected) {
      expected = [{ index: 0, length: str.length }]
    }
    expect(detectUrlAndEmails(str)).toEqual(expected)
  })

  const notToBeDetected = ["coiffeur H/M", "coiffeur.se", "coiffeur.ses", "agriculteur.trice", "employé.es", "employé.e"]
  it.each(notToBeDetected)("should not be detected: %s", (str) => {
    expect(detectUrlAndEmails(str)).toEqual([])
  })
})
