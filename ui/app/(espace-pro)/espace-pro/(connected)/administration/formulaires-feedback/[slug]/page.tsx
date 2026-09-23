import type { Metadata } from "next"

import { METADATA } from "@/utils/routes.metadata.utils"

import { FeedbackFormDetail } from "./FeedbackFormDetail"

export const metadata: Metadata = {
  title: METADATA.static.backAdminFeedbackForms().title,
}

export default async function AdministrationResultatsFormulaireFeedback() {
  return <FeedbackFormDetail />
}
