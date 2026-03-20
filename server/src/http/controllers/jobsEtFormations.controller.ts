import type { Server } from "@/http/server"

export default (server: Server) => {
  server.get("/v1/jobsEtFormations", async (_req, res) =>
    res.status(410).send({
      error: "API_DECOMMISSIONED",
      message: "Cette API n'est plus disponible. Veuillez utiliser la nouvelle adresse.",
      new_endpoint: "https://api.apprentissage.beta.gouv.fr/fr",
    })
  )
}
