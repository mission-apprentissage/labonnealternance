import type { Metadata } from "next"
import { METADATA } from "@/utils/routes.metadata.utils"
import ProcesseurPage from "./ProcesseurPage"
export const metadata: Metadata = {
  title: METADATA.static.adminProcessor().title,
}

export default async function Page() {
  return <ProcesseurPage />
}
