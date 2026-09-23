import { conflict, notFound } from "@hapi/boom"
import type { Document, Filter } from "mongodb"
import { ObjectId } from "mongodb"
import type { IFeedbackForm, IFeedbackFormForAdmin, IFeedbackFormInput, IFeedbackFormStatus } from "shared/models/feedback-form.model"
import { ALLOWED_FEEDBACK_FORM_STATUS_TRANSITIONS } from "shared/models/feedback-form.model"

import { getDbCollection } from "@/common/utils/mongodb-utils"

/**
 * Liste des formulaires pour le back-office, du plus récemment modifié au plus ancien.
 *
 * `responses_count` ne compte que les réponses réellement commencées (au moins une question
 * répondue) : une réponse est créée dès l'affichage du widget, la compter donnerait le nombre
 * d'affichages et non de retours. La collection `feedback_responses` n'existe pas encore —
 * `$lookup` la traite alors comme vide, ce qui donne bien 0.
 */
function withResponsesCount(match: Filter<IFeedbackForm>): Document[] {
  return [
    { $match: match },
    { $sort: { updated_at: -1 } },
    {
      $lookup: {
        from: "feedback_responses",
        let: { slug: "$slug" },
        pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$form_slug", "$$slug"] }, { $gt: [{ $size: { $objectToArray: "$answers" } }, 0] }] } } }, { $count: "n" }],
        as: "rc",
      },
    },
    { $addFields: { responses_count: { $ifNull: [{ $arrayElemAt: ["$rc.n", 0] }, 0] } } },
    { $project: { rc: 0 } },
  ]
}

export async function listFeedbackFormsForAdmin(status?: IFeedbackFormStatus[]): Promise<IFeedbackFormForAdmin[]> {
  return getDbCollection("feedback_forms")
    .aggregate<IFeedbackFormForAdmin>(withResponsesCount(status?.length ? { status: { $in: status } } : {}))
    .toArray()
}

async function getFeedbackFormBySlug(slug: string): Promise<IFeedbackForm> {
  const form = await getDbCollection("feedback_forms").findOne({ slug })
  if (!form) {
    throw notFound("Formulaire introuvable")
  }
  return form
}

export async function getFeedbackFormForAdmin(slug: string): Promise<IFeedbackFormForAdmin> {
  const [form] = await getDbCollection("feedback_forms").aggregate<IFeedbackFormForAdmin>(withResponsesCount({ slug })).toArray()
  if (!form) {
    throw notFound("Formulaire introuvable")
  }
  return form
}

export async function createFeedbackForm(input: IFeedbackFormInput, createdBy: string): Promise<IFeedbackForm> {
  const existing = await getDbCollection("feedback_forms").findOne({ slug: input.slug }, { projection: { _id: 1 } })
  if (existing) {
    throw conflict("Un formulaire avec ce slug existe déjà")
  }

  const now = new Date()
  const form: IFeedbackForm = {
    ...input,
    _id: new ObjectId(),
    status: "draft",
    version: 1,
    created_at: now,
    updated_at: now,
    created_by: createdBy,
    status_history: [{ status: "draft", date: now, granted_by: createdBy }],
  }
  await getDbCollection("feedback_forms").insertOne(form)
  return form
}

/**
 * Met à jour la définition d'un formulaire.
 *
 * Un brouillon est mis à jour en place. Le versioning d'un formulaire déjà activé arrivera avec
 * l'activation : tant que le seul statut atteignable est `draft`, il n'y a rien à versionner.
 */
export async function updateFeedbackForm(slug: string, input: Omit<IFeedbackFormInput, "slug">): Promise<IFeedbackForm> {
  const form = await getFeedbackFormBySlug(slug)
  if (form.status === "archived") {
    throw conflict("Un formulaire archivé ne peut plus être modifié")
  }

  const update = { ...input, updated_at: new Date() }
  await getDbCollection("feedback_forms").updateOne({ _id: form._id }, { $set: update })
  return { ...form, ...update }
}

/**
 * Supprime définitivement un brouillon. Un brouillon n'a jamais été affiché, il n'a donc aucune
 * réponse. Au-delà, c'est l'archivage qui retire un formulaire sans perdre ses résultats.
 */
export async function deleteFeedbackForm(slug: string): Promise<void> {
  const form = await getFeedbackFormBySlug(slug)
  if (form.status !== "draft") {
    throw conflict("Seul un brouillon peut être supprimé")
  }
  await getDbCollection("feedback_forms").deleteOne({ _id: form._id })
}

/** Changement de statut conforme au cycle de vie, tracé dans `status_history`. */
async function transitionFeedbackFormStatus(slug: string, next: IFeedbackFormStatus, grantedBy: string): Promise<void> {
  const form = await getFeedbackFormBySlug(slug)
  if (!ALLOWED_FEEDBACK_FORM_STATUS_TRANSITIONS[form.status].includes(next)) {
    throw conflict(form.status === "archived" ? "Ce formulaire est déjà archivé" : "Ce changement de statut n'est pas autorisé")
  }
  const now = new Date()
  await getDbCollection("feedback_forms").updateOne(
    { _id: form._id },
    { $set: { status: next, updated_at: now }, $push: { status_history: { status: next, date: now, granted_by: grantedBy } } }
  )
}

/** Archive un formulaire, quel que soit son statut : il n'est plus affiché aux usagers ni modifiable, ses réponses restent. */
export async function archiveFeedbackForm(slug: string, grantedBy: string): Promise<void> {
  await transitionFeedbackFormStatus(slug, "archived", grantedBy)
}
