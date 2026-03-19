import type { Metadata } from "next"
import { CFA } from "shared/constants/recruteur"
import { PAGES } from "@/utils/routes.utils"
import CfaOffrePage from "./CfaOffrePage"

export async function generateMetadata({ params }: { params: Promise<{ establishment_id: string; jobId: string }> }): Promise<Metadata> {
  const { establishment_id, jobId } = await params
  return {
    title: PAGES.dynamic.offreUpsert({ establishment_id, offerId: jobId, userType: CFA }).getMetadata().title,
  }
}

export default async function Page() {
  return <CfaOffrePage />
}
