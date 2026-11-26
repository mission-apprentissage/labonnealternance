import type { Metadata } from "next"
import { CandidaturesOffre } from "@/app/(espace-pro)/espace-pro/(connected)/_components/CandidaturesOffre"
import { APPLICATION_PAGE_METADATA_TITLES } from "@/utils/application-breadcrumb.utils"

export const metadata: Metadata = {
  title: APPLICATION_PAGE_METADATA_TITLES.applications,
}

export default function Page() {
  return <CandidaturesOffre />
}
