import type { Metadata } from "next"
import { AccessibilitePage } from "./AccessibilitePage"
import { fetchNotionPage } from "@/services/fetchNotionPage"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.accessibilite.getMetadata().title,
  description: PAGES.static.accessibilite.getMetadata().description,
}

const Page = async () => {
  const recordMap = await fetchNotionPage("e1d22fdf90974d20af39d960d0b2901a")

  console.log("recordMap", recordMap)

  return <AccessibilitePage recordMap={recordMap} />
}

export default Page
