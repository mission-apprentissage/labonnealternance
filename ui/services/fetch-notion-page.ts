import { cacheLife } from "next/cache"
import { NotionAPI } from "notion-client"

// https://github.com/NotionX/react-notion-x/issues/710
const notion = new NotionAPI({ apiBaseUrl: "https://app.notion.com/api/v3" })

export const fetchNotionPage = async (pageId: string) => {
  "use cache"
  cacheLife("days") // revalider toutes les 24h (API Notion rate-limitée)

  return notion.getPage(pageId)
}
