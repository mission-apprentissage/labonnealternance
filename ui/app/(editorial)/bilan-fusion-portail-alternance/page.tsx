import type { Metadata } from "next"

import { PAGES } from "@/utils/routes.utils"

import BilanFusionClient from "./BilanFusionClient"

export const metadata: Metadata = {
  ...PAGES.static.bilanFusionPortail.getMetadata(),
  robots: { index: false, follow: false },
}

export default function BilanFusionPortail() {
  return <BilanFusionClient />
}
