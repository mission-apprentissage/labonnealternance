import { Mistral } from "@mistralai/mistralai"

import config from "@/config"

const mistral = new Mistral({
  apiKey: config.mistralai.apiKey,
})

export const mistralSendMessages = async ({
  messages,
  randomSeed,
  maxTokens = 2048,

  model = "pixtral-12b-2409",
  response_format,
}: {
  messages: any[]
  randomSeed?: number
  maxTokens?: 1024 | 2048 | 4096
  model?: string
  response_format?: any
}): Promise<any> => {
  let response
  try {
    response = await mistral.chat.complete({
      model,
      maxTokens,
      ...(randomSeed ? { randomSeed } : {}),
      ...(response_format ? { response_format } : {}),
      messages: messages,
    })
  } catch (error) {
    console.log(error)
    return null
  }

  const message = response.choices[0].message
  const message_text = message.content

  return message_text
}
