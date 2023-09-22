import { NotionAPI } from "notion-client"

const notion = new NotionAPI()

export const fetchNotionPage = async (pageId) => {
  return await notion.getPage(pageId)
}
