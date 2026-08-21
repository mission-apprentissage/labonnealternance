import type { Metadata } from "next"
import { METADATA } from "@/utils/routes.metadata.utils"
import OpcoPage from "./OpcoPage"
export const metadata: Metadata = {
  title: METADATA.static.backOpcoHome().title,
}

export default async function Page() {
  return <OpcoPage />
}
