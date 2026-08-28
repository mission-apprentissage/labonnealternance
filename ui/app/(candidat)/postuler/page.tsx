import type { Metadata } from "next"
import { METADATA } from "@/utils/routes.metadata.utils"
import PostulerPage from "./PostulerPage"
export const metadata: Metadata = {
  title: METADATA.static.postuler().title,
}

const Page = async () => {
  return <PostulerPage />
}

export default Page
