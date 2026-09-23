import { setTimeout as sleep } from "node:timers/promises"

import { Mistral } from "@mistralai/mistralai"

import { logger } from "@/common/logger"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import config from "@/config"

const mistral = new Mistral({
  apiKey: config.mistralai.apiKey,
})

export type Message = { role: "system"; content: string } | { role: "user"; content: string } | { role: "assistant"; content: string } | { role: "tool"; content: string }

// 429 Mistral : transitoire, un backoff suffit (capturé tout de suite, c'est du bruit Sentry,
// cf. LBA-SERVER-5J7KF4ZZZT9JV). Les quotas sont des fenêtres à la minute (en-têtes
// x-ratelimit-{limit,remaining}-{tokens,req}-minute observés sur /v1/chat/completions, pas de
// X-RateLimit-Remaining global malgré la doc) : Retry-After s'il est présent, sinon paliers fixes
// dont le dernier (60s) garantit une fenêtre fraîche. Appelants = jobs de fond, la latence est sans
// enjeu. Sentry ne capture qu'une fois les retries épuisés.
const RATE_LIMIT_RETRY_DELAYS_MS = [2_000, 10_000, 60_000]

const isMistralRateLimitError = (error: unknown): error is Error & { headers?: Headers } => error instanceof Error && (error as { statusCode?: unknown }).statusCode === 429

const getRateLimitRetryDelayMs = (error: Error & { headers?: Headers }, attempt: number): number => {
  // Retry-After numérique uniquement (une date HTTP → NaN → paliers fixes), plafonné à 120s :
  // un header aberrant ne doit pas endormir un job une heure par tentative.
  const retryAfterSeconds = Number(error.headers?.get?.("retry-after"))
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) return Math.min(retryAfterSeconds * 1_000, 120_000)
  return RATE_LIMIT_RETRY_DELAYS_MS[attempt]
}

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
  for (let attempt = 0; ; attempt++) {
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
      if (isMistralRateLimitError(error) && attempt < RATE_LIMIT_RETRY_DELAYS_MS.length) {
        const delayMs = getRateLimitRetryDelayMs(error, attempt)
        logger.warn(
          {
            attempt,
            delayMs,
            remainingTokensMinute: error.headers?.get?.("x-ratelimit-remaining-tokens-minute") ?? null,
            remainingReqMinute: error.headers?.get?.("x-ratelimit-remaining-req-minute") ?? null,
          },
          "Mistral 429 — retry après backoff"
        )
        await sleep(delayMs)
        continue
      }
      sentryCaptureException(error)
      console.error(error)
      return null
    }
  }
}

export type MistralBatchRequest = { customId: string; messages: Message[] }

export const BATCH_TERMINAL_STATUSES = new Set(["SUCCESS", "FAILED", "TIMEOUT_EXCEEDED", "CANCELLED"])

/** Statut courant d'un job batch Mistral (pour la reprise différée par cron). */
export const getMistralBatchJob = async (jobId: string) => mistral.batch.jobs.get({ jobId })

/**
 * Télécharge et parse le JSONL de sortie d'un job batch terminé.
 * @returns Map custom_id → contenu texte de la réponse (les échecs sont simplement absents).
 */
export const downloadMistralBatchOutput = async (fileId: string): Promise<Map<string, string>> => {
  const results = new Map<string, string>()
  const stream = await mistral.files.download({ fileId })
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
}

/**
 * Soumet un job batch Mistral sans attendre son résultat. Retourne l'id du job (null si échec).
 * Mode « fichier » (upload puis `inputFiles`) : l'inline (`requests`) est rejeté par la gateway
 * au-delà de quelques centaines de requêtes (payload trop volumineux → 400 HTML).
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
    // `body` est transmis verbatim à l'API : noms snake_case (`max_tokens`, `response_format`),
    // contrairement à `chat.complete`.
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
 * Variante bloquante de submitMistralBatch (-50 % de coût) : sonde le statut jusqu'à terminaison
 * puis télécharge la sortie.
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

    return await downloadMistralBatchOutput(current.outputFile)
  } catch (error) {
    sentryCaptureException(error)
    console.error(error)
    return results
  }
}
