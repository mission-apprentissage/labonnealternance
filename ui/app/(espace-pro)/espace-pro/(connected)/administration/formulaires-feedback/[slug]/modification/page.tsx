import type { Metadata } from "next"

import { METADATA } from "@/utils/routes.metadata.utils"

import { FeedbackFormEdition } from "./FeedbackFormEdition"

export const metadata: Metadata = {
  title: METADATA.dynamic.backAdminFeedbackFormEdit().title,
}

export default async function AdministrationModificationFormulaireFeedback({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <FeedbackFormEdition slug={slug} />
}
