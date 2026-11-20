import type { Metadata } from "next"
import { CandidatureDetail } from "@/app/(espace-pro)/espace-pro/(connected)/_components/CandidatureDetail"
import { APPLICATION_PAGE_METADATA_TITLES } from "@/utils/application-breadcrumb.utils"

export const metadata: Metadata = {
  title: APPLICATION_PAGE_METADATA_TITLES.detail,
}

export default function Page() {
  return <CandidatureDetail />
}
