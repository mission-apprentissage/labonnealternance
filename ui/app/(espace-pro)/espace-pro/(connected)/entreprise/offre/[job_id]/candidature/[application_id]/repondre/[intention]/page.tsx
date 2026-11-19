import type { Metadata } from "next"
import { CandidatureReponse } from "@/app/(espace-pro)/espace-pro/(connected)/_components/CandidatureReponse"
import { APPLICATION_PAGE_METADATA_TITLES } from "@/utils/application-breadcrumb.utils"

export const metadata: Metadata = {
  title: APPLICATION_PAGE_METADATA_TITLES.reply,
}

export default function Page() {
  return <CandidatureReponse />
}
