import type { Metadata } from "next"
import ProcesseurPage from "./ProcesseurPage"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.adminProcessor.getMetadata().title,
}

export default async function Page() {
  return <ProcesseurPage />
}
