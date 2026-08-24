import type { Metadata } from "next"
import { fetchNotionPage } from "@/services/fetch-notion-page"
import { METADATA } from "@/utils/routes.metadata.utils"
import CGURendererClient from "./CGURendererClient"

export const metadata: Metadata = {
  title: METADATA.static.cgu().title,
  description: METADATA.static.cgu().description,
}

export default async function CGU() {
  const notionPage = await fetchNotionPage("3086c10e9c074efdaa895c089961fcd0")
  return <CGURendererClient recordMap={notionPage} />
}
