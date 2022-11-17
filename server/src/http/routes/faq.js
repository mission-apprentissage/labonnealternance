import express from "express"
import { NotionAPI } from "notion-client"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"

const notion = new NotionAPI()

export default () => {
  const router = express.Router()

  router.get(
    "/recruteur",
    // eslint-disable-next-line no-empty-pattern
    tryCatch(async ({}, res) => {
      const recordMap = await notion.getPage("95ae35012c6d4a32851b6c7b031fd28e")
      return res.json({ ...recordMap })
    })
  )

  router.get(
    "/organisme",
    // eslint-disable-next-line no-empty-pattern
    tryCatch(async ({}, res) => {
      const recordMap = await notion.getPage("b166d0ef1e6042f9a4bfd3a834f498d8")
      return res.json({ ...recordMap })
    })
  )

  router.get(
    "/candidat",
    // eslint-disable-next-line no-empty-pattern
    tryCatch(async ({}, res) => {
      const recordMap = await notion.getPage("2543e456b94649e5aefeefa64398b9f9")
      return res.json({ ...recordMap })
    })
  )

  return router
}
