import type { Metadata } from "next"
import { OPCO } from "shared/constants/recruteur"
import { METADATA } from "@/utils/routes.metadata.utils"
import OpcoOffrePage from "./OpcoOffrePage"
export async function generateMetadata({ params }: { params: Promise<{ jobId: string; establishment_id: string; userId: string }> }): Promise<Metadata> {
  const { jobId, establishment_id, userId } = await params
  return {
    title: METADATA.dynamic.offreUpsert({ establishment_id, offerId: jobId, userType: OPCO, userId }).title,
  }
}

export default async function Page() {
  return <OpcoOffrePage />
}
