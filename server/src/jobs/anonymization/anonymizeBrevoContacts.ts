import brevo, { GetContactDetails } from "@getbrevo/brevo"

import { logger } from "@/common/logger"
import { sleep } from "@/common/utils/asyncUtils"
import config from "@/config"

const getAllContactsFromBrevo = async (offset = 0, accumulated: GetContactDetails[] = []): Promise<GetContactDetails[]> => {
  const brevoClient = new brevo.ContactsApi()
  brevoClient.setApiKey(brevo.ContactsApiApiKeys.apiKey, config.smtp.brevoMarketingApiKey)

  const limit = 1000
  const response = await brevoClient.getContacts(limit, offset)
  const contacts = response.body.contacts ?? []

  const allContacts = [...accumulated, ...contacts]

  if (contacts.length === limit) {
    logger.info(`Fetched ${allContacts.length} contacts from Brevo out of ${response.body.count}`)
    // Still more to fetch
    return getAllContactsFromBrevo(offset + limit, allContacts)
  }

  return allContacts
}

const deleteContactsFromBrevo = async (contactIds: string[]): Promise<void> => {
  const brevoClient = new brevo.ContactsApi()
  brevoClient.setApiKey(brevo.ContactsApiApiKeys.apiKey, config.smtp.brevoMarketingApiKey)

  for (const id of contactIds) {
    try {
      await brevoClient.deleteContact(id)
      logger.info(`Deleted contact ${id}`)
      await sleep(200)
    } catch (error) {
      logger.warn(`Failed to delete contact ${id}: ${error}`)
      await sleep(200)
    }
  }
}

export const anonymizeBrevoContacts = async (): Promise<void> => {
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

  const contacts = await getAllContactsFromBrevo()
  if (!contacts || contacts.length === 0) {
    logger.info("No contacts found in Brevo")
    return
  }

  logger.info(`Found ${contacts.length} contacts in Brevo to process`)

  const contactsToAnonymize = contacts
    .filter((contact) => {
      const createdAt = new Date(contact.createdAt)
      return createdAt < twoYearsAgo
    })
    .map((contacts) => contacts.id.toString())

  logger.info(`Found ${contactsToAnonymize.length} contacts to anonymize`)

  await deleteContactsFromBrevo(contactsToAnonymize)
}
