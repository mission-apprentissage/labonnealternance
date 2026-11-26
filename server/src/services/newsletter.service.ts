import { notFound } from "@hapi/boom"
import { ObjectId } from "mongodb"
import type { INewsletter, INewsletterInput, INewsletterPublic } from "shared/models/newsletter.model"
import { NEWSLETTER_PUBLIC_LIMIT } from "shared/models/newsletter.model"

import { getDbCollection } from "@/common/utils/mongodb-utils"

const NOT_FOUND_MESSAGE = "Infolettre introuvable"

/** Toutes les éditions, masquées comprises, de la plus récente à la plus ancienne. */
export async function listNewslettersForAdmin(): Promise<INewsletter[]> {
  return getDbCollection("newsletters").find({}).sort({ edition_date: -1, _id: -1 }).toArray()
}

export async function listPublicNewsletters(): Promise<INewsletterPublic[]> {
  return getDbCollection("newsletters")
    .find({ is_visible: true }, { projection: { title: 1, edition_date: 1, linkedin_url: 1 } })
    .sort({ edition_date: -1, _id: -1 })
    .limit(NEWSLETTER_PUBLIC_LIMIT)
    .toArray()
}

export async function getNewsletter(id: ObjectId): Promise<INewsletter> {
  const newsletter = await getDbCollection("newsletters").findOne({ _id: id })
  if (!newsletter) {
    throw notFound(NOT_FOUND_MESSAGE)
  }
  return newsletter
}

export async function createNewsletter(input: INewsletterInput, createdBy: string): Promise<INewsletter> {
  const now = new Date()
  const newsletter: INewsletter = { ...input, _id: new ObjectId(), created_at: now, updated_at: now, created_by: createdBy }
  await getDbCollection("newsletters").insertOne(newsletter)
  return newsletter
}

export async function updateNewsletter(id: ObjectId, input: INewsletterInput): Promise<INewsletter> {
  const updated = await getDbCollection("newsletters").findOneAndUpdate({ _id: id }, { $set: { ...input, updated_at: new Date() } }, { returnDocument: "after" })
  if (!updated) {
    throw notFound(NOT_FOUND_MESSAGE)
  }
  return updated
}

export async function deleteNewsletter(id: ObjectId): Promise<void> {
  const { deletedCount } = await getDbCollection("newsletters").deleteOne({ _id: id })
  if (deletedCount === 0) {
    throw notFound(NOT_FOUND_MESSAGE)
  }
}
