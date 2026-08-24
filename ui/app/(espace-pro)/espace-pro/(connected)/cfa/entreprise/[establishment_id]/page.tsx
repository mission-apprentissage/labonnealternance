import type { Metadata } from "next"
import { METADATA } from "@/utils/routes.metadata.utils"
import CfaEntreprisePage from "./CfaEntreprisePage"
export async function generateMetadata({ params }: { params: Promise<{ establishment_id: string }> }): Promise<Metadata> {
  const { establishment_id } = await params
  return {
    title: METADATA.dynamic.backCfaPageEntreprise(establishment_id).title,
  }
}

export default async function Page() {
  return <CfaEntreprisePage />
}
