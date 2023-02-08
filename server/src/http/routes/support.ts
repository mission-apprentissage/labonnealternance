import express from "express"
import { NotionAPI } from "notion-client"
import Boom from "boom"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"

const notion = new NotionAPI()

export default () => {
  const router = express.Router()

  router.get(
    "/content/:id",
    tryCatch(async ({ params }, res) => {
      if (!["7e8a9c1a1ef54cb399f8ae50620f95ce"].includes(params.id)) {
        throw Boom.notFound("Page not found")
      }

      const recordMap = await notion.getPage(params.id)

      let pageTitle = ""
      const keys = Object.keys(recordMap.block)
      for (let index = 0; index < keys.length; index++) {
        const element = keys[index]
        const blockValue = recordMap.block[element].value
        if (blockValue.type === "page") {
          const title = blockValue.properties.title[0][0]
          if (title !== "Documentation") {
            pageTitle = title
          }
        }
      }

      return res.json({ ...recordMap, pageTitle })
    })
  )

  return router
}
