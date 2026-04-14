import { NotionAPI } from "notion-client"

import { sleep } from "@/utils/tools"

const notion = new NotionAPI()

const MAX_RETRIES = 3
const DEFAULT_RETRY_AFTER_SECONDS = 1

const getRetryAfterFromError = (err: unknown): number => {
  const headers = (err as { response?: { headers?: { "retry-after"?: string } } })?.response?.headers
  return (parseInt(headers?.["retry-after"] ?? String(DEFAULT_RETRY_AFTER_SECONDS), 10) || DEFAULT_RETRY_AFTER_SECONDS) * 1_000
}

// cf documentation : https://developers.notion.com/reference/request-limits
export const fetchNotionPage = async (pageId: string, attempt = 1): ReturnType<typeof notion.getPage> => {
  try {
    return await notion.getPage(pageId)
  } catch (err: unknown) {
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode
    if (status === 429 && attempt < MAX_RETRIES) {
      await sleep(getRetryAfterFromError(err))
      return fetchNotionPage(pageId, attempt + 1)
    }
    throw err
  }
}
