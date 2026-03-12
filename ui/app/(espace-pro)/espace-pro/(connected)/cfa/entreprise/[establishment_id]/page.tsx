import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import CfaEntreprisePage from "./CfaEntreprisePage"

export async function generateMetadata({ params }: { params: Promise<{ establishment_id: string }> }): Promise<Metadata> {
  const { establishment_id } = await params
  return {
    title: PAGES.dynamic.backCfaPageEntreprise(establishment_id).getMetadata().title,
  }
}

export default async function Page() {
  return <CfaEntreprisePage />
}
