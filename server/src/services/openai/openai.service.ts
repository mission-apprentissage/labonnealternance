import OpenAI from "openai"
import z from "zod"

import config from "@/config"

import { logger } from "../../common/logger"
import { sentryCaptureException } from "../../common/utils/sentryUtils"

const openAiApiUrl = "https://api.openai.com/v1/chat/completions"

// const openai = new OpenAI({
//   apiKey: config.openai.apiKey,
// })

export const ZChatCompletionResponse = z.object({
  offres: z.array(z.object({ type: z.enum(["cfa", "entreprise", "entreprise_cfa"]), id: z.string(), cfa: z.string().nullish() })),
})

export const sendOpenAIMessages = async ({
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
    // const json = await openai.chat.completions.create({
    //   model,
    //   max_tokens,
    //   ...(seed ? { seed } : {}),
    //   ...(response_format ? { response_format } : {}),
    //   messages: messages,
    // })

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

    const json: OpenAI.Chat.Completions.ChatCompletion = await response.json()
    if ("error" in json) {
      logger.error("Error from OpenAI", json.error)
      return null
    }
    if (!json.choices.length || !json.choices[0].message || !json.choices[0].message) {
      logger.info("No response from OpenAI", json)
      return null
    }

    const message = json.choices[0].message.content
    if (!message) {
      logger.info("No content in response message", json)
      return null
    }
    if (!ZChatCompletionResponse.safeParse(JSON.parse(message)).success) {
      console.warn("Invalid response format", message)
      return null
    }
    return message
  } catch (error) {
    sentryCaptureException(error)
    console.error(error)
    return null
  }
}
