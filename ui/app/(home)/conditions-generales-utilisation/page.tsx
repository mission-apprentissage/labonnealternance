import { Metadata } from "next"

import { fetchNotionPage } from "@/services/fetchNotionPage"
import { PAGES } from "@/utils/routes.utils"

import CGURendererClient from "./CGURendererClient"

export const metadata: Metadata = {
  title: PAGES.static.cgu.getMetadata().title,
  description: PAGES.static.cgu.getMetadata().description,
}

export default async function CGU() {
  const notionPage = await fetchNotionPage("3086c10e9c074efdaa895c089961fcd0")
  return <CGURendererClient recordMap={notionPage} />
}
