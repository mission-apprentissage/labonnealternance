import type { Metadata } from "next"
import { CandidatureReponse } from "@/app/(espace-pro)/espace-pro/(connected)/_components/CandidatureReponse"
import { METADATA } from "@/utils/routes.metadata.utils"

export const metadata: Metadata = {
  title: METADATA.dynamic.backEntrepriseCandidatureReponse().title,
}

export default function Page() {
  return <CandidatureReponse />
}
