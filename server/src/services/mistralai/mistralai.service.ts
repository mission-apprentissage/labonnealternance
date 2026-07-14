import { setTimeout as sleep } from "node:timers/promises"

import { Mistral } from "@mistralai/mistralai"

import { logger } from "@/common/logger"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import config from "@/config"

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
}): Promise<string | null> => {
  try {
    const response = await mistral.chat.complete({
      model,
      messages,
      maxTokens,
      ...(randomSeed ? { randomSeed } : {}),
      responseFormat,
    })

    if (!response.choices?.length || !response.choices[0].message) {
      logger.info({ response }, "No response from Mistral")
      return null
    }
    const message = response.choices[0].message.content as string
    if (!message) {
      logger.info({ response }, "No content from Mistral")
      return null
    }
    return message
  } catch (error) {
    sentryCaptureException(error)
    console.error(error)
    return null
  }
}

export type MistralBatchRequest = { customId: string; messages: Message[] }

const BATCH_TERMINAL_STATUSES = new Set(["SUCCESS", "FAILED", "TIMEOUT_EXCEEDED", "CANCELLED"])

/**
 * Soumet un job batch Mistral SANS attendre son résultat (fire-and-forget) : construit le
 * JSONL, l'upload (purpose `batch`) et crée le job. Retourne l'id du job (null si échec).
 * Récupération des résultats : console Mistral ou API (download de l'outputFile), puis
 * application via le job dédié (ex. `algolia:apply-keywords-batch --file <jsonl>`).
 */
export const submitMistralBatch = async ({
  requests,
  model = "mistral-small-latest",
  maxTokens = 2048,
  responseFormat = { type: "json_object" },
  timeoutHours = 24,
  inputFileName = "batch_input.jsonl",
}: {
  requests: MistralBatchRequest[]
  model?: string
  maxTokens?: number
  responseFormat?: { type: "text" | "json_object" }
  timeoutHours?: number
  inputFileName?: string
}): Promise<string | null> => {
  if (requests.length === 0) return null

  try {
    // JSONL d'entrée : une ligne par requête { custom_id, body: <payload chat verbatim> }.
    const jsonl = requests.map((r) => JSON.stringify({ custom_id: r.customId, body: { messages: r.messages, max_tokens: maxTokens, response_format: responseFormat } })).join("\n")

    const inputFile = await mistral.files.upload({
      purpose: "batch",
      file: { fileName: inputFileName, content: new TextEncoder().encode(jsonl) },
    })

    const job = await mistral.batch.jobs.create({
      model,
      endpoint: "/v1/chat/completions",
      timeoutHours,
      inputFiles: [inputFile.id],
    })

    logger.info(`Mistral batch soumis : job ${job.id} (${requests.length} requêtes, modèle ${model})`)
    return job.id
  } catch (error) {
    sentryCaptureException(error)
    console.error(error)
    return null
  }
}

/**
 * Exécute une série de requêtes chat via l'API Batch Mistral (asynchrone, -50% de coût).
 * Mode « fichier » : on construit un JSONL, on l'upload (purpose `batch`), puis on crée le
 * job via `inputFiles` — l'inline (`requests`) est rejeté par la gateway au-delà de quelques
 * centaines de requêtes (payload trop volumineux → 400 HTML). Sonde le statut jusqu'à
 * terminaison, puis télécharge et parse le JSONL de sortie.
 *
 * NB : le `body` de chaque ligne est transmis verbatim à l'API → noms snake_case
 * (`max_tokens`, `response_format`), contrairement à `chat.complete`.
 *
 * @returns Map customId → contenu texte de la réponse (les échecs sont simplement absents).
 */
export const sendMistralBatch = async ({
  requests,
  model = "mistral-small-latest",
  maxTokens = 2048,
  responseFormat = { type: "json_object" },
  pollIntervalMs = 5000,
  maxWaitMs = 60 * 60 * 1000,
  timeoutHours = 24,
}: {
  requests: MistralBatchRequest[]
  model?: string
  maxTokens?: number
  responseFormat?: { type: "text" | "json_object" }
  pollIntervalMs?: number
  maxWaitMs?: number
  timeoutHours?: number
}): Promise<Map<string, string>> => {
  const results = new Map<string, string>()
  if (requests.length === 0) return results

  try {
    const jobId = await submitMistralBatch({ requests, model, maxTokens, responseFormat, timeoutHours, inputFileName: "keywords_batch_input.jsonl" })
    if (!jobId) return results

    // Polling jusqu'à un statut terminal (ou expiration de maxWaitMs côté job runner).
    let current = await mistral.batch.jobs.get({ jobId })
    const startedAt = Date.now()
    while (!BATCH_TERMINAL_STATUSES.has(current.status)) {
      if (Date.now() - startedAt > maxWaitMs) {
        logger.warn(`Mistral batch ${jobId} : maxWaitMs atteint (statut ${current.status}), abandon du polling`)
        return results
      }
      await sleep(pollIntervalMs)
      current = await mistral.batch.jobs.get({ jobId })
      logger.info(`Mistral batch ${jobId} : ${current.status} ${current.completedRequests}/${current.totalRequests}`)
    }

    if (current.status !== "SUCCESS" || !current.outputFile) {
      logger.error(`Mistral batch ${jobId} terminé en ${current.status} (${current.failedRequests} échecs)`)
      return results
    }

    // Téléchargement + parsing du JSONL de sortie ({ custom_id, response: { body: { choices } } }).
    const stream = await mistral.files.download({ fileId: current.outputFile })
    const text = await new Response(stream).text()
    for (const line of text.split("\n")) {
      if (!line.trim()) continue
      try {
        const parsed = JSON.parse(line)
        const content = parsed?.response?.body?.choices?.[0]?.message?.content
        if (parsed.custom_id && typeof content === "string") results.set(parsed.custom_id, content)
      } catch {
        // ligne non parsable → ignorée
      }
    }
    return results
  } catch (error) {
    sentryCaptureException(error)
    console.error(error)
    return results
  }
}
