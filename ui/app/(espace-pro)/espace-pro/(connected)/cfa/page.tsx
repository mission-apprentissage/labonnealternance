import type { Metadata } from "next"
import CfaHome from "@/app/(espace-pro)/espace-pro/(connected)/_components/CfaHome"
import { METADATA } from "@/utils/routes.metadata.utils"
export const metadata: Metadata = {
  title: METADATA.static.backCfaHome().title,
}

export default function CfaPage() {
  return <CfaHome />
}
