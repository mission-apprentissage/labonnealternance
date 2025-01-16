import OpenAI from "openai"

import config from "@/config"

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
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
}): Promise<any> => {
  let response
  try {
    response = await openai.chat.completions.create({
      model,
      max_tokens,
      ...(seed ? { seed } : {}),
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
