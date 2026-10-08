import type { Metadata } from "next"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { METADATA } from "@/utils/routes.metadata.utils"
import { PAGES } from "@/utils/routes.utils"

import { FeedbackFormsList } from "./FeedbackFormsList"

export const metadata: Metadata = {
  title: METADATA.static.backAdminFeedbackForms().title,
}

export default async function AdministrationFormulairesFeedback() {
  return (
    <>
      <Breadcrumb pages={[PAGES.static.backAdminHome, PAGES.static.backAdminFeedbackForms]} />
      <FeedbackFormsList />
    </>
  )
}
