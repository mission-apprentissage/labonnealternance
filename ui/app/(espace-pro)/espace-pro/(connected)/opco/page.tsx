import type { Metadata } from "next"
import OpcoPage from "./OpcoPage"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.backOpcoHome.getMetadata().title,
}

export default async function Page() {
  return <OpcoPage />
}
