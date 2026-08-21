import type { Metadata } from "next"
import { fetchNotionPage } from "@/services/fetch-notion-page"
import { METADATA } from "@/utils/routes.metadata.utils"
import MentionLegalesRendererClient from "./MentionLegalesRendererClient"

export const metadata: Metadata = {
  title: METADATA.static.mentionsLegales().title,
  description: METADATA.static.mentionsLegales().description,
}

export default async function MentionsLegales() {
  const mentionsLegales = await fetchNotionPage("edb34310adc744b4b2001c34f162ee5a")

  return <MentionLegalesRendererClient mentionsLegales={mentionsLegales} />
}
