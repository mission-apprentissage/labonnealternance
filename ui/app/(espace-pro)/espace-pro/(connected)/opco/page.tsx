import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import OpcoPage from "./OpcoPage"

export const metadata: Metadata = {
  title: PAGES.static.backOpcoHome.getMetadata().title,
}

export default async function Page() {
  return <OpcoPage />
}
