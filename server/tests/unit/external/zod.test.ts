import { describe, expect, it } from "vitest"
import { z } from "zod"

describe("zod", () => {
  describe("z.email()", () => {
    ;[
      { input: '" "@example.org', expectedOutput: false },
      { input: '"very.(),:;<>[]".VERY."very@\\ "very".unusual"@strange.example.com', expectedOutput: false },
      { input: "inconnu", expectedOutput: false },
      { input: "inconnu", expectedOutput: false },
      { input: "user@domain", expectedOutput: false },
      { input: "user+tag@domain.com", expectedOutput: true },
      { input: "user@domain.com", expectedOutput: true },
      { input: "user@domain-dash.com", expectedOutput: true },
      { input: "user@sub.domain.com", expectedOutput: true },
      { input: "user@sub.domain-dash.com", expectedOutput: true },
      { input: "user.dot@domain.com", expectedOutput: true },
      { input: "user-dash.dot@domain.com", expectedOutput: true },
    ].forEach(({ input, expectedOutput }) => {
      it(`${input} => ${expectedOutput ? "valide" : "invalide"}`, () => {
        expect(z.string().email().safeParse(input).success).toStrictEqual(expectedOutput)
      })
    })
  })

  // https://github.com/colinhacks/zod/pull/2719
  it("preprocess validates with sibling errors", () => {
    expect(() => {
      z.object({
        // Must be first
        missing: z.string().refine(() => false),
        preprocess: z.preprocess((data: any) => data?.trim(), z.string().regex(/ asdf/)),
      }).parse({ preprocess: " asdf" })
    }).toThrow(
      JSON.stringify(
        [
          {
            code: "invalid_type",
            expected: "string",
            received: "undefined",
            path: ["missing"],
            message: "Required",
          },
          {
            validation: "regex",
            code: "invalid_string",
            message: "Invalid",
            path: ["preprocess"],
          },
        ],
        null,
        2
      )
    )
  })
})
