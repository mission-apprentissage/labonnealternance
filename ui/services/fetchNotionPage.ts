import { NotionAPI } from "notion-client"

const notion = new NotionAPI()

export const fetchNotionPage = async (pageId) => await notion.getPage(pageId)
