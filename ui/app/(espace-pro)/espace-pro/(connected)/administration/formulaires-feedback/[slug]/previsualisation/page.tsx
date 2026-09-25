import type { Metadata } from "next"

import { METADATA } from "@/utils/routes.metadata.utils"

import { FeedbackFormPreview } from "./FeedbackFormPreview"

export const metadata: Metadata = {
  title: METADATA.static.backAdminFeedbackForms().title,
}

export default async function AdministrationPrevisualisationFormulaireFeedback() {
  return <FeedbackFormPreview />
}
