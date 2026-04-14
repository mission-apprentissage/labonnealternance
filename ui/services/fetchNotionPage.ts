import { NotionAPI } from "notion-client"

const notion = new NotionAPI()

// add mitigation for rate limit : https://developers.notion.com/reference/request-limits
// gestion retry-after header if 429 is returned
// 3 trys at most with a delay of 1s or the value of retry-after header
export const fetchNotionPage = async (pageId: string) => await notion.getPage(pageId)
