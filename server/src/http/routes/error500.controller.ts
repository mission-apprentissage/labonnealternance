import express from "express"

/**
 * Simulate a dummy error
 */
export default () => {
  const router = express.Router()

  router.get("/", function (req, res) {
    res.status(500).send({ error: "Something failed ! This is a simulated error." })
  })

  return router
}
