import { describe, it, expect } from "vitest"

import { useMongo } from "@tests/utils/mongo.utils"
import { useServer } from "@tests/utils/server.utils"

describe("constantsRoutes", () => {
  useMongo()
  const httpClient = useServer()

  it("Vérifie que l'on expose bien l'ensemble des constantes", async () => {
    await httpClient()
      .get("/api/constants")
      .expect(200)
      .then((response) => expect(response.body.referrers).not.toHaveLength(0))
  })
})
