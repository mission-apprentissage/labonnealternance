import { NotionAPI } from "notion-client"

// https://github.com/NotionX/react-notion-x/issues/710
const notion = new NotionAPI({ apiBaseUrl: "https://app.notion.com/api/v3" })

export const fetchNotionPage = async (pageId: string) => await notion.getPage(pageId)
