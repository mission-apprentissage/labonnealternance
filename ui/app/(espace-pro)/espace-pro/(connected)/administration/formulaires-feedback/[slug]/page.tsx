import type { Metadata } from "next"

import { METADATA } from "@/utils/routes.metadata.utils"

import { FeedbackFormDetail } from "./FeedbackFormDetail"

export const metadata: Metadata = {
  title: METADATA.dynamic.backAdminFeedbackFormDetail().title,
}

export default async function AdministrationResultatsFormulaireFeedback() {
  return <FeedbackFormDetail />
}
