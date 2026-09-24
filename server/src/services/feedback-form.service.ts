import { badRequest, conflict, notFound } from "@hapi/boom"
import type { Document, Filter } from "mongodb"
import { ObjectId } from "mongodb"
import type { IFeedbackForm, IFeedbackFormForAdmin, IFeedbackFormInput, IFeedbackFormPublic, IFeedbackFormStatus } from "shared/models/feedback-form.model"
import { ALLOWED_FEEDBACK_FORM_STATUS_TRANSITIONS, ZFeedbackFormPublishable } from "shared/models/feedback-form.model"
import { scopePatternsOverlap } from "shared/utils/ui-routes.utils"

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
 * Supprime définitivement un brouillon ou un formulaire archivé. Un formulaire actif ou inactif
 * doit d'abord être archivé : la suppression ne peut pas retirer un widget encore en service.
 *
 * TODO à l'arrivée de `feedback_responses` : supprimer aussi les réponses d'un archivé (ou refuser
 * s'il en a), sinon elles resteraient orphelines.
 */
export async function deleteFeedbackForm(slug: string): Promise<void> {
  const form = await getFeedbackFormBySlug(slug)
  if (form.status !== "draft" && form.status !== "archived") {
    throw conflict("Seul un brouillon ou un formulaire archivé peut être supprimé")
  }
  await getDbCollection("feedback_forms").deleteOne({ _id: form._id })
}

/** Changement de statut conforme au cycle de vie, tracé dans `status_history`. */
async function transitionFeedbackFormStatus(slug: string, next: IFeedbackFormStatus, grantedBy: string, form?: IFeedbackForm): Promise<void> {
  form ??= await getFeedbackFormBySlug(slug)
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

/**
 * Active un brouillon ou un formulaire inactif : il pourra s'afficher aux usagers.
 *
 * Refusé si le formulaire n'est pas publiable (aucune question, chemin qui n'existe plus, condition
 * cassée) ou si un autre formulaire est déjà actif sur l'un de ses chemins — deux widgets ne
 * doivent pas se disputer la même page, y compris via des motifs qui se recouvrent
 * (`/formation/*` et `/formation/:id/:titre`, cf. `scopePatternsOverlap`).
 */
export async function activateFeedbackForm(slug: string, grantedBy: string): Promise<void> {
  const form = await getFeedbackFormBySlug(slug)
  const publishable = ZFeedbackFormPublishable.safeParse({ slug: form.slug, title: form.title, trigger: form.trigger, questions: form.questions })
  if (!publishable.success) {
    throw badRequest(`Activation impossible : ${publishable.error.issues[0].message}`)
  }

  // peu de formulaires actifs à la fois : le chevauchement des motifs se calcule ici plutôt qu'en requête
  const actives = await getDbCollection("feedback_forms")
    .find({ status: "active", _id: { $ne: form._id } })
    .toArray()
  for (const concurrent of actives) {
    const overlapping = concurrent.trigger.scope.filter((path) => form.trigger.scope.some((own) => scopePatternsOverlap(own, path)))
    if (overlapping.length) {
      throw conflict(`Activation impossible : le formulaire « ${concurrent.title} » est déjà actif sur ${overlapping.join(", ")}`)
    }
  }

  await transitionFeedbackFormStatus(slug, "active", grantedBy, form)
}

/** Désactive un formulaire actif : il n'est plus affiché, reste modifiable et réactivable. */
export async function deactivateFeedbackForm(slug: string, grantedBy: string): Promise<void> {
  await transitionFeedbackFormStatus(slug, "inactive", grantedBy)
}

/** Formulaires actifs, réduits à ce qu'en voit le widget public. */
export async function listActiveFeedbackForms(): Promise<IFeedbackFormPublic[]> {
  return getDbCollection("feedback_forms")
    .find({ status: "active" }, { projection: { _id: 0, slug: 1, version: 1, trigger: 1, questions: 1 } })
    .sort({ slug: 1 })
    .toArray() as Promise<IFeedbackFormPublic[]>
}
