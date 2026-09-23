import type { Metadata } from "next"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { METADATA } from "@/utils/routes.metadata.utils"
import { PAGES } from "@/utils/routes.utils"

import { FeedbackFormCreation } from "./FeedbackFormCreation"

export const metadata: Metadata = {
  title: METADATA.static.backAdminFeedbackFormCreation().title,
}

export default async function AdministrationCreationFormulaireFeedback() {
  return (
    <>
      <Breadcrumb pages={[PAGES.static.backAdminHome, PAGES.static.backAdminFeedbackForms, PAGES.static.backAdminFeedbackFormCreation]} />
      <FeedbackFormCreation />
    </>
  )
}
