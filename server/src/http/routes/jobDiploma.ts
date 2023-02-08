// @ts-nocheck
import express from "express"
<<<<<<<< HEAD:server/src/http/routes/updateLBB.controller.ts
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
import { updateContactInfo } from "../../service/lbb/updateContactInfo.js"
========
import { getDiplomasForJobsQuery } from "../../service/jobDiploma.js"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
>>>>>>>> 44bf7099 (refactor: shift to Typescript):server/src/http/routes/jobDiploma.ts

export default function () {
  const router = express.Router()

  router.get(
    "/updateContactInfo",
    tryCatch(async (req, res) => {
      const result = await updateContactInfo(req.query)
      return res.json(result)
    })
  )

  return router
}
