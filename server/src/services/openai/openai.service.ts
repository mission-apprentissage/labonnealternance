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

export const checkFTOffer = async (): Promise<{
  type: string
  name: string
}> => {
  const data = {}
  const messages = [
    {
      role: "system",
      content: `En tant qu'expert d'analyse semantique dans le domaine des offres d'emplois en Alternance, j'ai besoin de savoir si une offre est une offre postée par un CFA pour le compte d'une autre entreprise ou si l'offre est postée directement par l'entreprise.

Je vais te donner les informations de l'offres sous forme de JSON.

Une fois que tu as déterminé si c'est une offre CFA ou Entreprise tu répondras au format JSON:
{
    type: "CFA" | "entreprise",
    name: " nom"
}
  `,
    },
    {
      role: "user",
      content: `
Voici l'offre: ${JSON.stringify(data)}.
Une fois que tu as déterminé si c'est une offre CFA ou Entreprise tu répondras au format JSON:
{
    type: "CFA" | "entreprise",
    name: " nom"
}
`,
    },
  ]

  const responseStr = await sendMessages({
    messages,
    seed: 9999,
    max_tokens: 1024,
    response_format: { type: "json_object" },
  })
  const response = JSON.parse(responseStr)

  if (response.type === "entreprise") {
    return response
  }

  // TODO: save to db

  return response
}
