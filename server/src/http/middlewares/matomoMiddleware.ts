import { matomoClient } from "../../common/utils/MatomoClient.js"

export const matomoMiddleware = () => {
  return (req, res, next) => {
    const urlPath = (req.baseUrl || "") + (req.url || "")
    // non bloquant pour ne pas pénaliser l'utilisateur
    matomoClient.sendFromRequest(req, {
      e_c: "API LBA",
      e_n: "appel API",
      e_a: urlPath,
    })
    next()
  }
}
