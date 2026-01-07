import type { Metadata } from "next"
import OpcoOffrePage from "./OpcoOffrePage"
import { PAGES } from "@/utils/routes.utils"
import { OPCO } from "shared/constants/recruteur"

export async function generateMetadata({ params }: { params: Promise<{ jobId: string; establishment_id: string; userId: string }> }): Promise<Metadata> {
  const { jobId, establishment_id, userId } = await params
  return {
    title: PAGES.dynamic.offreUpsert({ establishment_id, offerId: jobId, userType: OPCO, userId }).getMetadata().title,
  }
}

export default async function Page() {
  return <OpcoOffrePage />
}
