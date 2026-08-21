import type { Metadata } from "next"
import { fetchNotionPage } from "@/services/fetch-notion-page"
import { METADATA } from "@/utils/routes.metadata.utils"
import { AccessibilitePage } from "./AccessibilitePage"

export const metadata: Metadata = {
  title: METADATA.static.accessibilite().title,
  description: METADATA.static.accessibilite().description,
}

const Page = async () => {
  const recordMap = await fetchNotionPage("e1d22fdf90974d20af39d960d0b2901a")

  return <AccessibilitePage recordMap={recordMap} />
}

export default Page
