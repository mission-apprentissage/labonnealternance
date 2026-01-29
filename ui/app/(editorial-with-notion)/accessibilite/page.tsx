import { AccessibilitePage } from "./AccessibilitePage"
import { fetchNotionPage } from "@/services/fetchNotionPage"

const Page = async () => {
  const recordMap = await fetchNotionPage("e1d22fdf90974d20af39d960d0b2901a")

  console.log("recordMap", recordMap)

  return <AccessibilitePage recordMap={recordMap} />
}

export default Page
