import express from "express"
import jwt from "jsonwebtoken"
import { Optout } from "../../common/model/index.js"
import config from "../../config.js"

export default () => {
  const router = express.Router()

  router.get("/validate", async (req, res) => {
    const token = req.headers.authorization.split(" ")[1]

    if (!token) {
      return res.statut(401).json({ error: true, reason: "TOKEN_NOT_FOUND" })
    }

    const { siret, email } = jwt.verify(token, config.auth["activation"].jwtSecret)

    const user = await Optout.findOne({ siret, "contacts.email": email }).lean()

    if (!user) {
      return res.json({ error: true, reason: "USER_NOT_FOUND" })
    }

    return res.json({
      ...user,
      // Set recipient email for the UI
      email,
    })
  })

  return router
}
