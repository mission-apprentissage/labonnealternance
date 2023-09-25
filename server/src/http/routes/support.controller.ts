import Boom from "boom"
import { NotionAPI } from "notion-client"
import { zRoutes } from "shared/index"

import { Server } from "../server"

const notion = new NotionAPI()

export default (server: Server) => {
  server.get(
    "/api/support/content/:id",
    {
      schema: zRoutes.get["/api/support/content/:id"],
    },
    async ({ params }, res) => {
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
          const title = blockValue?.properties?.title[0][0]
          if (title !== "Documentation") {
            pageTitle = title || ""
          }
        }
      }

      return res.status(200).send({ ...recordMap, pageTitle })
    }
  )
}
