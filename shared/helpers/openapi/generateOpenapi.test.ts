import { describe, it, expect } from "vitest"

import { generateOpenApiSchema } from "./generateOpenapi"

describe("generateOpenApiSchema", () => {
  it("should generate proper schema", async () => {
    const s = generateOpenApiSchema("V1.0", "Production", "https://labonnealternance.apprentissage.beta.gouv.fr")
    expect(s).toMatchSnapshot()
  })
})
