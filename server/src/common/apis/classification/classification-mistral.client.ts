import { setTimeout as sleep } from "node:timers/promises"

import { internal } from "@hapi/boom"
import type { IClassificationLabBatchResponse } from "shared/models/cache-classification.model"
import { z } from "zod"

import { sentryCaptureException } from "@/common/utils/sentry-utils"
import type { Message } from "@/services/mistralai/mistralai.service"
import { sendMistralMessages } from "@/services/mistralai/mistralai.service"

import type { IGetLabClassificationBatch } from "./classification.client"

export const CLASSIFICATION_MISTRAL_MODEL = "mistral-small-latest"
// Un lot de 50 descriptions complètes produit un JSON de sortie volumineux (un objet par job) :
// un maxTokens trop bas tronque la réponse en plein JSON et fait échouer le parsing du lot entier.
const CLASSIFICATION_MAX_TOKENS = 6000
const CLASSIFICATION_RETRY_DELAY_MS = 2000

const CLASSIFICATION_SYSTEM_PROMPT = `Tu classes des offres d'alternance transmises par des partenaires. Détecte les offres publiées par un CFA ou un organisme de formation qui se présente LUI-MÊME comme l'employeur (CFA "déguisé"), qui doivent être dépubliées.
Pour CHAQUE offre de la liste fournie (identifiée par "id"), retourne :
- label: "unpublish" UNIQUEMENT si l'ANNONCEUR (les champs workplace_name/workplace_description DE CETTE OFFRE, pas un tiers mentionné dans le texte) se présente lui-même comme un CFA/organisme de formation qui recrute pour SES PROPRES formations (vocabulaire "notre centre", "nos apprenants", nom d'établissement type CFA/GRETA/AFPA/CFPPA, "organisme de formation certifié", etc. appliqué à l'annonceur lui-même) ; "publish" sinon.
- Le simple fait que l'offre MENTIONNE un centre de formation partenaire (où se déroulera la formation théorique, mention légale du contrat d'apprentissage) est un cas NORMAL de toute offre d'alternance et NE DOIT PAS déclencher "unpublish" — seul le statut de l'ANNONCEUR/EMPLOYEUR compte, jamais celui d'un tiers cité dans le texte.
- Si le nom de l'employeur correspond à une entreprise reconnue dont l'activité principale n'est PAS la formation (banque, restauration collective, industrie, grande distribution, BTP, etc.), et que le mot "CFA"/"Académie"/"Formation" n'apparaît que dans le nom de marque de son propre dispositif de formation interne (ex. "CFA B-School by BNP Paribas", "CFA Académie by Elior"), ne classe PAS en "unpublish" : c'est l'entreprise elle-même qui recrute pour ses métiers via son alternance interne, pas un CFA externe déguisé en employeur.
- scores.publish et scores.unpublish : deux nombres entre 0 et 1, dont la somme fait 1.
Ignore le HTML. Traite tous les id fournis, un seul résultat par id, dans l'ordre reçu.
Réponds STRICTEMENT en JSON : {"results": [{"id": "...", "label": "publish"|"unpublish", "scores": {"publish": 0.0, "unpublish": 0.0}}]}`

const buildClassificationMessages = (jobs: IGetLabClassificationBatch): Message[] => [
  { role: "system", content: CLASSIFICATION_SYSTEM_PROMPT },
  { role: "user", content: JSON.stringify(jobs) },
]

const ZMistralClassificationResult = z.object({
  id: z.string(),
  label: z.enum(["publish", "unpublish"]),
  scores: z.object({ publish: z.number(), unpublish: z.number() }),
})

const ZMistralClassificationResponse = z.object({
  results: z.array(ZMistralClassificationResult),
})

/** Parse la réponse Mistral `{"results": [...]}` (null si JSON invalide ou hors-schéma). */
const parseMistralClassificationContent = (content: string): z.output<typeof ZMistralClassificationResult>[] | null => {
  let json: unknown
  try {
    json = JSON.parse(content)
  } catch {
    return null
  }
  const validation = ZMistralClassificationResponse.safeParse(json)
  return validation.success ? validation.data.results : null
}

const callMistralClassification = async (jobs: IGetLabClassificationBatch) => {
  const content = await sendMistralMessages({ messages: buildClassificationMessages(jobs), model: CLASSIFICATION_MISTRAL_MODEL, maxTokens: CLASSIFICATION_MAX_TOKENS })
  return { content, parsed: content === null ? null : parseMistralClassificationContent(content) }
}

export const getMistralClassificationBatch = async (jobs: IGetLabClassificationBatch): Promise<IClassificationLabBatchResponse> => {
  let { content, parsed } = await callMistralClassification(jobs)
  if (content === null) {
    // sendMistralMessages ne distingue pas erreur réseau/5xx/429 d'une absence de contenu : on
    // retente une fois avant d'abandonner ce lot (pas de retry si un contenu a bien été reçu mais
    // est invalide — c'est un problème de prompt, retenter ne change rien).
    await sleep(CLASSIFICATION_RETRY_DELAY_MS)
    ;({ content, parsed } = await callMistralClassification(jobs))
  }

  const results = parsed
  if (results === null) {
    const error = internal("getMistralClassificationBatch: pas de réponse Mistral exploitable après retry")
    sentryCaptureException(error)
    throw error
  }

  const resultsById = new Map(results.map((result) => [result.id, result]))

  return jobs.map((job) => {
    const result = resultsById.get(job.id)
    if (!result) {
      throw internal(`getMistralClassificationBatch: pas de résultat pour l'id ${job.id}`)
    }
    return { ...result, model: `mistral:${CLASSIFICATION_MISTRAL_MODEL}` }
  })
}
