import type { Metadata } from "next"
import { fetchNotionPage } from "@/services/fetch-notion-page"
import { METADATA } from "@/utils/routes.metadata.utils"
import PolitiqueDeConfidentialiteRendererClient from "./PDCRendererClient"

export const metadata: Metadata = {
  title: METADATA.static.politiqueConfidentialite().title,
  description: METADATA.static.politiqueConfidentialite().description,
}

export default async function PolitiqueDeConfidentialite() {
  const politiqueDeConfidentialite = await fetchNotionPage("2d7d9cda6d9a4059baa84eacff592139")
  return <PolitiqueDeConfidentialiteRendererClient politiqueDeConfidentialite={politiqueDeConfidentialite} />
}
