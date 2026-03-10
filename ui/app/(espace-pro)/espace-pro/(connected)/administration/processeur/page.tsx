import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import ProcesseurPage from "./ProcesseurPage"

export const metadata: Metadata = {
  title: PAGES.static.adminProcessor.getMetadata().title,
}

export default async function Page() {
  return <ProcesseurPage />
}
