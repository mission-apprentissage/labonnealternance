import type { Metadata } from "next"
import { CFA } from "shared/constants/recruteur"
import { METADATA } from "@/utils/routes.metadata.utils"
import CfaOffrePage from "./CfaOffrePage"
export async function generateMetadata({ params }: { params: Promise<{ establishment_id: string; jobId: string }> }): Promise<Metadata> {
  const { establishment_id, jobId } = await params
  return {
    title: METADATA.dynamic.offreUpsert({ establishment_id, offerId: jobId, userType: CFA }).title,
  }
}

export default async function Page() {
  return <CfaOffrePage />
}
