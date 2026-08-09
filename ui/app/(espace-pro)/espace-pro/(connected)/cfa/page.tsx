import type { Metadata } from "next"
import CfaHome from "@/app/(espace-pro)/espace-pro/(connected)/_components/CfaHome"
import { PAGES } from "@/utils/routes.utils"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export const metadata: Metadata = {
  title: PAGES.static.backCfaHome.getMetadata().title,
}

export default function CfaPage() {
  return <CfaHome />
}
