import { Mistral } from "@mistralai/mistralai"

import config from "@/config"

import { logger } from "../../common/logger"
import { sentryCaptureException } from "../../common/utils/sentryUtils"
import { ZChatCompletionResponse } from "../openai/openai.service"

const mistral = new Mistral({
  apiKey: config.mistralai.apiKey,
})

export type Message = { role: "system"; content: string } | { role: "user"; content: string } | { role: "assistant"; content: string } | { role: "tool"; content: string }

export const sendMistralMessages = async ({
  messages,
  randomSeed,
  maxTokens = 2048,
  model = "mistral-large-latest",
  responseFormat = { type: "json_object" },
}: {
  messages: Message[]
  model?: string
  randomSeed?: number
  maxTokens?: number
  responseFormat?: { type: "text" | "json_object" }
}): Promise<any> => {
  try {
    const response = await mistral.chat.complete({
      model,
      messages,
      maxTokens,
      ...(randomSeed ? { randomSeed } : {}),
      responseFormat,
    })

    if (!response.choices?.length || !response.choices[0].message) {
      logger.info("No response from Mistral", response)
      return null
    }
    const message = response.choices[0].message.content as string
    if (!message) {
      logger.info("No content from Mistral", response)
      return null
    }

    const { data, error } = ZChatCompletionResponse.safeParse(JSON.parse(message))
    if (error) {
      console.log("Invalid response format", error)
      return null
    }
    return data
  } catch (error) {
    sentryCaptureException(error)
    console.error(error)
    return null
  }
}
