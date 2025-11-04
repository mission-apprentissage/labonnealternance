import type { Metadata } from "next"

import PolitiqueDeConfidentialiteRendererClient from "./PDCRendererClient"
import { fetchNotionPage } from "@/services/fetchNotionPage"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.politiqueConfidentialite.getMetadata().title,
  description: PAGES.static.politiqueConfidentialite.getMetadata().description,
}

export default async function PolitiqueDeConfidentialite() {
  const politiqueDeConfidentialite = await fetchNotionPage("2d7d9cda6d9a4059baa84eacff592139")
  return <PolitiqueDeConfidentialiteRendererClient politiqueDeConfidentialite={politiqueDeConfidentialite} />
}
