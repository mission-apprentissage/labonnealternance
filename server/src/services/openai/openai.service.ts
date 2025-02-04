import OpenAI from "openai"
import z from "zod"

import config from "@/config"

import { sentryCaptureException } from "../../common/utils/sentryUtils"

const openAiApiUrl = "https://api.openai.com/v1/chat/completions"

const ZChatCompletionResponse = z.object({
  offres: z.array(z.object({ type: z.enum(["CFA", "entreprise", "entreprise_CFA"]), id: z.string(), cfa: z.string() })),
})

export const sendMessages = async ({
  messages,
  seed,
  max_tokens = 2048,
  model = "gpt-4o",
  response_format,
}: {
  messages: any[]
  seed?: number
  max_tokens?: 1024 | 2048 | 4096
  model?: string
  response_format?: any
}): Promise<string | null> => {
  try {
    const response = await fetch(openAiApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.openai.apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens,
        ...(seed ? { seed } : {}),
        ...(response_format ? { response_format } : {}),
        messages: messages,
      }),
    })
    const json: OpenAI.Chat.ChatCompletion = await response.json()
    const message = JSON.parse(json.choices[0].message.content!)
    if (!ZChatCompletionResponse.safeParse(JSON.parse(message.content!)).success) {
      console.log("Invalid response format", message.content)
      return null
    }
    return message
  } catch (error) {
    sentryCaptureException(error)
    console.log(error)
    return null
  }
}
