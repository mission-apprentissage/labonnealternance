import { NotionAPI } from "notion-client"

const notion = new NotionAPI()

export const fetchNotionPage = async (pageId: string) => await notion.getPage(pageId)
