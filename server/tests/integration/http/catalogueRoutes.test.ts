import { describe, it } from "vitest"

import { useMongo } from "@tests/utils/mongo.utils"
import { useServer } from "@tests/utils/server.utils"

describe("catalogueRoutes", () => {
  useMongo()
  const httpClient = useServer()

  it("Vérifie que l'on récupère bien les données de formation depuis la base de données", async () => {
    await httpClient().get("/api/catalogue/formations").expect(200)
  })
})
