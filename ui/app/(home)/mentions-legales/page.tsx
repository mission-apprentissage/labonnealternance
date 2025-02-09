import { Metadata } from "next"

import { fetchNotionPage } from "../../../services/fetchNotionPage"
import { PAGES } from "../../../utils/routes.utils"

import MentionLegalesRendererClient from "./MentionLegalesRendererClient"

export const metadata: Metadata = {
  title: PAGES.static.mentionsLegales.getMetadata().title,
  description: PAGES.static.mentionsLegales.getMetadata().description,
}

export default async function FAQ() {
  const mentionsLegales = await fetchNotionPage("edb34310adc744b4b2001c34f162ee5a")

  return <MentionLegalesRendererClient mentionsLegales={mentionsLegales} />
}
