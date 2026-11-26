import type { Metadata } from "next"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { METADATA } from "@/utils/routes.metadata.utils"
import { PAGES } from "@/utils/routes.utils"

import { NewslettersList } from "./NewslettersList"

export const metadata: Metadata = {
  title: METADATA.static.backAdminNewsletters().title,
}

export default async function AdministrationInfolettres() {
  return (
    <>
      <Breadcrumb pages={[PAGES.static.backAdminHome, PAGES.static.backAdminNewsletters]} />
      <NewslettersList />
    </>
  )
}
