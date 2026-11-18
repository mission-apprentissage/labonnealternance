import type { Metadata } from "next"
import { CandidatureDetail } from "@/app/(espace-pro)/espace-pro/(connected)/_components/CandidatureDetail"
import { METADATA } from "@/utils/routes.metadata.utils"

export const metadata: Metadata = {
  title: METADATA.dynamic.backEntrepriseCandidatureDetail().title,
}

export default function Page() {
  return <CandidatureDetail />
}
